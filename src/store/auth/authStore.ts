import { create } from "zustand";
import { callApi, fetchCsrfCookie } from "@/services";
import { User } from "@/data/models/User";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { AuthStatus } from "@/data/enums";
import { RequestMethod } from "@/data/constants/methods";
import { translate } from "@/i18n/translate";
import { applyUserUiPreferences } from "@/features/auth/applyUserUiPreferences";

/**
 * Auth store state interface
 */
export interface AuthState {
  user: User | null;
  permissions: string[];
  status: AuthStatus;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setPermissions: (permissions: string[]) => void;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

/**
 * Auth store using Zustand
 *
 * Manages authentication state including:
 * - Current user
 * - Permissions
 * - Auth status (loading, authenticated, etc.)
 * - Login/logout actions
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state
  user: null,
  permissions: [],
  status: AuthStatus.IDLE,
  error: null,

  // Set user directly
  setUser: (user) => {
    set({
      user,
      status: user ? AuthStatus.AUTHENTICATED : AuthStatus.UNAUTHENTICATED,
    });
  },

  // Set permissions
  setPermissions: (permissions) => {
    set({ permissions });
  },

  // Fetch current user from API
  fetchUser: async () => {
    set({ status: AuthStatus.LOADING, error: null });

    try {
      const response = await callApi<User>({
        url: API_ENDPOINTS.AUTH.ME,
        method: RequestMethod.GET,
        shouldPopError: false,
      });

      if (response.ok && response.data?.data) {
        const userData = response.data.data;
        applyUserUiPreferences(userData);
        set({
          user: userData,
          permissions: userData.permissions || [],
          status: AuthStatus.AUTHENTICATED,
          error: null,
        });
      } else {
        set({
          user: null,
          permissions: [],
          status: AuthStatus.UNAUTHENTICATED,
          error: null,
        });
      }
    } catch {
      set({ user: null, permissions: [], status: AuthStatus.FAILED, error: "Failed to fetch user" });
    }
  },

  // Login with email and password
  login: async (email: string, password: string): Promise<boolean> => {
    set({ status: AuthStatus.LOADING, error: null });

    try {
      await fetchCsrfCookie();

      const response = await callApi<User>({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: RequestMethod.POST,
        data: { email, password },
        shouldPopError: false,
        shouldPopSuccess: false,
      });

      const data = response.data as { data?: User };

      if (response.ok && data?.data) {
        const userData = data.data;
        applyUserUiPreferences(userData);
        set({
          user: userData,
          permissions: userData.permissions || [],
          status: AuthStatus.AUTHENTICATED,
          error: null,
        });
        return true;
      }

      const status = response.status ?? 0;
      const apiMessage =
        (response.data as { message?: string })?.message ||
        (response.data as { errors?: { email?: string[] } })?.errors?.email?.[0] ||
        "";
      let error = translate("auth.invalidCredentials");
      if (status === 429) {
        error = translate("common.tooManyAttempts");
      } else if (status === 419) {
        error = "Session expired. Please refresh the page and try again.";
      } else if (status === 401 || status === 403) {
        error =
          apiMessage ||
          (status === 401 ? translate("auth.invalidCredentials") : translate("auth.signInBlocked"));
      } else if (status >= 500 || status === 0) {
        error = translate("common.unexpectedError");
      } else if (apiMessage) {
        error = apiMessage;
      }

      set({
        status: AuthStatus.UNAUTHENTICATED,
        error,
      });
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      set({ status: AuthStatus.FAILED, error: message });
      return false;
    }
  },

  // Logout user — clear local auth first so the shell can leave immediately.
  logout: async () => {
    get().clearAuth();
    try {
      await callApi({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: RequestMethod.POST,
        shouldPopError: false,
      });
    } catch {
      // Server session cleanup is best-effort; local state is already cleared.
    }
  },

  // Clear all auth state
  clearAuth: () => {
    set({
      user: null,
      permissions: [],
      status: AuthStatus.UNAUTHENTICATED,
      error: null,
    });
  },
}));

/**
 * Selector for checking if user is authenticated
 */
export const selectIsAuthenticated = (state: AuthState) =>
  state.status === AuthStatus.AUTHENTICATED && state.user !== null;

/**
 * Selector for checking if auth is loading
 */
export const selectIsLoading = (state: AuthState) =>
  state.status === AuthStatus.LOADING || state.status === AuthStatus.IDLE;

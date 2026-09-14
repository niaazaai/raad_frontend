import { create } from "zustand";
import { callApi, fetchCsrfCookie } from "@/services";
import { User } from "@/data/models/User";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { AuthStatus } from "@/data/enums";
import { RequestMethod } from "@/data/constants/methods";
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
        shouldPopError: true,
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
      } else {
        const isCsrfExpired = response.status === 419;
        const apiMessage =
          (response.data as { message?: string })?.message ||
          (response.data as { errors?: { email?: string[] } })?.errors?.email?.[0] ||
          null;
        set({
          status: AuthStatus.UNAUTHENTICATED,
          error: isCsrfExpired
            ? "Session expired. Please refresh the page and try again."
            : apiMessage || "Invalid credentials",
        });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      set({ status: AuthStatus.FAILED, error: message });
      return false;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await callApi({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: RequestMethod.POST,
        shouldPopError: false,
      });
    } catch {
      // Always clear local state regardless of API failure
    } finally {
      // Always clear local state regardless of API response
      get().clearAuth();
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

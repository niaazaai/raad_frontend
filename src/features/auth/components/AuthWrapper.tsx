import { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/store";
import { AuthStatus } from "@/data/enums";
import { PageLoader } from "@/components/ui";
import { useAuth } from "../hooks/useAuth";

interface AuthWrapperProps {
  children: ReactNode;
  loginPath?: string;
}

const AuthWrapper = ({ children, loginPath = "/login" }: AuthWrapperProps) => {
  const location = useLocation();
  const { user, status } = useAuth();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (status === AuthStatus.LOADING || status === AuthStatus.IDLE) {
    return <PageLoader className="fixed inset-0 z-50 min-h-0" />;
  }

  if (!user && (status === AuthStatus.UNAUTHENTICATED || status === AuthStatus.FAILED)) {
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(location.pathname)}`;
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;

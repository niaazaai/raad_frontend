import { ReactNode, memo } from "react";
import { useAuth } from "../hooks/useAuth";
import { canAccessRoute } from "../canAccessRoute";
import PermissionDeniedCard from "./PermissionDeniedCard";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  anyRole?: string[];
  fallback?: ReactNode;
}

/**
 * Renders children only when every listed gate passes.
 * Denied routes never mount the feature tree (no lazy load / no queries).
 */
const ProtectedRoute = ({
  children,
  permission,
  anyPermission,
  anyRole,
  fallback,
}: ProtectedRouteProps) => {
  const auth = useAuth();
  const allowed = canAccessRoute({ permission, anyPermission, anyRole }, auth);

  if (!allowed) {
    return fallback || <PermissionDeniedCard />;
  }

  return <>{children}</>;
};

export default memo(ProtectedRoute);

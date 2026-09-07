import type { ProtectedRouteType } from "@/types/routes";
import { isAuthDisabled } from "./isAuthDisabled";

type RouteGate = Pick<ProtectedRouteType, "permission" | "anyPermission" | "anyRole">;

type AuthChecks = {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
};

/**
 * All listed constraints must pass. Empty `permission` means no permission gate.
 */
export function canAccessRoute(route: RouteGate, auth: AuthChecks): boolean {
  if (isAuthDisabled()) {
    return true;
  }

  if (route.anyRole && route.anyRole.length > 0 && !auth.hasAnyRole(route.anyRole)) {
    return false;
  }

  if (route.permission && !auth.hasPermission(route.permission)) {
    return false;
  }

  if (
    route.anyPermission &&
    route.anyPermission.length > 0 &&
    !auth.hasAnyPermission(route.anyPermission)
  ) {
    return false;
  }

  return true;
}

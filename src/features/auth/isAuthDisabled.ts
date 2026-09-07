/**
 * Build-time flag. `true` skips login and permission checks (local UI only).
 * Production must keep VITE_DISABLE_AUTH=false.
 */
export function isAuthDisabled(): boolean {
  return import.meta.env.VITE_DISABLE_AUTH === "true";
}

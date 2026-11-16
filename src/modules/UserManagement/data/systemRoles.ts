const SYSTEM_ROLE_NAMES = ["admin", "root", "student", "instructor", "user"];

export function isSystemRole(name: string | undefined | null): boolean {
  return SYSTEM_ROLE_NAMES.includes((name ?? "").trim().toLowerCase());
}

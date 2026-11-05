import { useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/store';

/** `undefined` means the control is not gated. */
export function usePermissionCheck(): (permission: string | undefined) => boolean {
  const { hasPermission } = useAuth();

  return useCallback(
    (permission) => (permission ? hasPermission(permission) : true),
    [hasPermission],
  );
}

/** One person's saved column layout must not leak to the next person on this browser. */
export function usePreferenceScope(): string {
  const userId = useAuthStore((state) => state.user?.id);
  return userId === undefined ? 'anon' : String(userId);
}

import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/** Green for active, red for inactive. Every other value stays neutral. */
export function statusVariant(status: string): BadgeVariant {
  if (status === 'active') return 'success';
  if (status === 'inactive') return 'destructive';
  return 'secondary';
}

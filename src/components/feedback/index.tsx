import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {body ? <p className="max-w-md text-sm text-muted-foreground">{body}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  requestId,
  onRetry,
}: {
  error: unknown;
  requestId?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : t("dt.states.errorTitle");

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-foreground">{t("dt.states.errorTitle")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {requestId ? <p className="text-xs text-muted-foreground"><bdi dir="ltr">{requestId}</bdi></p> : null}
      {onRetry ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {t("dt.table.retry")}
        </Button>
      ) : null}
    </div>
  );
}

export { useConfirm } from "./use-confirm";

import { useCallback } from "react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

export function useConfirm() {
  const { confirm } = useConfirmDialog();

  return useCallback(
    (options: { title: string; body?: string; confirmLabel?: string; destructive?: boolean }) =>
      confirm({
        title: options.title,
        message: options.body ?? "",
        confirmText: options.confirmLabel,
        variant: options.destructive ? "danger" : "info",
      }),
    [confirm],
  );
}

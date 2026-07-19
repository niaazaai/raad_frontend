import { useCallback, useMemo } from "react";
import type { ConfirmDialogOptions } from "@/components/ui/confirm-dialog";
import { useTranslation } from "./useTranslation";

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export function useFormatMessage() {
  const { t } = useTranslation();

  const fmt = useCallback(
    (key: Parameters<typeof t>[0], vars: Record<string, string> = {}) => fill(t(key), vars),
    [t],
  );

  return fmt;
}

export function useConfirmPresets() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      delete: (itemName: string = "item"): ConfirmDialogOptions => ({
        title: fill(t("confirm.deleteTitle"), { item: itemName }),
        message: fill(t("confirm.deleteMessage"), { item: itemName.toLowerCase() }),
        variant: "danger",
        confirmText: t("confirm.delete"),
        cancelText: t("common.cancel"),
      }),
      disable: (itemName: string = "item"): ConfirmDialogOptions => ({
        title: fill(t("confirm.disableTitle"), { item: itemName }),
        message: fill(t("confirm.disableMessage"), { item: itemName.toLowerCase() }),
        variant: "warning",
        confirmText: t("confirm.disable"),
        cancelText: t("common.cancel"),
      }),
      enable: (itemName: string = "item"): ConfirmDialogOptions => ({
        title: fill(t("confirm.enableTitle"), { item: itemName }),
        message: fill(t("confirm.enableMessage"), { item: itemName.toLowerCase() }),
        variant: "success",
        confirmText: t("confirm.enable"),
        cancelText: t("common.cancel"),
      }),
      suspend: (itemName: string = "item"): ConfirmDialogOptions => ({
        title: fill(t("confirm.suspendTitle"), { item: itemName }),
        message: fill(t("confirm.suspendMessage"), { item: itemName.toLowerCase() }),
        variant: "warning",
        confirmText: t("confirm.suspend"),
        cancelText: t("common.cancel"),
      }),
      activate: (itemName: string = "item"): ConfirmDialogOptions => ({
        title: fill(t("confirm.activateTitle"), { item: itemName }),
        message: fill(t("confirm.activateMessage"), { item: itemName.toLowerCase() }),
        variant: "success",
        confirmText: t("confirm.activate"),
        cancelText: t("common.cancel"),
      }),
      unsavedChanges: (): ConfirmDialogOptions => ({
        title: t("confirm.unsavedTitle"),
        message: t("confirm.unsavedMessage"),
        variant: "warning",
        confirmText: t("confirm.leave"),
        cancelText: t("confirm.stay"),
      }),
    }),
    [t],
  );
}

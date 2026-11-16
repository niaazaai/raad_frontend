import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/modules/Course/components/ClassStudentPaymentForm";
import type { FinancialTransactionRow } from "../data/models/FinanceReport";
import {
  useUpdateFinancialTransaction,
  type UpdateFinancialTransactionBody,
} from "../hooks/useFinancialTransactions";

const CLASSIFICATION_TYPES = new Set(["mof_receivable", "other_receivable", "receivable"]);

const notesClass = cn(
  "flex w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "md:text-sm resize-y min-h-[88px]"
);

interface TransactionEditDrawerProps {
  open: boolean;
  row: FinancialTransactionRow | null;
  onClose: () => void;
}

interface EditFormState {
  amount: string;
  currency: string;
  exchange_rate: string;
  transaction_date: string;
  next_installment_date: string;
  payer: string;
  notes: string;
  internal_notes: string;
  service_name: string;
  service_cost: string;
}

function formFromRow(row: FinancialTransactionRow): EditFormState {
  return {
    amount: row.amount != null ? String(row.amount) : "",
    currency: row.currency || "AFN",
    exchange_rate: row.exchange_rate != null ? String(row.exchange_rate) : "1",
    transaction_date: row.transaction_date?.slice(0, 10) || "",
    next_installment_date: row.next_installment_date?.slice(0, 10) || "",
    payer: row.payer || "",
    notes: row.notes || "",
    internal_notes: row.internal_notes || "",
    service_name: row.service_name || "",
    service_cost: row.service_cost != null ? String(row.service_cost) : "",
  };
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

const TransactionEditDrawer = ({ open, row, onClose }: TransactionEditDrawerProps) => {
  const { t } = useTranslation();
  const { mutate: save, isPending } = useUpdateFinancialTransaction();
  const [form, setForm] = useState<EditFormState | null>(null);

  useEffect(() => {
    if (open && row) {
      setForm(formFromRow(row));
    }
    if (!open) {
      setForm(null);
    }
  }, [open, row]);

  const classification = useMemo(
    () => (row?.type ? CLASSIFICATION_TYPES.has(row.type) : false),
    [row?.type]
  );

  const setField = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const submit = () => {
    if (!row || !form) return;

    const body: UpdateFinancialTransactionBody = {
      transaction_date: form.transaction_date || undefined,
      next_installment_date: form.next_installment_date.trim() === "" ? null : form.next_installment_date,
      notes: form.notes.trim() === "" ? null : form.notes.trim(),
      internal_notes: form.internal_notes.trim() === "" ? null : form.internal_notes.trim(),
      service_name: form.service_name.trim() === "" ? null : form.service_name.trim(),
      service_cost: optionalNumber(form.service_cost),
    };

    if (!classification) {
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount < 0.01) {
        toast.error(t("fin.transactions.editAmountInvalid"));
        return;
      }
      body.amount = Math.round(amount * 100) / 100;
      body.currency = form.currency || "AFN";
      body.exchange_rate =
        form.currency === "AFN" ? 1 : optionalNumber(form.exchange_rate) ?? 1;
      body.payer = form.payer.trim() === "" ? null : form.payer;
    }

    if (!form.transaction_date) {
      toast.error(t("fin.transactions.editDateRequired"));
      return;
    }

    save(
      { id: row.id, body },
      {
        onSuccess: () => {
          toast.success(t("fin.transactions.editDone"));
          onClose();
        },
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : t("fin.transactions.editFailed")),
      }
    );
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent side="right" className="w-full max-w-lg sm:w-[28rem]">
        <DrawerHeader>
          <DrawerTitle>{t("fin.transactions.editTitle")}</DrawerTitle>
          <DrawerDescription>
            {row
              ? `${row.student_name?.trim() || row.service_name || t("fin.transactions.details")} · #${row.id}`
              : t("fin.transactions.editBody")}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          {form ? (
            <>
              {classification ? (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {t("fin.transactions.editClassificationHint")}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tx-amount">{t("finance.columns.amount")}</Label>
                    <Input
                      id="tx-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setField("amount", e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("finance.manualInvoice.currency")}</Label>
                      <Select value={form.currency} onValueChange={(value) => setField("currency", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tx-rate">{t("finance.manualInvoice.exchangeRate")}</Label>
                      <Input
                        id="tx-rate"
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={form.exchange_rate}
                        disabled={form.currency === "AFN"}
                        onChange={(e) => setField("exchange_rate", e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("fin.payer.label")}</Label>
                    <Select
                      value={form.payer || "__none__"}
                      onValueChange={(value) => setField("payer", value === "__none__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("fin.payer.all")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        <SelectItem value="student">{t("fin.payer.student")}</SelectItem>
                        <SelectItem value="mof">{t("fin.payer.mof")}</SelectItem>
                        <SelectItem value="other_party">{t("fin.payer.other_party")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tx-date">{t("fin.columns.transactionDate")}</Label>
                  <Input
                    id="tx-date"
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => setField("transaction_date", e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tx-next">{t("finance.columns.nextInstallment")}</Label>
                  <Input
                    id="tx-next"
                    type="date"
                    value={form.next_installment_date}
                    onChange={(e) => setField("next_installment_date", e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tx-service">{t("finance.manualInvoice.serviceName")}</Label>
                <Input
                  id="tx-service"
                  value={form.service_name}
                  onChange={(e) => setField("service_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tx-notes">{t("finance.columns.remarks")}</Label>
                <textarea
                  id="tx-notes"
                  className={notesClass}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tx-internal">{t("fin.transactions.internalNotes")}</Label>
                <textarea
                  id="tx-internal"
                  className={notesClass}
                  value={form.internal_notes}
                  onChange={(e) => setField("internal_notes", e.target.value)}
                />
              </div>
            </>
          ) : null}
        </DrawerBody>
        <DrawerFooter className="flex flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || !form}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionEditDrawer;

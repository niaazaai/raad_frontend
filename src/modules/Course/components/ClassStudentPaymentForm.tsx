import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import FinanceStatusBadge from "@/modules/Finance/components/FinanceStatusBadge";
import { localIsoDate } from "@/modules/Finance/components/financeFormat";
import type { ClassStudentRow } from "../hooks/useClassStudents";

export const DISCOUNT_TYPES = ["none", "percentage", "fixed"] as const;
export const CURRENCIES = ["AFN", "USD", "GBP"] as const;
export const RECEIVABLE_STATUSES = ["pending", "mof_pending", "other_party"] as const;

export type PaymentFormState = {
  discount_type: string;
  discount_amount: string;
  payment_amount: string;
  currency: string;
  exchange_rate: string;
  next_due_date: string;
  transaction_date: string;
  receivable_status: string;
  other_party_name: string;
  irrecoverable_debt: string;
  /** Who is paying: the student, or MOF / the other party settling their classified balance. */
  payer: string;
};

/** Statuses where nothing is left to collect on the enrollment. */
export const SETTLED_STATUSES = ["paid", "free", "written_off", "withdrawn", "moved"] as const;

export function defaultPaymentFormState(): PaymentFormState {
  return {
    discount_type: "none",
    discount_amount: "",
    payment_amount: "",
    currency: "AFN",
    exchange_rate: "1",
    next_due_date: "",
    transaction_date: localIsoDate(),
    receivable_status: "pending",
    other_party_name: "",
    irrecoverable_debt: "",
    payer: "student",
  };
}

export function resolveEnrollmentRemainingDue(
  enrollment: Pick<
    ClassStudentRow,
    | "due_amount"
    | "class_fee"
    | "discount_type"
    | "discount_amount"
    | "paid_amount"
    | "irrecoverable_debt"
  >,
  classFee = 0
): number {
  if (enrollment.due_amount != null && enrollment.due_amount !== "") {
    const due = Number(enrollment.due_amount);
    if (!Number.isNaN(due)) {
      return Math.max(0, Math.round(due * 100) / 100);
    }
  }

  const feeSource = enrollment.class_fee != null ? Number(enrollment.class_fee) : classFee;
  const discountType = String(enrollment.discount_type ?? "none");
  const discountAmount =
    enrollment.discount_amount != null ? Number(enrollment.discount_amount) : 0;
  const settled = settledBaseOf(enrollment);
  const irrecoverable = Number(enrollment.irrecoverable_debt ?? 0);
  const feeAfter = computeFeeAfterDiscount(feeSource, discountType, discountAmount);

  return Math.max(0, Math.round((feeAfter - settled - irrecoverable) * 100) / 100);
}

export function isEnrollmentFullyPaid(
  enrollment: Pick<
    ClassStudentRow,
    | "payment_status"
    | "due_amount"
    | "class_fee"
    | "discount_type"
    | "discount_amount"
    | "paid_amount"
    | "irrecoverable_debt"
  >,
  classFee = 0
): boolean {
  if ((SETTLED_STATUSES as readonly string[]).includes(String(enrollment.payment_status ?? ""))) {
    return true;
  }

  return resolveEnrollmentRemainingDue(enrollment, classFee) <= 0.009;
}

export function buildPaymentFormStateFromEnrollment(
  enrollment: Pick<
    ClassStudentRow,
    | "due_amount"
    | "class_fee"
    | "discount_type"
    | "discount_amount"
    | "paid_amount"
    | "payment_status"
    | "currency"
    | "next_due_date"
    | "other_party_name"
    | "irrecoverable_debt"
  >,
  classFee = 0
): PaymentFormState {
  const discountType = String(enrollment.discount_type ?? "none");
  const discountAmount =
    enrollment.discount_amount != null ? Number(enrollment.discount_amount) : 0;
  const irrecoverable = Number(enrollment.irrecoverable_debt ?? 0);
  const remaining = resolveEnrollmentRemainingDue(enrollment, classFee);
  const currentStatus = String(enrollment.payment_status ?? "pending");
  const receivableStatus = RECEIVABLE_STATUSES.includes(
    currentStatus as (typeof RECEIVABLE_STATUSES)[number]
  )
    ? currentStatus
    : "pending";

  return {
    discount_type: discountType,
    discount_amount: String(discountAmount),
    payment_amount: remaining > 0 ? String(remaining) : "",
    currency: String(enrollment.currency ?? "AFN"),
    exchange_rate: "1",
    next_due_date: enrollment.next_due_date ? String(enrollment.next_due_date).slice(0, 10) : "",
    transaction_date: localIsoDate(),
    receivable_status: receivableStatus,
    other_party_name: String(enrollment.other_party_name ?? ""),
    irrecoverable_debt: irrecoverable > 0 ? String(irrecoverable) : "",
    payer: "student",
  };
}

export function formatMoney(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Payments (before refunds) plus cancelled fees: everything that already closed part of the fee. */
export function settledBaseOf(
  enrollment: Partial<Pick<ClassStudentRow, "paid_amount" | "refund_amount" | "cancelled_amount">>
): number {
  return (
    Number(enrollment.paid_amount ?? 0) +
    Number(enrollment.refund_amount ?? 0) +
    Number(enrollment.cancelled_amount ?? 0)
  );
}

export function computeFeeAfterDiscount(
  classFee: number,
  discountType: string,
  discountAmount: number
): number {
  if (discountType === "percentage") {
    return Math.max(
      0,
      Math.round(classFee * (1 - Math.min(100, Math.max(0, discountAmount)) / 100) * 100) / 100
    );
  }
  if (discountType === "fixed") {
    return Math.max(0, Math.round((classFee - Math.max(0, discountAmount)) * 100) / 100);
  }
  return Math.max(0, classFee);
}

export function resolvePaymentPreviewStatus(
  fee: number,
  paid: number,
  receivableStatus?: string,
  context: { discounted?: boolean; writtenOff?: number } = {}
): "pending" | "paid" | "partial" | "mof_pending" | "other_party" | "free" | "written_off" {
  if (fee <= 0 && context.discounted) return "free";
  if (fee <= 0 || paid >= fee) return (context.writtenOff ?? 0) > 0.009 ? "written_off" : "paid";
  if (receivableStatus === "mof_pending") return "mof_pending";
  if (receivableStatus === "other_party") return "other_party";
  if (paid <= 0) return "pending";
  return "partial";
}

export interface ClassStudentPaymentFormProps {
  enrollment: Pick<
    ClassStudentRow,
    | "paid_amount"
    | "class_fee"
    | "currency"
    | "discount_type"
    | "discount_amount"
    | "irrecoverable_debt"
  > &
    Partial<
      Pick<
        ClassStudentRow,
        "refund_amount" | "cancelled_amount" | "payment_status" | "other_party_name"
      >
    >;
  classFee: number;
  form: PaymentFormState;
  onFormChange: (next: PaymentFormState) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  classifyOnlyLabel?: string;
}

export function ClassStudentPaymentForm({
  enrollment,
  classFee,
  form,
  onFormChange,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  classifyOnlyLabel,
}: ClassStudentPaymentFormProps) {
  const { t } = useTranslation();

  const feeSource = enrollment.class_fee != null ? Number(enrollment.class_fee) : classFee;
  const discountAmount = form.discount_amount ? Number(form.discount_amount) : 0;
  const paymentAmount = form.payment_amount ? Number(form.payment_amount) : 0;
  const alreadyPaid = Number(enrollment.paid_amount ?? 0);
  // Refunds never re-open the balance and cancelled fees are closed, so both count as settled.
  const settledBase = settledBaseOf(enrollment);
  const irrecoverable = form.irrecoverable_debt ? Number(form.irrecoverable_debt) : 0;
  const feeAfterDiscount = computeFeeAfterDiscount(feeSource, form.discount_type, discountAmount);
  const remainingBefore = Math.max(
    0,
    Math.round((feeAfterDiscount - settledBase - irrecoverable) * 100) / 100
  );
  const projectedSettled = settledBase + paymentAmount;
  const dueAfter = Math.max(
    0,
    Math.round((feeAfterDiscount - projectedSettled - irrecoverable) * 100) / 100
  );
  const discounted = form.discount_type !== "none" && discountAmount > 0;
  const previewStatus = resolvePaymentPreviewStatus(
    feeAfterDiscount - irrecoverable,
    projectedSettled,
    dueAfter > 0.009 ? form.receivable_status : undefined,
    { discounted, writtenOff: irrecoverable }
  );
  const currentClassification = ["mof_pending", "other_party"].includes(
    String(enrollment.payment_status ?? "")
  )
    ? String(enrollment.payment_status)
    : "pending";
  const discountChanged =
    form.discount_type !== String(enrollment.discount_type ?? "none") ||
    Math.abs(discountAmount - Number(enrollment.discount_amount ?? 0)) > 0.009;
  const classificationChanged = form.receivable_status !== currentClassification;
  const isFree = discounted && feeAfterDiscount <= 0.009;
  const payerOptions =
    paymentAmount > 0 &&
    (currentClassification !== "pending" || form.receivable_status !== "pending")
      ? [
          "student",
          form.receivable_status === "other_party" || currentClassification === "other_party"
            ? "other_party"
            : "mof",
        ]
      : [];
  const needsExchangeRate = form.currency === "USD" || form.currency === "GBP";
  const needsNextDue = dueAfter > 0.009 && form.receivable_status === "pending";
  const otherPartyOk =
    form.receivable_status !== "other_party" || form.other_party_name.trim() !== "";
  const classifyRemaining =
    form.receivable_status === "mof_pending" || form.receivable_status === "other_party";
  const existingIrrecoverable = Number(enrollment.irrecoverable_debt ?? 0);
  const irrecoverableChanged = Math.abs(irrecoverable - existingIrrecoverable) > 0.009;
  const mofAfter = form.receivable_status === "mof_pending" ? dueAfter : 0;
  const otherAfter = form.receivable_status === "other_party" ? dueAfter : 0;
  const canSubmit =
    otherPartyOk &&
    paymentAmount <= remainingBefore + 0.01 &&
    (paymentAmount > 0 ||
      irrecoverableChanged ||
      discountChanged ||
      (dueAfter > 0.009 &&
        (classificationChanged || (classifyRemaining && form.next_due_date !== ""))));

  const clampPaymentToRemaining = (
    nextIrrecoverableValue: string,
    next: PaymentFormState
  ): PaymentFormState => {
    const nextIrrecoverable = nextIrrecoverableValue ? Number(nextIrrecoverableValue) : 0;
    const nextRemaining = Math.max(
      0,
      Math.round((feeAfterDiscount - settledBase - nextIrrecoverable) * 100) / 100
    );
    const currentPayment = next.payment_amount ? Number(next.payment_amount) : 0;
    return {
      ...next,
      irrecoverable_debt: nextIrrecoverableValue,
      payment_amount:
        currentPayment > nextRemaining
          ? nextRemaining > 0
            ? String(nextRemaining)
            : ""
          : next.payment_amount,
    };
  };

  const applyDiscountChange = (next: Partial<PaymentFormState>) => {
    const merged = { ...form, ...next };
    const nextDiscountAmount = merged.discount_amount ? Number(merged.discount_amount) : 0;
    const nextFee = computeFeeAfterDiscount(feeSource, merged.discount_type, nextDiscountAmount);
    const nextRemaining = Math.max(
      0,
      Math.round((nextFee - settledBase - irrecoverable) * 100) / 100
    );
    onFormChange({
      ...merged,
      payment_amount: nextRemaining > 0 ? String(nextRemaining) : "",
      next_due_date: nextRemaining > 0 ? merged.next_due_date : "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("course.classStudents.courseFee")}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {formatMoney(feeSource)}{" "}
          <span className="text-sm font-medium text-muted-foreground">
            {form.currency || "AFN"}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("course.classStudents.discountType")}</Label>
          <Select
            value={form.discount_type}
            onValueChange={(v) =>
              applyDiscountChange({
                discount_type: v,
                discount_amount: v === "none" ? "0" : form.discount_amount,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`course.discountType.${type}` as "course.discountType.none")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount-amount">{t("course.classStudents.discountAmount")}</Label>
          <Input
            id="discount-amount"
            type="number"
            min={0}
            max={form.discount_type === "percentage" ? 100 : undefined}
            disabled={form.discount_type === "none"}
            value={form.discount_type === "none" ? "0" : form.discount_amount}
            onChange={(e) => applyDiscountChange({ discount_amount: e.target.value })}
          />
        </div>
      </div>

      {isFree ? (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
          {t("fin.receive.freeStudent")}
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment-amount">{t("course.classStudents.paymentAmount")}</Label>
          <Input
            id="payment-amount"
            type="number"
            min={0}
            max={remainingBefore || undefined}
            value={form.payment_amount}
            onChange={(e) => onFormChange({ ...form, payment_amount: e.target.value })}
            disabled={remainingBefore <= 0}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("course.classStudents.currency")}</Label>
          <Select
            value={form.currency}
            onValueChange={(v) =>
              onFormChange({
                ...form,
                currency: v,
                exchange_rate: v === "AFN" ? "1" : form.exchange_rate || "1",
              })
            }
          >
            <SelectTrigger className="w-[6.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsExchangeRate ? (
        <div className="space-y-1.5">
          <Label htmlFor="exchange-rate">{t("course.classStudents.exchangeRate")}</Label>
          <Input
            id="exchange-rate"
            type="number"
            min={0.0001}
            step="0.0001"
            value={form.exchange_rate}
            onChange={(e) => onFormChange({ ...form, exchange_rate: e.target.value })}
          />
        </div>
      ) : null}

      {payerOptions.length > 0 ? (
        <div className="space-y-1.5">
          <Label>{t("fin.payer.label")}</Label>
          <div className="inline-flex w-full rounded-lg border border-border p-1">
            {payerOptions.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                className="flex-1"
                variant={(form.payer || "student") === option ? "default" : "ghost"}
                onClick={() => onFormChange({ ...form, payer: option })}
              >
                {option === "student"
                  ? t("fin.payer.student")
                  : option === "mof"
                    ? t("fin.payer.mof")
                    : form.other_party_name ||
                      enrollment.other_party_name ||
                      t("fin.payer.other_party")}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("fin.receive.settleHint")}</p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="transaction-date">{t("course.classStudents.transactionDate")}</Label>
        <Input
          id="transaction-date"
          type="date"
          value={form.transaction_date}
          onChange={(e) => onFormChange({ ...form, transaction_date: e.target.value })}
        />
      </div>

      {needsNextDue ? (
        <div className="space-y-1.5">
          <Label htmlFor="next-due-date">{t("course.classStudents.nextDueDate")}</Label>
          <Input
            id="next-due-date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={form.next_due_date}
            onChange={(e) => onFormChange({ ...form, next_due_date: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label>{t("course.classStudents.receivable")}</Label>
        <Select
          value={form.receivable_status}
          onValueChange={(v) => {
            onFormChange({
              ...form,
              receivable_status: v,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECEIVABLE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`course.paymentStatus.${status}` as "course.paymentStatus.pending")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("course.classStudents.receivableHint")}</p>
      </div>

      {form.receivable_status === "other_party" ? (
        <div className="space-y-1.5">
          <Label htmlFor="other-party-name">{t("course.classStudents.otherPartyName")}</Label>
          <Input
            id="other-party-name"
            value={form.other_party_name}
            onChange={(e) => onFormChange({ ...form, other_party_name: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="irrecoverable-debt">{t("course.classStudents.irrecoverableDebt")}</Label>
        <Input
          id="irrecoverable-debt"
          type="number"
          min={0}
          value={form.irrecoverable_debt}
          onChange={(e) => onFormChange(clampPaymentToRemaining(e.target.value, form))}
        />
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("course.classStudents.afterDiscount")}</span>
          <span className="font-medium tabular-nums">
            {formatMoney(feeAfterDiscount)} {form.currency}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("course.classStudents.alreadyPaid")}</span>
          <span className="font-medium tabular-nums">
            {formatMoney(alreadyPaid)} {form.currency}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("course.columns.payment_status")}</span>
          <FinanceStatusBadge value={previewStatus} />
        </div>
        {paymentAmount > 0.009 ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t("course.classStudents.cashThisSave")}</span>
            <span className="font-medium tabular-nums">
              {formatMoney(paymentAmount)} {form.currency}
            </span>
          </div>
        ) : null}
        {mofAfter > 0.009 ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t("finance.mofReceivable")}</span>
            <span className="font-medium tabular-nums text-warning">
              {formatMoney(mofAfter)} {form.currency}
            </span>
          </div>
        ) : null}
        {otherAfter > 0.009 ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t("finance.otherReceivable")}</span>
            <span className="font-medium tabular-nums text-warning">
              {formatMoney(otherAfter)} {form.currency}
            </span>
          </div>
        ) : null}
        {irrecoverable > 0.009 ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {t("course.classStudents.irrecoverableDebt")}
            </span>
            <span className="font-medium tabular-nums">
              {formatMoney(irrecoverable)} {form.currency}
            </span>
          </div>
        ) : null}
        {previewStatus === "partial" ||
        previewStatus === "pending" ||
        previewStatus === "mof_pending" ||
        previewStatus === "other_party" ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t("course.columns.due_amount")}</span>
            <span className="font-medium tabular-nums text-warning">
              {formatMoney(dueAfter)} {form.currency}
            </span>
          </div>
        ) : null}
        {remainingBefore <= 0 &&
        !irrecoverableChanged &&
        paymentAmount <= 0 &&
        !classifyRemaining &&
        !discountChanged ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("course.classStudents.fullyPaidHint")}
          </p>
        ) : null}
        {paymentAmount <= 0 && discountChanged ? (
          <p className="mt-3 text-xs text-info">{t("fin.receive.discountOnlyHint")}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          loading={isSubmitting}
          disabled={!canSubmit || (needsNextDue && !form.next_due_date)}
          onClick={() => void onSubmit()}
        >
          {paymentAmount > 0
            ? (submitLabel ?? t("course.classStudents.savePayment"))
            : discountChanged && !irrecoverableChanged && !classificationChanged
              ? t("fin.receive.saveDiscount")
              : (classifyOnlyLabel ?? t("course.classStudents.classifyOnly"))}
        </Button>
      </div>
    </div>
  );
}

export function buildPaymentPayloadFromForm(
  form: PaymentFormState,
  enrollment: Pick<ClassStudentRow, "paid_amount" | "class_fee"> &
    Partial<Pick<ClassStudentRow, "refund_amount" | "cancelled_amount">>,
  classFee: number
) {
  const discountAmount = form.discount_amount ? Number(form.discount_amount) : 0;
  const paymentAmount = form.payment_amount ? Number(form.payment_amount) : 0;
  const irrecoverable = form.irrecoverable_debt ? Number(form.irrecoverable_debt) : 0;
  const needsExchangeRate = form.currency === "USD" || form.currency === "GBP";
  const feeSource = enrollment.class_fee != null ? Number(enrollment.class_fee) : classFee;
  const feeAfterDiscount = computeFeeAfterDiscount(feeSource, form.discount_type, discountAmount);
  const projectedSettled = settledBaseOf(enrollment) + paymentAmount;
  const dueAfter = Math.max(
    0,
    Math.round((feeAfterDiscount - projectedSettled - irrecoverable) * 100) / 100
  );
  const needsNextDue = dueAfter > 0.009 && form.receivable_status === "pending";

  return {
    discount_type: form.discount_type,
    discount_amount: form.discount_type === "none" ? 0 : discountAmount,
    payment_amount: paymentAmount,
    currency: form.currency,
    exchange_rate: needsExchangeRate ? Number(form.exchange_rate || 1) : 1,
    transaction_date: form.transaction_date || undefined,
    next_due_date: needsNextDue ? form.next_due_date || null : null,
    receivable_status: form.receivable_status,
    other_party_name:
      form.receivable_status === "other_party" ? form.other_party_name.trim() : undefined,
    irrecoverable_debt: irrecoverable,
    payer: paymentAmount > 0 ? form.payer || "student" : undefined,
  };
}

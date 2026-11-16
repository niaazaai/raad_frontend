import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeftRight as CoinsSwap, Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  DatePicker,
  Input,
  Label,
  PageBreadcrumb,
  SearchableMultiSelect,
  SearchableSelect,
  Skeleton,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDebounce } from "@/hooks/common/useDebounce";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  buildPaymentFormStateFromEnrollment,
  buildPaymentPayloadFromForm,
  ClassStudentPaymentForm,
  computeDiscountValue,
  defaultPaymentFormState,
  isEnrollmentFullyPaid,
  type PaymentFormState,
} from "@/modules/Course/components/ClassStudentPaymentForm";
import {
  useRecordClassStudentPayment,
  type ClassStudentRow,
} from "@/modules/Course/hooks/useClassStudents";
import {
  useCourseEntityList,
  getCourseListFromResponse,
} from "@/modules/Course/hooks/useCourseEntity";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import MoneyWaterfall, { type WaterfallValues } from "../../components/MoneyWaterfall";
import { formatMoney, localIsoDate, openPdf, toNumber } from "../../components/financeFormat";
import { useRecoverWriteOff } from "../../hooks/useEnrollmentActions";
import {
  extractEnrollmentTransactions,
  useEnrollmentTransactions,
} from "../../hooks/useEnrollmentTransactions";
import {
  extractStudentEnrollments,
  useStudentActiveEnrollments,
} from "../../hooks/useReceivePayment";

type Mode = "payment" | "recover";

function formatStudentPickerLabel(student: Record<string, unknown>): {
  value: string;
  label: string;
} {
  const name = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
  const code = String(student.student_code ?? student.id);
  const nationalId = String(student.national_id ?? "—");
  const phone = String(student.phone_number ?? "").trim();
  const phoneSuffix = phone ? ` · ${phone}` : "";
  return {
    value: String(student.id),
    label: `${code} - ${name} : ${nationalId}${phoneSuffix}`,
  };
}

function enrollmentBalance(row: ClassStudentRow): number {
  return toNumber(row.receivable_amount ?? row.due_amount);
}

/** Saved ledger waterfall — mirrors invoice PDF / EnrollmentBalanceCalculator. */
function buildSavedAccountSummary(
  enrollment: ClassStudentRow,
  classFee: number
): WaterfallValues {
  const discount =
    enrollment.discount_value != null
      ? toNumber(enrollment.discount_value)
      : computeDiscountValue(
          classFee,
          String(enrollment.discount_type ?? "none"),
          Number(enrollment.discount_amount ?? 0)
        );
  const net =
    enrollment.net_amount != null
      ? toNumber(enrollment.net_amount)
      : toNumber(enrollment.fee_amount) || Math.max(0, classFee - discount);

  return {
    gross: classFee,
    discount,
    net,
    paid: enrollment.paid_amount,
    refunds: enrollment.refund_amount,
    cancelled: enrollment.cancelled_amount,
    writtenOff: enrollment.irrecoverable_debt,
    receivable: enrollment.receivable_amount ?? enrollment.due_amount,
    mof: enrollment.mof_receivable_amount,
    other: enrollment.other_receivable_amount,
    studentReceivable: enrollment.student_receivable_amount,
    credit: enrollment.credit_amount,
  };
}

/**
 * Recover preview only — does not project an unsaved payment into Paid.
 * Payment mode always uses the saved ledger (prefilled remaining must not look like paid).
 */
function buildRecoverPreviewSummary(
  enrollment: ClassStudentRow,
  classFee: number,
  recoverAmount: number
): WaterfallValues {
  const gross = Math.max(0, classFee);
  const refunds = toNumber(enrollment.refund_amount);
  const cancelled = toNumber(enrollment.cancelled_amount);
  const paymentsAlready = toNumber(enrollment.paid_amount) + refunds;
  const recover = Math.max(0, recoverAmount);
  const writtenOff = Math.max(0, toNumber(enrollment.irrecoverable_debt) - recover);
  const payments = paymentsAlready + recover;
  const discount = toNumber(enrollment.discount_value);
  const net =
    toNumber(enrollment.net_amount ?? enrollment.fee_amount) || Math.max(0, gross - discount);
  const open = Math.round((net - payments - cancelled - writtenOff) * 100) / 100;
  const receivable = Math.max(0, open);

  return {
    gross,
    discount,
    net,
    paid: Math.max(0, payments - refunds),
    refunds,
    cancelled,
    writtenOff,
    receivable,
    mof: 0,
    other: 0,
    studentReceivable: receivable,
    credit: Math.max(0, -open),
  };
}

const ReceivePaymentPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canReceive = hasPermission("finance.payments.receive");
  const canDiscount = hasPermission("finance.discounts.apply");
  const canWriteOff = hasPermission("finance.debts.writeoff");
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStudent = Number(searchParams.get("student") ?? "") || null;
  const initialEnrollment = Number(searchParams.get("enrollment") ?? "") || null;

  const [studentId, setStudentId] = useState<number | null>(initialStudent);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 150);
  const studentSearchTerm = debouncedStudentSearch.trim();

  const [enrollmentId, setEnrollmentId] = useState<number | null>(initialEnrollment);
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "recover" ? "recover" : "payment"
  );
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentFormState());
  const [recoverAmount, setRecoverAmount] = useState("");
  const [recoverDate, setRecoverDate] = useState(localIsoDate());
  const [recoverNotes, setRecoverNotes] = useState("");
  const [hydratedFor, setHydratedFor] = useState<number | null>(null);

  const studentsListQuery = useCourseEntityList(
    "lms-class-students",
    { per_page: 25, page: 1, status: "active", picker: 1, search: studentSearchTerm || undefined },
    { enabled: studentSearchTerm.length >= 1, keepPreviousData: true }
  );

  const availableStudents = getCourseListFromResponse(studentsListQuery.data);
  const studentOptions = useMemo(() => {
    const fromSearch = availableStudents.map((s) => formatStudentPickerLabel(s));
    if (
      studentId &&
      selectedStudentLabel &&
      !fromSearch.some((o) => o.value === String(studentId))
    ) {
      return [{ value: String(studentId), label: selectedStudentLabel }, ...fromSearch];
    }
    return fromSearch;
  }, [availableStudents, selectedStudentLabel, studentId]);

  const enrollmentsQuery = useStudentActiveEnrollments(studentId);
  const enrollments = extractStudentEnrollments(enrollmentsQuery.data);

  const selectedEnrollment = useMemo(
    () => enrollments.find((row) => row.id === enrollmentId) ?? null,
    [enrollmentId, enrollments]
  );

  // Deep link (?student=&enrollment=): label the student from the loaded enrollment once it arrives.
  useEffect(() => {
    if (!studentId || selectedStudentLabel || enrollments.length === 0) return;
    const first = enrollments[0];
    setSelectedStudentLabel(
      formatStudentPickerLabel({
        id: studentId,
        first_name: first.first_name,
        last_name: first.last_name,
        student_code: first.student_code,
        national_id: first.national_id,
        phone_number: first.phone_number,
      }).label
    );
  }, [enrollments, selectedStudentLabel, studentId]);

  const classId = selectedEnrollment?.class_id ?? 0;
  const classFee = selectedEnrollment?.class_fee != null ? Number(selectedEnrollment.class_fee) : 0;
  const settled = selectedEnrollment ? isEnrollmentFullyPaid(selectedEnrollment, classFee) : false;
  const writtenOff = toNumber(selectedEnrollment?.irrecoverable_debt);
  const recordPayment = useRecordClassStudentPayment(classId, enrollmentId ?? 0);
  const recoverWriteOff = useRecoverWriteOff(classId, enrollmentId ?? 0);
  const transactionsQuery = useEnrollmentTransactions(enrollmentId);
  const ledgerCashRows = useMemo(() => {
    const rows = extractEnrollmentTransactions(transactionsQuery.data).filter(
      (tx) => tx.type === "payment" || tx.type === "refund"
    );
    return [...rows].sort((a, b) => {
      const dateCmp = String(a.transaction_date ?? "").localeCompare(String(b.transaction_date ?? ""));
      if (dateCmp !== 0) return dateCmp;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [transactionsQuery.data]);
  const paymentInstallments = useMemo(
    () => ledgerCashRows.filter((tx) => tx.type === "payment"),
    [ledgerCashRows]
  );

  // Prefill the forms whenever a different enrollment is selected (incl. deep links).
  useEffect(() => {
    if (!selectedEnrollment || hydratedFor === selectedEnrollment.id) return;
    setHydratedFor(selectedEnrollment.id);
    setPaymentForm(buildPaymentFormStateFromEnrollment(selectedEnrollment, classFee));
    setRecoverAmount(writtenOff > 0 ? String(writtenOff) : "");
    setRecoverDate(localIsoDate());
    setRecoverNotes("");
    if (writtenOff <= 0) setMode("payment");
    else if (isEnrollmentFullyPaid(selectedEnrollment, classFee)) setMode("recover");
  }, [classFee, hydratedFor, selectedEnrollment, writtenOff]);

  // Older enrollments only stored the note on the payment row — pull it into the form once txs load.
  useEffect(() => {
    if (!selectedEnrollment || hydratedFor !== selectedEnrollment.id) return;
    if (String(selectedEnrollment.notes ?? "").trim() !== "") return;
    const latest = paymentInstallments[paymentInstallments.length - 1];
    const fromTx = String(latest?.internal_notes ?? latest?.notes ?? "").trim();
    if (!fromTx) return;
    setPaymentForm((prev) => (prev.notes.trim() !== "" ? prev : { ...prev, notes: fromTx }));
  }, [hydratedFor, paymentInstallments, selectedEnrollment]);

  const enrollmentOptions = useMemo(
    () =>
      enrollments.map((row) => {
        const name =
          [row.class_code, row.class_name].filter(Boolean).join(" · ") ||
          t("finance.receivePayment.unknownClass");
        const balance = enrollmentBalance(row);
        const status = row.payment_status
          ? ` · ${t(`fin.status.${row.payment_status}` as "fin.status.paid")}`
          : "";
        return {
          value: String(row.id),
          label: `${name} — ${t("fin.receive.balance")} ${formatMoney(balance, row.currency)}${status}`,
        };
      }),
    [enrollments, t]
  );

  const syncUrl = useCallback(
    (next: { student?: number | null; enrollment?: number | null }) => {
      const params = new URLSearchParams();
      const s = next.student ?? null;
      const e = next.enrollment ?? null;
      if (s) params.set("student", String(s));
      if (e) params.set("enrollment", String(e));
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleStudentChange = useCallback(
    (ids: string[]) => {
      const value = ids[0] ?? "";
      const nextId = value ? Number(value) : null;
      const id = nextId && !Number.isNaN(nextId) ? nextId : null;
      setStudentId(id);
      const match = studentOptions.find((o) => o.value === value);
      setSelectedStudentLabel(match?.label ?? "");
      setEnrollmentId(null);
      setHydratedFor(null);
      setPaymentForm(defaultPaymentFormState());
      syncUrl({ student: id });
    },
    [studentOptions, syncUrl]
  );

  const handleEnrollmentChange = useCallback(
    (value: string) => {
      const nextId = value ? Number(value) : null;
      const id = nextId && !Number.isNaN(nextId) ? nextId : null;
      setEnrollmentId(id);
      setHydratedFor(null);
      syncUrl({ student: studentId, enrollment: id });
    },
    [studentId, syncUrl]
  );

  useEffect(() => {
    if (
      enrollmentId &&
      enrollmentsQuery.isSuccess &&
      !enrollments.some((row) => row.id === enrollmentId)
    ) {
      setEnrollmentId(null);
      setPaymentForm(defaultPaymentFormState());
    }
  }, [enrollmentId, enrollments, enrollmentsQuery.isSuccess]);

  if (!canReceive) {
    return <PermissionDeniedCard />;
  }

  const refreshAfterSave = async () => {
    setHydratedFor(null);
    await Promise.all([enrollmentsQuery.refetch(), transactionsQuery.refetch()]);
  };

  const handleSubmit = async () => {
    if (!selectedEnrollment || !classId || !enrollmentId) return;
    try {
      const response = await recordPayment.mutateAsync(
        buildPaymentPayloadFromForm(paymentForm, selectedEnrollment, classFee)
      );
      openPdf(response.data?.invoice?.pdf_url);
      await refreshAfterSave();
    } catch {
      // error toast is shown by callApi
    }
  };

  const handleRecover = async () => {
    if (!selectedEnrollment || !classId || !enrollmentId) return;
    const amount = Number(recoverAmount);
    if (!amount || amount <= 0) return;
    try {
      const response = await recoverWriteOff.mutateAsync({
        amount,
        transaction_date: recoverDate || undefined,
        currency: String(selectedEnrollment.currency ?? "AFN"),
        notes: recoverNotes.trim() || undefined,
      });
      openPdf(response.data?.invoice?.pdf_url);
      await refreshAfterSave();
    } catch {
      // error toast is shown by callApi
    }
  };

  const currency = String(selectedEnrollment?.currency ?? "AFN");
  const recoverValue = Number(recoverAmount) || 0;
  const recoverValid = recoverValue > 0 && recoverValue <= writtenOff + 0.01;

  const accountSummary = useMemo((): WaterfallValues | null => {
    if (!selectedEnrollment) return null;

    // Recover tab can preview an unsaved recovery amount; payment mode stays on saved ledger
    // so the prefilled remaining balance is never mistaken for money already paid.
    if (mode === "recover" && writtenOff > 0 && hydratedFor === selectedEnrollment.id) {
      return buildRecoverPreviewSummary(selectedEnrollment, classFee, recoverValue);
    }

    return buildSavedAccountSummary(selectedEnrollment, classFee);
  }, [selectedEnrollment, classFee, mode, recoverValue, writtenOff, hydratedFor]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("finance.receivePayment.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("finance.receivePayment.subtitle")}
          </p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.receivePayment.title") },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/finance/upcoming-dues">{t("fin.dues.title")}</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <SearchableMultiSelect
              label={t("finance.receivePayment.selectStudent")}
              options={studentOptions}
              value={studentId ? [String(studentId)] : []}
              onChange={handleStudentChange}
              placeholder={t("finance.receivePayment.studentPlaceholder")}
              searchPlaceholder={t("finance.receivePayment.studentSearch")}
              emptyMessage={t("finance.receivePayment.studentEmpty")}
              typeToSearchMessage={t("course.classStudents.typeToSearchStudents")}
              filterLocally={false}
              onSearchChange={setStudentSearchQuery}
              isSearching={studentsListQuery.isFetching}
              minSearchLength={1}
              max={1}
            />

            {studentId ? (
              <div className="space-y-1.5">
                <Label>{t("finance.receivePayment.selectClass")}</Label>
                {enrollmentsQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ) : enrollmentOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("finance.receivePayment.noEnrollments")}
                  </p>
                ) : (
                  <SearchableSelect
                    options={enrollmentOptions}
                    value={enrollmentId ? String(enrollmentId) : ""}
                    onChange={handleEnrollmentChange}
                    placeholder={t("finance.receivePayment.classPlaceholder")}
                    searchPlaceholder={t("finance.receivePayment.classSearch")}
                    emptyMessage={t("finance.receivePayment.classEmpty")}
                  />
                )}
              </div>
            ) : null}

            {selectedEnrollment && writtenOff > 0 ? (
              <div
                className="inline-flex w-full rounded-lg border border-border p-1"
                role="tablist"
              >
                {(["payment", "recover"] as Mode[]).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    role="tab"
                    aria-selected={mode === value}
                    className="flex-1"
                    variant={mode === value ? "default" : "ghost"}
                    onClick={() => setMode(value)}
                  >
                    {value === "payment" ? (
                      <Wallet className="h-4 w-4" />
                    ) : (
                      <CoinsSwap className="h-4 w-4" />
                    )}
                    {value === "payment"
                      ? t("fin.receive.modePayment")
                      : t("fin.receive.modeRecover")}
                  </Button>
                ))}
              </div>
            ) : null}

            {selectedEnrollment && mode === "recover" && writtenOff > 0 ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-info/20 bg-info/5 p-3 text-sm text-muted-foreground">
                  {t("fin.receive.recoverHint")}
                </p>
                <div className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {t("fin.receive.writtenOffAvailable")}
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-danger">
                    {formatMoney(writtenOff, currency)}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="recover-amount">{t("fin.receive.recoverAmount")}</Label>
                    <Input
                      id="recover-amount"
                      type="number"
                      min={0}
                      max={writtenOff}
                      value={recoverAmount}
                      onChange={(e) => setRecoverAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="recover-date">
                      {t("course.classStudents.transactionDate")}
                    </Label>
                    <DatePicker
                      id="recover-date"
                      value={recoverDate}
                      onChange={setRecoverDate}
                      placeholder={t("course.classStudents.transactionDate")}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recover-notes">{t("fin.receive.notes")}</Label>
                  <Input
                    id="recover-notes"
                    value={recoverNotes}
                    onChange={(e) => setRecoverNotes(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    loading={recoverWriteOff.isPending}
                    disabled={!recoverValid}
                    onClick={() => void handleRecover()}
                  >
                    <CoinsSwap className="h-4 w-4" />
                    {t("fin.receive.recoverSubmit")}
                  </Button>
                </div>
              </div>
            ) : selectedEnrollment && settled ? (
              <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm">
                <p className="font-medium text-success">
                  {t("finance.receivePayment.alreadyPaidTitle")}
                </p>
                <p className="mt-1 text-muted-foreground">{t("fin.receive.nothingToCollect")}</p>
              </div>
            ) : selectedEnrollment ? (
              <ClassStudentPaymentForm
                enrollment={selectedEnrollment}
                classFee={classFee}
                form={paymentForm}
                onFormChange={setPaymentForm}
                onSubmit={handleSubmit}
                isSubmitting={recordPayment.isPending}
                submitLabel={t("finance.receivePayment.submit")}
                classifyOnlyLabel={t("course.classStudents.classifyOnly")}
                canApplyDiscount={canDiscount}
                canWriteOff={canWriteOff}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className={cn("min-w-0 self-start", !selectedEnrollment && "hidden lg:block")}>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <h2 className="text-sm font-semibold text-foreground">
                {t("fin.details.waterfall")}
              </h2>
              {selectedEnrollment ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <FinanceStatusBadge
                    value={selectedEnrollment.payment_status}
                    fallbackLabel={selectedEnrollment.payment_status_label}
                  />
                  {selectedEnrollment.next_due_date ? (
                    <Badge variant="outline" className="font-normal tabular-nums">
                      {t("fin.columns.dueDate")}: {String(selectedEnrollment.next_due_date).slice(0, 10)}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
            {selectedEnrollment && accountSummary ? (
              <>
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {[selectedEnrollment.first_name, selectedEnrollment.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedEnrollment.class_code, selectedEnrollment.class_name]
                      .filter(Boolean)
                      .join(" · ") || t("finance.receivePayment.unknownClass")}
                  </p>
                </div>
                <MoneyWaterfall
                  currency={currency}
                  values={accountSummary}
                  variant="receipt"
                  compact
                />
                <div className="space-y-1.5 border-t-[1.15px] border-dotted border-foreground/45 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("fin.receive.installments")}
                  </h3>
                  {transactionsQuery.isLoading ? (
                    <div className="space-y-1">
                      <Skeleton className="h-7 w-full" />
                      <Skeleton className="h-7 w-full" />
                    </div>
                  ) : ledgerCashRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("fin.receive.noInstallments")}</p>
                  ) : (
                    <ul className="space-y-0">
                      {(() => {
                        let paymentIndex = 0;
                        let refundIndex = 0;
                        return ledgerCashRows.map((tx) => {
                          const isRefund = tx.type === "refund";
                          if (isRefund) refundIndex += 1;
                          else paymentIndex += 1;
                          const label = isRefund
                            ? t("fin.receive.refundN").replace("{n}", String(refundIndex))
                            : t("fin.receive.installmentN").replace("{n}", String(paymentIndex));
                          return (
                            <li
                              key={tx.id}
                              className="flex items-center justify-between gap-2 border-b-[1.15px] border-dotted border-foreground/45 px-0.5 py-1.5 text-sm last:border-b-0"
                            >
                              <span className="min-w-0 text-muted-foreground">
                                <span
                                  className={cn(
                                    "font-medium",
                                    isRefund ? "text-danger" : "text-foreground"
                                  )}
                                >
                                  {label}
                                </span>
                                {tx.transaction_date ? (
                                  <span className="ms-1.5 tabular-nums">
                                    · {String(tx.transaction_date).slice(0, 10)}
                                  </span>
                                ) : null}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 font-medium tabular-nums",
                                  isRefund ? "text-danger" : "text-success"
                                )}
                              >
                                {isRefund ? "−" : ""}
                                {formatMoney(tx.amount, tx.currency ?? currency)}
                              </span>
                            </li>
                          );
                        });
                      })()}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("finance.receivePayment.classPlaceholder")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceivePaymentPage;

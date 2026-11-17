import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  DatePicker,
  Input,
  Label,
  PageBreadcrumb,
  SearchableMultiSelect,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDebounce } from "@/hooks/common/useDebounce";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/modules/Course/components/ClassStudentPaymentForm";
import {
  useCourseEntityList,
  getCourseListFromResponse,
} from "@/modules/Course/hooks/useCourseEntity";
import {
  extractStudentEnrollments,
  useStudentActiveEnrollments,
} from "../../hooks/useReceivePayment";
import {
  extractManualInvoice,
  extractNextInvoiceNumber,
  extractServiceNames,
  useCreateManualInvoice,
  useDeleteServiceName,
  useNextManualInvoiceNumber,
  useServiceNames,
} from "../../hooks/useManualInvoice";
import type { FinanceInvoiceRow, FinanceTransaction } from "../../data/models/FinanceReport";
import {
  keepNationalIdChars,
  keepPhoneChars,
  manualInvoiceContactSchema,
  OTHER_SERVICE_NAME,
  PRESET_SERVICE_NAMES,
} from "../../data/models/ManualInvoiceForm";
import { localIsoDate } from "../../components/financeFormat";

interface LastCreatedManualInvoice {
  invoiceNumber: string;
  transactionId: number;
  transactionDate: string;
  pdfUrl?: string | null;
  amount?: number | string | null;
  currency?: string | null;
}

const notesTextareaClass = cn(
  "flex w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "md:text-sm resize-y"
);

function todayIsoDate(): string {
  return localIsoDate();
}

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

function formatDisplayDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function lastCreatedFromInvoice(invoice: FinanceInvoiceRow): LastCreatedManualInvoice | null {
  const transaction = invoice.transaction as FinanceTransaction | undefined;
  if (!transaction?.id) return null;

  return {
    invoiceNumber: invoice.invoice_number,
    transactionId: transaction.id,
    transactionDate: transaction.transaction_date ?? "",
    pdfUrl: invoice.pdf_url,
    amount: invoice.amount,
    currency: invoice.currency ?? undefined,
  };
}

function formatMoney(value: unknown, currency?: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency ?? "AFN"}`;
}

const ManualInvoicePage = () => {
  const { t } = useTranslation();
  const { hasAnyPermission, hasPermission } = useAuth();
  const canCreate = hasAnyPermission([
    "finance.manual_invoices.create",
    "finance.service_income.create",
  ]);
  const canDeleteService = hasPermission("finance.service_names.delete");

  const [studentId, setStudentId] = useState<number | null>(null);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 300);
  const studentSearchTerm = debouncedStudentSearch.trim();
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("AFN");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [transactionDate, setTransactionDate] = useState(todayIsoDate());
  const [customerName, setCustomerName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceChoice, setServiceChoice] = useState("");
  const [customService, setCustomService] = useState("");
  const [hiddenServices, setHiddenServices] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [lastCreated, setLastCreated] = useState<LastCreatedManualInvoice | null>(null);

  const createManualInvoice = useCreateManualInvoice();
  const serviceNamesQuery = useServiceNames(canCreate);
  const { mutateAsync: removeServiceName } = useDeleteServiceName();
  const savedServiceNames = extractServiceNames(serviceNamesQuery.data);
  const nextNumberQuery = useNextManualInvoiceNumber(canCreate);
  const nextInvoiceNumber = extractNextInvoiceNumber(nextNumberQuery.data);

  const studentsListQuery = useCourseEntityList(
    "lms-class-students",
    {
      per_page: 25,
      page: 1,
      status: "active",
      picker: 1,
      search: studentSearchTerm || undefined,
    },
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

  const enrollmentOptions = useMemo(
    () =>
      enrollments.map((row) => ({
        value: String(row.id),
        label: `${row.class_name || t("finance.receivePayment.unknownClass")}${row.class_code ? ` (${row.class_code})` : ""}`,
      })),
    [enrollments, t]
  );

  const needsExchangeRate = currency === "USD" || currency === "GBP";

  const serviceOptions = useMemo(() => {
    const hidden = new Set(hiddenServices.map((name) => name.toLowerCase()));
    const allowed = new Set(PRESET_SERVICE_NAMES.map((name) => name.toLowerCase()));
    const fromSaved = savedServiceNames
      .map((option) => (option.label || option.value).trim())
      .filter((name) => allowed.has(name.toLowerCase()));
    const base = serviceNamesQuery.isSuccess ? fromSaved : [...PRESET_SERVICE_NAMES];
    return base.filter((name) => name !== "" && !hidden.has(name.toLowerCase()));
  }, [hiddenServices, savedServiceNames, serviceNamesQuery.isSuccess]);

  const resolvedServiceName =
    serviceChoice === OTHER_SERVICE_NAME ? customService.trim() : serviceChoice.trim();

  const handleStudentChange = useCallback(
    (ids: string[]) => {
      const value = ids[0] ?? "";
      const nextId = value ? Number(value) : null;
      setStudentId(Number.isNaN(nextId) ? null : nextId);
      const match = studentOptions.find((o) => o.value === value);
      setSelectedStudentLabel(match?.label ?? "");
      const student = availableStudents.find((row) => String(row.id) === value);
      if (student) {
        const nextNationalId = keepNationalIdChars(String(student.national_id ?? ""));
        const nextPhone = keepPhoneChars(String(student.phone_number ?? ""));
        const nextEmail = String(student.email ?? "").trim();
        setNationalId((current) => (current.trim() ? current : nextNationalId));
        setPhone((current) => (current.trim() ? current : nextPhone));
        setEmail((current) => (current.trim() ? current : nextEmail));
      }
      setEnrollmentId(null);
    },
    [availableStudents, studentOptions]
  );

  const clearFieldError = (key: string) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleRemoveService = async (value: string) => {
    try {
      await removeServiceName(value);
      setHiddenServices((current) =>
        current.some((name) => name.toLowerCase() === value.toLowerCase())
          ? current
          : [...current, value.toLowerCase()],
      );
      if (serviceChoice.toLowerCase() === value.toLowerCase()) {
        const next = serviceOptions.find((name) => name.toLowerCase() !== value.toLowerCase());
        setServiceChoice(next ?? "");
      }
    } catch {
      // The request layer already shows the in-use or permission message.
    }
  };

  const resetForm = () => {
    setAmount("");
    setCustomerName("");
    setNationalId("");
    setPhone("");
    setEmail("");
    setServiceChoice("");
    setCustomService("");
    setFieldErrors({});
    setCost("");
    setNotes("");
    setTransactionDate(todayIsoDate());
    setExchangeRate("1");
    setCurrency("AFN");
    setStudentId(null);
    setSelectedStudentLabel("");
    setEnrollmentId(null);
    setStudentSearchQuery("");
    void nextNumberQuery.refetch();
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error(t("finance.manualInvoice.amountRequired"));
      return;
    }

    if (serviceChoice === OTHER_SERVICE_NAME && !customService.trim()) {
      setFieldErrors({ service_name: t("finance.manualInvoice.serviceRequired") });
      return;
    }

    const contact = manualInvoiceContactSchema({
      nationalId: t("finance.manualInvoice.nationalIdInvalid"),
      phone: t("finance.manualInvoice.phoneInvalid"),
      email: t("finance.manualInvoice.emailInvalid"),
      service: t("finance.manualInvoice.serviceRequired"),
    }).safeParse({
      customer_national_id: nationalId,
      customer_phone: phone,
      customer_email: email,
      service_name: resolvedServiceName,
    });
    if (!contact.success) {
      const next: Record<string, string> = {};
      for (const issue of contact.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});

    const payload = {
      amount: parsedAmount,
      currency,
      exchange_rate: needsExchangeRate ? Number(exchangeRate) || 1 : 1,
      transaction_date: transactionDate,
      customer_name: customerName.trim() || undefined,
      customer_national_id: contact.data.customer_national_id || undefined,
      customer_phone: contact.data.customer_phone || undefined,
      customer_email: contact.data.customer_email || undefined,
      service_name: contact.data.service_name || undefined,
      cost: cost.trim() ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
      ...(enrollmentId ? { class_student_id: enrollmentId } : {}),
    };

    try {
      const response = await createManualInvoice.mutateAsync(payload);
      const invoice = extractManualInvoice(response);
      const created = invoice ? lastCreatedFromInvoice(invoice) : null;
      // success toast comes from the API response (callApi)
      if (created) {
        setLastCreated(created);
      }
      if (invoice?.pdf_url) {
        window.open(invoice.pdf_url, "_blank", "noopener,noreferrer");
      }
      resetForm();
    } catch {
      // error toast is shown by callApi
    }
  };

  if (!canCreate) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-6 p-6 pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("finance.manualInvoice.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("finance.manualInvoice.subtitle")}
            </p>
            <div className="mt-2">
              <PageBreadcrumb
                items={[
                  { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                  { label: t("finance.title"), to: "/finance" },
                  { label: t("finance.serviceIncome.title"), to: "/finance/service-income" },
                  { label: t("finance.manualInvoice.title") },
                ]}
              />
            </div>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link to="/finance/service-income">{t("finance.serviceIncome.title")}</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 justify-center p-6">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <SearchableMultiSelect
                label={t("finance.manualInvoice.studentOptional")}
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
                  <Label>{t("finance.manualInvoice.classOptional")}</Label>
                  {enrollmentsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                  ) : enrollmentOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("finance.receivePayment.noEnrollments")}
                    </p>
                  ) : (
                    <SearchableSelect
                      options={enrollmentOptions}
                      value={enrollmentId ? String(enrollmentId) : ""}
                      onChange={(value) => setEnrollmentId(value ? Number(value) : null)}
                      placeholder={t("finance.receivePayment.classPlaceholder")}
                      searchPlaceholder={t("finance.receivePayment.classSearch")}
                      emptyMessage={t("finance.receivePayment.classEmpty")}
                    />
                  )}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="manual-customer">{t("finance.manualInvoice.customerName")}</Label>
                <Input
                  id="manual-customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("finance.manualInvoice.customerPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-national-id">{t("finance.manualInvoice.nationalId")}</Label>
                  <Input
                    id="manual-national-id"
                    value={nationalId}
                    inputMode="text"
                    maxLength={64}
                    onChange={(e) => {
                      setNationalId(keepNationalIdChars(e.target.value));
                      clearFieldError("customer_national_id");
                    }}
                    placeholder={t("finance.manualInvoice.nationalIdPlaceholder")}
                  />
                  {fieldErrors.customer_national_id ? (
                    <p className="text-sm text-danger">{fieldErrors.customer_national_id}</p>
                  ) : null}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-phone">{t("finance.manualInvoice.phone")}</Label>
                  <Input
                    id="manual-phone"
                    value={phone}
                    inputMode="tel"
                    maxLength={16}
                    onChange={(e) => {
                      setPhone(keepPhoneChars(e.target.value));
                      clearFieldError("customer_phone");
                    }}
                    placeholder="+93701234567"
                  />
                  {fieldErrors.customer_phone ? (
                    <p className="text-sm text-danger">{fieldErrors.customer_phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-email">{t("finance.manualInvoice.email")}</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("customer_email");
                  }}
                  placeholder="name@example.com"
                />
                {fieldErrors.customer_email ? (
                  <p className="text-sm text-danger">{fieldErrors.customer_email}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-service">{t("finance.manualInvoice.serviceName")}</Label>
                <Select
                  value={serviceChoice || undefined}
                  onValueChange={(value) => {
                    setServiceChoice(value);
                    clearFieldError("service_name");
                    if (value !== OTHER_SERVICE_NAME) setCustomService("");
                  }}
                >
                  <SelectTrigger id="manual-service" className="w-full">
                    <SelectValue placeholder={t("finance.manualInvoice.servicePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((name) => (
                      <SelectItem
                        key={name}
                        value={name}
                        onRemove={canDeleteService ? () => void handleRemoveService(name) : undefined}
                        removeLabel={t("finance.manualInvoice.removeService")}
                      >
                        {name}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_SERVICE_NAME}>{t("finance.manualInvoice.otherService")}</SelectItem>
                  </SelectContent>
                </Select>
                {serviceChoice === OTHER_SERVICE_NAME ? (
                  <Input
                    id="manual-service-other"
                    value={customService}
                    maxLength={255}
                    onChange={(e) => {
                      setCustomService(e.target.value);
                      clearFieldError("service_name");
                    }}
                    placeholder={t("finance.manualInvoice.customServicePlaceholder")}
                    aria-label={t("finance.manualInvoice.customService")}
                  />
                ) : null}
                {fieldErrors.service_name ? (
                  <p className="text-sm text-danger">{fieldErrors.service_name}</p>
                ) : null}
              </div>

              <div className={cn("grid gap-4", needsExchangeRate ? "grid-cols-3" : "grid-cols-2")}>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-amount">{t("finance.manualInvoice.amount")}</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-currency">{t("finance.manualInvoice.currency")}</Label>
                  <SearchableSelect
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                    value={currency}
                    onChange={(value) => {
                      setCurrency(value || "AFN");
                      if (value === "AFN") setExchangeRate("1");
                    }}
                    placeholder={t("finance.manualInvoice.currency")}
                  />
                </div>
                {needsExchangeRate ? (
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="manual-fx">{t("finance.manualInvoice.exchangeRate")}</Label>
                    <Input
                      id="manual-fx"
                      type="number"
                      min={0.0001}
                      step="0.0001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-cost">{t("finance.manualInvoice.serviceCost")}</Label>
                  <Input
                    id="manual-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-date">{t("finance.manualInvoice.date")}</Label>
                  <DatePicker
                    id="manual-date"
                    value={transactionDate}
                    onChange={setTransactionDate}
                    placeholder={t("finance.manualInvoice.date")}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-notes">{t("finance.manualInvoice.internalNote")}</Label>
                <textarea
                  id="manual-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={notesTextareaClass}
                  style={{ height: 150 }}
                />
              </div>

              <Button type="button" onClick={handleSubmit} disabled={createManualInvoice.isPending}>
                {createManualInvoice.isPending
                  ? t("common.loading")
                  : t("finance.manualInvoice.submit")}
              </Button>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("finance.manualInvoice.totalCard")}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-success">
                  {formatMoney(amount || 0, currency)}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("finance.manualInvoice.nextInvoiceNumber")}
                </p>
                <p className="mt-1.5 font-mono text-lg font-semibold text-foreground">
                  {nextNumberQuery.isLoading ? "…" : nextInvoiceNumber || "—"}
                </p>
              </div>
              {resolvedServiceName ? (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("finance.manualInvoice.serviceName")}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{resolvedServiceName}</p>
                </div>
              ) : null}
              {lastCreated ? (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("finance.manualInvoice.createdInvoice")}
                  </p>
                  <p className="mt-1.5 font-mono text-lg font-semibold text-foreground">
                    {lastCreated.invoiceNumber}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("finance.manualInvoice.transactionNumber")}{" "}
                    <span className="font-mono font-medium text-foreground">
                      {lastCreated.transactionId}
                    </span>
                  </p>
                  {lastCreated.transactionDate ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("finance.manualInvoice.date")}:{" "}
                      <span className="font-medium text-foreground">
                        {formatDisplayDate(lastCreated.transactionDate)}
                      </span>
                    </p>
                  ) : null}
                  {lastCreated.pdfUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      asChild
                    >
                      <a href={lastCreated.pdfUrl} target="_blank" rel="noopener noreferrer">
                        {t("finance.manualInvoice.viewPdf")}
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {t("finance.manualInvoice.totalHint")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManualInvoicePage;

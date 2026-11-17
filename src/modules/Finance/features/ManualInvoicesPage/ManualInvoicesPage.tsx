import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Banknote, Hash, Printer, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/ui";
import {
  ColumnFunnel,
  NewButton,
  ServerDataTable,
  actionsColumn,
  useDataTable,
  useUrlFilters,
  withHeaderAddon,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import type { ListEnvelope } from "@/api/client";
import { apiFetch } from "@/api/client";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../../data/constants/endpoints";
import type {
  ManualInvoiceSummary,
  ManualInvoiceTransactionRow,
  ServiceIncomeFacets,
} from "../../data/models/FinanceReport";
import FinancePeriodFilter from "../../components/FinancePeriodFilter";
import {
  defaultPeriodState,
  formatMoney,
  openPdf,
  periodRange,
  type PeriodState,
} from "../../components/financeFormat";

const READ = "finance.service_income.read";
const FILTER_KEYS = ["service_name", "customer_national_id", "customer_phone", "customer_email"] as const;

function periodParamsOf(state: PeriodState): Record<string, string | undefined> {
  const range = periodRange(state);
  if (!range) return { all_time: "true" };
  return { from: range.from, to: range.to };
}

function periodKeyOf(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(Object.fromEntries(entries)).toString();
}

function moneyText(value: unknown, currency?: string | null): string {
  const text = formatMoney(value, currency);
  return text === "—" ? "" : text;
}

const ManualInvoicesPage = () => {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [periodState, setPeriodState] = useState<PeriodState>(() => defaultPeriodState("all"));
  const filters = useUrlFilters(FILTER_KEYS);
  const periodParams = useMemo(() => periodParamsOf(periodState), [periodState]);
  const tableParams = useMemo(
    () => ({ ...periodParams, ...filters.params }),
    [periodParams, filters.params],
  );
  const periodKey = useMemo(() => periodKeyOf(periodParams), [periodParams]);
  const facetQuery = useQuery({
    queryKey: [...FINANCE_QUERY_KEYS.manualInvoices, "facets", periodKey],
    queryFn: () => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(periodParams)) {
        if (value) search.set(key, value);
      }
      search.set("page", "1");
      search.set("per_page", "1");
      return apiFetch<ListEnvelope<ManualInvoiceTransactionRow> & { meta: { facets?: ServiceIncomeFacets } }>(
        `${FINANCE_ENDPOINTS.MANUAL_INVOICES}?${search.toString()}`,
      );
    },
  });
  const facets = facetQuery.data?.meta.facets;

  const canCreate = hasAnyPermission([
    "course.class_students.invoice",
    "course.class_students.payment",
    "course.class_students.update",
    "finance.service_income.create",
  ]);

  const openNew = useCallback(() => navigate("/finance/manual-invoice"), [navigate]);

  const columns = useMemo<ColumnDef<ManualInvoiceTransactionRow, unknown>[]>(() => {
    const dateLabel = t("finance.serviceIncome.columns.transactionDate");
    const numberLabel = t("finance.serviceIncome.columns.transactionNumber");
    const invoiceLabel = t("finance.invoices.columns.number");
    const customerLabel = t("finance.manualInvoice.customerName");
    const nationalIdLabel = t("finance.manualInvoice.nationalId");
    const phoneLabel = t("finance.manualInvoice.phone");
    const emailLabel = t("finance.manualInvoice.email");
    const nameLabel = t("finance.columns.name");
    const serviceLabel = t("finance.manualInvoice.serviceName");
    const incomeLabel = t("finance.serviceIncome.columns.income");
    const costLabel = t("finance.manualInvoice.serviceCost");
    const printLabel = t("finance.invoices.print");

    const funnel = (
      column: ColumnDef<ManualInvoiceTransactionRow, unknown>,
      key: (typeof FILTER_KEYS)[number],
      label: string,
      options: { value: string; label: string }[],
    ): ColumnDef<ManualInvoiceTransactionRow, unknown> =>
      withHeaderAddon(
        column,
        <ColumnFunnel
          label={label}
          value={filters.values[key]}
          onChange={(next) => filters.set(key, next)}
          options={options}
        />,
      );

    const facetOptions = (
      key: keyof ServiceIncomeFacets,
      anyLabel: string,
    ): { value: string; label: string }[] => [
      { value: "", label: anyLabel },
      ...(facets?.[key] ?? []).map((option) => ({ value: option.value, label: option.label })),
    ];

    return [
      {
        id: "transaction_date",
        header: dateLabel,
        meta: {
          priority: 1,
          sortKey: "transaction_date",
          shortLabel: dateLabel,
          plainText: (row) => (row as ManualInvoiceTransactionRow).transaction_date ?? "",
        },
        cell: ({ row }) => (
          <bdi dir="ltr">{row.original.transaction_date || "—"}</bdi>
        ),
      },
      {
        id: "invoice_number",
        header: invoiceLabel,
        meta: {
          priority: 1,
          sortKey: "invoice_number",
          shortLabel: invoiceLabel,
          plainText: (row) => (row as ManualInvoiceTransactionRow).invoice_number ?? "",
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-xs">{row.original.invoice_number}</bdi>
        ),
      },
      {
        id: "customer_name",
        header: customerLabel,
        meta: {
          priority: 1,
          sortKey: "customer_name",
          shortLabel: customerLabel,
          plainText: (row) => (row as ManualInvoiceTransactionRow).customer_name ?? "",
        },
        cell: ({ row }) => row.original.customer_name || "—",
      },
      funnel(
        {
          id: "customer_national_id",
          header: nationalIdLabel,
          meta: {
            priority: 2,
            sortKey: "customer_national_id",
            shortLabel: nationalIdLabel,
            plainText: (row) => (row as ManualInvoiceTransactionRow).customer_national_id ?? "",
          },
          cell: ({ row }) =>
            row.original.customer_national_id ? (
              <bdi dir="ltr">{row.original.customer_national_id}</bdi>
            ) : (
              "—"
            ),
        },
        "customer_national_id",
        nationalIdLabel,
        facetOptions("customer_national_ids", t("finance.serviceIncome.columns.allNationalIds")),
      ),
      funnel(
        {
          id: "customer_phone",
          header: phoneLabel,
          meta: {
            priority: 2,
            sortKey: "customer_phone",
            shortLabel: phoneLabel,
            plainText: (row) => (row as ManualInvoiceTransactionRow).customer_phone ?? "",
          },
          cell: ({ row }) =>
            row.original.customer_phone ? (
              <bdi dir="ltr">{row.original.customer_phone}</bdi>
            ) : (
              "—"
            ),
        },
        "customer_phone",
        phoneLabel,
        facetOptions("customer_phones", t("finance.serviceIncome.columns.allPhones")),
      ),
      funnel(
        {
          id: "customer_email",
          header: emailLabel,
          meta: {
            priority: 3,
            sortKey: "customer_email",
            shortLabel: emailLabel,
            plainText: (row) => (row as ManualInvoiceTransactionRow).customer_email ?? "",
          },
          cell: ({ row }) =>
            row.original.customer_email ? (
              <bdi dir="ltr">{row.original.customer_email}</bdi>
            ) : (
              "—"
            ),
        },
        "customer_email",
        emailLabel,
        facetOptions("customer_emails", t("finance.serviceIncome.columns.allEmails")),
      ),
      {
        id: "transaction_id",
        header: numberLabel,
        meta: {
          priority: 2,
          shortLabel: numberLabel,
          plainText: (row) => {
            const id = (row as ManualInvoiceTransactionRow).transaction_id;
            return id == null ? "" : String(id);
          },
        },
        cell: ({ row }) =>
          row.original.transaction_id ? (
            <bdi dir="ltr" className="font-mono text-xs">{row.original.transaction_id}</bdi>
          ) : (
            "—"
          ),
      },
      {
        id: "student_name",
        header: nameLabel,
        meta: {
          priority: 2,
          shortLabel: nameLabel,
          plainText: (row) => {
            const value = row as ManualInvoiceTransactionRow;
            return [value.student_name, value.student_code].filter(Boolean).join(" ");
          },
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.student_name?.trim() || "—"}</div>
            {row.original.student_code ? (
              <bdi dir="ltr" className="font-mono text-xs text-muted-foreground">
                {row.original.student_code}
              </bdi>
            ) : null}
          </div>
        ),
      },
      funnel(
        {
          id: "service_name",
          header: serviceLabel,
          meta: {
            priority: 2,
            sortKey: "service_name",
            shortLabel: serviceLabel,
            plainText: (row) => (row as ManualInvoiceTransactionRow).service_name ?? "",
          },
          cell: ({ row }) => row.original.service_name || "—",
        },
        "service_name",
        serviceLabel,
        facetOptions("service_names", t("finance.serviceIncome.columns.allServices")),
      ),
      {
        id: "amount",
        header: incomeLabel,
        meta: {
          priority: 2,
          sortKey: "amount",
          shortLabel: incomeLabel,
          plainText: (row) => {
            const value = row as ManualInvoiceTransactionRow;
            return moneyText(value.amount, value.currency);
          },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="tabular-nums">
            {formatMoney(row.original.amount, row.original.currency)}
          </bdi>
        ),
      },
      {
        id: "service_cost",
        header: costLabel,
        meta: {
          priority: 3,
          sortKey: "service_cost",
          shortLabel: costLabel,
          plainText: (row) => {
            const value = row as ManualInvoiceTransactionRow;
            return moneyText(value.service_cost, value.currency);
          },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="tabular-nums">
            {formatMoney(row.original.service_cost, row.original.currency)}
          </bdi>
        ),
      },
      actionsColumn<ManualInvoiceTransactionRow>(
        gridT,
        () => [],
        true,
        undefined,
        (row) =>
          row.pdf_url
            ? [
                {
                  id: "print",
                  label: printLabel,
                  icon: <Printer className="size-4" aria-hidden="true" />,
                  permission: READ,
                  onSelect: () => openPdf(row.pdf_url),
                },
              ]
            : [],
      ),
    ];
  }, [facets, filters, gridT, t]);

  const table = useDataTable<ManualInvoiceTransactionRow>({
    key: "finance.service-income",
    queryKey: (query) => [...FINANCE_QUERY_KEYS.manualInvoices, query],
    endpoint: FINANCE_ENDPOINTS.MANUAL_INVOICES,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    readPermission: READ,
    exportTitle: t("finance.serviceIncome.title"),
    params: tableParams,
    syncUrl: true,
    defaultSort: "-transaction_date",
    defaultPerPage: 25,
    getRowId: (row) => String(row.id),
  });

  const summaryQuery = useQuery({
    queryKey: [...FINANCE_QUERY_KEYS.manualInvoices, table.controls.query, periodKey],
    queryFn: () =>
      apiFetch<ListEnvelope<ManualInvoiceTransactionRow> & { meta: { summary?: ManualInvoiceSummary; facets?: ServiceIncomeFacets } }>(
        `${FINANCE_ENDPOINTS.MANUAL_INVOICES}${table.queryString}`,
      ),
  });
  const summary = summaryQuery.data?.meta.summary;

  const newLabel = t("finance.serviceIncome.create");

  if (!hasPermission(READ)) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("finance.serviceIncome.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("finance.serviceIncome.subtitle")}
          </p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.serviceIncome.title") },
              ]}
            />
          </div>
        </div>
        <NewButton show={canCreate} onNew={openNew} label={newLabel} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("finance.netServiceIncome")}
          value={<bdi dir="ltr">{formatMoney(summary?.service_income ?? 0)}</bdi>}
          icon={<Banknote className="size-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label={t("finance.netServiceCost")}
          value={<bdi dir="ltr">{formatMoney(summary?.service_cost ?? 0)}</bdi>}
          icon={<Receipt className="size-5" aria-hidden="true" />}
          tone="warning"
        />
        <StatCard
          label={t("finance.serviceIncome.count")}
          value={<bdi dir="ltr">{summary?.count ?? 0}</bdi>}
          icon={<Hash className="size-5" aria-hidden="true" />}
          tone="info"
        />
      </div>

      <ServerDataTable
        api={table}
        entityLabel={t("finance.serviceIncome.title")}
        searchPlaceholder={t("finance.serviceIncome.search")}
        emptyTitle={t("finance.serviceIncome.empty")}
        emptyBody={t("finance.serviceIncome.subtitle")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={periodState.period !== "all" || filters.narrowed}
        onRowDoubleClick={(row) => openPdf(row.pdf_url)}
        stickyHeader
        toolsInHeader
        extra={(
          <FinancePeriodFilter
            beside
            value={periodState}
            idPrefix="service-period"
            onChange={setPeriodState}
          />
        )}
      />
    </div>
  );
};

const STAT_TONES = {
  success: {
    border: "border-success/25",
    wash: "from-success/12 via-card to-card",
    icon: "bg-success/15 text-success",
    value: "text-success",
  },
  warning: {
    border: "border-warning/25",
    wash: "from-warning/12 via-card to-card",
    icon: "bg-warning/15 text-warning",
    value: "text-warning",
  },
  info: {
    border: "border-info/25",
    wash: "from-info/12 via-card to-card",
    icon: "bg-info/15 text-info",
    value: "text-info",
  },
} as const;

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: keyof typeof STAT_TONES;
}) {
  const theme = STAT_TONES[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 sm:p-5", theme.border, theme.wash)}>
      <div className={cn("absolute end-4 top-4 rounded-xl p-2.5", theme.icon)}>{icon}</div>
      <p className="pe-14 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-3 text-2xl font-bold tabular-nums tracking-tight", theme.value)}>{value}</p>
    </div>
  );
}

export default ManualInvoicesPage;

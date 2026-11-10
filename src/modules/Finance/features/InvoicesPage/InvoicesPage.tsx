import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ColumnFunnel,
  ServerDataTable,
  actionsColumn,
  useDataTable,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import FinancePeriodFilter from "../../components/FinancePeriodFilter";
import {
  defaultPeriodState,
  formatMoney,
  openPdf,
  periodRange,
  type PeriodState,
} from "../../components/financeFormat";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../../data/constants/endpoints";
import type { FinanceInvoiceRow } from "../../data/models/FinanceReport";

const READ = "finance.invoices.read";
const FILTER_KEYS = ["source"] as const;
type InvoiceFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

function sourceLabel(
  source: FinanceInvoiceRow["source"],
  labels: { class: string; course: string; service: string }
): string {
  if (source === "course") return labels.course;
  if (source === "class") return labels.class;
  return labels.service;
}

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function Ltr({ value }: { value: string }) {
  if (value === "—") return value;
  return <bdi dir="ltr">{value}</bdi>;
}

function InvoicesList({
  period,
  onPeriodChange,
  filters,
}: {
  period: PeriodState;
  onPeriodChange: (next: PeriodState) => void;
  filters: InvoiceFilters;
}) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const title = t("finance.invoices.title");

  const range = periodRange(period);
  const dateParams = useMemo(
    () =>
      range
        ? { from: range.from, to: range.to, all_time: undefined }
        : { from: undefined, to: undefined, all_time: "1" },
    [range],
  );

  const tableParams = useMemo(
    () => ({
      ...filters.params,
      ...dateParams,
    }),
    [filters.params, dateParams],
  );

  const sourceOptions = useMemo(
    () => [
      { value: "", label: t("fin.transactions.sourceAll") },
      { value: "class", label: t("fin.transactions.sourceClass") },
      { value: "course", label: t("fin.transactions.sourceCourse") },
    ],
    [t],
  );

  const sourceLabels = useMemo(
    () => ({
      class: t("fin.transactions.sourceClass"),
      course: t("fin.transactions.sourceCourse"),
      service: t("finance.serviceIncome.title"),
    }),
    [t],
  );

  const openInvoice = useCallback((row: FinanceInvoiceRow) => {
    openPdf(row.pdf_url);
  }, []);

  const columns = useMemo<ColumnDef<FinanceInvoiceRow, unknown>[]>(() => {
    const numberLabel = t("finance.invoices.columns.number");
    const transactionDateLabel = t("fin.columns.transactionDate");
    const issueDateLabel = t("fin.columns.issueDate");
    const nameLabel = t("finance.columns.name");
    const classLabel = t("finance.columns.class");
    const sourceLabelHeader = t("fin.transactions.sourceAll");
    const customerLabel = t("finance.manualInvoice.customerName");
    const amountLabel = t("finance.columns.amount");
    const notesLabel = t("fin.transactions.internalNotes");
    const printLabel = t("finance.invoices.print");

    const funnel = (
      column: ColumnDef<FinanceInvoiceRow, unknown>,
      key: (typeof FILTER_KEYS)[number],
      label: string,
      options: { value: string; label: string }[],
    ): ColumnDef<FinanceInvoiceRow, unknown> =>
      withHeaderAddon(
        column,
        <ColumnFunnel
          label={label}
          value={filters.values[key]}
          onChange={(next) => filters.set(key, next)}
          options={options}
        />,
      );

    return [
      {
        id: "invoice_number",
        header: numberLabel,
        meta: {
          priority: 1,
          sortKey: "invoice_number",
          shortLabel: numberLabel,
          plainText: (row) => shown((row as FinanceInvoiceRow).invoice_number),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            <Ltr value={shown(row.original.invoice_number)} />
          </span>
        ),
      },
      {
        id: "transaction_date",
        header: transactionDateLabel,
        meta: {
          priority: 1,
          sortKey: "transaction_date",
          shortLabel: transactionDateLabel,
          plainText: (row) => {
            const item = row as FinanceInvoiceRow;
            return shown(item.transaction_date || item.issued_at);
          },
          width: { default: 130, min: 110 },
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            <Ltr value={shown(row.original.transaction_date || row.original.issued_at)} />
          </span>
        ),
      },
      {
        id: "issued_at",
        header: issueDateLabel,
        meta: {
          priority: 3,
          sortKey: "issued_at",
          shortLabel: issueDateLabel,
          plainText: (row) => shown((row as FinanceInvoiceRow).issued_at),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            <Ltr value={shown(row.original.issued_at)} />
          </span>
        ),
      },
      {
        id: "student_name",
        header: nameLabel,
        meta: {
          priority: 1,
          shortLabel: nameLabel,
          plainText: (row) => {
            const item = row as FinanceInvoiceRow;
            return shown(item.student_name || item.customer_name);
          },
          width: { default: 180, min: 140 },
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {shown(row.original.student_name || row.original.customer_name)}
            </div>
            {row.original.student_code ? (
              <div className="font-mono text-xs text-muted-foreground">
                <bdi dir="ltr">{row.original.student_code}</bdi>
              </div>
            ) : null}
          </div>
        ),
      },
      funnel(
        {
          id: "source",
          header: sourceLabelHeader,
          meta: {
            priority: 2,
            shortLabel: sourceLabelHeader,
            plainText: (row) =>
              sourceLabel((row as FinanceInvoiceRow).source, sourceLabels),
            width: { default: 150, min: 120 },
          },
          cell: ({ row }) => (
            <span className="text-sm">
              {sourceLabel(row.original.source, sourceLabels)}
            </span>
          ),
        },
        "source",
        sourceLabelHeader,
        sourceOptions,
      ),
      {
        id: "class_name",
        header: classLabel,
        meta: {
          priority: 2,
          shortLabel: classLabel,
          plainText: (row) => {
            const item = row as FinanceInvoiceRow;
            if (item.source === "course") {
              return shown(item.course_label || item.course_title || item.service_name);
            }
            return shown(item.class_name || item.class_code);
          },
          width: { default: 180, min: 130 },
        },
        cell: ({ row }) => {
          const item = row.original;
          if (item.source === "course") {
            return (
              <div>
                <div>{shown(item.course_label || item.course_title || item.service_name)}</div>
                {item.class_code ? (
                  <div className="font-mono text-xs text-muted-foreground">
                    <bdi dir="ltr">{item.class_code}</bdi>
                  </div>
                ) : null}
              </div>
            );
          }
          return (
            <div>
              <div>{shown(item.class_name)}</div>
              {item.class_code ? (
                <div className="font-mono text-xs text-muted-foreground">
                  <bdi dir="ltr">{item.class_code}</bdi>
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "customer_name",
        header: customerLabel,
        meta: {
          priority: 3,
          shortLabel: customerLabel,
          plainText: (row) => shown((row as FinanceInvoiceRow).customer_name),
          width: { default: 160, min: 120 },
        },
        cell: ({ row }) => shown(row.original.customer_name),
      },
      {
        id: "amount",
        header: amountLabel,
        meta: {
          priority: 2,
          sortKey: "amount",
          shortLabel: amountLabel,
          plainText: (row) => {
            const item = row as FinanceInvoiceRow;
            return formatMoney(item.amount, item.currency);
          },
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            <bdi dir="ltr">{formatMoney(row.original.amount, row.original.currency)}</bdi>
          </span>
        ),
      },
      {
        id: "internal_notes",
        header: notesLabel,
        meta: {
          priority: 3,
          shortLabel: notesLabel,
          plainText: (row) => shown((row as FinanceInvoiceRow).internal_notes),
          width: { default: 200, min: 140 },
        },
        cell: ({ row }) => (
          <span
            className="block max-w-[240px] truncate text-muted-foreground"
            title={row.original.internal_notes || undefined}
          >
            {shown(row.original.internal_notes)}
          </span>
        ),
      },
      actionsColumn<FinanceInvoiceRow>(
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
                  onSelect: () => openInvoice(row),
                },
              ]
            : [],
      ),
    ];
  }, [filters, gridT, openInvoice, sourceLabels, sourceOptions, t]);

  const table = useDataTable<FinanceInvoiceRow>({
    key: "finance.invoices",
    queryKey: (query) => [...FINANCE_QUERY_KEYS.invoices, query],
    endpoint: FINANCE_ENDPOINTS.INVOICES,
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    exportTitle: title,
    params: tableParams,
    syncUrl: true,
    defaultSort: "-transaction_date",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  return (
    <ServerDataTable
      api={table}
      entityLabel={title}
      searchPlaceholder={t("dt.invoices.search")}
      emptyTitle={t("dt.invoices.emptyTitle")}
      emptyBody={t("dt.invoices.emptyBody")}
      narrowed={period.period !== "all" || filters.narrowed}
      onRowDoubleClick={openInvoice}
      stickyHeader
      toolsInHeader
      extra={
        <FinancePeriodFilter
          value={period}
          onChange={onPeriodChange}
          allowAll
          size="sm"
          idPrefix="invoice-period"
        />
      }
    />
  );
}

const InvoicesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [period, setPeriod] = useState<PeriodState>(() => defaultPeriodState("all"));
  const filters = useUrlFilters(FILTER_KEYS);

  if (!hasPermission(READ)) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("finance.invoices.title")}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("fin.invoices.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.invoices.title") },
              ]}
            />
          </div>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
        </Button>
      </div>
      <InvoicesList period={period} onPeriodChange={setPeriod} filters={filters} />
    </div>
  );
};

export default InvoicesPage;

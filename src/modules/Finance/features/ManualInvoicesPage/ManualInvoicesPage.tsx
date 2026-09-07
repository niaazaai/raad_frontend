import { useCallback, useMemo } from "react";
import { Coins, Page, Plus, Wallet } from "iconoir-react";
import { Link } from "react-router-dom";
import { Button, DataTable, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import type { DataTableConfig } from "@/types/datatable";
import { FINANCE_ENDPOINTS } from "../../data/constants/endpoints";
import {
  extractManualInvoicePagination,
  extractManualInvoiceRows,
  extractManualInvoiceSummary,
  useManualInvoiceTransactions,
} from "../../hooks/useManualInvoiceTransactions";
import type { ManualInvoiceTransactionRow } from "../../data/models/FinanceReport";

function formatMoney(value: unknown, currency?: string | null): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

const ManualInvoicesPage = () => {
  const { t } = useTranslation();
  const { hasPermission, hasAnyPermission } = useAuth();

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "transaction_date",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const { data, isLoading } = useManualInvoiceTransactions({
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const rows = extractManualInvoiceRows(data);
  const pagination = extractManualInvoicePagination(data);
  const summary = extractManualInvoiceSummary(data);

  const canCreate = hasAnyPermission([
    "course.class_students.invoice",
    "course.class_students.payment",
    "course.class_students.update",
  ]);

  const openPdf = useCallback((url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const config: DataTableConfig<ManualInvoiceTransactionRow> = useMemo(
    () => ({
      columns: [
        {
          key: "transaction_date",
          header: t("finance.serviceIncome.columns.transactionDate"),
          sortable: true,
          render: (row) => row.transaction_date || "—",
        },
        {
          key: "transaction_id",
          header: t("finance.serviceIncome.columns.transactionNumber"),
          sortable: false,
          render: (row) =>
            row.transaction_id ? <span className="font-mono text-xs">{row.transaction_id}</span> : "—",
        },
        {
          key: "invoice_number",
          header: t("finance.invoices.columns.number"),
          sortable: true,
          render: (row) => <span className="font-mono text-xs">{row.invoice_number}</span>,
        },
        {
          key: "customer_name",
          header: t("finance.manualInvoice.customerName"),
          sortable: true,
          render: (row) => row.customer_name || "—",
        },
        {
          key: "student_name",
          header: t("finance.columns.name"),
          sortable: false,
          render: (row) => (
            <div>
              <div className="font-medium">{row.student_name?.trim() || "—"}</div>
              {row.student_code ? (
                <div className="font-mono text-xs text-muted-foreground">{row.student_code}</div>
              ) : null}
            </div>
          ),
        },
        {
          key: "service_name",
          header: t("finance.manualInvoice.serviceName"),
          sortable: true,
          render: (row) => row.service_name || "—",
        },
        {
          key: "amount",
          header: t("finance.serviceIncome.columns.income"),
          sortable: true,
          align: "right",
          render: (row) => formatMoney(row.amount, row.currency),
        },
        {
          key: "service_cost",
          header: t("finance.manualInvoice.serviceCost"),
          sortable: true,
          align: "right",
          render: (row) => formatMoney(row.service_cost, row.currency),
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("finance.serviceIncome.search"),
      filtersEnabled: false,
      paginationEnabled: true,
      emptyMessage: t("finance.serviceIncome.empty"),
      onRowDoubleClick: (row) => openPdf(row.pdf_url),
      exportFilename: "service-income",
      exportDateKey: "transaction_date",
      fetchExportRows: (query) =>
        fetchAllListPages({
          url: FINANCE_ENDPOINTS.MANUAL_INVOICES,
          params: {
            search: debouncedSearch || undefined,
            sort_by: params.sort_by,
            sort_dir: params.sort_dir,
          },
          query,
          extractRows: extractManualInvoiceRows,
          extractPagination: extractManualInvoicePagination,
        }),
      actions: [
        {
          key: "print",
          label: t("finance.invoices.print"),
          icon: <Page className="h-4 w-4" />,
          onClick: (row) => openPdf(row.pdf_url),
          hidden: (row) => !row.pdf_url,
        },
      ],
    }),
    [t, debouncedSearch, params.sort_by, params.sort_dir, openPdf]
  );

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("finance.serviceIncome.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.serviceIncome.subtitle")}</p>
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
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
          </Button>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/finance/manual-invoice">
                <Plus className="h-4 w-4" />
                {t("finance.serviceIncome.create")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-gradient-to-br from-success/8 via-card to-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("finance.netServiceIncome")}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-success">
                {formatMoney(summary?.service_income ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-success/15 p-2 text-success">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-warning/8 via-card to-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("finance.netServiceCost")}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-warning">
                {formatMoney(summary?.service_cost ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-warning/15 p-2 text-warning">
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className={cn("rounded-xl border border-border bg-gradient-to-br from-muted/40 via-card to-card p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("finance.serviceIncome.count")}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{summary?.count ?? 0}</p>
        </div>
      </div>

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ManualInvoicesPage;

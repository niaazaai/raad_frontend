import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "iconoir-react";
import { Button, DataTable, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import { FINANCE_ENDPOINTS } from "../../data/constants/endpoints";
import type { FinancialTransactionFilter, FinancialTransactionRow } from "../../data/models/FinanceReport";
import {
  extractFinancialTransactions,
  extractFinancialTransactionsPagination,
  useFinancialTransactions,
} from "../../hooks/useFinancialTransactions";

function formatMoney(value: unknown, currency?: string | null): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

const TransactionsPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [filter, setFilter] = useState<FinancialTransactionFilter | "">("");
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "transaction_date",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const listParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    filter: filter || undefined,
    all_time: 1 as const,
  };

  const { data, isLoading } = useFinancialTransactions(listParams);
  const rows = extractFinancialTransactions(data);
  const pagination = extractFinancialTransactionsPagination(data);

  const openPdf = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filters: { value: FinancialTransactionFilter | ""; label: string }[] = [
    { value: "", label: t("finance.transactions.filterAll") },
    { value: "irrecoverable", label: t("finance.transactions.filterIrrecoverable") },
    { value: "mof", label: t("finance.transactions.filterMof") },
    { value: "pending", label: t("finance.transactions.filterPending") },
    { value: "refund", label: t("finance.transactions.filterRefund") },
  ];

  const config: DataTableConfig<FinancialTransactionRow> = useMemo(
    () => ({
      columns: [
        {
          key: "transaction_date",
          header: t("finance.manualInvoice.date"),
          sortable: true,
          render: (row) => row.transaction_date || "—",
        },
        {
          key: "id",
          header: t("finance.serviceIncome.columns.transactionNumber"),
          sortable: true,
          render: (row) => <span className="font-mono text-xs">{row.id}</span>,
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
          key: "class_name",
          header: t("finance.columns.class"),
          sortable: false,
          render: (row) => (
            <div>
              <div>{row.class_name || "—"}</div>
              {row.class_code ? <div className="font-mono text-xs text-muted-foreground">{row.class_code}</div> : null}
            </div>
          ),
        },
        {
          key: "type",
          header: t("finance.columns.type"),
          sortable: true,
          render: (row) => row.type_label || row.type || "—",
        },
        {
          key: "amount",
          header: t("finance.columns.amount"),
          sortable: true,
          align: "right",
          render: (row) => formatMoney(row.amount, row.currency),
        },
        {
          key: "invoice_number",
          header: t("finance.columns.invoice"),
          sortable: false,
          render: (row) => <span className="font-mono text-xs">{row.invoice_number || "—"}</span>,
        },
        {
          key: "mof_receivable_amount",
          header: t("finance.columns.mof"),
          sortable: false,
          align: "right",
          render: (row) => formatMoney(row.mof_receivable_amount, row.currency),
        },
        {
          key: "irrecoverable_debt",
          header: t("finance.columns.irrecoverable"),
          sortable: false,
          align: "right",
          render: (row) => formatMoney(row.irrecoverable_debt, row.currency),
        },
        {
          key: "notes",
          header: t("finance.columns.remarks"),
          sortable: false,
          render: (row) => row.notes || row.internal_notes || "—",
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("finance.transactions.search"),
      filtersEnabled: false,
      paginationEnabled: true,
      emptyMessage: t("finance.transactions.empty"),
      exportFilename: "financial-transactions",
      exportDateKey: "transaction_date",
      fetchExportRows: (query) =>
        fetchAllListPages({
          url: FINANCE_ENDPOINTS.TRANSACTIONS,
          params: {
            search: debouncedSearch || undefined,
            sort_by: params.sort_by,
            sort_dir: params.sort_dir,
            filter: filter || undefined,
          },
          query,
          extractRows: extractFinancialTransactions,
          extractPagination: extractFinancialTransactionsPagination,
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
    [t, debouncedSearch, params.sort_by, params.sort_dir, filter]
  );

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.transactions.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.transactions.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.transactions.title") },
              ]}
            />
          </div>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
        </Button>
      </div>

      <div className="inline-flex flex-wrap rounded-lg border border-border p-1">
        {filters.map((item) => (
          <Button
            key={item.value || "all"}
            type="button"
            size="sm"
            variant={filter === item.value ? "default" : "ghost"}
            className={cn("whitespace-nowrap")}
            onClick={() => {
              setFilter(item.value);
              updateParams({ page: 1 });
            }}
          >
            {item.label}
          </Button>
        ))}
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

export default TransactionsPage;

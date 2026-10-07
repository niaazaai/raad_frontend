import { useState } from "react";
import { Page } from "iconoir-react";
import { Link } from "react-router-dom";
import { Button, DataTable, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import type { DataTableConfig } from "@/types/datatable";
import { FINANCE_ENDPOINTS } from "../../data/constants/endpoints";
import {
  extractFinanceInvoices,
  extractFinanceInvoicesPagination,
  useFinanceInvoices,
} from "../../hooks/useFinanceInvoices";
import type { FinanceInvoiceRow } from "../../data/models/FinanceReport";
import FinancePeriodFilter from "../../components/FinancePeriodFilter";
import {
  defaultPeriodState,
  formatMoney,
  openPdf,
  periodRange,
  type PeriodState,
} from "../../components/financeFormat";

const InvoicesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [periodState, setPeriodState] = useState<PeriodState>(() => defaultPeriodState("all"));
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    searchDebounceMs: 400,
  });

  const range = periodRange(periodState);
  const { data, isLoading } = useFinanceInvoices({
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    ...(range ? { from: range.from, to: range.to } : { all_time: 1 as const }),
  });

  const rows = extractFinanceInvoices(data);
  const pagination = extractFinanceInvoicesPagination(data);

  const config: DataTableConfig<FinanceInvoiceRow> = {
    columns: [
      {
        key: "invoice_number",
        header: t("finance.invoices.columns.number"),
        sortable: false,
        render: (row) => <span className="font-mono text-xs">{row.invoice_number}</span>,
      },
      {
        key: "transaction_date",
        header: t("fin.columns.transactionDate"),
        sortable: false,
        render: (row) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {row.transaction_date || row.issued_at || "—"}
          </span>
        ),
        exportValue: (row) => row.transaction_date || row.issued_at,
      },
      {
        key: "issued_at",
        header: t("fin.columns.issueDate"),
        sortable: false,
        render: (row) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            {row.issued_at || "—"}
          </span>
        ),
      },
      {
        key: "student_name",
        header: t("finance.columns.name"),
        sortable: false,
        render: (row) => (
          <div>
            <div className="font-medium">{row.student_name || "—"}</div>
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
            {row.class_code ? (
              <div className="font-mono text-xs text-muted-foreground">{row.class_code}</div>
            ) : null}
          </div>
        ),
      },
      {
        key: "customer_name",
        header: t("finance.manualInvoice.customerName"),
        sortable: false,
        render: (row) => row.customer_name || "—",
      },
      {
        key: "amount",
        header: t("finance.columns.amount"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.amount, row.currency),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("finance.invoices.search"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("finance.invoices.empty"),
    onRowDoubleClick: (row) => openPdf(row.pdf_url),
    exportFilename: "invoices",
    exportDateKey: "transaction_date",
    fetchExportRows: (query) =>
      fetchAllListPages({
        url: FINANCE_ENDPOINTS.INVOICES,
        params: {
          search: debouncedSearch || undefined,
        },
        query,
        extractRows: extractFinanceInvoices,
        extractPagination: extractFinanceInvoicesPagination,
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
  };

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("finance.invoices.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fin.invoices.subtitle")}</p>
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

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
        toolbar={
          <FinancePeriodFilter
            value={periodState}
            idPrefix="invoice-period"
            onChange={(next) => {
              setPeriodState(next);
              updateParams({ page: 1 });
            }}
          />
        }
      />
    </div>
  );
};

export default InvoicesPage;

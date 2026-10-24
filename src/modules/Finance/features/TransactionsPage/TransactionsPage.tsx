import { useCallback, useMemo, useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, PageBreadcrumb, useConfirmDialog } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import TransactionFiltersDrawer from "../../components/TransactionFiltersDrawer";
import {
  defaultTransactionFilters,
  formatMoney,
  openPdf,
  periodRange,
  type TransactionFilterState,
} from "../../components/financeFormat";
import { FINANCE_ENDPOINTS } from "../../data/constants/endpoints";
import type {
  FinanceClassRow,
  FinancialTransactionFilter,
  FinancialTransactionRow,
  TransactionPayer,
} from "../../data/models/FinanceReport";
import {
  extractFinancialTransactions,
  extractFinancialTransactionsPagination,
  extractFinancialTransactionTotals,
  useDeleteFinancialTransaction,
  useFinancialTransactions,
} from "../../hooks/useFinancialTransactions";
import FinanceDetailsDrawer from "../FinanceReportPage/FinanceDetailsDrawer";

const TransactionsPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { confirm } = useConfirmDialog();
  const { mutate: deleteTransaction, isPending: deleting } = useDeleteFinancialTransaction();
  const [filters, setFilters] = useState<TransactionFilterState>(defaultTransactionFilters);
  const { filter, payer, period: periodState } = filters;
  const [account, setAccount] = useState<(Partial<FinanceClassRow> & { id: number }) | null>(null);
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "transaction_date",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const range = periodRange(periodState);
  const dateParams = range ? { from: range.from, to: range.to } : { all_time: 1 as const };

  const { data, isLoading, isFetching } = useFinancialTransactions({
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    filter: filter || undefined,
    payer: payer || undefined,
    ...dateParams,
  });
  const rows = extractFinancialTransactions(data);
  const pagination = extractFinancialTransactionsPagination(data);
  const totals = extractFinancialTransactionTotals(data);

  const typeOptions: { value: FinancialTransactionFilter | ""; label: string }[] = [
    { value: "", label: t("finance.transactions.filterAll") },
    { value: "payment", label: t("fin.transactions.filterPayment") },
    { value: "refund", label: t("finance.transactions.filterRefund") },
    { value: "recovery", label: t("fin.transactions.filterRecovery") },
    { value: "write_off", label: t("fin.transactions.filterWriteOff") },
    { value: "mof", label: t("finance.transactions.filterMof") },
    { value: "other", label: t("fin.transactions.filterOther") },
    { value: "cancellation", label: t("fin.transactions.filterCancellation") },
    { value: "pending", label: t("finance.transactions.filterPending") },
  ];

  const payerOptions: { value: TransactionPayer | ""; label: string }[] = [
    { value: "", label: t("fin.payer.all") },
    { value: "student", label: t("fin.payer.student") },
    { value: "mof", label: t("fin.payer.mof") },
    { value: "other_party", label: t("fin.payer.other_party") },
  ];

  const activeSummary = [
    periodState.period === "all" ? null : t(`fin.period.${periodState.period}`),
    filter ? typeOptions.find((option) => option.value === filter)?.label : null,
    payer ? payerOptions.find((option) => option.value === payer)?.label : null,
  ].filter((label): label is string => Boolean(label));

  const openRow = useCallback((row: FinancialTransactionRow) => {
    if (row.class_student_id) {
      setAccount({
        id: row.class_student_id,
        student_name: row.student_name,
        student_code: row.student_code,
        class_name: row.class_name,
        class_code: row.class_code,
        payment_status: row.payment_status,
      });
      return;
    }
    openPdf(row.pdf_url);
  }, []);

  const config: DataTableConfig<FinancialTransactionRow> = useMemo(
    () => ({
      columns: [
        {
          key: "transaction_date",
          header: t("fin.columns.transactionDate"),
          sortable: true,
          render: (row) => (
            <span className="whitespace-nowrap font-medium tabular-nums">
              {row.transaction_date || "—"}
            </span>
          ),
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
          render: (row) => (
            <div>
              <div className="font-medium">
                {row.student_name?.trim() || row.service_name || "—"}
              </div>
              {row.student_code ? (
                <div className="font-mono text-xs text-muted-foreground">{row.student_code}</div>
              ) : null}
            </div>
          ),
          exportValue: (row) => row.student_name?.trim() || row.service_name,
        },
        {
          key: "student_code",
          header: t("finance.columns.studentId"),
          render: (row) => row.student_code || "—",
          exportOnly: true,
        },
        {
          key: "class_name",
          header: t("finance.columns.class"),
          render: (row) => (
            <div>
              <div>{row.class_name || "—"}</div>
              {row.class_code ? (
                <div className="font-mono text-xs text-muted-foreground">{row.class_code}</div>
              ) : null}
            </div>
          ),
          exportValue: (row) => row.class_code ?? row.class_name,
        },
        {
          key: "class_full_name",
          header: t("finance.columns.className"),
          render: (row) => row.class_name || "—",
          exportValue: (row) => row.class_name,
          exportOnly: true,
        },
        {
          key: "teacher_name",
          header: t("finance.columns.teacher"),
          render: (row) => row.teacher_name || "—",
          exportOnly: true,
        },
        {
          key: "next_installment_date",
          header: t("finance.columns.nextInstallment"),
          render: (row) => row.next_installment_date || "—",
          exportOnly: true,
        },
        {
          key: "type",
          header: t("finance.columns.type"),
          sortable: true,
          render: (row) => (
            <FinanceStatusBadge
              kind="type"
              value={row.is_recovery ? "recovery" : row.type}
              fallbackLabel={row.type_label}
            />
          ),
          exportValue: (row) => row.type_label ?? row.type,
        },
        {
          key: "payer",
          header: t("fin.payer.label"),
          render: (row) => row.payer_label || "—",
          exportValue: (row) => row.payer_label,
        },
        {
          key: "amount",
          header: t("finance.columns.amount"),
          sortable: true,
          align: "right",
          render: (row) => {
            const negative = row.type === "refund";
            const muted = row.type === "mof_receivable" || row.type === "other_receivable";
            return (
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  negative && "text-danger",
                  muted && "font-medium text-muted-foreground"
                )}
              >
                {negative ? "−" : ""}
                {formatMoney(row.amount, row.currency)}
              </span>
            );
          },
          exportValue: (row) => row.amount as number,
        },
        {
          key: "invoice_number",
          header: t("finance.columns.invoice"),
          render: (row) => <span className="font-mono text-xs">{row.invoice_number || "—"}</span>,
        },
        {
          key: "payment_status",
          header: t("finance.columns.paymentStatus"),
          render: (row) =>
            row.payment_status ? (
              <FinanceStatusBadge
                value={row.payment_status}
                fallbackLabel={row.payment_status_label}
              />
            ) : (
              "—"
            ),
          exportValue: (row) => row.payment_status_label ?? row.payment_status,
        },
        {
          key: "notes",
          header: t("finance.columns.remarks"),
          render: (row) => (
            <span
              className="block max-w-[240px] truncate text-muted-foreground"
              title={row.notes || row.internal_notes || undefined}
            >
              {row.notes || row.internal_notes || "—"}
            </span>
          ),
          exportValue: (row) => row.notes || row.internal_notes,
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("finance.transactions.search"),
      filtersEnabled: false,
      paginationEnabled: true,
      emptyMessage: t("finance.transactions.empty"),
      onRowDoubleClick: openRow,
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
            payer: payer || undefined,
          },
          query,
          extractRows: extractFinancialTransactions,
          extractPagination: extractFinancialTransactionsPagination,
        }),
      actions: [
        {
          key: "print",
          label: t("fin.transactions.printInvoice"),
          icon: <Printer className="h-4 w-4" />,
          onClick: (row) => openPdf(row.pdf_url),
          hidden: (row) => !row.pdf_url,
        },
        {
          key: "delete",
          label: t("fin.transactions.delete"),
          icon: <Trash2 className="h-4 w-4" />,
          variant: "danger",
          permission: "finance.transactions.delete",
          onClick: (row) => {
            if (deleting) return;
            void confirm({
              title: t("fin.transactions.deleteTitle"),
              message: t("fin.transactions.deleteMessage"),
              variant: "danger",
              confirmText: t("fin.transactions.delete"),
              cancelText: t("common.cancel"),
            }).then((ok) => {
              if (!ok) return;
              deleteTransaction(row.id, {
                onSuccess: () => toast.success(t("fin.transactions.deleteDone")),
                onError: (error: unknown) =>
                  toast.error(error instanceof Error ? error.message : t("fin.transactions.deleteFailed")),
              });
            });
          },
        },
      ],
    }),
    [t, debouncedSearch, params.sort_by, params.sort_dir, filter, payer, openRow, confirm, deleteTransaction, deleting]
  );

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("finance.transactions.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fin.transactions.subtitle")}</p>
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
        <TransactionFiltersDrawer
          value={filters}
          typeOptions={typeOptions}
          payerOptions={payerOptions}
          onApply={(next) => {
            setFilters(next);
            updateParams({ page: 1 });
          }}
        />
      </div>

      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
          (isLoading || isFetching) && "opacity-70"
        )}
      >
        <TotalTile
          label={t("fin.transactions.count")}
          value={totals ? String(totals.count) : "—"}
        />
        <TotalTile
          label={t("fin.transactions.collected")}
          value={formatMoney(totals?.collected ?? 0)}
          tone="text-success"
        />
        <TotalTile
          label={t("fin.transactions.refunded")}
          value={formatMoney(totals?.refunded ?? 0)}
          tone="text-danger"
        />
        <TotalTile
          label={t("fin.transactions.netCash")}
          value={formatMoney(totals?.net_cash ?? 0)}
          tone="text-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {activeSummary.length === 0 ? (
          <span className="text-muted-foreground">{t("fin.filters.none")}</span>
        ) : (
          activeSummary.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary"
            >
              {label}
            </span>
          ))
        )}
      </div>

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />

      <FinanceDetailsDrawer
        open={account != null}
        onClose={() => setAccount(null)}
        module="class"
        classRow={account}
      />
    </div>
  );
};

const TotalTile = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn("mt-1 text-2xl font-bold tabular-nums", tone)}>{value}</p>
  </div>
);

export default TransactionsPage;

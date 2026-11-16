import { useCallback, useMemo, useState } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import type { ApiResponse } from "@/types/api";
import {
  ColumnFunnel,
  ServerDataTable,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  useConfirmDelete,
  useDataTable,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import {
  getCourseListFromResponse,
  useCourseEntityList,
} from "@/modules/Course/hooks/useCourseEntity";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import FinancePeriodFilter from "../../components/FinancePeriodFilter";
import TransactionEditDrawer from "../../components/TransactionEditDrawer";
import {
  defaultPeriodState,
  formatMoney,
  openPdf,
  periodRange,
  type PeriodState,
} from "../../components/financeFormat";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../../data/constants/endpoints";
import type {
  FinanceClassRow,
  FinancialTransactionRow,
} from "../../data/models/FinanceReport";
import {
  extractFinancialTransactionTotals,
  useDeleteFinancialTransaction,
  useFinancialTransactions,
} from "../../hooks/useFinancialTransactions";
import FinanceDetailsDrawer from "../FinanceReportPage/FinanceDetailsDrawer";

const FILTER_KEYS = ["type", "payer", "class_id", "source"] as const;
const READ = "finance.read";
const EDIT = "finance.transactions.edit";
const DELETE = "finance.transactions.delete";

type TransactionFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function Ltr({ value }: { value: string }) {
  if (value === "—") return value;
  return <bdi dir="ltr">{value}</bdi>;
}

function TransactionsList({
  filters,
  period,
  onPeriodChange,
}: {
  filters: TransactionFilters;
  period: PeriodState;
  onPeriodChange: (next: PeriodState) => void;
}) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { hasPermission } = useAuth();
  const [account, setAccount] = useState<(Partial<FinanceClassRow> & { id: number }) | null>(null);
  const [editing, setEditing] = useState<FinancialTransactionRow | null>(null);
  const title = t("finance.transactions.title");

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

  const classesQuery = useCourseEntityList("lms-classes", { per_page: 200, sort_by: "name", sort_dir: "asc" });
  const classOptions = useMemo(() => {
    const rows = getCourseListFromResponse(classesQuery.data);
    return [
      { value: "", label: t("finance.transactions.filterAll") },
      ...rows.map((row) => {
        const id = String(row.id ?? "");
        const code = typeof row.class_code === "string" ? row.class_code.trim() : "";
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const label = [code, name].filter(Boolean).join(" · ") || id;
        return { value: id, label };
      }),
    ];
  }, [classesQuery.data, t]);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteFinancialTransaction();
  const confirmDelete = useConfirmDelete();

  const canEdit = hasPermission(EDIT);
  const canDelete = hasPermission(DELETE);

  const removeRow = useCallback<UseMutateFunction<unknown, Error, string>>((id, options) => {
    removeMutate(Number(id), {
      onSuccess: () => options?.onSuccess?.(undefined, id, undefined, undefined as never),
      onError: (error) =>
        options?.onError?.(
          error instanceof Error ? error : new Error("Delete failed"),
          id,
          undefined,
          undefined as never,
        ),
    });
    return Promise.resolve(undefined);
  }, [removeMutate]);

  const removeRowAsync = useCallback((id: string) => removeAsync(Number(id)), [removeAsync]);

  const nameOf = useCallback((row: FinancialTransactionRow) => {
    const name = shown(row.student_name?.trim() || row.service_name);
    return name === "—" ? `#${row.id}` : name;
  }, []);

  const openEdit = useCallback((row: FinancialTransactionRow) => {
    if (row.type === "refund") return;
    setEditing(row);
  }, []);
  const openAccount = useCallback((row: FinancialTransactionRow) => {
    if (!row.class_student_id) {
      openPdf(row.pdf_url);
      return;
    }
    setAccount({
      id: row.class_student_id,
      student_name: row.student_name,
      student_code: row.student_code,
      class_name: row.class_name,
      class_code: row.class_code,
      payment_status: row.payment_status,
    });
  }, []);
  const openRow = useCallback(
    (row: FinancialTransactionRow) => {
      if (canEdit && row.type !== "refund") {
        openEdit(row);
        return;
      }
      openAccount(row);
    },
    [canEdit, openAccount, openEdit]
  );

  const printTransactionInvoice = useCallback(async (row: FinancialTransactionRow) => {
    if (row.pdf_url) {
      openPdf(row.pdf_url);
      return;
    }

    const isCash = row.type === "payment" || row.type === "refund";
    if (!isCash) {
      toast.error(t("fin.transactions.invoiceUnavailable"));
      return;
    }

    try {
      // Unified endpoint covers class enrollments and online course subscriptions.
      const response = await callApi<{ id: number; pdf_url?: string | null }>({
        url: FINANCE_ENDPOINTS.TRANSACTION_INVOICE(row.id),
        method: RequestMethod.POST,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Invoice generation failed");
      }
      const payload = response.data as
        | ApiResponse<{ id: number; pdf_url?: string | null }>
        | { id: number; pdf_url?: string | null }
        | undefined;
      const invoice =
        payload && typeof payload === "object" && "data" in payload
          ? payload.data
          : (payload as { id: number; pdf_url?: string | null } | undefined);
      if (invoice?.pdf_url) {
        openPdf(invoice.pdf_url);
        return;
      }
      toast.error(t("fin.transactions.invoiceUnavailable"));
    } catch {
      // error toast is shown by callApi when the API returns an error envelope
    }
  }, [t]);

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: DELETE, remove: removeRowAsync })],
    [gridT, removeRowAsync],
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: t("finance.transactions.filterAll") },
      { value: "payment", label: t("fin.transactions.filterPayment") },
      { value: "refund", label: t("finance.transactions.filterRefund") },
      { value: "recovery", label: t("fin.transactions.filterRecovery") },
      { value: "write_off", label: t("fin.transactions.filterWriteOff") },
      { value: "mof", label: t("finance.transactions.filterMof") },
      { value: "other", label: t("fin.transactions.filterOther") },
      { value: "cancellation", label: t("fin.transactions.filterCancellation") },
      { value: "pending", label: t("finance.transactions.filterPending") },
    ],
    [t],
  );

  const payerOptions = useMemo(
    () => [
      { value: "", label: t("fin.payer.all") },
      { value: "student", label: t("fin.payer.student") },
      { value: "mof", label: t("fin.payer.mof") },
      { value: "other_party", label: t("fin.payer.other_party") },
    ],
    [t],
  );

  const sourceOptions = useMemo(
    () => [
      { value: "", label: t("fin.transactions.sourceAll") },
      { value: "class", label: t("fin.transactions.sourceClass") },
      { value: "course", label: t("fin.transactions.sourceCourse") },
    ],
    [t],
  );

  const columns = useMemo<ColumnDef<FinancialTransactionRow, unknown>[]>(() => {
    const funnel = (
      column: ColumnDef<FinancialTransactionRow, unknown>,
      key: (typeof FILTER_KEYS)[number],
      label: string,
      options: { value: string; label: string }[],
    ): ColumnDef<FinancialTransactionRow, unknown> =>
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
        id: "transaction_date",
        header: t("fin.columns.transactionDate"),
        meta: {
          priority: 1,
          sortKey: "transaction_date",
          shortLabel: t("fin.columns.transactionDate"),
          plainText: (row) => shown((row as FinancialTransactionRow).transaction_date),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => <Ltr value={shown(row.original.transaction_date)} />,
      },
      {
        id: "id",
        header: t("finance.serviceIncome.columns.transactionNumber"),
        meta: {
          priority: 2,
          sortKey: "id",
          shortLabel: t("finance.serviceIncome.columns.transactionNumber"),
          plainText: (row) => String((row as FinancialTransactionRow).id),
          width: { default: 88, min: 72 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-xs">
            {row.original.id}
          </bdi>
        ),
      },
      funnel(
        {
          id: "student_name",
          header: t("finance.columns.name"),
          meta: {
            priority: 1,
            shortLabel: t("finance.columns.name"),
            plainText: (row) => {
              const item = row as FinancialTransactionRow;
              return shown(item.student_name?.trim() || item.service_name);
            },
            width: { default: 180, min: 140 },
          },
          cell: ({ row }) => (
            <div>
              <div className="font-medium">
                {shown(row.original.student_name?.trim() || row.original.service_name)}
              </div>
              {row.original.student_code ? (
                <div className="font-mono text-xs text-muted-foreground">
                  <bdi dir="ltr">{row.original.student_code}</bdi>
                </div>
              ) : null}
            </div>
          ),
        },
        "source",
        t("fin.transactions.sourceAll"),
        sourceOptions,
      ),
      funnel(
        {
          id: "class_name",
          header: t("finance.columns.class"),
          meta: {
            priority: 2,
            shortLabel: t("finance.columns.class"),
            plainText: (row) => {
              const item = row as FinancialTransactionRow;
              return shown(item.class_code ?? item.class_name);
            },
            width: { default: 160, min: 120 },
          },
          cell: ({ row }) => (
            <div>
              <div>{shown(row.original.class_name)}</div>
              {row.original.class_code ? (
                <div className="font-mono text-xs text-muted-foreground">
                  <bdi dir="ltr">{row.original.class_code}</bdi>
                </div>
              ) : null}
            </div>
          ),
        },
        "class_id",
        t("finance.columns.class"),
        classOptions,
      ),
      funnel(
        {
          id: "type",
          header: t("finance.columns.type"),
          meta: {
            priority: 1,
            sortKey: "type",
            shortLabel: t("finance.columns.type"),
            plainText: (row) => {
              const item = row as FinancialTransactionRow;
              return shown(item.type_label ?? item.type);
            },
            width: { default: 130, min: 110 },
          },
          cell: ({ row }) => (
            <FinanceStatusBadge
              kind="type"
              value={row.original.is_recovery ? "recovery" : row.original.type}
              fallbackLabel={row.original.type_label}
            />
          ),
        },
        "type",
        t("finance.columns.type"),
        typeOptions,
      ),
      funnel(
        {
          id: "payer",
          header: t("fin.payer.label"),
          meta: {
            priority: 2,
            shortLabel: t("fin.payer.label"),
            plainText: (row) => shown((row as FinancialTransactionRow).payer_label),
            width: { default: 120, min: 100 },
          },
          cell: ({ row }) => shown(row.original.payer_label),
        },
        "payer",
        t("fin.payer.label"),
        payerOptions,
      ),
      {
        id: "amount",
        header: t("finance.columns.amount"),
        meta: {
          priority: 2,
          sortKey: "amount",
          shortLabel: t("finance.columns.amount"),
          plainText: (row) => {
            const item = row as FinancialTransactionRow;
            return String(item.amount ?? "");
          },
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => {
          const negative = row.original.type === "refund";
          const muted =
            row.original.type === "mof_receivable" || row.original.type === "other_receivable";
          return (
            <span
              className={cn(
                "font-semibold tabular-nums",
                negative && "text-danger",
                muted && "font-medium text-muted-foreground",
              )}
            >
              {negative ? "−" : ""}
              <bdi dir="ltr">{formatMoney(row.original.amount, row.original.currency)}</bdi>
            </span>
          );
        },
      },
      {
        id: "invoice_number",
        header: t("finance.columns.invoice"),
        meta: {
          priority: 3,
          shortLabel: t("finance.columns.invoice"),
          plainText: (row) => shown((row as FinancialTransactionRow).invoice_number),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            <Ltr value={shown(row.original.invoice_number)} />
          </span>
        ),
      },
      {
        id: "payment_status",
        header: t("finance.columns.paymentStatus"),
        meta: {
          priority: 3,
          shortLabel: t("finance.columns.paymentStatus"),
          plainText: (row) => {
            const item = row as FinancialTransactionRow;
            return shown(item.payment_status_label ?? item.payment_status);
          },
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) =>
          row.original.payment_status ? (
            <FinanceStatusBadge
              value={row.original.payment_status}
              fallbackLabel={row.original.payment_status_label}
            />
          ) : (
            "—"
          ),
      },
      {
        id: "notes",
        header: t("finance.columns.remarks"),
        meta: {
          priority: 3,
          shortLabel: t("finance.columns.remarks"),
          plainText: (row) => {
            const item = row as FinancialTransactionRow;
            return shown(item.notes || item.internal_notes);
          },
          width: { default: 200, min: 140 },
        },
        cell: ({ row }) => (
          <span
            className="block max-w-[240px] truncate text-muted-foreground"
            title={row.original.notes || row.original.internal_notes || undefined}
          >
            {shown(row.original.notes || row.original.internal_notes)}
          </span>
        ),
      },
      actionsColumn<FinancialTransactionRow>(
        gridT,
        (row) =>
          editDeleteActions({
            t: gridT,
            // Refunds are ledger-final — never expose edit.
            canUpdate: canEdit && row.type !== "refund",
            canDelete,
            updatePermission: EDIT,
            deletePermission: DELETE,
            onEdit: () => openEdit(row),
            onDelete: () => confirmDelete(nameOf(row), String(row.id), removeRow),
          }),
        true,
        undefined,
        (row) => {
          const leading = [];
          const canPrint =
            Boolean(row.pdf_url) ||
            ((row.type === "payment" || row.type === "refund") &&
              (Number(row.class_student_id ?? 0) > 0 ||
                Number(row.student_subscription_id ?? 0) > 0 ||
                row.source === "course" ||
                row.source === "class"));
          if (canPrint) {
            leading.push({
              id: "print",
              label: t("fin.transactions.printInvoice"),
              icon: <Printer className="size-4" aria-hidden="true" />,
              permission: READ,
              onSelect: () => {
                void printTransactionInvoice(row);
              },
            });
          }
          if (row.class_student_id) {
            leading.push({
              id: "view-account",
              label: t("common.view"),
              icon: <Eye className="size-4" aria-hidden="true" />,
              permission: READ,
              onSelect: () => openAccount(row),
            });
          }
          return leading;
        },
      ),
    ];
  }, [
    canDelete,
    canEdit,
    classOptions,
    confirmDelete,
    filters,
    gridT,
    nameOf,
    openAccount,
    openEdit,
    payerOptions,
    printTransactionInvoice,
    removeRow,
    sourceOptions,
    t,
    typeOptions,
  ]);

  const table = useDataTable<FinancialTransactionRow>({
    key: "finance.transactions",
    queryKey: (query) => [...FINANCE_QUERY_KEYS.transactions, query],
    endpoint: FINANCE_ENDPOINTS.TRANSACTIONS,
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: title,
    params: tableParams,
    syncUrl: true,
    defaultSort: "-transaction_date",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const { data: totalsSource, isFetching: totalsFetching } = useFinancialTransactions({
    page: 1,
    per_page: 1,
    type: filters.values.type || undefined,
    payer: filters.values.payer || undefined,
    class_id: filters.values.class_id || undefined,
    ...(range ? { from: range.from, to: range.to } : { all_time: 1 }),
  });
  const totals = extractFinancialTransactionTotals(totalsSource);

  return (
    <>
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
          (table.isLoading || table.isFetching || totalsFetching) && "opacity-70",
        )}
      >
        <TotalTile label={t("fin.transactions.count")} value={totals ? String(totals.count) : "—"} />
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

      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.transactions.search")}
        emptyTitle={t("dt.transactions.emptyTitle")}
        emptyBody={t("dt.transactions.emptyBody")}
        narrowed={filters.narrowed || period.period !== "all"}
        onRowDoubleClick={openRow}
        stickyHeader
        toolsInHeader
        extra={
          <FinancePeriodFilter
            value={period}
            onChange={onPeriodChange}
            allowAll
            size="sm"
            idPrefix="tx-period"
          />
        }
      />

      <FinanceDetailsDrawer
        open={account != null}
        onClose={() => setAccount(null)}
        module="class"
        classRow={account}
      />

      <TransactionEditDrawer
        open={editing != null}
        row={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

const TotalTile = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn("mt-1 text-2xl font-bold tabular-nums", tone)}>{value}</p>
  </div>
);

const TransactionsPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const filters = useUrlFilters(FILTER_KEYS);
  const [period, setPeriod] = useState<PeriodState>(() => defaultPeriodState("all"));

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("finance.transactions.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("fin.transactions.subtitle")}</p>
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
      <TransactionsList filters={filters} period={period} onPeriodChange={setPeriod} />
    </div>
  );
};

export default TransactionsPage;

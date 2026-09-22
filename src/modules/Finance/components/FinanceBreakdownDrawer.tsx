import { useEffect, useMemo } from "react";
import {
  DataTable,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from "@/components/ui";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import type { DataTableConfig } from "@/types/datatable";
import { FINANCE_ENDPOINTS } from "../data/constants/endpoints";
import type {
  FinanceBreakdownEnrollmentRow,
  FinanceBreakdownMetric,
  FinancialTransactionRow,
} from "../data/models/FinanceReport";
import {
  extractBreakdownMeta,
  extractBreakdownRows,
  useFinanceBreakdown,
} from "../hooks/useFinanceBreakdown";
import FinanceStatusBadge from "./FinanceStatusBadge";
import { formatMoney, openPdf, type PeriodQuery } from "./financeFormat";

export interface BreakdownRequest {
  metric: FinanceBreakdownMetric;
  label: string;
  hint: string;
}

interface FinanceBreakdownDrawerProps {
  request: BreakdownRequest | null;
  periodParams: PeriodQuery;
  periodLabel: string;
  onClose: () => void;
  onOpenEnrollment: (row: FinanceBreakdownEnrollmentRow) => void;
}

/** Shows the individual enrollments / transactions that add up to a finance dashboard card. */
const FinanceBreakdownDrawer = ({
  request,
  periodParams,
  periodLabel,
  onClose,
  onOpenEnrollment,
}: FinanceBreakdownDrawerProps) => {
  const { t } = useTranslation();
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "amount",
    defaultSortDir: "desc",
    searchDebounceMs: 350,
  });

  useEffect(() => {
    updateParams({ page: 1, search: "" });
  }, [request?.metric, updateParams]);

  const queryParams = request
    ? {
        metric: request.metric,
        ...periodParams,
        search: debouncedSearch || undefined,
        page: params.page,
        per_page: params.per_page,
      }
    : null;

  const { data, isLoading, isFetching } = useFinanceBreakdown(queryParams);
  const meta = extractBreakdownMeta(data);
  const rows = extractBreakdownRows(data);
  const kind = meta?.kind ?? "enrollments";

  const enrollmentConfig: DataTableConfig<FinanceBreakdownEnrollmentRow> = useMemo(
    () => ({
      columns: [
        {
          key: "student_name",
          header: t("finance.columns.name"),
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
          render: (row) => (
            <div>
              <div>{row.class_name || "—"}</div>
              {row.class_code ? (
                <div className="font-mono text-xs text-muted-foreground">{row.class_code}</div>
              ) : null}
            </div>
          ),
        },
        { key: "fee_date", header: t("fin.columns.feeDate"), render: (row) => row.fee_date || "—" },
        {
          key: "amount",
          header: request?.label ?? t("fin.breakdown.total"),
          align: "right",
          render: (row) => (
            <span className="font-semibold tabular-nums">{formatMoney(row.amount)}</span>
          ),
          exportValue: (row) => row.amount,
        },
        {
          key: "net_amount",
          header: t("fin.cards.net"),
          align: "right",
          render: (row) => formatMoney(row.net_amount),
          exportValue: (row) => row.net_amount,
        },
        {
          key: "paid_amount",
          header: t("fin.cards.paidToDate"),
          align: "right",
          render: (row) => formatMoney(row.paid_amount),
          exportValue: (row) => row.paid_amount,
        },
        {
          key: "net_receivable",
          header: t("fin.columns.receivable"),
          align: "right",
          render: (row) => formatMoney(row.net_receivable),
          exportValue: (row) => row.net_receivable,
        },
        {
          key: "payment_status",
          header: t("finance.columns.paymentStatus"),
          render: (row) => (
            <FinanceStatusBadge
              value={row.payment_status}
              fallbackLabel={row.payment_status_label}
            />
          ),
          exportValue: (row) => row.payment_status_label ?? row.payment_status,
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("fin.breakdown.search"),
      paginationEnabled: true,
      filtersEnabled: false,
      emptyMessage: t("fin.breakdown.empty"),
      onRowDoubleClick: onOpenEnrollment,
      exportFilename: `finance-breakdown-${request?.metric ?? ""}`,
      fetchExportRows: () =>
        fetchAllListPages({
          url: FINANCE_ENDPOINTS.REPORT_BREAKDOWN,
          params: {
            metric: request?.metric,
            ...periodParams,
            search: debouncedSearch || undefined,
          },
          extractRows: (res) => extractBreakdownRows(res) as FinanceBreakdownEnrollmentRow[],
          extractPagination: (res) => extractBreakdownMeta(res)?.pagination ?? null,
        }),
    }),
    [t, request?.label, request?.metric, onOpenEnrollment, periodParams, debouncedSearch]
  );

  const transactionConfig: DataTableConfig<FinancialTransactionRow> = useMemo(
    () => ({
      columns: [
        {
          key: "transaction_date",
          header: t("fin.columns.transactionDate"),
          render: (row) => row.transaction_date || "—",
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
        },
        {
          key: "type",
          header: t("finance.columns.type"),
          render: (row) => (
            <FinanceStatusBadge
              kind="type"
              value={row.is_recovery ? "recovery" : row.type}
              fallbackLabel={row.type_label}
            />
          ),
        },
        { key: "payer", header: t("fin.payer.label"), render: (row) => row.payer_label || "—" },
        {
          key: "amount",
          header: request?.label ?? t("fin.breakdown.total"),
          align: "right",
          render: (row) => (
            <span className="font-semibold tabular-nums">
              {formatMoney(
                request?.metric === "service_cost" ? row.service_cost : row.amount,
                row.currency
              )}
            </span>
          ),
          exportValue: (row) =>
            (request?.metric === "service_cost" ? row.service_cost : row.amount) as number,
        },
        {
          key: "invoice_number",
          header: t("finance.columns.invoice"),
          render: (row) => <span className="font-mono text-xs">{row.invoice_number || "—"}</span>,
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("fin.breakdown.search"),
      paginationEnabled: true,
      filtersEnabled: false,
      emptyMessage: t("fin.breakdown.empty"),
      onRowDoubleClick: (row) => openPdf(row.pdf_url),
      exportFilename: `finance-breakdown-${request?.metric ?? ""}`,
      fetchExportRows: () =>
        fetchAllListPages({
          url: FINANCE_ENDPOINTS.REPORT_BREAKDOWN,
          params: {
            metric: request?.metric,
            ...periodParams,
            search: debouncedSearch || undefined,
          },
          extractRows: (res) => extractBreakdownRows(res) as FinancialTransactionRow[],
          extractPagination: (res) => extractBreakdownMeta(res)?.pagination ?? null,
        }),
    }),
    [t, request?.label, request?.metric, periodParams, debouncedSearch]
  );

  return (
    <Drawer open={request != null} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent side="right" className="w-full min-w-0 max-w-none sm:w-[85vw] xl:w-[70vw]">
        <DrawerHeader>
          <div className="space-y-1.5 pe-4">
            <DrawerTitle>
              {request?.label} — {t("fin.breakdown.title")}
            </DrawerTitle>
            <DrawerDescription>{request?.hint}</DrawerDescription>
          </div>
        </DrawerHeader>
        <DrawerBody className="space-y-5 px-4 py-5 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("fin.breakdown.total")} · {periodLabel}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
                {isLoading ? "…" : formatMoney(meta?.total ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("fin.breakdown.rows")}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {isLoading ? "…" : (meta?.pagination?.total ?? rows.length)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {kind === "transactions"
              ? t("fin.breakdown.transactionsNote")
              : t("fin.breakdown.enrollmentsNote")}
            {isFetching && !isLoading ? (
              <span className="ms-2 text-primary">{t("fin.updating")}</span>
            ) : null}
          </p>
          {kind === "transactions" ? (
            <DataTable
              data={rows as FinancialTransactionRow[]}
              config={transactionConfig}
              params={params}
              onParamsChange={updateParams}
              pagination={meta?.pagination ?? null}
              isLoading={isLoading}
            />
          ) : (
            <DataTable
              data={rows as FinanceBreakdownEnrollmentRow[]}
              config={enrollmentConfig}
              params={params}
              onParamsChange={updateParams}
              pagination={meta?.pagination ?? null}
              isLoading={isLoading}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default FinanceBreakdownDrawer;

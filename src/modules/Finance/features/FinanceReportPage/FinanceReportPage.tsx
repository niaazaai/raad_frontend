import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bank,
  Cart,
  CheckCircle,
  Clock,
  Coins,
  CoinsSwap,
  Eye,
  GraphUp,
  Group,
  MoreHoriz,
  Percentage,
  Undo,
  Wallet,
  WarningTriangle,
  XmarkCircle,
} from "iconoir-react";
import {
  Button,
  Card,
  CardContent,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PageBreadcrumb,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchAllListPages } from "@/lib/fetchAllListPages";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import FinanceBreakdownDrawer, {
  type BreakdownRequest,
} from "../../components/FinanceBreakdownDrawer";
import FinancePeriodFilter from "../../components/FinancePeriodFilter";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import SummaryCard from "../../components/SummaryCard";
import {
  defaultPeriodState,
  formatMoney,
  periodParams,
  periodRange,
  type PeriodState,
} from "../../components/financeFormat";
import { FINANCE_ENDPOINTS } from "../../data/constants/endpoints";
import type {
  FinanceBreakdownEnrollmentRow,
  FinanceBreakdownMetric,
  FinanceClassRow,
  FinanceCourseRow,
  FinanceModule,
  FinanceReportScope,
  FinanceSummary,
} from "../../data/models/FinanceReport";
import {
  extractFinancePagination,
  extractFinanceRows,
  extractFinanceSummary,
  useFinanceReport,
} from "../../hooks/useFinanceReport";
import FinanceDetailsDrawer from "./FinanceDetailsDrawer";

const EMPTY_SUMMARY: FinanceSummary = {
  class_income: 0,
  course_income: 0,
  total_income: 0,
  fees_amount: 0,
  discount_amount: 0,
  net_amount: 0,
  paid_amount: 0,
  refund_amount: 0,
  mof_receivable: 0,
  other_receivable: 0,
  irrecoverable_debt: 0,
  net_receivable: 0,
  service_income: 0,
  service_cost: 0,
};

const FinanceReportPage = () => {
  const { t } = useTranslation();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [module, setModule] = useState<FinanceModule>("class");
  const [periodState, setPeriodState] = useState<PeriodState>(() => defaultPeriodState("daily"));
  const [scope, setScope] = useState<FinanceReportScope>("activity");
  const [detailsRow, setDetailsRow] = useState<
    (Partial<FinanceClassRow> & { id: number }) | FinanceCourseRow | null
  >(null);
  const [breakdown, setBreakdown] = useState<BreakdownRequest | null>(null);

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "payment_date",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const period = useMemo(() => periodParams(periodState), [periodState]);
  const range = periodRange(periodState);
  const periodLabel = range
    ? range.from === range.to
      ? range.from
      : `${range.from} → ${range.to}`
    : t("finance.periodAll");

  const { data, isLoading, isFetching } = useFinanceReport({
    module,
    ...period,
    scope: module === "class" ? scope : undefined,
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const rows = extractFinanceRows(data);
  const pagination = extractFinancePagination(data);
  const summary: FinanceSummary = extractFinanceSummary(data) ?? EMPTY_SUMMARY;

  const setModuleAndReset = (next: FinanceModule) => {
    setModule(next);
    setDetailsRow(null);
    updateParams({ page: 1, sort_by: next === "course" ? "purchase_date" : "payment_date" });
  };

  const onPeriodChange = (next: PeriodState) => {
    setPeriodState(next);
    updateParams({ page: 1 });
  };

  const openBreakdown = (metric: FinanceBreakdownMetric, label: string, hint: string) =>
    setBreakdown({ metric, label, hint });

  const openEnrollmentFromBreakdown = useCallback((row: FinanceBreakdownEnrollmentRow) => {
    setDetailsRow({
      id: row.id,
      class_id: row.class_id ?? undefined,
      student_id: row.student_id ?? undefined,
      student_name: row.student_name,
      student_code: row.student_code,
      class_name: row.class_name,
      class_code: row.class_code,
      payment_status: row.payment_status,
    });
  }, []);

  const classConfig: DataTableConfig<FinanceClassRow> = {
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
        exportValue: (row) => row.student_name,
      },
      {
        key: "father_name",
        header: t("finance.columns.fatherName"),
        render: (row) => row.father_name || "—",
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
        key: "payment_date",
        header: t("fin.columns.lastPayment"),
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap tabular-nums">{row.payment_date || "—"}</span>
        ),
      },
      {
        key: "paid_in_period",
        header: t("fin.columns.paidInPeriod"),
        align: "right",
        render: (row) => (
          <span className="font-semibold tabular-nums text-success">
            {row.paid_in_period != null ? formatMoney(row.paid_in_period) : "—"}
          </span>
        ),
        exportValue: (row) => row.paid_in_period,
      },
      {
        key: "fees_amount",
        header: t("finance.columns.fees"),
        align: "right",
        render: (row) => formatMoney(row.fees_amount),
        exportValue: (row) => row.fees_amount as number,
      },
      {
        key: "discount_amount",
        header: t("finance.columns.discountAmount"),
        align: "right",
        render: (row) => (
          <span className="tabular-nums">
            {formatMoney(row.discount_amount)}
            {Number(row.discount_percent) > 0 ? (
              <span className="ms-1 text-xs text-muted-foreground">
                ({Number(row.discount_percent)}%)
              </span>
            ) : null}
          </span>
        ),
        exportValue: (row) => row.discount_amount as number,
      },
      {
        key: "net_amount",
        header: t("finance.columns.net"),
        align: "right",
        render: (row) => formatMoney(row.net_amount),
        exportValue: (row) => row.net_amount as number,
      },
      {
        key: "paid_amount",
        header: t("fin.columns.totalPaid"),
        align: "right",
        render: (row) => formatMoney(row.paid_amount),
        exportValue: (row) => row.paid_amount as number,
      },
      {
        key: "refund_amount",
        header: t("finance.columns.refund"),
        align: "right",
        render: (row) => formatMoney(row.refund_amount),
        exportValue: (row) => row.refund_amount as number,
      },
      {
        key: "irrecoverable_debt",
        header: t("finance.columns.irrecoverable"),
        align: "right",
        render: (row) => formatMoney(row.irrecoverable_debt),
        exportValue: (row) => row.irrecoverable_debt as number,
      },
      {
        key: "net_receivable",
        header: t("finance.columns.netReceivable"),
        align: "right",
        render: (row) => (
          <div className="text-end">
            <div className="font-semibold tabular-nums text-warning">
              {formatMoney(row.net_receivable)}
            </div>
            {Number(row.mof_receivable_amount) > 0 ? (
              <div className="text-xs text-auxiliary">
                MOF {formatMoney(row.mof_receivable_amount)}
              </div>
            ) : null}
            {Number(row.other_receivable_amount) > 0 ? (
              <div className="text-xs text-info">
                {row.other_party_name || t("fin.payer.other_party")}{" "}
                {formatMoney(row.other_receivable_amount)}
              </div>
            ) : null}
          </div>
        ),
        exportValue: (row) => row.net_receivable as number,
      },
      {
        key: "payment_status",
        header: t("finance.columns.paymentStatus"),
        sortable: true,
        render: (row) => (
          <FinanceStatusBadge value={row.payment_status} fallbackLabel={row.payment_status_label} />
        ),
        exportValue: (row) => row.payment_status_label ?? row.payment_status,
      },
      {
        key: "next_installment_date",
        header: t("finance.columns.nextInstallment"),
        render: (row) => row.next_installment_date || "—",
      },
      {
        key: "fee_date",
        header: t("fin.columns.feeDate"),
        sortable: true,
        render: (row) => row.fee_date || "—",
      },
      {
        key: "invoice_number",
        header: t("finance.columns.invoice"),
        render: (row) => <span className="font-mono text-xs">{row.invoice_number || "—"}</span>,
      },
      {
        key: "teacher_name",
        header: t("finance.columns.teacher"),
        render: (row) => row.teacher_name || "—",
      },
      {
        key: "actions",
        header: t("dataTable.actions"),
        exportable: false,
        render: (row) => (
          <Button type="button" variant="outline" size="sm" onClick={() => setDetailsRow(row)}>
            <Eye className="h-4 w-4" />
            {t("finance.details.viewDetails")}
          </Button>
        ),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("finance.searchClass"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("finance.empty"),
    onRowDoubleClick: (row) => setDetailsRow(row),
    exportFilename: "finance-class-report",
    exportDateKey: "payment_date",
    fetchExportRows: (query) =>
      fetchAllListPages({
        url: FINANCE_ENDPOINTS.REPORT,
        params: {
          module: "class",
          scope,
          search: debouncedSearch || undefined,
          sort_by: params.sort_by,
          sort_dir: params.sort_dir,
          ...(query.allTime
            ? { period: "all" }
            : { period: "range", from: query.from, to: query.to }),
        },
        extractRows: (res) => extractFinanceRows(res) as FinanceClassRow[],
        extractPagination: extractFinancePagination,
      }),
  };

  const courseConfig: DataTableConfig<FinanceCourseRow> = {
    columns: [
      {
        key: "student_name",
        header: t("finance.columns.student"),
        render: (row) => <span className="font-medium">{row.student_name || "—"}</span>,
      },
      {
        key: "course_title",
        header: t("finance.columns.course"),
        render: (row) => row.course_title || "—",
      },
      {
        key: "plan_name",
        header: t("finance.columns.plan"),
        render: (row) => row.plan_name || "—",
      },
      {
        key: "amount",
        header: t("finance.columns.amount"),
        align: "right",
        render: (row) => formatMoney(row.amount),
      },
      {
        key: "payment_status",
        header: t("finance.columns.paymentStatus"),
        sortable: true,
        render: (row) => (
          <FinanceStatusBadge value={row.payment_status} fallbackLabel={row.payment_status_label} />
        ),
      },
      {
        key: "purchase_date",
        header: t("finance.columns.purchaseDate"),
        sortable: true,
        render: (row) => row.purchase_date || "—",
      },
      {
        key: "subscription_status",
        header: t("finance.columns.subscriptionStatus"),
        render: (row) => row.subscription_status_label || row.subscription_status || "—",
      },
      {
        key: "actions",
        header: t("dataTable.actions"),
        exportable: false,
        render: (row) => (
          <Button type="button" variant="outline" size="sm" onClick={() => setDetailsRow(row)}>
            <Eye className="h-4 w-4" />
            {t("finance.details.viewDetails")}
          </Button>
        ),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("finance.searchCourse"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("finance.empty"),
    onRowDoubleClick: (row) => setDetailsRow(row),
    exportFilename: "finance-course-report",
    exportDateKey: "purchase_date",
    fetchExportRows: (query) =>
      fetchAllListPages({
        url: FINANCE_ENDPOINTS.REPORT,
        params: {
          module: "course",
          search: debouncedSearch || undefined,
          sort_by: params.sort_by,
          sort_dir: params.sort_dir,
          ...(query.allTime
            ? { period: "all" }
            : { period: "range", from: query.from, to: query.to }),
        },
        extractRows: (res) => extractFinanceRows(res) as FinanceCourseRow[],
        extractPagination: extractFinancePagination,
      }),
  };

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  const canReceivePayment = hasAnyPermission([
    "course.class_students.payment",
    "course.class_students.update",
  ]);
  const loadingCards = isLoading || (isFetching && !data);
  const cohortFootnote = `${summary.enrollment_count ?? 0} ${t("fin.cards.enrollments")}${
    summary.free_count ? ` · ${summary.free_count} ${t("fin.cards.freeStudents")}` : ""
  }`;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("finance.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title") },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/finance/transactions">{t("finance.transactions.title")}</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/finance/upcoming-dues">
              <Clock className="h-4 w-4" />
              {t("fin.dues.title")}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" aria-label={t("fin.more")}>
                <MoreHoriz className="h-4 w-4" />
                {t("fin.more")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/finance/invoices">{t("finance.invoices.title")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/finance/service-income">{t("finance.serviceIncome.title")}</Link>
              </DropdownMenuItem>
              {canReceivePayment ? (
                <DropdownMenuItem asChild>
                  <Link to="/finance/manual-invoice">{t("finance.manualInvoice.title")}</Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          {canReceivePayment ? (
            <Button type="button" asChild>
              <Link to="/finance/receive-payment">
                <Wallet className="h-4 w-4" />
                {t("finance.receivePayment.title")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <Button
              type="button"
              size="sm"
              variant={module === "class" ? "default" : "ghost"}
              onClick={() => setModuleAndReset("class")}
            >
              {t("finance.classModule")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={module === "course" ? "default" : "ghost"}
              onClick={() => setModuleAndReset("course")}
            >
              {t("finance.courseModule")}
            </Button>
          </div>
          <FinancePeriodFilter value={periodState} onChange={onPeriodChange} />
          {isFetching && data ? (
            <span className="ms-auto text-xs text-primary">{t("fin.updating")}</span>
          ) : null}
        </CardContent>
      </Card>

      <TooltipProvider delayDuration={150}>
        {module === "class" ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t("fin.groups.cohortTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("fin.groups.cohortHint")}{" "}
                  <span className="font-mono">({t("fin.identity")})</span>
                </p>
              </div>
              <div
                className={cn(
                  "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                  loadingCards && "opacity-60"
                )}
              >
                <SummaryCard
                  label={t("fin.cards.gross")}
                  value={summary.gross_amount ?? summary.fees_amount}
                  hint={t("fin.hints.gross")}
                  icon={<Wallet className="h-5 w-5" />}
                  footnote={cohortFootnote}
                  onClick={() => openBreakdown("gross", t("fin.cards.gross"), t("fin.hints.gross"))}
                />
                <SummaryCard
                  label={t("fin.cards.discount")}
                  value={summary.discount_amount}
                  hint={t("fin.hints.discount")}
                  icon={<Percentage className="h-5 w-5" />}
                  tone="info"
                  onClick={() =>
                    openBreakdown("discount", t("fin.cards.discount"), t("fin.hints.discount"))
                  }
                />
                <SummaryCard
                  label={t("fin.cards.net")}
                  value={summary.net_amount}
                  hint={t("fin.hints.net")}
                  icon={<GraphUp className="h-5 w-5" />}
                  tone="auxiliary"
                  onClick={() => openBreakdown("net", t("fin.cards.net"), t("fin.hints.net"))}
                />
                <SummaryCard
                  label={t("fin.cards.paidToDate")}
                  value={summary.paid_amount}
                  hint={t("fin.hints.paidToDate")}
                  icon={<CheckCircle className="h-5 w-5" />}
                  tone="success"
                  onClick={() =>
                    openBreakdown("paid", t("fin.cards.paidToDate"), t("fin.hints.paidToDate"))
                  }
                />
                <SummaryCard
                  label={t("fin.cards.receivable")}
                  value={summary.net_receivable}
                  hint={t("fin.hints.receivable")}
                  icon={<Clock className="h-5 w-5" />}
                  tone="warning"
                  parts={[
                    { label: t("fin.cards.studentPart"), value: summary.student_receivable ?? 0 },
                    { label: t("fin.cards.mofPart"), value: summary.mof_receivable },
                    { label: t("fin.cards.otherPart"), value: summary.other_receivable },
                  ]}
                  onClick={() =>
                    openBreakdown(
                      "receivable",
                      t("fin.cards.receivable"),
                      t("fin.hints.receivable")
                    )
                  }
                />
                <SummaryCard
                  label={t("fin.cards.writtenOff")}
                  value={summary.irrecoverable_debt}
                  hint={t("fin.hints.writtenOff")}
                  icon={<WarningTriangle className="h-5 w-5" />}
                  tone="danger"
                  onClick={() =>
                    openBreakdown(
                      "irrecoverable",
                      t("fin.cards.writtenOff"),
                      t("fin.hints.writtenOff")
                    )
                  }
                />
                <SummaryCard
                  label={t("fin.cards.mof")}
                  value={summary.mof_receivable}
                  hint={t("finance.hints.mof")}
                  icon={<Bank className="h-5 w-5" />}
                  tone="auxiliary"
                  onClick={() => openBreakdown("mof", t("fin.cards.mof"), t("finance.hints.mof"))}
                />
                <SummaryCard
                  label={t("fin.cards.other")}
                  value={summary.other_receivable}
                  hint={t("finance.hints.other")}
                  icon={<Group className="h-5 w-5" />}
                  tone="info"
                  onClick={() =>
                    openBreakdown("other", t("fin.cards.other"), t("finance.hints.other"))
                  }
                />
                <SummaryCard
                  label={t("fin.cards.refunds")}
                  value={summary.refund_amount}
                  hint={t("fin.hints.refunds")}
                  icon={<Undo className="h-5 w-5" />}
                  onClick={() =>
                    openBreakdown("refund", t("fin.cards.refunds"), t("fin.hints.refunds"))
                  }
                />
                {(summary.cancelled_amount ?? 0) > 0 ? (
                  <SummaryCard
                    label={t("fin.cards.cancelled")}
                    value={summary.cancelled_amount ?? 0}
                    hint={t("fin.hints.cancelled")}
                    icon={<XmarkCircle className="h-5 w-5" />}
                    onClick={() =>
                      openBreakdown("cancelled", t("fin.cards.cancelled"), t("fin.hints.cancelled"))
                    }
                  />
                ) : null}
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t("fin.groups.cashTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("fin.groups.cashHint")}</p>
              </div>
              <div
                className={cn(
                  "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
                  loadingCards && "opacity-60"
                )}
              >
                <SummaryCard
                  label={t("fin.cards.collected")}
                  value={summary.cash_collected ?? 0}
                  hint={t("fin.hints.collected")}
                  icon={<Coins className="h-5 w-5" />}
                  tone="success"
                  onClick={() =>
                    openBreakdown("collected", t("fin.cards.collected"), t("fin.hints.collected"))
                  }
                />
                <SummaryCard
                  label={t("fin.cards.refunded")}
                  value={summary.cash_refunded ?? 0}
                  hint={t("fin.hints.refunded")}
                  icon={<Undo className="h-5 w-5" />}
                  onClick={() =>
                    openBreakdown("refunded", t("fin.cards.refunded"), t("fin.hints.refunded"))
                  }
                />
                <SummaryCard
                  label={t("fin.cards.recovered")}
                  value={summary.cash_recovered ?? 0}
                  hint={t("fin.hints.recovered")}
                  icon={<CoinsSwap className="h-5 w-5" />}
                  tone="success"
                  onClick={() =>
                    openBreakdown("recovered", t("fin.cards.recovered"), t("fin.hints.recovered"))
                  }
                />
                <SummaryCard
                  label={t("fin.cards.netCash")}
                  value={summary.cash_net ?? summary.class_income}
                  hint={t("fin.hints.netCash")}
                  icon={<GraphUp className="h-5 w-5" />}
                  tone="success"
                />
                <SummaryCard
                  label={t("fin.cards.serviceIncome")}
                  value={summary.service_income ?? 0}
                  hint={t("fin.hints.serviceIncome")}
                  icon={<Coins className="h-5 w-5" />}
                  tone="info"
                  onClick={() =>
                    openBreakdown(
                      "service_income",
                      t("fin.cards.serviceIncome"),
                      t("fin.hints.serviceIncome")
                    )
                  }
                />
                <SummaryCard
                  label={t("fin.cards.serviceCost")}
                  value={summary.service_cost ?? 0}
                  hint={t("fin.hints.serviceCost")}
                  icon={<Cart className="h-5 w-5" />}
                  tone="danger"
                  onClick={() =>
                    openBreakdown(
                      "service_cost",
                      t("fin.cards.serviceCost"),
                      t("fin.hints.serviceCost")
                    )
                  }
                />
              </div>
            </section>
          </div>
        ) : (
          <div
            className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", loadingCards && "opacity-60")}
          >
            <SummaryCard
              label={t("finance.courseIncome")}
              value={summary.course_income}
              hint={t("finance.hints.courseIncome")}
              icon={<Wallet className="h-5 w-5" />}
              tone="success"
            />
            <SummaryCard
              label={t("finance.totalIncome")}
              value={summary.total_income}
              hint={t("finance.hints.courseIncome")}
              icon={<GraphUp className="h-5 w-5" />}
            />
            <SummaryCard
              label={t("finance.netServiceIncome")}
              value={summary.service_income ?? 0}
              hint={t("finance.hints.serviceIncome")}
              icon={<Coins className="h-5 w-5" />}
              tone="success"
            />
            <SummaryCard
              label={t("finance.netServiceCost")}
              value={summary.service_cost ?? 0}
              hint={t("finance.hints.serviceCost")}
              icon={<Cart className="h-5 w-5" />}
              tone="danger"
            />
          </div>
        )}
      </TooltipProvider>

      {module === "class" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("fin.scope.label")}
            </span>
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <TooltipProvider delayDuration={150}>
                {(["activity", "cohort"] as FinanceReportScope[]).map((value) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant={scope === value ? "default" : "ghost"}
                        onClick={() => {
                          setScope(value);
                          updateParams({ page: 1 });
                        }}
                      >
                        {t(value === "activity" ? "fin.scope.activity" : "fin.scope.cohort")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      {t(value === "activity" ? "fin.scope.activityHint" : "fin.scope.cohortHint")}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
          <DataTable
            data={rows as FinanceClassRow[]}
            config={classConfig}
            params={params}
            onParamsChange={updateParams}
            pagination={pagination}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <DataTable
          data={rows as FinanceCourseRow[]}
          config={courseConfig}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      )}

      <FinanceDetailsDrawer
        open={detailsRow != null}
        onClose={() => setDetailsRow(null)}
        module={module}
        classRow={
          module === "class"
            ? (detailsRow as (Partial<FinanceClassRow> & { id: number }) | null)
            : null
        }
        courseRow={module === "course" ? (detailsRow as FinanceCourseRow | null) : null}
      />

      <FinanceBreakdownDrawer
        request={breakdown}
        periodParams={period}
        periodLabel={periodLabel}
        onClose={() => setBreakdown(null)}
        onOpenEnrollment={openEnrollmentFromBreakdown}
      />
    </div>
  );
};

export default FinanceReportPage;

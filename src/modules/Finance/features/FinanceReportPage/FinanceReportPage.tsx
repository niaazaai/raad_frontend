import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import {
  Landmark as Bank,
  CalendarArrowDown,
  ShoppingCart as Cart,
  CircleCheck as CheckCircle,
  Clock,
  Coins,
  ArrowLeftRight as CoinsSwap,
  Eye,
  TrendingUp as GraphUp,
  Users as Group,
  HandCoins as HandCash,
  List,
  Ellipsis as MoreHoriz,
  FilePen as PageEdit,
  BookOpenText as PageFlip,
  Percent as Percentage,
  Undo2 as Undo,
  Wallet,
  TriangleAlert as WarningTriangle,
  CircleX as XmarkCircle,
} from "lucide-react";
import {
  Button,
  ButtonGroup,
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
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
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
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../../data/constants/endpoints";
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

const CLASS_FILTER_KEYS = ["payment_status"] as const;
const READ = "finance.read";

type ClassFilters = UrlFilters<(typeof CLASS_FILTER_KEYS)[number]>;

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function Ltr({ value }: { value: string }) {
  if (value === "—") return value;
  return <bdi dir="ltr">{value}</bdi>;
}

function ClassReportList({
  filters,
  period,
  onPeriodChange,
  scope,
  onScopeChange,
  module,
  onModuleChange,
  onOpenDetails,
}: {
  filters: ClassFilters;
  period: PeriodState;
  onPeriodChange: (next: PeriodState) => void;
  scope: FinanceReportScope;
  onScopeChange: (next: FinanceReportScope) => void;
  module: FinanceModule;
  onModuleChange: (next: FinanceModule) => void;
  onOpenDetails: (row: FinanceClassRow) => void;
}) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const title = t("finance.title");
  const periodQuery = useMemo(() => periodParams(period), [period]);

  const tableParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      module: "class",
      scope,
      period: periodQuery.period,
      date: periodQuery.date,
      month: periodQuery.month,
      year: periodQuery.year != null ? String(periodQuery.year) : undefined,
      from: periodQuery.from,
      to: periodQuery.to,
      ...filters.params,
    };
    return params;
  }, [filters.params, periodQuery, scope]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("finance.transactions.filterAll") },
      { value: "pending", label: t("fin.status.pending") },
      { value: "paid", label: t("fin.status.paid") },
      { value: "partial", label: t("fin.status.partial") },
      { value: "mof_pending", label: t("fin.status.mof_pending") },
      { value: "other_party", label: t("fin.status.other_party") },
      { value: "free", label: t("fin.status.free") },
      { value: "written_off", label: t("fin.status.written_off") },
      { value: "withdrawn", label: t("fin.status.withdrawn") },
      { value: "moved", label: t("fin.status.moved") },
    ],
    [t],
  );

  const columns = useMemo<ColumnDef<FinanceClassRow, unknown>[]>(() => {
    const nameLabel = t("finance.columns.name");
    const fatherLabel = t("finance.columns.fatherName");
    const classLabel = t("finance.columns.class");
    const startLabel = t("finance.columns.classStartDate");
    const paidInPeriodLabel = t("fin.columns.paidInPeriod");
    const feesLabel = t("finance.columns.fees");
    const discountLabel = t("finance.columns.discountAmount");
    const netLabel = t("finance.columns.net");
    const totalPaidLabel = t("fin.columns.totalPaid");
    const refundLabel = t("finance.columns.refund");
    const irrecoverableLabel = t("finance.columns.irrecoverable");
    const receivableLabel = t("finance.columns.netReceivable");
    const statusLabel = t("finance.columns.paymentStatus");
    const feeDateLabel = t("finance.columns.enrollmentDate");
    const teacherLabel = t("finance.columns.teacher");
    const viewLabel = t("finance.details.viewDetails");

    return [
      {
        id: "student_name",
        header: nameLabel,
        meta: {
          priority: 1,
          shortLabel: nameLabel,
          plainText: (row) => shown((row as FinanceClassRow).student_name),
          width: { default: 180, min: 140 },
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{shown(row.original.student_name)}</div>
            {row.original.student_code ? (
              <div className="font-mono text-xs text-muted-foreground">
                <bdi dir="ltr">{row.original.student_code}</bdi>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "father_name",
        header: fatherLabel,
        meta: {
          priority: 3,
          shortLabel: fatherLabel,
          plainText: (row) => shown((row as FinanceClassRow).father_name),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => shown(row.original.father_name),
      },
      {
        id: "class_name",
        header: classLabel,
        meta: {
          priority: 1,
          shortLabel: classLabel,
          plainText: (row) => {
            const item = row as FinanceClassRow;
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
      {
        id: "starting_date",
        header: startLabel,
        meta: {
          priority: 3,
          shortLabel: startLabel,
          plainText: (row) => shown((row as FinanceClassRow).starting_date),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            <Ltr value={shown(row.original.starting_date)} />
          </span>
        ),
      },
      {
        id: "paid_in_period",
        header: paidInPeriodLabel,
        meta: {
          priority: 2,
          shortLabel: paidInPeriodLabel,
          plainText: (row) => {
            const item = row as FinanceClassRow;
            return item.paid_in_period == null ? "—" : formatMoney(item.paid_in_period);
          },
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums text-success">
            {row.original.paid_in_period == null ? (
              "—"
            ) : (
              <bdi dir="ltr">{formatMoney(row.original.paid_in_period)}</bdi>
            )}
          </span>
        ),
      },
      {
        id: "fees_amount",
        header: feesLabel,
        meta: {
          priority: 2,
          shortLabel: feesLabel,
          plainText: (row) => formatMoney((row as FinanceClassRow).fees_amount),
          width: { default: 110, min: 90 },
        },
        cell: ({ row }) => (
          <bdi dir="ltr">{formatMoney(row.original.fees_amount)}</bdi>
        ),
      },
      {
        id: "discount_amount",
        header: discountLabel,
        meta: {
          priority: 3,
          shortLabel: discountLabel,
          plainText: (row) => formatMoney((row as FinanceClassRow).discount_amount),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <span className="tabular-nums">
            <bdi dir="ltr">{formatMoney(row.original.discount_amount)}</bdi>
            {Number(row.original.discount_percent) > 0 ? (
              <span className="ms-1 text-xs text-muted-foreground">
                ({Number(row.original.discount_percent)}%)
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "net_amount",
        header: netLabel,
        meta: {
          priority: 2,
          shortLabel: netLabel,
          plainText: (row) => formatMoney((row as FinanceClassRow).net_amount),
          width: { default: 110, min: 90 },
        },
        cell: ({ row }) => <bdi dir="ltr">{formatMoney(row.original.net_amount)}</bdi>,
      },
      {
        id: "paid_amount",
        header: totalPaidLabel,
        meta: {
          priority: 2,
          shortLabel: totalPaidLabel,
          plainText: (row) => formatMoney((row as FinanceClassRow).paid_amount),
          width: { default: 110, min: 90 },
        },
        cell: ({ row }) => <bdi dir="ltr">{formatMoney(row.original.paid_amount)}</bdi>,
      },
      {
        id: "refund_amount",
        header: refundLabel,
        meta: {
          priority: 3,
          shortLabel: refundLabel,
          plainText: (row) => formatMoney((row as FinanceClassRow).refund_amount),
          width: { default: 110, min: 90 },
        },
        cell: ({ row }) => <bdi dir="ltr">{formatMoney(row.original.refund_amount)}</bdi>,
      },
      {
        id: "irrecoverable_debt",
        header: irrecoverableLabel,
        meta: {
          priority: 3,
          shortLabel: irrecoverableLabel,
          plainText: (row) => formatMoney((row as FinanceClassRow).irrecoverable_debt),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => <bdi dir="ltr">{formatMoney(row.original.irrecoverable_debt)}</bdi>,
      },
      {
        id: "net_receivable",
        header: receivableLabel,
        meta: {
          priority: 1,
          shortLabel: receivableLabel,
          plainText: (row) =>
            formatMoney((row as FinanceClassRow).student_receivable_amount ?? 0),
          width: { default: 130, min: 110 },
        },
        cell: ({ row }) => (
          <div className="text-end font-semibold tabular-nums text-warning">
            <bdi dir="ltr">{formatMoney(row.original.student_receivable_amount)}</bdi>
          </div>
        ),
      },
      withHeaderAddon(
        {
          id: "payment_status",
          header: statusLabel,
          meta: {
            priority: 1,
            sortKey: "payment_status",
            shortLabel: statusLabel,
            plainText: (row) => {
              const item = row as FinanceClassRow;
              return shown(item.payment_status_label ?? item.payment_status);
            },
            width: { default: 130, min: 110 },
          },
          cell: ({ row }) => (
            <FinanceStatusBadge
              value={row.original.payment_status}
              fallbackLabel={row.original.payment_status_label}
            />
          ),
        },
        <ColumnFunnel
          label={statusLabel}
          value={filters.values.payment_status}
          onChange={(next) => filters.set("payment_status", next)}
          options={statusOptions}
        />,
      ),
      {
        id: "fee_date",
        header: feeDateLabel,
        meta: {
          priority: 3,
          sortKey: "fee_date",
          shortLabel: feeDateLabel,
          plainText: (row) => shown((row as FinanceClassRow).fee_date),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => <Ltr value={shown(row.original.fee_date)} />,
      },
      {
        id: "teacher_name",
        header: teacherLabel,
        meta: {
          priority: 3,
          shortLabel: teacherLabel,
          plainText: (row) => shown((row as FinanceClassRow).teacher_name),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => shown(row.original.teacher_name),
      },
      actionsColumn<FinanceClassRow>(
        gridT,
        () => [],
        true,
        undefined,
        (row) => [
          {
            id: "view",
            label: viewLabel,
            icon: <Eye className="size-4" aria-hidden="true" />,
            permission: READ,
            onSelect: () => onOpenDetails(row),
          },
        ],
      ),
    ];
  }, [filters, gridT, onOpenDetails, statusOptions, t]);

  const table = useDataTable<FinanceClassRow>({
    key: "finance.report.class",
    queryKey: (query) => [...FINANCE_QUERY_KEYS.report, "class", query],
    endpoint: FINANCE_ENDPOINTS.REPORT,
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    exportTitle: title,
    params: tableParams,
    syncUrl: true,
    defaultSort: "-payment_date",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="space-y-3">
      <div className="flex max-w-full flex-wrap items-center gap-2 overflow-x-auto">
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
                    onClick={() => onScopeChange(value)}
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

      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("dt.finance.searchClass")}
        emptyTitle={t("dt.finance.emptyTitle")}
        emptyBody={t("dt.finance.emptyBody")}
        narrowed={filters.narrowed || period.period !== "all"}
        onRowDoubleClick={onOpenDetails}
        stickyHeader
        toolsInHeader
        extra={
          <div className="flex w-full min-w-0 flex-col items-stretch gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
            <ModuleToggle module={module} onChange={onModuleChange} />
            <FinancePeriodFilter
              className="w-full min-w-0 lg:w-auto"
              value={period}
              onChange={onPeriodChange}
              allowAll
              size="sm"
              idPrefix="finance-report-period"
            />
          </div>
        }
      />
    </div>
  );
}

function CourseReportList({
  period,
  onPeriodChange,
  module,
  onModuleChange,
  onOpenDetails,
}: {
  period: PeriodState;
  onPeriodChange: (next: PeriodState) => void;
  module: FinanceModule;
  onModuleChange: (next: FinanceModule) => void;
  onOpenDetails: (row: FinanceCourseRow) => void;
}) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const title = t("finance.title");
  const periodQuery = useMemo(() => periodParams(period), [period]);

  const tableParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      module: "course",
      period: periodQuery.period,
      date: periodQuery.date,
      month: periodQuery.month,
      year: periodQuery.year != null ? String(periodQuery.year) : undefined,
      from: periodQuery.from,
      to: periodQuery.to,
    };
    return params;
  }, [periodQuery]);

  const columns = useMemo<ColumnDef<FinanceCourseRow, unknown>[]>(() => {
    const studentLabel = t("finance.columns.student");
    const courseLabel = t("finance.columns.course");
    const planLabel = t("finance.columns.plan");
    const amountLabel = t("finance.columns.amount");
    const statusLabel = t("finance.columns.paymentStatus");
    const purchaseLabel = t("finance.columns.purchaseDate");
    const subscriptionLabel = t("finance.columns.subscriptionStatus");
    const viewLabel = t("finance.details.viewDetails");

    return [
      {
        id: "student_name",
        header: studentLabel,
        meta: {
          priority: 1,
          shortLabel: studentLabel,
          plainText: (row) => shown((row as FinanceCourseRow).student_name),
          width: { default: 180, min: 140 },
        },
        cell: ({ row }) => (
          <span className="font-medium">{shown(row.original.student_name)}</span>
        ),
      },
      {
        id: "course_title",
        header: courseLabel,
        meta: {
          priority: 1,
          shortLabel: courseLabel,
          plainText: (row) => shown((row as FinanceCourseRow).course_title),
          width: { default: 180, min: 140 },
        },
        cell: ({ row }) => shown(row.original.course_title),
      },
      {
        id: "plan_name",
        header: planLabel,
        meta: {
          priority: 2,
          shortLabel: planLabel,
          plainText: (row) => shown((row as FinanceCourseRow).plan_name),
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) => shown(row.original.plan_name),
      },
      {
        id: "amount",
        header: amountLabel,
        meta: {
          priority: 1,
          shortLabel: amountLabel,
          plainText: (row) => formatMoney((row as FinanceCourseRow).amount),
          width: { default: 110, min: 90 },
        },
        cell: ({ row }) => <bdi dir="ltr">{formatMoney(row.original.amount)}</bdi>,
      },
      {
        id: "payment_status",
        header: statusLabel,
        meta: {
          priority: 2,
          sortKey: "payment_status",
          shortLabel: statusLabel,
          plainText: (row) => {
            const item = row as FinanceCourseRow;
            return shown(item.payment_status_label ?? item.payment_status);
          },
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => (
          <FinanceStatusBadge
            value={row.original.payment_status}
            fallbackLabel={row.original.payment_status_label}
          />
        ),
      },
      {
        id: "purchase_date",
        header: purchaseLabel,
        meta: {
          priority: 2,
          sortKey: "purchase_date",
          shortLabel: purchaseLabel,
          plainText: (row) => shown((row as FinanceCourseRow).purchase_date),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => <Ltr value={shown(row.original.purchase_date)} />,
      },
      {
        id: "subscription_status",
        header: subscriptionLabel,
        meta: {
          priority: 3,
          shortLabel: subscriptionLabel,
          plainText: (row) => {
            const item = row as FinanceCourseRow;
            return shown(item.subscription_status_label ?? item.subscription_status);
          },
          width: { default: 140, min: 110 },
        },
        cell: ({ row }) =>
          shown(row.original.subscription_status_label ?? row.original.subscription_status),
      },
      actionsColumn<FinanceCourseRow>(
        gridT,
        () => [],
        true,
        undefined,
        (row) => [
          {
            id: "view",
            label: viewLabel,
            icon: <Eye className="size-4" aria-hidden="true" />,
            permission: READ,
            onSelect: () => onOpenDetails(row),
          },
        ],
      ),
    ];
  }, [gridT, onOpenDetails, t]);

  const table = useDataTable<FinanceCourseRow>({
    key: "finance.report.course",
    queryKey: (query) => [...FINANCE_QUERY_KEYS.report, "course", query],
    endpoint: FINANCE_ENDPOINTS.REPORT,
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    exportTitle: title,
    params: tableParams,
    syncUrl: true,
    defaultSort: "-purchase_date",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  return (
    <ServerDataTable
      api={table}
      entityLabel={title}
      searchPlaceholder={t("dt.finance.searchCourse")}
      emptyTitle={t("dt.finance.emptyTitle")}
      emptyBody={t("dt.finance.emptyBody")}
      narrowed={period.period !== "all"}
      onRowDoubleClick={onOpenDetails}
      stickyHeader
      toolsInHeader
      extra={
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          <ModuleToggle module={module} onChange={onModuleChange} />
          <FinancePeriodFilter
            className="w-full min-w-0 lg:w-auto"
            value={period}
            onChange={onPeriodChange}
            allowAll
            size="sm"
            idPrefix="finance-report-period-course"
          />
        </div>
      }
    />
  );
}

function ModuleToggle({
  module,
  onChange,
}: {
  module: FinanceModule;
  onChange: (next: FinanceModule) => void;
}) {
  const { t } = useTranslation();

  return (
    <ButtonGroup aria-label={t("finance.classModule")} className="w-full lg:w-auto">
      <Button
        type="button"
        size="sm"
        aria-pressed={module === "class"}
        variant={module === "class" ? "default" : "outline"}
        className={cn(
          "min-w-0 flex-1 lg:flex-none",
          module !== "class" && "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onChange("class")}
      >
        <Group className="h-4 w-4" />
        {t("finance.classModule")}
      </Button>
      <Button
        type="button"
        size="sm"
        aria-pressed={module === "course"}
        variant={module === "course" ? "default" : "outline"}
        className={cn(
          "min-w-0 flex-1 lg:flex-none",
          module !== "course" && "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onChange("course")}
      >
        <Cart className="h-4 w-4" />
        {t("finance.courseModule")}
      </Button>
    </ButtonGroup>
  );
}

const FinanceReportPage = () => {
  const { t } = useTranslation();
  const { hasPermission, hasAnyPermission } = useAuth();
  const filters = useUrlFilters(CLASS_FILTER_KEYS);
  const [module, setModule] = useState<FinanceModule>("class");
  const [periodState, setPeriodState] = useState<PeriodState>(() => defaultPeriodState("today"));
  const [scope, setScope] = useState<FinanceReportScope>("activity");
  const [detailsRow, setDetailsRow] = useState<
    (Partial<FinanceClassRow> & { id: number }) | FinanceCourseRow | null
  >(null);
  const [breakdown, setBreakdown] = useState<BreakdownRequest | null>(null);

  const period = useMemo(() => periodParams(periodState), [periodState]);
  const range = periodRange(periodState);
  const periodLabel = range
    ? range.from === range.to
      ? range.from
      : `${range.from} → ${range.to}`
    : t("finance.periodAll");

  const summaryQuery = useFinanceReport({
    module,
    ...period,
    scope: module === "class" ? scope : undefined,
    search: undefined,
    page: 1,
    per_page: 1,
    payment_status: module === "class" ? filters.values.payment_status || undefined : undefined,
  });
  const summary: FinanceSummary = extractFinanceSummary(summaryQuery.data) ?? EMPTY_SUMMARY;
  const loadingCards = summaryQuery.isLoading || (summaryQuery.isFetching && !summaryQuery.data);

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

  const openClassDetails = useCallback((row: FinanceClassRow) => setDetailsRow(row), []);
  const openCourseDetails = useCallback((row: FinanceCourseRow) => setDetailsRow(row), []);

  if (!hasPermission(READ)) {
    return <PermissionDeniedCard />;
  }

  const canReceivePayment = hasPermission("finance.payments.receive");
  const canCreateManualInvoice = hasAnyPermission([
    "finance.manual_invoices.create",
    "finance.service_income.create",
  ]);
  const canSeeFinanceCards = hasPermission("finance.dashboard.read");
  const canSeeStudentReceivable = hasPermission("finance.receivables.students.read");
  const canSeeMofReceivable = hasPermission("finance.receivables.mof.read");
  const canSeeOtherReceivable = hasPermission("finance.receivables.other.read");
  const canSeeServiceIncome = hasPermission("finance.service_income.read");
  const cohortFootnote = `${summary.enrollment_count ?? 0} ${t("fin.cards.enrollments")}${
    summary.free_count ? ` · ${summary.free_count} ${t("fin.cards.freeStudents")}` : ""
  }`;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
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
        <ButtonGroup className="w-full min-w-0 sm:w-auto sm:shrink-0">
          {canReceivePayment ? (
            <Button type="button" asChild className="min-w-0 flex-1 sm:flex-none">
              <Link to="/finance/receive-payment">
                <HandCash className="h-4 w-4" />
                {t("finance.receivePayment.title")}
              </Link>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant={canReceivePayment ? "outline" : "default"}
                size={canReceivePayment ? "icon" : undefined}
                className="shrink-0"
                aria-label={t("fin.more")}
              >
                <MoreHoriz className="h-4 w-4" />
                {canReceivePayment ? null : t("fin.more")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/finance/transactions">
                  <List className="h-4 w-4" />
                  {t("finance.transactions.title")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/finance/upcoming-dues">
                  <CalendarArrowDown className="h-4 w-4" />
                  {t("fin.dues.title")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/finance/invoices">
                  <PageFlip className="h-4 w-4" />
                  {t("finance.invoices.title")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/finance/service-income">
                  <Coins className="h-4 w-4" />
                  {t("finance.serviceIncome.title")}
                </Link>
              </DropdownMenuItem>
              {canCreateManualInvoice ? (
                <DropdownMenuItem asChild>
                  <Link to="/finance/manual-invoice">
                    <PageEdit className="h-4 w-4" />
                    {t("finance.manualInvoice.title")}
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>

      {canSeeFinanceCards ? (
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
                    "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                    loadingCards && "opacity-60",
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
                  {canSeeStudentReceivable ? (
                    <SummaryCard
                      label={t("fin.cards.receivable")}
                      value={summary.student_receivable ?? 0}
                      hint={t("fin.hints.receivable")}
                      icon={<Clock className="h-5 w-5" />}
                      tone="warning"
                      onClick={() =>
                        openBreakdown(
                          "student_receivable",
                          t("fin.cards.receivable"),
                          t("fin.hints.receivable"),
                        )
                      }
                    />
                  ) : null}
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
                        t("fin.hints.writtenOff"),
                      )
                    }
                  />
                  {canSeeMofReceivable ? (
                    <SummaryCard
                      label={t("fin.cards.mof")}
                      value={summary.mof_receivable}
                      hint={t("finance.hints.mof")}
                      icon={<Bank className="h-5 w-5" />}
                      tone="auxiliary"
                      onClick={() => openBreakdown("mof", t("fin.cards.mof"), t("finance.hints.mof"))}
                    />
                  ) : null}
                  {canSeeOtherReceivable ? (
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
                  ) : null}
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
                        openBreakdown(
                          "cancelled",
                          t("fin.cards.cancelled"),
                          t("fin.hints.cancelled"),
                        )
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
                    "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
                    loadingCards && "opacity-60",
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
                  {canSeeServiceIncome ? (
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
                          t("fin.hints.serviceIncome"),
                        )
                      }
                    />
                  ) : null}
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
                        t("fin.hints.serviceCost"),
                      )
                    }
                  />
                </div>
              </section>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
                loadingCards && "opacity-60",
              )}
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
              {canSeeServiceIncome ? (
                <SummaryCard
                  label={t("finance.netServiceIncome")}
                  value={summary.service_income ?? 0}
                  hint={t("finance.hints.serviceIncome")}
                  icon={<Coins className="h-5 w-5" />}
                  tone="success"
                />
              ) : null}
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
      ) : null}

      {module === "class" ? (
        <ClassReportList
          filters={filters}
          period={periodState}
          onPeriodChange={setPeriodState}
          scope={scope}
          onScopeChange={setScope}
          module={module}
          onModuleChange={setModule}
          onOpenDetails={openClassDetails}
        />
      ) : (
        <CourseReportList
          period={periodState}
          onPeriodChange={setPeriodState}
          module={module}
          onModuleChange={setModule}
          onOpenDetails={openCourseDetails}
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

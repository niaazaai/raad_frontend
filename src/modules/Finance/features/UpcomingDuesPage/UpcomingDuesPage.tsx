import { useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Phone, Wallet } from "iconoir-react";
import { AlertTriangle, CalendarClock, CalendarDays, CalendarOff, ListFilter } from "lucide-react";
import {
  DataTable,
  PageBreadcrumb,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import { formatMoney, openPdf } from "../../components/financeFormat";
import type {
  DuesBucket,
  FinanceClassRow,
  UpcomingInstallmentRow,
} from "../../data/models/FinanceReport";
import { extractDuesMeta, extractDuesRows, useFinanceDues } from "../../hooks/useFinanceDues";
import FinanceDetailsDrawer from "../FinanceReportPage/FinanceDetailsDrawer";

const BUCKETS: DuesBucket[] = ["overdue", "week", "upcoming", "all", "no_date"];

const BUCKET_THEMES: Record<
  DuesBucket,
  { icon: ComponentType<{ className?: string }>; tone: string }
> = {
  overdue: { icon: AlertTriangle, tone: "bg-danger/15 text-danger" },
  week: { icon: CalendarClock, tone: "bg-warning/15 text-warning" },
  upcoming: { icon: CalendarDays, tone: "bg-info/15 text-info" },
  all: { icon: ListFilter, tone: "bg-primary/15 text-primary" },
  no_date: { icon: CalendarOff, tone: "bg-muted text-muted-foreground" },
};

/**
 * Dues & follow-up. A due stays listed until it is paid (or classified / written off / cancelled):
 * overdue instalments are never hidden, oldest first.
 */
const UpcomingDuesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [bucket, setBucket] = useState<DuesBucket>("overdue");
  const [account, setAccount] = useState<(Partial<FinanceClassRow> & { id: number }) | null>(null);
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "next_due_date",
    defaultSortDir: "asc",
    searchDebounceMs: 350,
  });

  const { data, isLoading } = useFinanceDues({
    bucket,
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
  });
  const rows = extractDuesRows(data);
  const { pagination, counts } = extractDuesMeta(data);
  const canReceive = hasAnyPermission([
    "course.class_students.payment",
    "course.class_students.update",
  ]);

  const receiveLink = (row: UpcomingInstallmentRow) =>
    `/finance/receive-payment?student=${row.student_id ?? ""}&enrollment=${row.id}`;

  const config: DataTableConfig<UpcomingInstallmentRow> = useMemo(
    () => ({
      columns: [
        {
          key: "next_due_date",
          header: t("fin.columns.dueDate"),
          render: (row) => (
            <div className="whitespace-nowrap">
              <div className="font-medium tabular-nums">{row.next_due_date || "—"}</div>
              {row.is_overdue ? (
                <span className="mt-1 inline-flex rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                  {row.days_overdue} {t("fin.dues.daysOverdue")}
                </span>
              ) : row.next_due_date ? (
                <span className="mt-1 inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  {daysUntil(row.next_due_date) === 0
                    ? t("fin.dues.dueToday")
                    : `${t("fin.dues.dueIn")} ${daysUntil(row.next_due_date)} ${t("fin.dues.days")}`}
                </span>
              ) : null}
            </div>
          ),
          exportValue: (row) => row.next_due_date,
        },
        {
          key: "student_name",
          header: t("finance.columns.name"),
          render: (row) => (
            <div>
              <div className="font-medium">{row.student_name || "—"}</div>
              <div className="text-xs text-muted-foreground">
                {row.student_code ? <span className="font-mono">{row.student_code}</span> : null}
                {row.father_name ? <span> · {row.father_name}</span> : null}
              </div>
            </div>
          ),
          exportValue: (row) => row.student_name,
        },
        {
          key: "phone_number",
          header: t("finance.details.phone"),
          render: (row) =>
            row.phone_number ? (
              <a
                href={`tel:${row.phone_number}`}
                dir="ltr"
                className="inline-flex items-center gap-1.5 whitespace-nowrap text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3.5 w-3.5" />
                {row.phone_number}
              </a>
            ) : (
              "—"
            ),
          exportValue: (row) => row.phone_number,
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
          key: "balance_due",
          header: t("fin.columns.balanceDue"),
          align: "right",
          render: (row) => (
            <span className="font-semibold tabular-nums text-warning">
              {formatMoney(row.balance_due, row.currency)}
            </span>
          ),
          exportValue: (row) => row.balance_due,
        },
        {
          key: "paid_amount",
          header: t("fin.columns.totalPaid"),
          align: "right",
          render: (row) => formatMoney(row.paid_amount),
          exportValue: (row) => row.paid_amount,
        },
        {
          key: "last_payment_date",
          header: t("fin.columns.lastPayment"),
          render: (row) => row.last_payment_date || "—",
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
      searchPlaceholder: t("fin.dues.search"),
      filtersEnabled: false,
      paginationEnabled: true,
      emptyMessage: t("fin.dues.empty"),
      exportFilename: "finance-dues",
      onRowDoubleClick: (row) =>
        setAccount({
          id: row.id,
          class_id: row.class_id ?? undefined,
          student_id: row.student_id ?? undefined,
          student_name: row.student_name,
          student_code: row.student_code,
          class_name: row.class_name,
          class_code: row.class_code,
          payment_status: row.payment_status,
        }),
      actions: [
        ...(canReceive
          ? [
              {
                key: "receive",
                label: t("fin.dues.receive"),
                icon: <Wallet className="h-4 w-4" />,
                onClick: (row: UpcomingInstallmentRow) => navigate(receiveLink(row)),
              },
            ]
          : []),
        {
          key: "invoice",
          label: t("finance.invoices.print"),
          icon: <Page className="h-4 w-4" />,
          onClick: (row: UpcomingInstallmentRow) => openPdf(row.pdf_url),
          hidden: (row: UpcomingInstallmentRow) => !row.pdf_url,
        },
      ],
    }),
    [t, canReceive, navigate]
  );

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("fin.dues.title")}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("fin.dues.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("fin.dues.title") },
              ]}
            />
          </div>
        </div>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BUCKETS.map((value) => {
            const active = bucket === value;
            const count = counts?.[value];
            const { icon: Icon, tone } = BUCKET_THEMES[value];
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setBucket(value);
                      updateParams({ page: 1 });
                    }}
                    className={cn(
                      "relative rounded-xl border p-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                    aria-pressed={active}
                  >
                    <span className={cn("absolute end-3 top-3 rounded-lg p-2", tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="pe-11 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(`fin.dues.tabs.${value}`)}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-2xl font-bold tabular-nums",
                        value === "overdue" && (count ?? 0) > 0
                          ? "text-danger"
                          : active
                            ? "text-primary"
                            : "text-foreground"
                      )}
                    >
                      {count ?? "—"}
                    </p>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {t(`fin.dues.tips.${value}`)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination ?? null}
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

function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const due = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((due - today) / 86_400_000));
}

export default UpcomingDuesPage;

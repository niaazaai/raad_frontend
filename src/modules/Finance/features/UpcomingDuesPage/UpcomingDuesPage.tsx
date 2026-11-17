import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  ListFilter,
  Phone,
  Printer,
  Wallet,
} from "lucide-react";
import {
  PageBreadcrumb,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { ServerDataTable, actionsColumn, useDataTable } from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { apiFetch, type ListEnvelope } from "@/api/client";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import { formatMoney, openPdf } from "../../components/financeFormat";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../../data/constants/endpoints";
import type {
  DuesBucket,
  DuesCounts,
  FinanceClassRow,
  UpcomingInstallmentRow,
} from "../../data/models/FinanceReport";
import FinanceDetailsDrawer from "../FinanceReportPage/FinanceDetailsDrawer";

const READ = "finance.dues.read";
const BUCKETS: DuesBucket[] = ["overdue", "week", "upcoming", "all", "no_date"];

const BUCKET_THEMES: Record<
  DuesBucket,
  { icon: ComponentType<{ className?: string }>; iconTone: string; value: string; border: string; wash: string }
> = {
  overdue: {
    icon: AlertTriangle,
    iconTone: "bg-danger/15 text-danger",
    value: "text-danger",
    border: "border-danger/25",
    wash: "from-danger/10 via-card to-card",
  },
  week: {
    icon: CalendarClock,
    iconTone: "bg-warning/15 text-warning",
    value: "text-warning",
    border: "border-warning/25",
    wash: "from-warning/10 via-card to-card",
  },
  upcoming: {
    icon: CalendarDays,
    iconTone: "bg-info/15 text-info",
    value: "text-info",
    border: "border-info/25",
    wash: "from-info/10 via-card to-card",
  },
  all: {
    icon: ListFilter,
    iconTone: "bg-primary/15 text-primary",
    value: "text-primary",
    border: "border-primary/25",
    wash: "from-primary/10 via-card to-card",
  },
  no_date: {
    icon: CalendarOff,
    iconTone: "bg-muted text-muted-foreground",
    value: "text-foreground",
    border: "border-border",
    wash: "from-muted/40 via-card to-card",
  },
};

function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const due = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((due - today) / 86_400_000));
}

const UpcomingDuesPage = () => {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [bucket, setBucket] = useState<DuesBucket>("overdue");
  const [account, setAccount] = useState<(Partial<FinanceClassRow> & { id: number }) | null>(null);
  const canReceive = hasAnyPermission([
    "course.class_students.payment",
    "course.class_students.update",
  ]);
  const receivePermission = hasPermission("course.class_students.payment")
    ? "course.class_students.payment"
    : "course.class_students.update";

  const openAccount = (row: UpcomingInstallmentRow) =>
    setAccount({
      id: row.id,
      class_id: row.class_id ?? undefined,
      student_id: row.student_id ?? undefined,
      student_name: row.student_name,
      student_code: row.student_code,
      class_name: row.class_name,
      class_code: row.class_code,
      payment_status: row.payment_status,
    });

  const columns = useMemo<ColumnDef<UpcomingInstallmentRow, unknown>[]>(() => {
    const dueLabel = t("fin.columns.dueDate");
    const nameLabel = t("finance.columns.name");
    const phoneLabel = t("finance.details.phone");
    const classLabel = t("finance.columns.class");
    const balanceLabel = t("fin.columns.balanceDue");
    const paidLabel = t("fin.columns.totalPaid");
    const lastLabel = t("fin.columns.lastPayment");
    const statusLabel = t("finance.columns.paymentStatus");
    const receiveLabel = t("fin.dues.receive");
    const printLabel = t("finance.invoices.print");

    return [
      {
        id: "next_due_date",
        header: dueLabel,
        meta: {
          priority: 1,
          sortKey: "next_due_date",
          shortLabel: dueLabel,
          plainText: (row) => (row as UpcomingInstallmentRow).next_due_date ?? "",
        },
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <bdi dir="ltr" className="font-medium tabular-nums">
              {row.original.next_due_date || "—"}
            </bdi>
            {row.original.is_overdue ? (
              <span className="mt-1 inline-flex rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                {row.original.days_overdue ?? 0} {t("fin.dues.daysOverdue")}
              </span>
            ) : row.original.next_due_date ? (
              <span className="mt-1 inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                {daysUntil(row.original.next_due_date) === 0
                  ? t("fin.dues.dueToday")
                  : `${t("fin.dues.dueIn")} ${daysUntil(row.original.next_due_date)} ${t("fin.dues.days")}`}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "student_name",
        header: nameLabel,
        meta: {
          priority: 1,
          shortLabel: nameLabel,
          plainText: (row) => {
            const value = row as UpcomingInstallmentRow;
            return [value.student_name, value.student_code, value.father_name].filter(Boolean).join(" ");
          },
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.student_name || "—"}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.student_code ? (
                <bdi dir="ltr" className="font-mono">{row.original.student_code}</bdi>
              ) : null}
              {row.original.father_name ? <span> · {row.original.father_name}</span> : null}
            </div>
          </div>
        ),
      },
      {
        id: "balance_due",
        header: balanceLabel,
        meta: {
          priority: 1,
          shortLabel: balanceLabel,
          plainText: (row) => {
            const value = row as UpcomingInstallmentRow;
            return String(value.balance_due ?? "");
          },
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-semibold tabular-nums text-warning">
            {formatMoney(row.original.balance_due, row.original.currency)}
          </bdi>
        ),
      },
      {
        id: "phone_number",
        header: phoneLabel,
        meta: {
          priority: 2,
          shortLabel: phoneLabel,
          plainText: (row) => (row as UpcomingInstallmentRow).phone_number ?? "",
        },
        cell: ({ row }) =>
          row.original.phone_number ? (
            <a
              href={`tel:${row.original.phone_number}`}
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              <Phone className="size-3.5" aria-hidden="true" />
              <bdi dir="ltr">{row.original.phone_number}</bdi>
            </a>
          ) : (
            "—"
          ),
      },
      {
        id: "class_name",
        header: classLabel,
        meta: {
          priority: 2,
          shortLabel: classLabel,
          plainText: (row) => {
            const value = row as UpcomingInstallmentRow;
            return [value.class_name, value.class_code].filter(Boolean).join(" ");
          },
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate">{row.original.class_name || "—"}</div>
            {row.original.class_code ? (
              <bdi dir="ltr" className="font-mono text-xs text-muted-foreground">
                {row.original.class_code}
              </bdi>
            ) : null}
          </div>
        ),
      },
      {
        id: "paid_amount",
        header: paidLabel,
        meta: {
          priority: 2,
          shortLabel: paidLabel,
          plainText: (row) => String((row as UpcomingInstallmentRow).paid_amount ?? ""),
        },
        cell: ({ row }) => (
          <bdi dir="ltr" className="tabular-nums">{formatMoney(row.original.paid_amount)}</bdi>
        ),
      },
      {
        id: "last_payment_date",
        header: lastLabel,
        meta: {
          priority: 3,
          shortLabel: lastLabel,
          plainText: (row) => (row as UpcomingInstallmentRow).last_payment_date ?? "",
        },
        cell: ({ row }) => (
          <bdi dir="ltr">{row.original.last_payment_date || "—"}</bdi>
        ),
      },
      {
        id: "payment_status",
        header: statusLabel,
        meta: {
          priority: 2,
          shortLabel: statusLabel,
          plainText: (row) => {
            const value = row as UpcomingInstallmentRow;
            return value.payment_status_label ?? value.payment_status ?? "";
          },
        },
        cell: ({ row }) => (
          <FinanceStatusBadge
            value={row.original.payment_status}
            fallbackLabel={row.original.payment_status_label}
          />
        ),
      },
      actionsColumn<UpcomingInstallmentRow>(
        gridT,
        () => [],
        true,
        undefined,
        (row) => {
          const actions = [];
          if (canReceive && row.student_id) {
            actions.push({
              id: "receive",
              label: receiveLabel,
              icon: <Wallet className="size-4" aria-hidden="true" />,
              permission: receivePermission,
              onSelect: () =>
                navigate(`/finance/receive-payment?student=${row.student_id ?? ""}&enrollment=${row.id}`),
            });
          }
          if (row.pdf_url) {
            actions.push({
              id: "print",
              label: printLabel,
              icon: <Printer className="size-4" aria-hidden="true" />,
              permission: READ,
              onSelect: () => openPdf(row.pdf_url),
            });
          }
          return actions;
        },
      ),
    ];
  }, [t, gridT, canReceive, receivePermission, navigate]);

  const table = useDataTable<UpcomingInstallmentRow>({
    key: "finance.upcoming-dues",
    queryKey: (query) => [...FINANCE_QUERY_KEYS.dues, query],
    endpoint: FINANCE_ENDPOINTS.DUES,
    columns,
    search: true,
    select: "multi",
    exports: ["print"],
    readPermission: READ,
    exportTitle: t("fin.dues.title"),
    params: { bucket },
    syncUrl: true,
    defaultSort: "next_due_date",
    defaultPerPage: 25,
    getRowId: (row) => String(row.id),
  });

  const countsQuery = useQuery({
    queryKey: [...FINANCE_QUERY_KEYS.dues, table.controls.query, `bucket=${bucket}`],
    queryFn: () =>
      apiFetch<ListEnvelope<UpcomingInstallmentRow> & { meta: { counts?: DuesCounts } }>(
        `${FINANCE_ENDPOINTS.DUES}${table.queryString}`,
      ),
  });
  const counts = countsQuery.data?.meta.counts;

  if (!hasPermission(READ)) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("fin.dues.title")}</h1>
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

      <TooltipProvider delayDuration={150}>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BUCKETS.map((value) => {
            const active = bucket === value;
            const theme = BUCKET_THEMES[value];
            const Icon = theme.icon;
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setBucket(value)}
                    aria-pressed={active}
                    className={cn(
                      "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-start outline-none transition",
                      "focus-visible:ring-2 focus-visible:ring-ring",
                      theme.border,
                      theme.wash,
                      active ? "ring-2 ring-primary/40" : "hover:shadow-sm",
                    )}
                  >
                    <span className={cn("absolute end-3 top-3 rounded-xl p-2", theme.iconTone)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="pe-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(`fin.dues.tabs.${value}`)}
                    </p>
                    <p className={cn("mt-2 text-2xl font-bold tabular-nums tracking-tight", theme.value)}>
                      <bdi dir="ltr">{counts?.[value] ?? "—"}</bdi>
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

      <ServerDataTable
        api={table}
        entityLabel={t("fin.dues.title")}
        searchPlaceholder={t("fin.dues.search")}
        emptyTitle={t("fin.dues.empty")}
        emptyBody={t("fin.dues.subtitle")}
        narrowed={bucket !== "all"}
        onRowDoubleClick={openAccount}
        stickyHeader
        toolsInHeader
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

export default UpcomingDuesPage;

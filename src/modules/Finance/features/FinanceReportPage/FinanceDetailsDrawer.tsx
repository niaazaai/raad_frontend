import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Book,
  Calendar,
  CoinsSwap,
  Hat,
  Page,
  Repeat,
  User,
  Wallet,
} from "iconoir-react";
import {
  Button,
  Card,
  CardContent,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import FinanceStatusBadge from "../../components/FinanceStatusBadge";
import MoneyWaterfall from "../../components/MoneyWaterfall";
import MoveEnrollmentDrawer, { type MoveSubject } from "../../components/MoveEnrollmentDrawer";
import { formatMoney, openPdf, toNumber } from "../../components/financeFormat";
import {
  extractEnrollmentAccount,
  extractMoves,
  useEnrollmentAccount,
  useEnrollmentMoves,
} from "../../hooks/useEnrollmentActions";
import {
  extractEnrollmentTransactions,
  useEnrollmentTransactions,
} from "../../hooks/useEnrollmentTransactions";
import type {
  FinanceClassRow,
  FinanceCourseRow,
  FinanceModule,
  FinanceTransaction,
} from "../../data/models/FinanceReport";

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

interface DetailFieldProps {
  label: string;
  value: ReactNode;
}

const DetailField = ({ label, value }: DetailFieldProps) => (
  <div className="min-w-0 space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="break-words text-sm font-medium text-foreground">{value}</div>
  </div>
);

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const SectionCard = ({ icon, title, children }: SectionCardProps) => (
  <Card className="h-full shadow-none">
    <CardContent className="space-y-5 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </CardContent>
  </Card>
);

const SectionTitle = ({
  icon,
  title,
  extra,
}: {
  icon: ReactNode;
  title: string;
  extra?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </span>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {extra}
  </div>
);

interface FinanceDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  module: FinanceModule;
  /** Any row with at least an enrollment id; the full account is loaded fresh. */
  classRow?: (Partial<FinanceClassRow> & { id: number }) | null;
  courseRow?: FinanceCourseRow | null;
}

const FinanceDetailsDrawer = ({
  open,
  onClose,
  module,
  classRow: initialRow,
  courseRow,
}: FinanceDetailsDrawerProps) => {
  const { t } = useTranslation();
  const { hasAnyPermission } = useAuth();
  const [moveSubject, setMoveSubject] = useState<MoveSubject | null>(null);
  const isClass = module === "class" && initialRow != null;
  const enrollmentId = isClass && open ? initialRow.id : null;

  const accountQuery = useEnrollmentAccount(enrollmentId);
  const fresh = extractEnrollmentAccount(accountQuery.data);
  const classRow: Partial<FinanceClassRow> | null = isClass
    ? { ...initialRow, ...(fresh ?? {}) }
    : null;

  const transactionsQuery = useEnrollmentTransactions(enrollmentId);
  const transactions = extractEnrollmentTransactions(transactionsQuery.data);
  const movesQuery = useEnrollmentMoves(classRow?.class_id, enrollmentId);
  const moves = extractMoves(movesQuery.data);

  const canPay = hasAnyPermission([
    "course.class_students.payment",
    "course.class_students.update",
  ]);
  const canMove = hasAnyPermission(["course.class_students.update"]);

  const studentName = isClass ? classRow?.student_name : courseRow?.student_name;
  const subjectName = isClass ? classRow?.class_name : courseRow?.course_title;
  const instructorName = isClass ? classRow?.teacher_name : courseRow?.instructor_name;
  const currency = classRow?.currency ?? "AFN";
  const isMoved =
    Boolean(classRow?.moved_to_class_student_id) || classRow?.payment_status === "moved";
  const receivable = toNumber(classRow?.net_receivable);
  const writtenOff = toNumber(classRow?.irrecoverable_debt);
  const receiveLink =
    classRow?.id && classRow?.student_id
      ? `/finance/receive-payment?student=${classRow.student_id}&enrollment=${classRow.id}`
      : "/finance/receive-payment";

  const openMove = () => {
    if (!classRow?.id || !classRow.class_id) return;
    const payments = toNumber(classRow.paid_amount) + toNumber(classRow.refund_amount);
    setMoveSubject({
      id: classRow.id,
      classId: classRow.class_id,
      studentName: classRow.student_name || "—",
      className: classRow.class_name,
      classCode: classRow.class_code,
      classFee: toNumber(classRow.fees_amount),
      discountPercent: toNumber(classRow.discount_percent),
      discountValue: toNumber(classRow.discount_amount),
      payments,
      paid: toNumber(classRow.paid_amount),
      writtenOff,
      cancelled: toNumber(classRow.cancelled_amount),
      currency,
    });
  };

  return (
    <>
      <Drawer open={open} onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent side="right" className="w-full min-w-0 max-w-none sm:w-[85vw] xl:w-[72vw]">
          <DrawerHeader>
            <div className="space-y-1.5 pe-4">
              <div className="flex flex-wrap items-center gap-3">
                <DrawerTitle>{t("finance.details.title")}</DrawerTitle>
                {isClass ? (
                  <FinanceStatusBadge
                    value={classRow?.payment_status}
                    fallbackLabel={classRow?.payment_status_label}
                  />
                ) : (
                  <FinanceStatusBadge
                    value={courseRow?.payment_status}
                    fallbackLabel={courseRow?.payment_status_label}
                  />
                )}
                {accountQuery.isFetching ? (
                  <span className="text-xs text-primary">{t("fin.updating")}</span>
                ) : null}
              </div>
              <DrawerDescription>
                {isClass ? t("finance.details.subtitleClass") : t("finance.details.subtitleCourse")}
              </DrawerDescription>
              {studentName || subjectName ? (
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{studentName || "—"}</span>
                  {subjectName ? (
                    <span className="text-muted-foreground"> · {subjectName}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </DrawerHeader>

          <DrawerBody className="space-y-8 px-4 py-6 sm:px-8">
            {isClass ? (
              isMoved ? (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  {t("fin.receive.movedNotice")}
                </div>
              ) : canPay || canMove ? (
                <div className="flex flex-wrap gap-2">
                  {canPay ? (
                    <Button type="button" size="sm" asChild>
                      <Link to={receiveLink}>
                        <Wallet className="h-4 w-4" />
                        {t("fin.details.receivePayment")}
                      </Link>
                    </Button>
                  ) : null}
                  {canPay && writtenOff > 0 ? (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link to={`${receiveLink}&mode=recover`}>
                        <CoinsSwap className="h-4 w-4" />
                        {t("fin.details.recoverDebt")}
                      </Link>
                    </Button>
                  ) : null}
                  {canMove ? (
                    <Button type="button" size="sm" variant="outline" onClick={openMove}>
                      <Repeat className="h-4 w-4" />
                      {t("fin.details.move")}
                    </Button>
                  ) : null}
                  {classRow?.class_id ? (
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <Link to={`/classes/${classRow.class_id}/students`}>
                        {classRow.class_code || classRow.class_name}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null
            ) : null}

            <section className="grid gap-4 lg:grid-cols-3">
              <SectionCard icon={<User className="h-4 w-4" />} title={t("finance.details.student")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label={t("finance.details.student")} value={display(studentName)} />
                  {isClass ? (
                    <>
                      <DetailField
                        label={t("finance.details.studentCode")}
                        value={display(classRow?.student_code)}
                      />
                      <DetailField
                        label={t("finance.details.fatherName")}
                        value={display(classRow?.father_name)}
                      />
                      <DetailField
                        label={t("finance.details.phone")}
                        value={
                          classRow?.phone_number ? (
                            <a
                              className="text-primary hover:underline"
                              href={`tel:${classRow.phone_number}`}
                              dir="ltr"
                            >
                              {classRow.phone_number}
                            </a>
                          ) : (
                            "—"
                          )
                        }
                      />
                      <DetailField
                        label={t("finance.details.nationalId")}
                        value={display(classRow?.national_id)}
                      />
                      <DetailField
                        label={t("finance.details.email")}
                        value={display(classRow?.email)}
                      />
                    </>
                  ) : (
                    <DetailField
                      label={t("finance.details.email")}
                      value={display(courseRow?.student_email)}
                    />
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={<Book className="h-4 w-4" />}
                title={isClass ? t("finance.details.class") : t("finance.details.course")}
              >
                {isClass ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailField
                      label={t("finance.details.class")}
                      value={display(classRow?.class_name)}
                    />
                    <DetailField
                      label={t("finance.details.classCode")}
                      value={display(classRow?.class_code)}
                    />
                    <DetailField
                      label={t("finance.details.classDates")}
                      value={
                        classRow?.starting_date || classRow?.ending_date
                          ? `${classRow?.starting_date || "—"} – ${classRow?.ending_date || "—"}`
                          : "—"
                      }
                    />
                    <DetailField
                      label={t("finance.details.schedule")}
                      value={display(classRow?.schedule_days_label)}
                    />
                    <DetailField
                      label={t("finance.details.timing")}
                      value={display(classRow?.timing)}
                    />
                    <DetailField
                      label={t("finance.columns.classStatus")}
                      value={display(classRow?.class_status_label || classRow?.class_status)}
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailField
                      label={t("finance.details.course")}
                      value={display(courseRow?.course_title)}
                    />
                    <DetailField
                      label={t("finance.details.plan")}
                      value={display(courseRow?.plan_name)}
                    />
                    <DetailField
                      label={t("finance.details.subscriptionId")}
                      value={display(courseRow?.subscription_public_id)}
                    />
                    <DetailField
                      label={t("finance.details.subscriptionPeriod")}
                      value={
                        courseRow?.subscription_start_date || courseRow?.subscription_end_date
                          ? `${courseRow?.subscription_start_date || "—"} – ${courseRow?.subscription_end_date || "—"}`
                          : "—"
                      }
                    />
                    <DetailField
                      label={t("finance.columns.subscriptionStatus")}
                      value={display(
                        courseRow?.subscription_status_label || courseRow?.subscription_status
                      )}
                    />
                    <DetailField
                      label={t("finance.details.purchaseDate")}
                      value={display(courseRow?.purchase_date)}
                    />
                  </div>
                )}
              </SectionCard>

              <SectionCard
                icon={<Hat className="h-4 w-4" />}
                title={t("finance.details.instructor")}
              >
                <div className="grid gap-4">
                  <DetailField
                    label={t("finance.details.instructor")}
                    value={display(instructorName)}
                  />
                  {isClass ? (
                    <>
                      <DetailField
                        label={t("finance.details.enrollmentDate")}
                        value={display(classRow?.enrollment_date)}
                      />
                      <DetailField
                        label={t("fin.columns.feeDate")}
                        value={display(classRow?.fee_date)}
                      />
                    </>
                  ) : (
                    <DetailField
                      label={t("finance.details.planDuration")}
                      value={
                        courseRow?.plan_duration_days
                          ? `${courseRow.plan_duration_days} ${t("finance.details.days")}`
                          : "—"
                      }
                    />
                  )}
                </div>
              </SectionCard>
            </section>

            <section className="space-y-4">
              <SectionTitle
                icon={<Wallet className="h-4 w-4" />}
                title={t("fin.details.waterfall")}
              />
              {isClass && classRow ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <MoneyWaterfall
                    currency={currency}
                    values={{
                      gross: classRow.fees_amount,
                      discount: classRow.discount_amount,
                      net: classRow.net_amount,
                      paid: classRow.paid_amount,
                      refunds: classRow.refund_amount,
                      cancelled: classRow.cancelled_amount,
                      writtenOff: classRow.irrecoverable_debt,
                      receivable: classRow.net_receivable,
                      mof: classRow.mof_receivable_amount,
                      other: classRow.other_receivable_amount,
                      credit: classRow.credit_amount,
                    }}
                  />
                  <div className="grid content-start gap-3 sm:grid-cols-2">
                    <FactTile
                      label={t("finance.columns.discountPercent")}
                      value={
                        toNumber(classRow.discount_percent) > 0
                          ? `${toNumber(classRow.discount_percent)}%`
                          : "—"
                      }
                    />
                    <FactTile
                      label={t("fin.columns.lastPayment")}
                      value={display(classRow.payment_date)}
                    />
                    <FactTile
                      label={t("fin.columns.dueDate")}
                      value={receivable > 0 ? display(classRow.next_installment_date) : "—"}
                    />
                    <FactTile
                      label={t("finance.columns.other")}
                      value={classRow.other_party_name ? `${classRow.other_party_name}` : "—"}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FactTile
                    label={t("finance.columns.amount")}
                    value={formatMoney(courseRow?.amount)}
                  />
                  <FactTile
                    label={t("finance.columns.paymentStatus")}
                    value={courseRow?.payment_status_label || courseRow?.payment_status || "—"}
                  />
                  <FactTile
                    label={t("finance.columns.purchaseDate")}
                    value={display(courseRow?.purchase_date)}
                  />
                </div>
              )}
            </section>

            {isClass ? (
              <section className="space-y-4">
                <SectionTitle
                  icon={<Calendar className="h-4 w-4" />}
                  title={t("finance.details.transactions")}
                />
                <Card className="shadow-none">
                  <CardContent className="p-0">
                    {transactionsQuery.isLoading ? (
                      <div className="space-y-3 px-5 py-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between gap-3">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-36" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                        {t("finance.details.noTransactions")}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                          <thead>
                            <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="px-5 py-3 text-start font-medium">
                                {t("fin.columns.transactionDate")}
                              </th>
                              <th className="px-5 py-3 text-start font-medium">
                                {t("finance.details.type")}
                              </th>
                              <th className="px-5 py-3 text-end font-medium">
                                {t("finance.details.amount")}
                              </th>
                              <th className="px-5 py-3 text-start font-medium">
                                {t("fin.payer.label")}
                              </th>
                              <th className="px-5 py-3 text-start font-medium">
                                {t("finance.columns.nextInstallment")}
                              </th>
                              <th className="px-5 py-3 text-start font-medium">
                                {t("finance.details.invoice")}
                              </th>
                              <th className="px-5 py-3 text-start font-medium">
                                {t("finance.details.notes")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <TransactionRow
                                key={tx.id}
                                transaction={tx}
                                noInvoiceLabel={t("finance.details.noInvoice")}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            ) : null}

            {isClass ? (
              <section className="space-y-4">
                <SectionTitle
                  icon={<Repeat className="h-4 w-4" />}
                  title={t("fin.details.moves")}
                />
                {moves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("fin.details.noMoves")}</p>
                ) : (
                  <div className="space-y-2">
                    {moves.map((move) => (
                      <div
                        key={move.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border p-3 text-sm"
                      >
                        <span className="font-medium tabular-nums">{move.move_date}</span>
                        <span>
                          <span className="font-mono">{move.from_class_code}</span>
                          <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
                          <span className="font-mono">{move.to_class_code}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {t("fin.details.oldFee")}: {formatMoney(move.old_class_fee)} ·{" "}
                          {t("fin.details.newFee")}: {formatMoney(move.new_class_fee)}
                        </span>
                        <span className="text-muted-foreground">
                          {move.moved_transaction_count} {t("fin.details.transactionsMoved")}
                        </span>
                        {move.created_by_name ? (
                          <span className="text-muted-foreground">
                            {t("fin.details.by")} {move.created_by_name}
                          </span>
                        ) : null}
                        {move.reason ? (
                          <span className="basis-full text-muted-foreground">{move.reason}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <MoveEnrollmentDrawer
        subject={moveSubject}
        onClose={() => setMoveSubject(null)}
        onMoved={() => onClose()}
      />
    </>
  );
};

const FactTile = ({ label, value }: { label: string; value: string }) => (
  <Card className="shadow-none">
    <CardContent className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 break-words text-base font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </CardContent>
  </Card>
);

const TransactionRow = ({
  transaction,
  noInvoiceLabel,
}: {
  transaction: FinanceTransaction;
  noInvoiceLabel: string;
}) => {
  const invoice = transaction.invoice;
  const isClassification =
    transaction.type === "mof_receivable" || transaction.type === "other_receivable";
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-foreground">
        {display(transaction.transaction_date)}
      </td>
      <td className="px-5 py-3.5">
        <FinanceStatusBadge
          kind="type"
          value={transaction.is_recovery ? "recovery" : transaction.type}
          fallbackLabel={transaction.type_label}
        />
      </td>
      <td
        className={`px-5 py-3.5 text-end font-medium tabular-nums ${isClassification ? "text-muted-foreground" : "text-foreground"}`}
      >
        {formatMoney(transaction.amount, transaction.currency)}
      </td>
      <td className="px-5 py-3.5 text-foreground">{display(transaction.payer_label)}</td>
      <td className="px-5 py-3.5 text-foreground">{display(transaction.next_installment_date)}</td>
      <td className="px-5 py-3.5">
        {invoice?.pdf_url ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openPdf(invoice.pdf_url)}
          >
            <Page className="h-4 w-4" />
            <span className="font-mono text-xs">{invoice.invoice_number}</span>
          </Button>
        ) : (
          <span className="text-muted-foreground">{noInvoiceLabel}</span>
        )}
      </td>
      <td
        className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground"
        title={transaction.notes ?? undefined}
      >
        {display(transaction.notes)}
      </td>
    </tr>
  );
};

export default FinanceDetailsDrawer;

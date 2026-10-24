import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  Input,
  Label,
  SearchableSelect,
  useConfirmDialog,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  getCourseListFromResponse,
  useCourseEntityList,
} from "@/modules/Course/hooks/useCourseEntity";
import { useMoveClassStudent } from "../hooks/useEnrollmentActions";
import { formatMoney, localIsoDate, toNumber } from "./financeFormat";

export interface MoveSubject {
  id: number;
  classId: number;
  studentName: string;
  className?: string | null;
  classCode?: string | null;
  classFee: number;
  /** Percentage discount (0–100) when the discount is a percentage. */
  discountPercent: number;
  /** Discount value in money (used as a fixed discount when there is no percentage). */
  discountValue: number;
  /** Payments received (before refunds). */
  payments: number;
  paid: number;
  writtenOff: number;
  cancelled: number;
  currency?: string | null;
}

interface MoveEnrollmentDrawerProps {
  subject: MoveSubject | null;
  onClose: () => void;
  onMoved?: (newEnrollmentId: number, newClassId: number) => void;
}

/** Move a student to another class; all money and invoices go with them (see EnrollmentMoveService). */
const MoveEnrollmentDrawer = ({ subject, onClose, onMoved }: MoveEnrollmentDrawerProps) => {
  const { t } = useTranslation();
  const { confirm } = useConfirmDialog();
  const [targetId, setTargetId] = useState("");
  const [moveDate, setMoveDate] = useState(localIsoDate());
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (subject) {
      setTargetId("");
      setMoveDate(localIsoDate());
      setReason("");
    }
  }, [subject]);

  const classesQuery = useCourseEntityList(
    "lms-classes",
    { per_page: 100, page: 1, sort_by: "created_at", sort_dir: "desc" },
    { enabled: subject != null }
  );
  const classes = getCourseListFromResponse(classesQuery.data);
  const options = useMemo(
    () =>
      classes
        .filter(
          (row) => Number(row.id) !== subject?.classId && String(row.status ?? "") !== "archived"
        )
        .map((row) => ({
          value: String(row.id),
          label: `${String(row.class_code ?? "")} · ${String(row.name ?? "")} — ${formatMoney(row.class_fee)} ${subject?.currency ?? "AFN"}`,
        })),
    [classes, subject?.classId, subject?.currency]
  );
  const target = classes.find((row) => String(row.id) === targetId);

  const move = useMoveClassStudent(subject?.classId ?? 0, subject?.id ?? 0);

  const newFee = toNumber(target?.class_fee);
  const newDiscount = subject
    ? subject.discountPercent > 0
      ? Math.round(newFee * Math.min(100, subject.discountPercent)) / 100
      : Math.min(newFee, subject.discountValue)
    : 0;
  const newNet = Math.max(0, newFee - newDiscount);
  const open = subject ? newNet - subject.payments - subject.cancelled - subject.writtenOff : 0;
  const newBalance = Math.max(0, Math.round(open * 100) / 100);
  const credit = Math.max(0, Math.round(-open * 100) / 100);

  const submit = async () => {
    if (!subject || !targetId) return;
    const ok = await confirm({
      title: t("fin.move.confirmTitle"),
      message: t("fin.move.confirmBody"),
      variant: "warning",
      confirmText: t("fin.move.submit"),
    });
    if (!ok) return;
    try {
      const response = await move.mutateAsync({
        target_class_id: Number(targetId),
        move_date: moveDate || undefined,
        reason: reason.trim() || undefined,
      });
      const enrollment = response.data?.enrollment;
      onClose();
      if (enrollment) onMoved?.(enrollment.id, enrollment.class_id);
    } catch {
      // error toast is shown by callApi
    }
  };

  const currency = subject?.currency ?? "AFN";

  return (
    <Drawer open={subject != null} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent side="right" className="w-full max-w-lg">
        <DrawerHeader>
          <div className="space-y-1 pe-4">
            <DrawerTitle>{t("fin.move.title")}</DrawerTitle>
            <DrawerDescription>{t("fin.move.subtitle")}</DrawerDescription>
          </div>
        </DrawerHeader>
        <DrawerBody className="space-y-5">
          {subject ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{subject.studentName}</p>
                  <p className="truncate text-muted-foreground">
                    {subject.classCode ? (
                      <span className="font-mono">{subject.classCode}</span>
                    ) : null}{" "}
                    {subject.className}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                <div className="min-w-0 flex-1 text-end">
                  <p className="truncate font-semibold">
                    {target ? String(target.class_code ?? "") : "—"}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {target ? String(target.name ?? "") : t("fin.move.pickClass")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("fin.move.targetClass")}</Label>
                <SearchableSelect
                  options={options}
                  value={targetId}
                  onChange={setTargetId}
                  placeholder={classesQuery.isLoading ? t("fin.loading") : t("fin.move.pickClass")}
                  searchPlaceholder={t("fin.move.searchClass")}
                  emptyMessage={t("fin.move.noClasses")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="move-date">{t("fin.move.moveDate")}</Label>
                  <Input
                    id="move-date"
                    type="date"
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="move-reason">{t("fin.move.reason")}</Label>
                  <Input
                    id="move-reason"
                    value={reason}
                    placeholder={t("fin.move.reasonPlaceholder")}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <p className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("fin.move.preview")}
                </p>
                {[
                  {
                    label: t("fin.move.paidSoFar"),
                    value: formatMoney(subject.paid, currency),
                    tone: "text-success",
                  },
                  { label: t("fin.move.oldFee"), value: formatMoney(subject.classFee, currency) },
                  {
                    label: t("fin.move.newFee"),
                    value: target ? formatMoney(newFee, currency) : "—",
                  },
                  {
                    label: t("fin.move.discount"),
                    value:
                      subject.discountPercent > 0
                        ? `${subject.discountPercent}%`
                        : formatMoney(subject.discountValue, currency),
                  },
                  {
                    label: credit > 0 ? t("fin.move.credit") : t("fin.move.newBalance"),
                    value: target ? formatMoney(credit > 0 ? credit : newBalance, currency) : "—",
                    tone: credit > 0 ? "text-info" : "text-warning",
                    strong: true,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-sm last:border-b-0",
                      row.strong && "bg-muted/30"
                    )}
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        row.strong ? "font-semibold" : "font-medium",
                        row.tone
                      )}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DrawerBody>
        <DrawerFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            loading={move.isPending}
            disabled={!targetId}
            onClick={() => void submit()}
          >
            {t("fin.move.submit")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MoveEnrollmentDrawer;

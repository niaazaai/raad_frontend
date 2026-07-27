import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, EditPencil, Plus, Prohibition, Trash, Wallet } from "iconoir-react";
import {
  Button,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
  PageBreadcrumb,
  SearchableMultiSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useConfirmDialog,
} from "@/components/ui";
import { Can, PermissionDeniedCard, useAuth } from "@/features/auth";
import { useConfirmPresets, useFormatMessage } from "@/i18n/useConfirmPresets";
import { useTranslation } from "@/i18n/useTranslation";
import { useDataTableParams } from "@/hooks";
import { cn } from "@/lib/utils";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import {
  useAttachClassStudent,
  useClassStudents,
  useDisableClassStudent,
  useRemoveClassStudent,
  useUpdateClassStudent,
  extractClassStudentsFromResponse,
  type ClassStudentRow,
} from "../../hooks/useClassStudents";
import {
  useCourseEntityDetail,
  getCourseEntityDetailFromResponse,
} from "../../hooks/useCourseEntity";
import { useCourseEntityList, getCourseListFromResponse } from "../../hooks/useCourseEntity";

function getPagination(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}

const GRADE_VALUES = ["A", "B", "C", "D", "F", "PENDING"] as const;
const DISCOUNT_TYPES = ["none", "percentage", "fixed"] as const;
const CURRENCIES = ["AFN", "USD", "GBP"] as const;

function PaymentStatusBadge({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const raw = String(value ?? "pending");
  const labels: Record<string, string> = {
    pending: t("course.paymentStatus.pending"),
    paid: t("course.paymentStatus.paid"),
    partial: t("course.paymentStatus.partial"),
  };
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {labels[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1)}
    </span>
  );
}

function CurrencyBadge({ value }: { value: unknown }) {
  const raw = String(value ?? "AFN");
  const colors: Record<string, string> = {
    AFN: "bg-success/10 text-success",
    USD: "bg-info/10 text-info",
    GBP: "bg-warning/10 text-warning",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {raw}
    </span>
  );
}

function formatMoney(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const ClassStudentsPage = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { confirm } = useConfirmDialog();
  const confirmPresets = useConfirmPresets();
  const { t } = useTranslation();

  const gradeOptions = useMemo(
    () =>
      GRADE_VALUES.map((value) => ({
        value,
        label: value === "PENDING" ? t("course.gradePending") : value,
      })),
    [t],
  );

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });

  const classDetailQuery = useCourseEntityDetail("lms-classes", classId > 0 ? classId : null);
  const classRow = getCourseEntityDetailFromResponse(classDetailQuery.data);
  const className = String(classRow?.name ?? "Class");
  const classCode = String(classRow?.class_code ?? "");
  const classFee = classRow?.class_fee != null ? Number(classRow.class_fee) : 0;

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  const { data, isLoading, error } = useClassStudents(classId, apiParams);
  const rows = extractClassStudentsFromResponse(data);
  const pagination = getPagination(data);

  const attachStudent = useAttachClassStudent(classId);
  const removeStudent = useRemoveClassStudent(classId);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [gradeModal, setGradeModal] = useState<ClassStudentRow | null>(null);
  const [disableModal, setDisableModal] = useState<ClassStudentRow | null>(null);
  const [paymentModal, setPaymentModal] = useState<ClassStudentRow | null>(null);

  const [gradeForm, setGradeForm] = useState({ grade: "PENDING", marks: "" });
  const [disableReason, setDisableReason] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    discount_type: "none",
    discount_amount: "",
    paid_amount: "",
    currency: "AFN",
  });

  const studentsListQuery = useCourseEntityList(
    addOpen ? "lms-class-students" : null,
    { per_page: 100, page: 1, status: "active" },
    { enabled: addOpen }
  );
  const availableStudents = getCourseListFromResponse(studentsListQuery.data);
  const studentOptions = availableStudents.map((s) => {
    const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "—";
    const code = String(s.student_code ?? s.id);
    const nationalId = String(s.national_id ?? "—");
    return {
      value: String(s.id),
      label: `${code} - ${name} : ${nationalId}`,
    };
  });

  const openGradeModal = (row: ClassStudentRow) => {
    setGradeForm({
      grade: String(row.grade ?? "PENDING"),
      marks: row.marks != null ? String(row.marks) : "",
    });
    setGradeModal(row);
  };

  const openPaymentModal = (row: ClassStudentRow) => {
    setPaymentForm({
      discount_type: String(row.discount_type ?? "none"),
      discount_amount: row.discount_amount != null ? String(row.discount_amount) : "0",
      paid_amount: row.paid_amount != null ? String(row.paid_amount) : "0",
      currency: String(row.currency ?? "AFN"),
    });
    setPaymentModal(row);
  };

  const handleAddStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    await attachStudent.mutateAsync({
      student_ids: selectedStudentIds.map((id) => Number(id)),
    });
    setAddOpen(false);
    setSelectedStudentIds([]);
  };

  const tableConfig: DataTableConfig<ClassStudentRow> = useMemo(
    () => ({
      columns: [
        {
          key: "student_code",
          header: t("course.columns.student_code"),
          render: (row) => (
            <span className="font-mono text-sm">{String(row.student_code ?? row.student_id)}</span>
          ),
        },
        {
          key: "full_name",
          header: t("course.columns.full_name"),
          render: (row) => (
            <div className="min-w-[8rem]">
              <div className="font-medium">
                {row.full_name || `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—"}
              </div>
              {row.phone_number ? (
                <div className="mt-0.5 text-xs text-muted-foreground">{row.phone_number}</div>
              ) : null}
            </div>
          ),
        },
        {
          key: "grade",
          header: t("course.columns.grade"),
          render: (row) => (
            <span>
              {row.grade ?? "—"}
              {row.marks != null ? ` (${row.marks})` : ""}
            </span>
          ),
        },
        {
          key: "class_fee",
          header: t("course.columns.class_fee"),
          render: (row) => (
            <span>
              {formatMoney(row.class_fee ?? classFee)}{" "}
              <CurrencyBadge value={row.currency ?? "AFN"} />
            </span>
          ),
        },
        {
          key: "payment_status",
          header: t("course.columns.payment_status"),
          render: (row) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <PaymentStatusBadge value={row.payment_status} />
              <CurrencyBadge value={row.currency} />
            </div>
          ),
        },
        {
          key: "due_amount",
          header: t("course.columns.due_amount"),
          render: (row) => {
            const status = String(row.payment_status ?? "pending");
            if (status === "paid") return <span className="text-muted-foreground">—</span>;
            return (
              <span>
                {formatMoney(row.due_amount)}{" "}
                <span className="text-xs text-muted-foreground">{String(row.currency ?? "AFN")}</span>
              </span>
            );
          },
        },
        {
          key: "status",
          header: t("course.columns.status"),
          render: (row) => (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                row.status === "disabled" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
              )}
            >
              {row.status === "disabled" ? t("course.classStudents.disabled") : t("course.classStudents.active")}
            </span>
          ),
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("course.classStudents.searchStudents"),
      paginationEnabled: true,
      emptyMessage: t("course.classStudents.empty"),
      actions: [
        {
          key: "grade",
          label: t("course.columns.grade"),
          icon: <EditPencil className="h-4 w-4" />,
          permission: "course.class_students.update",
          onClick: openGradeModal,
        },
        {
          key: "payment",
          label: t("course.classStudents.payment"),
          icon: <Wallet className="h-4 w-4" />,
          permission: "course.class_students.update",
          onClick: openPaymentModal,
          hidden: (row) =>
            String(row.payment_status) === "paid" && Number(row.due_amount ?? 0) <= 0,
        },
        {
          key: "disable",
          label: t("common.disable"),
          icon: <Prohibition className="h-4 w-4" />,
          permission: "course.class_students.update",
          onClick: (row) => {
            if (row.status === "disabled") return;
            setDisableReason("");
            setDisableModal(row);
          },
        },
        {
          key: "remove",
          label: t("course.classStudents.remove"),
          icon: <Trash className="h-4 w-4" />,
          variant: "danger" as const,
          permission: "course.class_students.update",
          onClick: async (row) => {
            if (!(await confirm(confirmPresets.delete(t("course.classStudents.removeConfirmItem"))))) return;
            removeStudent.mutate(row.id);
          },
        },
      ],
    }),
    [classFee, confirm, confirmPresets, removeStudent, t],
  );

  if (!hasPermission("course.class_students.read")) {
    return <PermissionDeniedCard />;
  }

  if (!classId || Number.isNaN(classId)) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("course.classStudents.invalidClass")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="button" variant="ghost" size="sm" className="mb-2 gap-2" onClick={() => navigate("/classes")}>
            <ArrowLeft className="h-4 w-4" />
            {t("course.classStudents.backToClasses")}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {className}
            {classCode ? (
              <span className="ms-2 font-mono text-base font-normal text-muted-foreground">{classCode}</span>
            ) : null}
          </h1>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("course.entities.lmsClasses.title"), to: "/classes" },
                { label: t("course.students") },
              ]}
            />
          </div>
        </div>
        <Can permission="course.class_students.update">
          <Button type="button" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("course.classStudents.addStudent")}
          </Button>
        </Can>
      </div>

      <DataTable
        data={rows}
        config={tableConfig}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <ModalOverlay />
        <ModalContent className="max-w-xl">
          <ModalHeader>
            <ModalTitle>{t("course.classStudents.addRegisteredStudent")}</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <SearchableMultiSelect
              id="add-student-select"
              label={t("common.student")}
              required
              options={studentOptions}
              value={selectedStudentIds}
              onChange={setSelectedStudentIds}
              placeholder={t("course.classStudents.selectStudents")}
              disabled={studentsListQuery.isFetching}
              max={10}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              loading={attachStudent.isPending}
              disabled={selectedStudentIds.length === 0}
              onClick={handleAddStudents}
            >
              {t("course.classStudents.addToClass")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <GradeModal
        open={!!gradeModal}
        row={gradeModal}
        classId={classId}
        form={gradeForm}
        onFormChange={setGradeForm}
        onClose={() => setGradeModal(null)}
        gradeOptions={gradeOptions}
      />

      <DisableModal
        open={!!disableModal}
        classId={classId}
        enrollmentId={disableModal?.id ?? 0}
        reason={disableReason}
        onReasonChange={setDisableReason}
        onClose={() => setDisableModal(null)}
      />

      <PaymentModal
        open={!!paymentModal}
        row={paymentModal}
        classId={classId}
        classFee={classFee}
        form={paymentForm}
        onFormChange={setPaymentForm}
        onClose={() => setPaymentModal(null)}
      />
    </div>
  );
};

interface GradeModalProps {
  open: boolean;
  row: ClassStudentRow | null;
  classId: number;
  form: { grade: string; marks: string };
  onFormChange: (v: { grade: string; marks: string }) => void;
  onClose: () => void;
  gradeOptions: { value: string; label: string }[];
}

function GradeModal({ open, row, classId, form, onFormChange, onClose, gradeOptions }: GradeModalProps) {
  const updateEnrollment = useUpdateClassStudent(classId, row?.id ?? 0);
  const { t } = useTranslation();
  const fmt = useFormatMessage();

  if (!open || !row) return null;

  const studentName = String(row.full_name ?? row.student_code ?? "");

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{fmt("course.classStudents.applyGrade", { name: studentName })}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grade-select">{t("course.columns.grade")}</Label>
            <select
              id="grade-select"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              value={form.grade}
              onChange={(e) => onFormChange({ ...form, grade: e.target.value })}
            >
              {gradeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marks-input">{t("course.classStudents.marksNumber")}</Label>
            <Input
              id="marks-input"
              type="number"
              min={0}
              value={form.marks}
              onChange={(e) => onFormChange({ ...form, marks: e.target.value })}
              placeholder={t("course.classStudents.marksPlaceholder")}
            />
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            loading={updateEnrollment.isPending}
            onClick={async () => {
              await updateEnrollment.mutateAsync({
                grade: form.grade,
                marks: form.marks ? Number(form.marks) : null,
              });
              onClose();
            }}
          >
            {t("course.classStudents.saveGrade")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface DisableModalProps {
  open: boolean;
  classId: number;
  enrollmentId: number;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
}

function DisableModal({ open, classId, enrollmentId, reason, onReasonChange, onClose }: DisableModalProps) {
  const disableEnrollment = useDisableClassStudent(classId, enrollmentId);
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("course.classStudents.disableStudent")}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-1.5">
            <Label htmlFor="disable-reason">{t("course.classStudents.reason")}</Label>
            <textarea
              id="disable-reason"
              className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t("course.classStudents.disableReasonPlaceholder")}
            />
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={disableEnrollment.isPending}
            onClick={async () => {
              if (!reason.trim()) return;
              await disableEnrollment.mutateAsync({ disable_reason: reason });
              onClose();
            }}
          >
            {t("course.classStudents.disableStudent")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface PaymentModalProps {
  open: boolean;
  row: ClassStudentRow | null;
  classId: number;
  classFee: number;
  form: {
    discount_type: string;
    discount_amount: string;
    paid_amount: string;
    currency: string;
  };
  onFormChange: (v: PaymentModalProps["form"]) => void;
  onClose: () => void;
}

function computeFeeAfterDiscount(classFee: number, discountType: string, discountAmount: number): number {
  if (discountType === "percentage") {
    return Math.max(0, Math.round(classFee * (1 - Math.min(100, Math.max(0, discountAmount)) / 100) * 100) / 100);
  }
  if (discountType === "fixed") {
    return Math.max(0, Math.round((classFee - Math.max(0, discountAmount)) * 100) / 100);
  }
  return Math.max(0, classFee);
}

function resolveStatus(fee: number, paid: number): "pending" | "paid" | "partial" {
  if (fee <= 0 || paid >= fee) return "paid";
  if (paid <= 0) return "pending";
  return "partial";
}

function PaymentModal({ open, row, classId, classFee, form, onFormChange, onClose }: PaymentModalProps) {
  const updateEnrollment = useUpdateClassStudent(classId, row?.id ?? 0);
  const { t } = useTranslation();
  const fmt = useFormatMessage();

  if (!open || !row) return null;

  const studentName = String(row.full_name ?? row.student_code ?? "");
  const feeSource = row.class_fee != null ? Number(row.class_fee) : classFee;
  const discountAmount = form.discount_amount ? Number(form.discount_amount) : 0;
  const paidAmount = form.paid_amount ? Number(form.paid_amount) : 0;
  const feeAfterDiscount = computeFeeAfterDiscount(feeSource, form.discount_type, discountAmount);
  const previewStatus = resolveStatus(feeAfterDiscount, paidAmount);
  const dueAmount = Math.max(0, Math.round((feeAfterDiscount - paidAmount) * 100) / 100);
  const isFullyPaid = previewStatus === "paid";

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{fmt("course.classStudents.paymentTitle", { name: studentName })}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("course.classStudents.courseFee")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatMoney(feeSource)}{" "}
              <span className="text-sm font-medium text-muted-foreground">{form.currency || "AFN"}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("course.classStudents.discountType")}</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) =>
                  onFormChange({
                    ...form,
                    discount_type: v,
                    discount_amount: v === "none" ? "0" : form.discount_amount,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`course.discountType.${type}` as "course.discountType.none")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-amount">{t("course.classStudents.discountAmount")}</Label>
              <Input
                id="discount-amount"
                type="number"
                min={0}
                max={form.discount_type === "percentage" ? 100 : undefined}
                disabled={form.discount_type === "none"}
                value={form.discount_type === "none" ? "0" : form.discount_amount}
                onChange={(e) => onFormChange({ ...form, discount_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paid-amount">{t("course.columns.paid_amount")}</Label>
              <Input
                id="paid-amount"
                type="number"
                min={0}
                max={isFullyPaid && paidAmount >= feeAfterDiscount ? feeAfterDiscount : undefined}
                value={form.paid_amount}
                onChange={(e) => onFormChange({ ...form, paid_amount: e.target.value })}
                disabled={String(row.payment_status) === "paid" && Number(row.due_amount ?? 0) <= 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("course.classStudents.currency")}</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => onFormChange({ ...form, currency: v })}
              >
                <SelectTrigger className="w-[6.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("course.classStudents.afterDiscount")}</span>
              <span className="font-medium tabular-nums">
                {formatMoney(feeAfterDiscount)} {form.currency}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("course.columns.payment_status")}</span>
              <PaymentStatusBadge value={previewStatus} />
            </div>
            {previewStatus === "partial" || previewStatus === "pending" ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{t("course.columns.due_amount")}</span>
                <span className="font-medium tabular-nums text-warning">
                  {formatMoney(dueAmount)} {form.currency}
                </span>
              </div>
            ) : null}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            loading={updateEnrollment.isPending}
            disabled={String(row.payment_status) === "paid" && Number(row.due_amount ?? 0) <= 0}
            onClick={async () => {
              await updateEnrollment.mutateAsync({
                discount_type: form.discount_type,
                discount_amount: form.discount_type === "none" ? 0 : discountAmount,
                paid_amount: paidAmount,
                currency: form.currency,
              });
              onClose();
            }}
          >
            {t("course.classStudents.savePayment")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ClassStudentsPage;

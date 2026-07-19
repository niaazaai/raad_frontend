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
  PageBreadcrumb,
  SearchableSelect,
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

const PAYMENT_STATUS_VALUES = ["pending", "paid", "partial", "due"] as const;

function PaymentStatusBadge({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const raw = String(value ?? "pending");
  const labels: Record<string, string> = {
    pending: t("course.paymentStatus.pending"),
    paid: t("course.paymentStatus.paid"),
    partial: t("course.paymentStatus.partial"),
    due: t("course.paymentStatus.due"),
  };
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    due: "bg-danger/10 text-danger",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {labels[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1)}
    </span>
  );
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

  const paymentStatusOptions = useMemo(
    () =>
      PAYMENT_STATUS_VALUES.map((value) => ({
        value,
        label: t(`course.paymentStatus.${value}` as "course.paymentStatus.pending"),
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
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [gradeModal, setGradeModal] = useState<ClassStudentRow | null>(null);
  const [disableModal, setDisableModal] = useState<ClassStudentRow | null>(null);
  const [paymentModal, setPaymentModal] = useState<ClassStudentRow | null>(null);

  const [gradeForm, setGradeForm] = useState({ grade: "PENDING", marks: "" });
  const [disableReason, setDisableReason] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    discount_percent: "",
    fee_amount: "",
    paid_amount: "",
    payment_status: "pending",
  });

  const studentsListQuery = useCourseEntityList(
    addOpen ? "lms-class-students" : null,
    { per_page: 100, page: 1 },
    { enabled: addOpen }
  );
  const availableStudents = getCourseListFromResponse(studentsListQuery.data);
  const studentOptions = availableStudents.map((s) => ({
    value: String(s.id),
    label: `${s.student_code ?? s.id} — ${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
  }));

  const openGradeModal = (row: ClassStudentRow) => {
    setGradeForm({
      grade: String(row.grade ?? "PENDING"),
      marks: row.marks != null ? String(row.marks) : "",
    });
    setGradeModal(row);
  };

  const openPaymentModal = (row: ClassStudentRow) => {
    setPaymentForm({
      discount_percent: row.discount_percent != null ? String(row.discount_percent) : "0",
      fee_amount: row.fee_amount != null ? String(row.fee_amount) : "",
      paid_amount: row.paid_amount != null ? String(row.paid_amount) : "0",
      payment_status: String(row.payment_status ?? "pending"),
    });
    setPaymentModal(row);
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    await attachStudent.mutateAsync({ student_id: Number(selectedStudentId) });
    setAddOpen(false);
    setSelectedStudentId("");
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
            <span>{row.full_name || `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—"}</span>
          ),
        },
        { key: "phone_number", header: t("course.columns.phone_number"), render: (row) => <span>{row.phone_number ?? "—"}</span> },
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
          key: "payment_status",
          header: t("course.columns.payment_status"),
          render: (row) => <PaymentStatusBadge value={row.payment_status} />,
        },
        {
          key: "due_amount",
          header: t("course.columns.due_amount"),
          render: (row) => <span>{row.due_amount != null ? String(row.due_amount) : "—"}</span>,
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
    [confirm, confirmPresets, removeStudent, t],
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
    <div className="space-y-6 p-6">
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

      <Drawer open={addOpen} onClose={() => setAddOpen(false)}>
        <DrawerContent className="max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("course.classStudents.addRegisteredStudent")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <SearchableSelect
              id="add-student-select"
              label={t("common.student")}
              required
              options={studentOptions}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              placeholder={t("course.classStudents.selectStudent")}
              disabled={studentsListQuery.isFetching}
            />
          </DrawerBody>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" loading={attachStudent.isPending} onClick={handleAddStudent}>
              {t("course.classStudents.addToClass")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
        form={paymentForm}
        onFormChange={setPaymentForm}
        onClose={() => setPaymentModal(null)}
        paymentStatusOptions={paymentStatusOptions}
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
  form: { discount_percent: string; fee_amount: string; paid_amount: string; payment_status: string };
  onFormChange: (v: PaymentModalProps["form"]) => void;
  onClose: () => void;
  paymentStatusOptions: { value: string; label: string }[];
}

function PaymentModal({
  open,
  row,
  classId,
  form,
  onFormChange,
  onClose,
  paymentStatusOptions,
}: PaymentModalProps) {
  const updateEnrollment = useUpdateClassStudent(classId, row?.id ?? 0);
  const { t } = useTranslation();
  const fmt = useFormatMessage();

  if (!open || !row) return null;

  const studentName = String(row.full_name ?? row.student_code ?? "");

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{fmt("course.classStudents.paymentTitle", { name: studentName })}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="discount-pct">{t("course.columns.discount_percent")}</Label>
            <Input
              id="discount-pct"
              type="number"
              min={0}
              max={100}
              value={form.discount_percent}
              onChange={(e) => onFormChange({ ...form, discount_percent: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fee-amount">{t("course.columns.fee_amount")}</Label>
            <Input
              id="fee-amount"
              type="number"
              min={0}
              value={form.fee_amount}
              onChange={(e) => onFormChange({ ...form, fee_amount: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paid-amount">{t("course.columns.paid_amount")}</Label>
            <Input
              id="paid-amount"
              type="number"
              min={0}
              value={form.paid_amount}
              onChange={(e) => onFormChange({ ...form, paid_amount: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment-status">{t("course.columns.payment_status")}</Label>
            <select
              id="payment-status"
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              value={form.payment_status}
              onChange={(e) => onFormChange({ ...form, payment_status: e.target.value })}
            >
              {paymentStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
                discount_percent: form.discount_percent ? Number(form.discount_percent) : 0,
                fee_amount: form.fee_amount ? Number(form.fee_amount) : undefined,
                paid_amount: form.paid_amount ? Number(form.paid_amount) : 0,
                payment_status: form.payment_status,
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

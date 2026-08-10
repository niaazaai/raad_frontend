import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Calendar, Cash, Clock, FloppyDisk, Hashtag, Page, User } from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { CourseEntitySlug } from "../../data/courseRegistry";
import {
  COURSE_ENTITY_FORM_REGISTRY,
  courseRowToFormValuesForSlug,
  getCreateDefaultsForEntity,
  getSerializeFieldsForSlug,
  serializeCourseEntityPayload,
} from "../../data/courseEntityFormRegistry";
import type { CourseEntityFormField } from "../../data/courseEntityFormRegistry";
import {
  getCourseEntityDetailFromResponse,
  getCourseListFromResponse,
  useApproveStudentSubscription,
  useCourseEntityDetail,
  useCourseEntityList,
  useCreateCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";
import { useCourseFormMeta } from "../../hooks/useCourseFormMeta";
import { useNextClassCode, useNextStudentCode } from "../../hooks/useLmsClassActions";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import {
  Button,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  ImageDropzone,
  Input,
  Label,
  RichTextEditor,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useConfirmDialog,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { API_V1_BASE } from "@/services/apiClient";

type FormValues = Record<string, string | boolean>;

export type CourseEntityDrawerMode = "create" | "edit" | "view";

export interface CourseEntityFormDrawerProps {
  slug: CourseEntitySlug;
  entityTitle: string;
  mode: CourseEntityDrawerMode;
  entityId: number | null;
  onSuccess: () => void;
}

const inputClass = cn(
  "border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm",
  "focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateYmd(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

function formatDateHuman(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function formatTimeHms(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
  return raw;
}

function voucherIsPdf(detail: Record<string, unknown> | null | undefined): boolean {
  if (!detail) return false;
  if (detail.voucher_is_pdf === true) return true;
  const path = String(detail.voucher_file_url ?? detail.voucher_url ?? "");
  return /\.pdf(\?|$)/i.test(path);
}

function openVoucherInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

function validateRequired(values: FormValues, slug: CourseEntitySlug): string | null {
  if (slug === "student-subscriptions") return null;
  const fields = getSerializeFieldsForSlug(slug);
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.name];
    if (f.type === "checkbox") continue;
    if (v === undefined || v === null || String(v).trim() === "") {
      return `${f.label} is required`;
    }
  }
  return null;
}

function renderFieldControl(
  f: CourseEntityFormField,
  readOnly: boolean,
  register: ReturnType<typeof useForm<FormValues>>["register"]
) {
  const id = `cef-${f.name}`;
  if (f.type === "textarea") {
    return (
      <textarea
        id={id}
        className={cn(inputClass, "min-h-[88px]")}
        disabled={readOnly}
        placeholder={f.placeholder}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "json") {
    return (
      <textarea
        id={id}
        className={cn(inputClass, "min-h-[120px] font-mono text-xs")}
        disabled={readOnly}
        placeholder={f.placeholder}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "text" || f.type === "number") {
    return (
      <input
        id={id}
        type={f.type === "number" ? "number" : "text"}
        step={f.type === "number" ? "any" : undefined}
        className={inputClass}
        disabled={readOnly}
        placeholder={f.placeholder}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "date" || f.type === "time") {
    return (
      <input
        id={id}
        type={f.type === "time" ? "time" : "date"}
        className={inputClass}
        disabled={readOnly}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "select") {
    return (
      <select id={id} className={inputClass} disabled={readOnly} {...register(f.name)}>
        <option value="">—</option>
        {(f.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (f.type === "checkbox") {
    return (
      <input
        id={id}
        type="checkbox"
        disabled={readOnly}
        className="border-input h-4 w-4 rounded"
        {...register(f.name)}
      />
    );
  }
  return null;
}

const THUMB_SLUGS: CourseEntitySlug[] = ["main-categories", "sub-categories"];

function courseEntityThumbnailUrl(slug: CourseEntitySlug, entityId: number | null): string | null {
  if (entityId == null) return null;
  if (slug === "main-categories") return `${API_V1_BASE}/main-categories/${entityId}/thumbnail`;
  if (slug === "sub-categories") return `${API_V1_BASE}/sub-categories/${entityId}/thumbnail`;
  return null;
}

function CategoryDrawerViewImage({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        No image uploaded
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      className="max-h-80 w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

const SUB_FREE_PAID_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const CourseEntityFormDrawer = ({
  slug,
  entityTitle: _entityTitle,
  mode,
  entityId,
  onSuccess,
}: CourseEntityFormDrawerProps) => {
  const { drawerHeading } = useCourseI18n();
  const def = COURSE_ENTITY_FORM_REGISTRY[slug];
  const readOnly = mode === "view";
  const formMetaKey =
    slug === "sub-categories" ? "sub-categories" : slug === "instructors" ? "instructors" : null;
  const { data: metaRes, isLoading: metaLoading } = useCourseFormMeta(formMetaKey);
  const meta = metaRes?.data;
  const mainCategoryOptions = useMemo(() => {
    const rows = meta?.main_categories ?? [];
    return rows.map((r) => ({ value: String(r.id), label: `${r.title} (#${r.id})` }));
  }, [meta?.main_categories]);

  const { data: detailRes, isLoading: loadingDetail } = useCourseEntityDetail(slug, entityId, {
    enabled: mode !== "create" && entityId != null,
  });
  const detail = getCourseEntityDetailFromResponse(detailRes);

  const coursesWithPlansQuery = useCourseEntityList(
    slug === "student-subscriptions" ? "courses" : null,
    { has_subscription_plans: 1, per_page: 200 },
    { enabled: slug === "student-subscriptions" && !readOnly }
  );
  const courseOptions = useMemo(() => {
    const rows = getCourseListFromResponse(coursesWithPlansQuery.data);
    return rows.map((r) => ({
      value: String(r.id),
      label: `${String(r.title ?? "Course")} (#${r.id})`,
    }));
  }, [coursesWithPlansQuery.data]);

  const { data: studentUsersRes } = useQueryApi<Record<string, unknown>[]>({
    queryKey: ["users", "student-picker"],
    url: "/users",
    method: RequestMethod.GET,
    params: { type: "student", per_page: 200 },
    options: { enabled: slug === "student-subscriptions" && !readOnly },
  });
  const studentUserOptions = useMemo(() => {
    const envelope = studentUsersRes as { data?: unknown } | undefined;
    const raw = envelope?.data;
    const fromApi = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
    return fromApi.map((r) => ({
      value: String(r.id),
      label: `${String(r.name ?? "")} (${String(r.email ?? "")})`,
    }));
  }, [studentUsersRes]);

  const { register, handleSubmit, reset, control, setValue, getValues, formState } = useForm<FormValues>({
    defaultValues: getCreateDefaultsForEntity(slug),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const watchedCourseId = useWatch({ control, name: "course_id", defaultValue: "" });
  const watchedMainCategoryId = useWatch({ control, name: "main_category_id", defaultValue: "" });
  const courseIdNum = Number(watchedCourseId) || 0;

  const attachedPlansQuery = useCourseEntityList(
    slug === "student-subscriptions" && courseIdNum > 0 ? "subscription-plans" : null,
    { attached_to_course: courseIdNum, per_page: 100 },
    { enabled: slug === "student-subscriptions" && courseIdNum > 0 && !readOnly }
  );
  const planOptions = useMemo(() => {
    const rows = getCourseListFromResponse(attachedPlansQuery.data);
    return rows.map((r) => {
      const price = r.price != null ? String(r.price) : "—";
      const days = r.duration_in_days != null ? String(r.duration_in_days) : "—";
      const typ = String(r.subscription_type ?? "");
      return {
        value: String(r.id),
        label: `${String(r.plan_name ?? "Plan")} · ${price} · ${days}d · ${typ}`,
      };
    });
  }, [attachedPlansQuery.data]);

  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [studentProfileImage, setStudentProfileImage] = useState<File | null>(null);
  const [studentNationalIdAttachment, setStudentNationalIdAttachment] = useState<File | null>(null);

  const isCreateMode = mode === "create";
  const nextClassCodeQuery = useNextClassCode(slug === "lms-classes" && isCreateMode && !readOnly);
  const nextStudentCodeQuery = useNextStudentCode(
    slug === "lms-class-students" && isCreateMode && !readOnly
  );
  const nextClassCode =
    (nextClassCodeQuery.data as { data?: { class_code?: string } } | undefined)?.data?.class_code ??
    (nextClassCodeQuery.data as { class_code?: string } | undefined)?.class_code;
  const nextStudentCode =
    (nextStudentCodeQuery.data as { data?: { student_code?: string } } | undefined)?.data
      ?.student_code ??
    (nextStudentCodeQuery.data as { student_code?: string } | undefined)?.student_code;

  const courseOptionsQuery = useCourseEntityList(
    slug === "lms-classes" ? "courses" : null,
    { per_page: 200 },
    { enabled: slug === "lms-classes" && !readOnly }
  );
  const lmsClassCourseOptions = useMemo(() => {
    const rows = getCourseListFromResponse(courseOptionsQuery.data);
    return rows.map((r) => ({
      value: String(r.id),
      label: `${String(r.title ?? "Course")} (#${r.id})`,
      title: String(r.title ?? ""),
    }));
  }, [courseOptionsQuery.data]);

  const instructorOptionsQuery = useCourseEntityList(
    slug === "lms-classes" ? "instructors" : null,
    { per_page: 200 },
    { enabled: slug === "lms-classes" && !readOnly }
  );
  const lmsClassInstructorOptions = useMemo(() => {
    const rows = getCourseListFromResponse(instructorOptionsQuery.data);
    return rows.map((r) => ({
      value: String(r.id),
      label: `${String(r.user_name ?? "Instructor")} (#${String(r.id)})`,
    }));
  }, [instructorOptionsQuery.data]);

  const mainCategoryOptionsQuery = useCourseEntityList(
    slug === "lms-classes" ? "main-categories" : null,
    { per_page: 200, status: "active" },
    { enabled: slug === "lms-classes" && !readOnly }
  );
  const lmsClassMainCategoryOptions = useMemo(() => {
    const rows = getCourseListFromResponse(mainCategoryOptionsQuery.data);
    return rows.map((r) => ({
      value: String(r.id),
      label: String(r.title ?? `Category #${String(r.id)}`),
    }));
  }, [mainCategoryOptionsQuery.data]);

  const subCategoryOptionsQuery = useCourseEntityList(
    slug === "lms-classes" ? "sub-categories" : null,
    { per_page: 500, status: "active" },
    { enabled: slug === "lms-classes" && !readOnly }
  );
  const lmsClassSubCategoryOptions = useMemo(() => {
    const rows = getCourseListFromResponse(subCategoryOptionsQuery.data);
    const mainId = String(watchedMainCategoryId ?? "").trim();
    const filtered = mainId
      ? rows.filter((r) => String(r.main_category_id ?? "") === mainId)
      : rows;
    return filtered.map((r) => ({
      value: String(r.id),
      label: String(r.title ?? `Sub category #${String(r.id)}`),
    }));
  }, [subCategoryOptionsQuery.data, watchedMainCategoryId]);

  const studentUsersQuery = useQueryApi<Record<string, unknown>[]>({
    queryKey: ["users", "student-picker", "class-students"],
    url: "/users",
    method: RequestMethod.GET,
    params: { type: "student", per_page: 200 },
    options: { enabled: slug === "lms-class-students" && !readOnly },
  });
  const classStudentUserOptions = useMemo(() => {
    const envelope = studentUsersQuery.data as { data?: unknown } | undefined;
    const raw = envelope?.data;
    const fromApi = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
    return fromApi.map((r) => ({
      value: String(r.id),
      label: `${String(r.name ?? "")} (${String(r.email ?? "")})`,
    }));
  }, [studentUsersQuery.data]);

  const instructorUserOptions = useMemo(() => {
    const rows = meta?.instructor_users ?? [];
    const opts = rows.map((r) => ({
      value: String(r.id),
      label: `${r.name} (${r.email}) · ${r.type}`,
    }));
    if (mode !== "create" && detail) {
      const rawId = detail.user_id;
      if (rawId !== null && rawId !== undefined && String(rawId).trim() !== "") {
        const uid = String(rawId);
        if (!opts.some((o) => o.value === uid)) {
          const uname =
            typeof detail.user_name === "string" && detail.user_name.trim() !== ""
              ? String(detail.user_name)
              : `User #${uid}`;
          return [{ value: uid, label: `${uname} (#${uid})` }, ...opts];
        }
      }
    }
    return opts;
  }, [meta?.instructor_users, mode, detail]);

  useEffect(() => {
    if (slug !== "lms-classes" || readOnly) return;
    const selected = lmsClassCourseOptions.find((opt) => opt.value === String(watchedCourseId ?? ""));
    if (!selected?.title) return;
    const currentName = String(getValues("name") ?? "").trim();
    if (!formState.dirtyFields.name || currentName === "") {
      setValue("name", selected.title, { shouldDirty: false });
    }
  }, [
    slug,
    readOnly,
    watchedCourseId,
    lmsClassCourseOptions,
    getValues,
    setValue,
    formState.dirtyFields.name,
  ]);

  useEffect(() => {
    if (slug !== "lms-classes" || readOnly) return;
    const mainId = String(watchedMainCategoryId ?? "").trim();
    const subId = String(getValues("sub_category_id") ?? "").trim();
    if (!mainId || !subId) return;
    const rows = getCourseListFromResponse(subCategoryOptionsQuery.data);
    const stillValid = rows.some(
      (r) => String(r.id) === subId && String(r.main_category_id ?? "") === mainId
    );
    if (!stillValid) {
      setValue("sub_category_id", "", { shouldDirty: true });
    }
  }, [
    slug,
    readOnly,
    watchedMainCategoryId,
    subCategoryOptionsQuery.data,
    getValues,
    setValue,
  ]);

  const watchedStudentUserId = useWatch({ control, name: "user_id", defaultValue: "" });
  useEffect(() => {
    if (slug !== "lms-class-students" || readOnly) return;
    const selected = classStudentUserOptions.find(
      (opt) => opt.value === String(watchedStudentUserId ?? "")
    );
    if (!selected?.label) return;
    const [namePart, emailPart] = selected.label.split("(");
    const fullName = (namePart ?? "").trim();
    const email = (emailPart ?? "").replace(")", "").trim();
    const [firstName, ...lastParts] = fullName.split(/\s+/);
    if (!String(getValues("first_name") ?? "").trim()) {
      setValue("first_name", firstName ?? "", { shouldDirty: false });
    }
    if (!String(getValues("last_name") ?? "").trim()) {
      setValue("last_name", lastParts.join(" "), { shouldDirty: false });
    }
    if (!String(getValues("email") ?? "").trim() && email) {
      setValue("email", email, { shouldDirty: false });
    }
  }, [
    slug,
    readOnly,
    watchedStudentUserId,
    classStudentUserOptions,
    getValues,
    setValue,
  ]);

  const { mutate: createEntity, isPending: creating } = useCreateCourseEntity(slug);
  const { mutate: updateEntity, isPending: updating } = useUpdateCourseEntity(slug);
  const { confirm } = useConfirmDialog();
  const { mutateAsync: approveStudentSubscription, isPending: approvingStudentSubscription } =
    useApproveStudentSubscription();
  const submitting = creating || updating;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    if (slug === "student-subscriptions") {
      if (mode === "create") {
        reset({
          course_id: "",
          user_id: "",
          plan_id: "",
          subscription_start_date: todayISO(),
          subscription_end_date: "",
          purchase_date: todayISO(),
        });
        setVoucherFile(null);
        setStudentProfileImage(null);
        return;
      }
      if (detail) {
        reset({
          course_id: String(detail.course_id ?? ""),
          user_id: String(detail.user_id ?? ""),
          plan_id: String(detail.plan_id ?? ""),
          subscription_start_date: String(detail.subscription_start_date ?? "").slice(0, 10),
          subscription_end_date: String(detail.subscription_end_date ?? "").slice(0, 10),
          purchase_date: String(detail.purchase_date ?? "").slice(0, 10),
        });
        setVoucherFile(null);
        setStudentProfileImage(null);
        setStudentNationalIdAttachment(null);
      }
      return;
    }
    if (mode === "create") {
      reset(getCreateDefaultsForEntity(slug));
      setThumbnailFile(null);
      setVoucherFile(null);
      setStudentProfileImage(null);
      setStudentNationalIdAttachment(null);
      return;
    }
    if (detail) {
      reset(courseRowToFormValuesForSlug(slug, detail, def.fields));
      setThumbnailFile(null);
      setVoucherFile(null);
      setStudentProfileImage(null);
      setStudentNationalIdAttachment(null);
    }
  }, [mode, slug, detail, reset, def.fields]);

  useEffect(() => {
    if (!readOnly || slug !== "student-subscriptions" || !detail) return;
    const voucherUrl = typeof detail.voucher_url === "string" ? detail.voucher_url : "";
    if (!voucherUrl || !voucherIsPdf(detail)) return;
    openVoucherInNewTab(voucherUrl);
  }, [readOnly, slug, detail]);

  const onSubmit = (values: FormValues) => {
    if (readOnly) return;
    const normalizedValues: FormValues = { ...values };
    if (slug === "lms-classes") {
      for (const key of ["start_time", "end_time"] as const) {
        const raw = String(normalizedValues[key] ?? "").trim();
        if (/^\d{2}:\d{2}$/.test(raw)) {
          normalizedValues[key] = `${raw}:00`;
        }
      }
      const startDate = String(normalizedValues.start_date ?? "").trim();
      const endDate = String(normalizedValues.end_date ?? "").trim();
      const startTime = String(normalizedValues.start_time ?? "").trim();
      const endTime = String(normalizedValues.end_time ?? "").trim();
      if (!startDate || !endDate || !startTime || !endTime) {
        toast.error("Start date, end date, start time, and end time are required.");
        return;
      }
      if (endDate < startDate) {
        toast.error("End date must be on or after start date.");
        return;
      }
      if (startDate === endDate && endTime <= startTime) {
        toast.error("End time must be after start time when dates are the same.");
        return;
      }
    }

    if (slug === "lms-class-students") {
      for (const phoneKey of ["phone_number", "whatsapp_number", "emergency_phone_number"] as const) {
        const phone = String(normalizedValues[phoneKey] ?? "").trim();
        if (phone && !/^\+?[0-9]{7,15}$/.test(phone)) {
          toast.error("Phone numbers must be 7–15 digits (optional + prefix).");
          return;
        }
      }
    }

    if (slug === "student-subscriptions") {
      const courseId = Number(values.course_id);
      const userId = Number(values.user_id);
      const planId = Number(values.plan_id);
      if (!courseId || !userId || !planId) {
        toast.error("Course, student, and plan are required.");
        return;
      }

      // Create: dates are server-owned (StoreStudentSubscriptionRequest marks them prohibited).
      // Edit: dates may be updated via UpdateStudentSubscriptionRequest.
      if (mode === "create") {
        const body: Record<string, unknown> = {
          course_id: courseId,
          user_id: userId,
          plan_id: planId,
        };
        if (voucherFile) body.voucher_file = voucherFile;
        createEntity(body, {
          onSuccess: () => onSuccess(),
          onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Create failed"),
        });
        return;
      }
      if (entityId == null) return;
      const body: Record<string, unknown> = {
        course_id: courseId,
        user_id: userId,
        plan_id: planId,
        subscription_start_date: values.subscription_start_date || undefined,
        subscription_end_date: values.subscription_end_date || null,
        purchase_date: values.purchase_date || undefined,
      };
      if (voucherFile) body.voucher_file = voucherFile;
      updateEntity(
        { id: entityId, body },
        {
          onSuccess: () => onSuccess(),
          onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Update failed"),
        }
      );
      return;
    }

    if (slug === "subscription-plans") {
      const payload: Record<string, unknown> = {
        plan_name: String(values.plan_name ?? "").trim(),
        plan_description: String(values.plan_description ?? ""),
        price: Number(values.price),
        duration_in_days: Number(values.duration_in_days),
        subscription_type: String(values.subscription_type || "free"),
      };
      if (!payload.plan_name) {
        toast.error("Plan name is required.");
        return;
      }
      if (Number.isNaN(payload.price) || Number.isNaN(payload.duration_in_days)) {
        toast.error("Price and duration must be valid numbers.");
        return;
      }
      if (mode === "create") {
        createEntity(payload, {
          onSuccess: () => onSuccess(),
          onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Create failed"),
        });
        return;
      }
      if (entityId == null) return;
      updateEntity(
        { id: entityId, body: payload },
        {
          onSuccess: () => onSuccess(),
          onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Update failed"),
        }
      );
      return;
    }

    const err = validateRequired(normalizedValues, slug);
    if (err) {
      toast.error(err);
      return;
    }
    const fields = getSerializeFieldsForSlug(slug);
    const payload = serializeCourseEntityPayload(normalizedValues, fields);
    if (THUMB_SLUGS.includes(slug) && thumbnailFile) {
      payload.thumbnail_file = thumbnailFile;
    }
    if (slug === "lms-class-students" && studentProfileImage) {
      payload.profile_image_file = studentProfileImage;
    }
    if (slug === "lms-class-students" && studentNationalIdAttachment) {
      payload.national_id_attachment_file = studentNationalIdAttachment;
    }

    if (mode === "create") {
      createEntity(payload, {
        onSuccess: () => onSuccess(),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Create failed"),
      });
      return;
    }

    if (entityId == null) return;
    updateEntity(
      { id: entityId, body: payload },
      {
        onSuccess: () => onSuccess(),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  };

  const heading = drawerHeading(mode, slug);

  const detailThumbnailUrl =
    typeof detail?.thumbnail_url === "string" && detail.thumbnail_url.trim() !== ""
      ? detail.thumbnail_url.trim()
      : null;
  const thumbnailSrc =
    THUMB_SLUGS.includes(slug) && entityId != null
      ? (detailThumbnailUrl ?? courseEntityThumbnailUrl(slug, entityId))
      : null;

  if (mode !== "create" && entityId != null && loadingDetail && !detail) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle>{heading}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="text-primary h-8 w-8" />
          </div>
        </DrawerBody>
      </>
    );
  }

  const showThumb = THUMB_SLUGS.includes(slug) && !readOnly;

  const renderStandardFields = (fields: CourseEntityFormField[]) =>
    fields.map((f) => {
      const id = `cef-${f.name}`;
      return (
        <div key={f.name} className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor={id}>
            {f.label}
            {f.required ? <span className="text-destructive"> *</span> : null}
          </label>
          {renderFieldControl(f, readOnly, register)}
        </div>
      );
    });

  const renderCategoryReadOnly = () => {
    if (!detail) return null;
    const title = String(detail.title ?? "—");
    const description =
      detail.description != null && String(detail.description).trim() !== ""
        ? String(detail.description)
        : "—";
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Title</p>
          <p className="text-lg font-semibold text-foreground">{title}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Description
          </p>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {description}
          </p>
        </div>
        {thumbnailSrc ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Image
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <CategoryDrawerViewImage key={entityId ?? 0} src={thumbnailSrc} title={title} />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const drawerDescription = readOnly
    ? "Summary of this record."
    : slug === "subscription-plans"
      ? mode === "create"
        ? "Plans are reusable templates. Set pricing and copy here; attach up to three plans per course from the course wizard."
        : "Update the plan template. Courses already linked in the wizard keep their attachments until you change them there."
      : slug === "student-subscriptions"
        ? "Link a learner to a course and an attached plan. A unique subscription ID is created automatically. Payment defaults to pending."
        : slug === "instructors" && mode === "create"
          ? "Pick any user account (any type). Each user can have at most one instructor profile; course access still follows RBAC."
          : mode === "create"
            ? "Fill in the fields and save. IDs reference other records in the LMS."
            : "Update fields and save changes.";

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{heading}</DrawerTitle>
        <DrawerDescription>{drawerDescription}</DrawerDescription>
      </DrawerHeader>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <DrawerBody className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-smooth pb-4">
          {readOnly && (slug === "main-categories" || slug === "sub-categories")
            ? renderCategoryReadOnly()
            : null}

          {readOnly && slug === "subscription-plans" && detail ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Plan name
                </p>
                <p className="text-lg font-semibold text-foreground">{String(detail.plan_name ?? "—")}</p>
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{
                  __html: String(detail.plan_description ?? "<p>—</p>"),
                }}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-medium">{String(detail.price ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Duration (days)</p>
                  <p className="font-medium">{String(detail.duration_in_days ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{String(detail.subscription_type ?? "—")}</p>
                </div>
              </div>
            </div>
          ) : null}

          {readOnly && slug === "student-subscriptions" && detail ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <Hashtag className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Subscription ID
                    </p>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {String(detail.subscription_public_id ?? "—")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <Cash className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Payment
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {String(detail.payment_status ?? "—")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <Page className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Course
                    </p>
                    <p className="text-sm font-medium">
                      {String(detail.course_title ?? detail.course_id ?? "—")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Plan: {String(detail.plan_name ?? detail.plan_id ?? "—")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <User className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Student
                    </p>
                    <p className="text-sm font-medium">
                      {String(detail.user_name ?? detail.user_id ?? "—")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex gap-2 rounded-lg border border-border bg-muted/15 p-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start</p>
                    <p className="text-sm">{String(detail.subscription_start_date ?? "—")}</p>
                  </div>
                </div>
                <div className="flex gap-2 rounded-lg border border-border bg-muted/15 p-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">End</p>
                    <p className="text-sm">{String(detail.subscription_end_date ?? "—")}</p>
                  </div>
                </div>
                <div className="flex gap-2 rounded-lg border border-border bg-muted/15 p-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Purchased</p>
                    <p className="text-sm">{String(detail.purchase_date ?? "").slice(0, 10)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Voucher
                </p>
                {typeof detail.voucher_url === "string" && detail.voucher_url.length > 0 ? (
                  voucherIsPdf(detail) ? (
                    <div className="rounded-xl border border-border bg-muted/10 p-4">
                      <p className="text-sm text-muted-foreground">
                        This voucher is a PDF. It opens in a new browser tab for viewing.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3"
                        onClick={() => openVoucherInNewTab(String(detail.voucher_url))}
                      >
                        View PDF voucher
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-muted/10 p-2">
                      <img
                        src={String(detail.voucher_url)}
                        alt="Voucher"
                        className="max-h-[420px] w-full object-contain"
                      />
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">No voucher on file.</p>
                )}
              </div>

              {(String(detail.subscription_status ?? "") === "pending" ||
                String(detail.payment_status ?? "") === "pending") && (
                <Button
                  type="button"
                  className="mt-4 w-full"
                  variant="default"
                  loading={approvingStudentSubscription}
                  disabled={approvingStudentSubscription || detail.id == null}
                  onClick={() => {
                    const rawId = detail.id;
                    const numericId =
                      typeof rawId === "number" ? rawId : Number(rawId);
                    if (rawId == null || Number.isNaN(numericId)) return;

                    void confirm({
                      title: "Approve subscription?",
                      message:
                        "This will activate the subscription, mark payment as paid, apply any eligible student discount on the server, and notify the learner.",
                      variant: "success",
                      confirmText: "Approve",
                      cancelText: "Cancel",
                    }).then(async (ok) => {
                      if (!ok) return;
                      try {
                        await approveStudentSubscription(numericId);
                        onSuccess();
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Approval failed. Please try again."
                        );
                      }
                    });
                  }}
                >
                  Approve subscription and apply discount
                </Button>
              )}
            </div>
          ) : null}

          {readOnly && slug === "lms-classes" && detail ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Class ID</p>
                  <p className="mt-1 font-mono text-base font-semibold text-primary">
                    {String(detail.class_code ?? detail.id ?? "—")}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Class name</p>
                  <p className="mt-1 text-base font-semibold">{String(detail.name ?? "—")}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
                  <p className="mt-1 text-base font-medium capitalize">
                    {String(detail.class_type ?? "—")}
                  </p>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Cash className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Class fee</p>
                    <p className="mt-1 text-base font-semibold tabular-nums">
                      {detail.class_fee != null && detail.class_fee !== ""
                        ? Number(detail.class_fee).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Page className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Main category</p>
                    <p className="mt-1 text-sm font-medium">{String(detail.main_category_name ?? "—")}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Page className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Sub category</p>
                    <p className="mt-1 text-sm font-medium">{String(detail.sub_category_name ?? "—")}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Page className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Course</p>
                    <p className="mt-1 text-sm font-medium">{String(detail.course_name ?? "—")}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <User className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Instructor</p>
                    <p className="mt-1 text-sm font-medium">{String(detail.instructor_name ?? "—")}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/15 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Schedule days</p>
                  <p className="mt-1 text-sm font-medium capitalize">
                    {String(detail.schedule_days ?? "—").replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Start date</p>
                    <p className="text-sm font-medium">{formatDateHuman(detail.start_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateYmd(detail.start_date)}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">End date</p>
                    <p className="text-sm font-medium">{formatDateHuman(detail.end_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateYmd(detail.end_date)}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Start time</p>
                    <p className="text-sm font-medium">{formatTimeHms(detail.start_time)}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-muted/15 p-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">End time</p>
                    <p className="text-sm font-medium">{formatTimeHms(detail.end_time)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {readOnly && slug === "lms-class-students" && detail ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-border bg-muted/10 p-2">
                  {typeof detail.profile_image_url === "string" && detail.profile_image_url ? (
                    <img
                      src={detail.profile_image_url}
                      alt="Student profile"
                      className="mx-auto h-36 w-36 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                      No profile photo
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-muted/10 p-2">
                  {typeof detail.national_id_attachment_url === "string" && detail.national_id_attachment_url ? (
                    detail.national_id_attachment_url.toLowerCase().includes(".pdf") ? (
                      <a
                        href={detail.national_id_attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-36 flex-col items-center justify-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Page className="h-10 w-10" />
                        View national ID attachment
                      </a>
                    ) : (
                      <img
                        src={detail.national_id_attachment_url}
                        alt="National ID"
                        className="mx-auto h-36 w-full rounded-lg object-contain"
                      />
                    )
                  ) : (
                    <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                      No national ID attachment
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Student</p>
                <p className="mt-1 text-base font-semibold">
                  {String(
                    detail.full_name ??
                      detail.user_name ??
                      (`${String(detail.first_name ?? "")} ${String(detail.last_name ?? "")}`.trim() || "—")
                  )}
                </p>
                {detail.student_code ? (
                  <p className="mt-1 font-mono text-sm text-primary">{String(detail.student_code)}</p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Date of birth</p>
                  <p className="text-sm font-medium">{String(detail.date_of_birth ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium capitalize">{String(detail.gender ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">ACCA ID</p>
                  <p className="text-sm font-medium">{String(detail.acca_id ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Academic background</p>
                  <p className="text-sm font-medium">{String(detail.academic_background ?? "—").replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/15 p-4">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{String(detail.address ?? "—")}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{String(detail.email ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">National ID</p>
                  <p className="text-sm font-medium">{String(detail.national_id ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{String(detail.phone_number ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="text-sm font-medium">{String(detail.whatsapp_number ?? "—")}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Emergency phone</p>
                  <p className="text-sm font-medium">{String(detail.emergency_phone_number ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Father name</p>
                  <p className="text-sm font-medium">{String(detail.father_name ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize">{String(detail.status ?? "active")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">Linked user</p>
                  <p className="text-sm font-medium">
                    {detail.user_id ? String(detail.user_name ?? detail.user_id) : "None"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/15 p-4">
                <p className="text-xs text-muted-foreground">Note</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{String(detail.notes ?? "—")}</p>
              </div>
              {Array.isArray(detail.classes_taken) && detail.classes_taken.length > 0 ? (
                <div className="rounded-lg border border-border bg-muted/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Classes taken</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {detail.classes_taken.map((cls: Record<string, unknown>) => (
                      <li key={String(cls.id)} className="flex items-center justify-between">
                        <span>{String(cls.class_name ?? `Class #${String(cls.class_id ?? "")}`)}</span>
                        <span className="text-muted-foreground">
                          {String(cls.grade ?? "PENDING")} · {String(cls.status ?? "active")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {readOnly &&
          slug !== "main-categories" &&
          slug !== "sub-categories" &&
          slug !== "subscription-plans" &&
          slug !== "student-subscriptions" &&
          slug !== "lms-classes" &&
          slug !== "lms-class-students" ? (
            <div className="space-y-4">{renderStandardFields(def.fields)}</div>
          ) : null}

          {slug === "subscription-plans" && !readOnly && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cef-plan-name">
                  Plan name <span className="text-destructive">*</span>
                </Label>
                <Input id="cef-plan-name" placeholder="e.g. 90-day Pro access" {...register("plan_name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Controller
                  name="plan_description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={(html) => field.onChange(html)}
                      minHeight="min-h-[200px]"
                      placeholder="What learners get with this plan…"
                    />
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-plan-price">
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-plan-price" type="number" step="any" {...register("price")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-plan-duration">
                    Duration (days) <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-plan-duration" type="number" {...register("duration_in_days")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-plan-type">Subscription type</Label>
                  <select id="cef-plan-type" className={inputClass} {...register("subscription_type")}>
                    {SUB_FREE_PAID_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {slug === "student-subscriptions" && !readOnly && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-1">
                <Controller
                  name="course_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-stu-sub-course"
                      label="Course"
                      required
                      options={courseOptions}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder="Courses with subscription plans…"
                      disabled={coursesWithPlansQuery.isFetching}
                      searchPlaceholder="Search course…"
                    />
                  )}
                />
                <Controller
                  name="user_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-stu-sub-user"
                      label="Student (user)"
                      required
                      options={studentUserOptions}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder="Student accounts…"
                      disabled={mode === "edit"}
                      searchPlaceholder="Search by name or email…"
                    />
                  )}
                />
                <Controller
                  name="plan_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-stu-sub-plan"
                      label="Plan"
                      required
                      options={planOptions}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder={
                        courseIdNum ? "Plans attached to this course…" : "Select a course first"
                      }
                      disabled={!courseIdNum || attachedPlansQuery.isFetching}
                      searchPlaceholder="Search plan…"
                    />
                  )}
                />
              </div>
              {mode === "edit" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cef-sub-start">Subscription start</Label>
                    <Input id="cef-sub-start" type="date" {...register("subscription_start_date")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cef-sub-end">Subscription end</Label>
                    <Input id="cef-sub-end" type="date" {...register("subscription_end_date")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cef-sub-purchase">Purchase date</Label>
                    <Input id="cef-sub-purchase" type="date" {...register("purchase_date")} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Purchase and subscription dates are set automatically on create. End date is
                  assigned when the subscription is approved.
                </p>
              )}
              <ImageDropzone
                accept="image/*,application/pdf"
                label="Voucher"
                hint="Upload payment proof — image or PDF"
                value={voucherFile}
                onSelect={setVoucherFile}
                previewMode="square"
              />
            </div>
          )}

          {slug === "main-categories" && (
            <>
              {!readOnly
                ? renderStandardFields(def.fields.filter((f) => f.name !== "status"))
                : null}
              {showThumb ? (
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Thumbnail"
                  hint="JPEG, PNG, WebP or GIF · stored privately under course/thumbnails"
                  value={thumbnailFile}
                  onSelect={setThumbnailFile}
                  previewMode="wide"
                  initialPreviewUrl={thumbnailFile ? null : thumbnailSrc}
                />
              ) : null}
              {!readOnly
                ? renderStandardFields(def.fields.filter((f) => f.name === "status"))
                : null}
            </>
          )}

          {slug === "sub-categories" && (
            <>
              {!readOnly && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="main_category_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="cef-main-category"
                        label="Main category"
                        required
                        options={mainCategoryOptions}
                        value={String(field.value ?? "")}
                        onChange={field.onChange}
                        placeholder="Search and select…"
                        disabled={metaLoading}
                      />
                    )}
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="cef-status-sub">
                      Status<span className="text-destructive"> *</span>
                    </label>
                    <select id="cef-status-sub" className={inputClass} {...register("status")}>
                      <option value="">—</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
              {!readOnly ? renderStandardFields(def.fields) : null}
              {showThumb ? (
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Thumbnail"
                  hint="JPEG, PNG, WebP or GIF · stored privately under course/thumbnails"
                  value={thumbnailFile}
                  onSelect={setThumbnailFile}
                  previewMode="wide"
                  initialPreviewUrl={thumbnailFile ? null : thumbnailSrc}
                />
              ) : null}
            </>
          )}

          {slug === "instructors" && (
            <>
              {!readOnly ? (
                <>
                  <Controller
                    name="user_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="cef-instructor-user"
                        label="User"
                        required
                        options={instructorUserOptions}
                        value={String(field.value ?? "")}
                        onChange={field.onChange}
                        placeholder="Search and select…"
                        disabled={metaLoading || mode === "edit"}
                        searchPlaceholder="Search by name or email…"
                      />
                    )}
                  />
                  {renderStandardFields(def.fields.filter((f) => f.name !== "user_id"))}
                </>
              ) : null}
            </>
          )}

          {slug === "lms-classes" && !readOnly && (
            <div className="space-y-4">
              {isCreateMode && nextClassCode ? (
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Next class ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-primary">{nextClassCode}</p>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="main_category_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-class-main-category"
                      label="Main category"
                      options={lmsClassMainCategoryOptions}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder="Select main category…"
                      disabled={mainCategoryOptionsQuery.isFetching}
                    />
                  )}
                />
                <Controller
                  name="sub_category_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-class-sub-category"
                      label="Sub category"
                      options={lmsClassSubCategoryOptions}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder="Select sub category…"
                      disabled={subCategoryOptionsQuery.isFetching || !String(watchedMainCategoryId ?? "").trim()}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cef-class-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input id="cef-class-name" {...register("name")} placeholder="Class name" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-class-type">Class type</Label>
                  <Controller
                    name="class_type"
                    control={control}
                    render={({ field }) => (
                      <Select value={String(field.value ?? "online")} onValueChange={field.onChange}>
                        <SelectTrigger id="cef-class-type" className="w-full">
                          <SelectValue placeholder="Select class type…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-schedule-days">Days (odd/even)</Label>
                  <Controller
                    name="schedule_days"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? "") || "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger id="cef-schedule-days" className="w-full">
                          <SelectValue placeholder="Select days…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select days…</SelectItem>
                          <SelectItem value="odd">Odd days</SelectItem>
                          <SelectItem value="even">Even days</SelectItem>
                          <SelectItem value="both">Both odd &amp; even</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="course_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-class-course"
                      label="Course"
                      options={lmsClassCourseOptions.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder="Select course…"
                      disabled={courseOptionsQuery.isFetching}
                    />
                  )}
                />
                <Controller
                  name="instructor_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      id="cef-class-instructor"
                      label="Instructor"
                      required
                      options={lmsClassInstructorOptions}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      placeholder="Select instructor…"
                      disabled={instructorOptionsQuery.isFetching}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cef-class-fee">Class fee (default for enrolled students)</Label>
                <Input
                  id="cef-class-fee"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("class_fee")}
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-start-date">
                    Start date <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-start-date" type="date" {...register("start_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-end-date">
                    End date <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-end-date" type="date" {...register("end_date")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-start-time">
                    Start time <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-start-time" type="time" {...register("start_time")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-end-time">
                    End time <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-end-time" type="time" {...register("end_time")} />
                </div>
              </div>
            </div>
          )}

          {slug === "lms-class-students" && !readOnly && (
            <div className="space-y-4">
              {isCreateMode && nextStudentCode ? (
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Next student ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-primary">{nextStudentCode}</p>
                </div>
              ) : null}
              <Controller
                name="user_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    id="cef-student-user"
                    label="User"
                    options={classStudentUserOptions}
                    value={String(field.value ?? "")}
                    onChange={field.onChange}
                    placeholder="Search user…"
                    disabled={studentUsersQuery.isFetching}
                  />
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-first-name">
                    First name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="cef-first-name" {...register("first_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-last-name">Last name</Label>
                  <Input id="cef-last-name" {...register("last_name")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cef-father-name">Father name</Label>
                <Input id="cef-father-name" {...register("father_name")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-acca-id">ACCA ID</Label>
                  <Input id="cef-acca-id" {...register("acca_id")} placeholder="ACCA registration ID" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-academic-background">Academic background</Label>
                  <select id="cef-academic-background" className={inputClass} {...register("academic_background")}>
                    <option value="">Select background…</option>
                    <option value="grade_12">12th Grade</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="doctorate">Doctorate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-gender">Gender</Label>
                  <select id="cef-gender" className={inputClass} {...register("gender")}>
                    <option value="">Select gender…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-dob">Date of birth</Label>
                  <Input id="cef-dob" type="date" {...register("date_of_birth")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cef-address">Address</Label>
                <textarea id="cef-address" className={cn(inputClass, "min-h-[72px]")} {...register("address")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-national-id">National ID</Label>
                  <Input id="cef-national-id" {...register("national_id")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-email">Email</Label>
                  <Input id="cef-email" type="email" {...register("email")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cef-phone-number">Phone number</Label>
                  <Input id="cef-phone-number" {...register("phone_number")} placeholder="+937XXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-whatsapp">WhatsApp number</Label>
                  <Input id="cef-whatsapp" {...register("whatsapp_number")} placeholder="+937XXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cef-emergency-phone">Emergency phone number</Label>
                  <Input id="cef-emergency-phone" {...register("emergency_phone_number")} placeholder="+937XXXXXXXX" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cef-student-note">Note</Label>
                <textarea id="cef-student-note" className={cn(inputClass, "min-h-[96px]")} {...register("notes")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Profile picture"
                  hint="Upload student profile image"
                  value={studentProfileImage}
                  onSelect={setStudentProfileImage}
                  previewMode="square"
                  initialPreviewUrl={
                    studentProfileImage ? null : (typeof detail?.profile_image_url === "string" ? detail.profile_image_url : null)
                  }
                />
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  label="National ID attachment"
                  hint="Upload national ID image or PDF"
                  value={studentNationalIdAttachment}
                  onSelect={setStudentNationalIdAttachment}
                  previewMode="square"
                  mediaPreview="file"
                  initialPreviewUrl={
                    studentNationalIdAttachment
                      ? null
                      : (typeof detail?.national_id_attachment_url === "string" ? detail.national_id_attachment_url : null)
                  }
                />
              </div>
            </div>
          )}

          {slug !== "main-categories" &&
            slug !== "sub-categories" &&
            slug !== "instructors" &&
            slug !== "subscription-plans" &&
            slug !== "student-subscriptions" &&
            slug !== "lms-classes" &&
            slug !== "lms-class-students" &&
            !readOnly &&
            renderStandardFields(def.fields)}
        </DrawerBody>

        {!readOnly && (
          <DrawerFooter className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-card shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)]">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving…
                </>
              ) : (
                <>
                  <FloppyDisk className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DrawerFooter>
        )}
      </form>
    </>
  );
};

export default CourseEntityFormDrawer;

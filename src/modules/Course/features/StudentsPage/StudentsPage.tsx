import { useCallback, useMemo, useState } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Star } from "lucide-react";
import { Drawer, DrawerContent, DrawerOverlay, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ColumnFunnel,
  NewButton,
  ServerDataTable,
  StatusBadge,
  actionsColumn,
  bulkDeleteAction,
  editDeleteActions,
  useConfirmDelete,
  useDataTable,
  useStatusToggle,
  useUrlFilters,
  withHeaderAddon,
  type UrlFilters,
} from "@/components/data-table";
import { useTranslation as useGridTranslation } from "@/components/data-table/i18n";
import { coursePermission } from "../../data/courseEntityFormRegistry";
import { courseQueryKeys } from "../../data/constants/queryKeys";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import { useDeleteCourseEntity, useUpdateCourseEntity } from "../../hooks/useCourseEntity";
import type { CourseRow } from "../../hooks/useCourseEntity";
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";
import StudentSuccessStoryDrawer from "../StudentSuccessStoryDrawer/StudentSuccessStoryDrawer";

const FILTER_KEYS = ["status", "channel", "gender", "academic_background"] as const;
const READ = "course.class_students.read";

type StudentFilters = UrlFilters<(typeof FILTER_KEYS)[number]>;

interface ClassTaken {
  id: number;
  class_code: string | null;
  class_name: string | null;
}

interface StudentRow {
  id: number;
  student_code: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  father_name: string | null;
  user_name: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  emergency_phone_number: string | null;
  email: string | null;
  national_id: string | null;
  national_id_attachment_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  acca_id: string | null;
  academic_background: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  channel: string | null;
  success_stories_count?: number;
  classes_taken?: ClassTaken[] | null;
  created_at: string | null;
}

interface EditorState {
  mode: CourseEntityDrawerMode;
  id: number | null;
}

function shown(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

function day(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

function classesLabel(row: StudentRow): string {
  const text = (row.classes_taken ?? [])
    .map((item) => [item.class_code, item.class_name].filter((part) => part && part.trim() !== "").join(" · "))
    .filter((part) => part !== "")
    .join(", ");
  return text === "" ? "—" : text;
}

function Ltr({ value }: { value: string }) {
  if (value === "—") return value;
  return <bdi dir="ltr">{value}</bdi>;
}

function StudentsList({ filters }: { filters: StudentFilters }) {
  const { t } = useTranslation();
  const { t: gridT } = useGridTranslation();
  const { entityTitle, entityDescription } = useCourseI18n();
  const { hasPermission } = useAuth();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [story, setStory] = useState<CourseRow | null>(null);
  const title = entityTitle("lms-class-students");

  const openNew = useCallback(() => setEditor({ mode: "create", id: null }), []);
  const openEdit = useCallback((row: StudentRow) => setEditor({ mode: "edit", id: row.id }), []);
  const openView = useCallback((row: StudentRow) => setEditor({ mode: "view", id: row.id }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const { mutate: removeMutate, mutateAsync: removeAsync } = useDeleteCourseEntity("lms-class-students");
  const { mutateAsync: saveRow } = useUpdateCourseEntity("lms-class-students");
  const confirmDelete = useConfirmDelete();

  const canCreate = hasPermission(coursePermission(READ, "create"));
  const canUpdate = hasPermission(coursePermission(READ, "update"));
  const canDelete = hasPermission(coursePermission(READ, "delete"));
  const updatePermission = coursePermission(READ, "update");
  const deletePermission = coursePermission(READ, "delete");

  const removeRow = useCallback<UseMutateFunction<unknown, Error, string>>((id, options) => {
    removeMutate(Number(id), {
      onSuccess: () => options?.onSuccess?.(undefined, id, undefined, undefined as never),
      onError: (error) =>
        options?.onError?.(
          error instanceof Error ? error : new Error("Delete failed"),
          id,
          undefined,
          undefined as never,
        ),
    });
    return Promise.resolve(undefined);
  }, [removeMutate]);

  const removeRowAsync = useCallback((id: string) => removeAsync(Number(id)), [removeAsync]);

  const nameOf = useCallback((row: StudentRow) => {
    const name = shown(row.full_name);
    return name === "—" ? shown(row.student_code) : name;
  }, []);

  const statusToggle = useStatusToggle<StudentRow>({
    can: canUpdate,
    nameOf,
    save: (row, next) => saveRow({ id: row.id, body: { status: next } }),
  });

  const bulkActions = useMemo(
    () => [bulkDeleteAction({ t: gridT, permission: deletePermission, remove: removeRowAsync })],
    [gridT, deletePermission, removeRowAsync],
  );

  const columns = useMemo<ColumnDef<StudentRow, unknown>[]>(() => {
    const genderText = (value: string | null): string => {
      if (value === "male") return t("studentDirectory.male");
      if (value === "female") return t("studentDirectory.female");
      if (value === "other") return t("studentDirectory.other");
      return shown(value);
    };
    const backgroundText = (value: string | null): string => {
      if (value === "grade_12") return t("studentDirectory.grade12");
      if (value === "undergraduate") return t("studentDirectory.undergraduate");
      if (value === "bachelor") return t("studentDirectory.bachelor");
      if (value === "master") return t("studentDirectory.master");
      if (value === "doctorate") return t("studentDirectory.doctorate");
      if (value === "other") return t("studentDirectory.other");
      return shown(value);
    };
    const channelText = (value: string | null): string => {
      if (value === "online") return t("studentDirectory.online");
      if (value === "offline") return t("studentDirectory.offline");
      return "—";
    };
    const statusText = (value: string): string =>
      value === "active" || value === "inactive" ? gridT(`common:status.${value}`) : shown(value);

    const funnel = (
      column: ColumnDef<StudentRow, unknown>,
      key: (typeof FILTER_KEYS)[number],
      label: string,
      options: { value: string; label: string }[],
    ): ColumnDef<StudentRow, unknown> => withHeaderAddon(
      column,
      <ColumnFunnel
        label={label}
        value={filters.values[key]}
        onChange={(next) => filters.set(key, next)}
        options={options}
      />,
    );

    const text = (
      id: string,
      header: string,
      priority: 1 | 2 | 3,
      read: (row: StudentRow) => string,
      options?: { sortKey?: string; numeric?: boolean; width?: number },
    ): ColumnDef<StudentRow, unknown> => {
      const width = options?.width ?? 150;
      return {
        id,
        header,
        meta: {
          priority,
          shortLabel: header,
          sortKey: options?.sortKey,
          numeric: options?.numeric,
          plainText: (row) => read(row as StudentRow),
          width: { default: width, min: Math.min(width, 110) },
        },
        cell: ({ row }) => {
          const value = read(row.original);
          return options?.numeric ? <Ltr value={value} /> : value;
        },
      };
    };

    return [
      text("student_code", t("course.columns.student_code"), 1, (row) => shown(row.student_code), {
        sortKey: "student_code",
        numeric: true,
        width: 130,
      }),
      text("full_name", t("course.columns.full_name"), 1, (row) => shown(row.full_name ?? row.first_name), {
        sortKey: "first_name",
        width: 180,
      }),
      funnel(
        text("channel", t("studentDirectory.type"), 1, (row) => channelText(row.channel), { width: 120 }),
        "channel",
        t("studentDirectory.type"),
        [
          { value: "", label: t("studentDirectory.allTypes") },
          { value: "online", label: t("studentDirectory.online") },
          { value: "offline", label: t("studentDirectory.offline") },
        ],
      ),
      text("father_name", t("course.columns.father_name"), 2, (row) => shown(row.father_name), { width: 150 }),
      text("last_name", t("studentDirectory.lastName"), 3, (row) => shown(row.last_name), { width: 140 }),
      text("phone_number", t("course.columns.phone_number"), 2, (row) => shown(row.phone_number), {
        numeric: true,
        width: 140,
      }),
      text("whatsapp_number", t("course.columns.whatsapp_number"), 3, (row) => shown(row.whatsapp_number), {
        numeric: true,
        width: 140,
      }),
      text("emergency_phone_number", t("studentDirectory.emergencyPhone"), 3, (row) => shown(row.emergency_phone_number), {
        numeric: true,
        width: 150,
      }),
      text("email", t("course.columns.email"), 2, (row) => shown(row.email), { numeric: true, width: 200 }),
      text("national_id", t("studentDirectory.nationalId"), 3, (row) => shown(row.national_id), {
        numeric: true,
        width: 140,
      }),
      {
        id: "national_id_attachment",
        header: t("studentDirectory.nationalIdFile"),
        meta: {
          priority: 3,
          shortLabel: t("studentDirectory.nationalIdFile"),
          plainText: (row) => ((row as StudentRow).national_id_attachment_url ? t("studentDirectory.viewFile") : "—"),
          width: { default: 120, min: 100 },
        },
        cell: ({ row }) => {
          const url = row.original.national_id_attachment_url;
          if (!url) return "—";
          return (
            <a href={url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
              {t("studentDirectory.viewFile")}
            </a>
          );
        },
      },
      text("date_of_birth", t("studentDirectory.dateOfBirth"), 3, (row) => day(row.date_of_birth), {
        numeric: true,
        width: 130,
      }),
      funnel(
        text("gender", t("studentDirectory.gender"), 2, (row) => genderText(row.gender), { width: 120 }),
        "gender",
        t("studentDirectory.gender"),
        [
          { value: "", label: t("studentDirectory.allGenders") },
          { value: "male", label: t("studentDirectory.male") },
          { value: "female", label: t("studentDirectory.female") },
          { value: "other", label: t("studentDirectory.other") },
        ],
      ),
      text("acca_id", t("studentDirectory.accaId"), 3, (row) => shown(row.acca_id), { numeric: true, width: 120 }),
      funnel(
        text("academic_background", t("studentDirectory.background"), 3, (row) => backgroundText(row.academic_background), {
          width: 160,
        }),
        "academic_background",
        t("studentDirectory.background"),
        [
          { value: "", label: t("studentDirectory.allBackgrounds") },
          { value: "grade_12", label: t("studentDirectory.grade12") },
          { value: "undergraduate", label: t("studentDirectory.undergraduate") },
          { value: "bachelor", label: t("studentDirectory.bachelor") },
          { value: "master", label: t("studentDirectory.master") },
          { value: "doctorate", label: t("studentDirectory.doctorate") },
          { value: "other", label: t("studentDirectory.other") },
        ],
      ),
      text("address", t("studentDirectory.address"), 3, (row) => shown(row.address), { width: 200 }),
      text("user_name", t("course.columns.user_name"), 3, (row) => shown(row.user_name), { width: 160 }),
      text("classes", t("studentDirectory.classes"), 2, classesLabel, { width: 200 }),
      text("notes", t("studentDirectory.notes"), 3, (row) => shown(row.notes), { width: 180 }),
      text(
        "success_story",
        t("course.columns.success_story"),
        3,
        (row) => shown(row.success_stories_count ?? 0),
        { numeric: true, width: 120 },
      ),
      funnel(
        {
          id: "status",
          header: t("course.columns.status"),
          meta: {
            priority: 2,
            shortLabel: t("course.columns.status"),
            plainText: (row) => statusText((row as StudentRow).status),
            width: { default: 120, min: 100 },
          },
          cell: ({ row }) => <StatusBadge status={row.original.status} label={statusText(row.original.status)} />,
        },
        "status",
        t("course.columns.status"),
        [
          { value: "", label: t("studentDirectory.allStatuses") },
          { value: "active", label: gridT("common:status.active") },
          { value: "inactive", label: gridT("common:status.inactive") },
        ],
      ),
      text("created_at", t("course.columns.created_at"), 3, (row) => day(row.created_at), {
        sortKey: "created_at",
        numeric: true,
        width: 120,
      }),
      {
        ...actionsColumn<StudentRow>(
          gridT,
          (row) =>
            editDeleteActions({
              t: gridT,
              canUpdate,
              canDelete,
              updatePermission,
              deletePermission,
              onEdit: () => openEdit(row),
              onDelete: () => confirmDelete(nameOf(row), String(row.id), removeRow),
            }),
          true,
          statusToggle,
          (row) => [
            {
              id: "view",
              label: t("common.view"),
              icon: <Eye className="size-4" aria-hidden="true" />,
              permission: READ,
              onSelect: () => openView(row),
            },
            {
              id: "success-story",
              label: t("course.successStory"),
              icon: <Star className="size-4" aria-hidden="true" />,
              permission: updatePermission,
              onSelect: () => setStory({
                id: row.id,
                full_name: row.full_name,
                first_name: row.first_name,
                last_name: row.last_name,
                user_name: row.user_name,
              }),
            },
          ],
        ),
        meta: {
          priority: 1,
          alwaysVisible: true,
          exportable: false,
          shortLabel: gridT("common:fields.actions"),
          width: { default: 220, min: 180 },
        },
      },
    ];
  }, [
    canDelete,
    canUpdate,
    confirmDelete,
    deletePermission,
    filters,
    gridT,
    nameOf,
    openEdit,
    openView,
    removeRow,
    statusToggle,
    t,
    updatePermission,
  ]);

  const table = useDataTable<StudentRow>({
    key: "course.students",
    queryKey: (query) => courseQueryKeys.entity("lms-class-students", query),
    endpoint: "/students",
    readPermission: READ,
    columns,
    search: true,
    select: "multi",
    bulkActions,
    exports: ["print"],
    exportTitle: title,
    params: filters.params,
    syncUrl: true,
    defaultSort: "-created_at",
    defaultPerPage: 25,
    perPageOptions: [25, 50, 100, 200],
    getRowId: (row) => String(row.id),
  });

  const newLabel = t("course.classStudents.addStudent");

  return (
    <>
      <ServerDataTable
        api={table}
        entityLabel={title}
        searchPlaceholder={t("studentDirectory.search")}
        emptyTitle={t("studentDirectory.empty")}
        emptyBody={entityDescription("lms-class-students")}
        emptyAction={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
        narrowed={filters.narrowed}
        onRowDoubleClick={canUpdate ? openEdit : openView}
        stickyHeader
        toolsInHeader
        extra={<NewButton show={canCreate} onNew={openNew} label={newLabel} />}
      />
      <Drawer open={editor !== null} onClose={closeEditor}>
        <DrawerOverlay />
        <DrawerContent className="w-[42%] min-w-[480px]">
          {editor ? (
            <CourseEntityFormDrawer
              slug="lms-class-students"
              entityTitle={title}
              mode={editor.mode}
              entityId={editor.id}
              onSuccess={closeEditor}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
      <StudentSuccessStoryDrawer open={story !== null} onClose={() => setStory(null)} row={story} />
    </>
  );
}

const StudentsPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription } = useCourseI18n();
  const filters = useUrlFilters(FILTER_KEYS);
  const title = entityTitle("lms-class-students");

  if (!hasPermission(READ)) return <PermissionDeniedCard />;

  return (
    <div className="min-w-0 max-w-full space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{entityDescription("lms-class-students")}</p>
        <div className="mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: title },
            ]}
          />
        </div>
      </div>
      <StudentsList filters={filters} />
    </div>
  );
};

export default StudentsPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditPencil, NavArrowLeft, Plus, Trash } from "iconoir-react";
import { toast } from "sonner";
import {
  useCourseEntityList,
  useCreateCourseEntity,
  useDeleteCourseEntity,
  useUpdateCourseEntity,
  getCourseListFromResponse,
  type CourseRow,
} from "../../hooks/useCourseEntity";
import { COURSE_ENTITY_REGISTRY } from "../../data/courseRegistry";
import { coursePermission } from "../../data/courseEntityFormRegistry";
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
  ImageDropzone,
  Input,
  Label,
  Spinner,
  confirmPresets,
  useConfirmDialog,
} from "@/components/ui";
import { Can, useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";

interface MainCategorySubCategoriesDrawerProps {
  open: boolean;
  onClose: () => void;
  mainCategoryId: number | null;
  mainCategoryTitle: string;
}

type SubCategoryFormState = {
  title: string;
  description: string;
  status: "active" | "inactive";
  thumbnailFile: File | null;
};

const EMPTY_FORM: SubCategoryFormState = {
  title: "",
  description: "",
  status: "active",
  thumbnailFile: null,
};

const SUB_PERMISSION_BASE = COURSE_ENTITY_REGISTRY["sub-categories"].permission;

function getTitle(row: CourseRow): string {
  return typeof row.title === "string" && row.title.trim().length > 0 ? row.title.trim() : "Untitled";
}

function getInitials(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return title.slice(0, 2).toUpperCase();
}

function getThumbnailUrl(row: CourseRow): string | null {
  const url = row.thumbnail_url;
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}

function SubCategoryCardImage({ row }: { row: CourseRow }) {
  const [failed, setFailed] = useState(false);
  const title = getTitle(row);
  const src = getThumbnailUrl(row);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-t-xl bg-primary/10 text-2xl font-bold text-primary">
        {getInitials(title)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      className="h-32 w-full rounded-t-xl object-cover"
      onError={() => setFailed(true)}
    />
  );
}

const MainCategorySubCategoriesDrawer = ({
  open,
  onClose,
  mainCategoryId,
  mainCategoryTitle,
}: MainCategorySubCategoriesDrawerProps) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { confirm } = useConfirmDialog();

  const [mode, setMode] = useState<"grid" | "form">("grid");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SubCategoryFormState>(EMPTY_FORM);
  const [editingThumbnailUrl, setEditingThumbnailUrl] = useState<string | null>(null);

  const { data, isFetching, error } = useCourseEntityList(
    "sub-categories",
    {
      main_category_id: mainCategoryId ?? undefined,
      page: 1,
      per_page: 100,
      sort_by: "title",
      sort_dir: "asc",
    },
    { enabled: open && mainCategoryId != null }
  );

  const rows = getCourseListFromResponse(data);

  const { mutate: createSub, isPending: creating } = useCreateCourseEntity("sub-categories");
  const { mutate: updateSub, isPending: updating } = useUpdateCourseEntity("sub-categories");
  const { mutate: deleteSub, isPending: deleting } = useDeleteCourseEntity("sub-categories");
  const saving = creating || updating;

  const canCreate = hasPermission(coursePermission(SUB_PERMISSION_BASE, "create"));
  const canUpdate = hasPermission(coursePermission(SUB_PERMISSION_BASE, "update"));
  const canDelete = hasPermission(coursePermission(SUB_PERMISSION_BASE, "delete"));

  // Reset to grid whenever the drawer is (re)opened for a category.
  useEffect(() => {
    if (open) {
      setMode("grid");
      setEditingId(null);
      setForm(EMPTY_FORM);
      setEditingThumbnailUrl(null);
    }
  }, [open, mainCategoryId]);

  const openCreateForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditingThumbnailUrl(null);
    setMode("form");
  }, []);

  const openEditForm = useCallback((row: CourseRow) => {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    if (Number.isNaN(id)) return;
    setEditingId(id);
    setForm({
      title: typeof row.title === "string" ? row.title : "",
      description: typeof row.description === "string" ? row.description : "",
      status: String(row.status ?? "active") === "inactive" ? "inactive" : "active",
      thumbnailFile: null,
    });
    setEditingThumbnailUrl(getThumbnailUrl(row));
    setMode("form");
  }, []);

  const backToGrid = useCallback(() => {
    setMode("grid");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditingThumbnailUrl(null);
  }, []);

  const handleDelete = useCallback(
    (row: CourseRow) => {
      const id = typeof row.id === "number" ? row.id : Number(row.id);
      if (Number.isNaN(id) || deleting) return;
      void confirm(confirmPresets.delete(getTitle(row))).then((ok: boolean) => {
        if (!ok) return;
        deleteSub(id, {
          onSuccess: () => toast.success(t("subCategories.deleted")),
          onError: (e: unknown) =>
            toast.error(e instanceof Error ? e.message : t("subCategories.deleteFailed")),
        });
      });
    },
    [confirm, deleteSub, deleting, t]
  );

  const handleSubmit = useCallback(() => {
    if (mainCategoryId == null || saving) return;
    const title = form.title.trim();
    if (!title) {
      toast.error(t("subCategories.titleRequired"));
      return;
    }

    const body: Record<string, unknown> = {
      main_category_id: mainCategoryId,
      title,
      description: form.description.trim() || undefined,
      status: form.status,
    };
    if (form.thumbnailFile) body.thumbnail_file = form.thumbnailFile;

    if (editingId != null) {
      updateSub(
        { id: editingId, body },
        {
          onSuccess: () => {
            toast.success(t("subCategories.updated"));
            backToGrid();
          },
          onError: (e: unknown) =>
            toast.error(e instanceof Error ? e.message : t("subCategories.saveFailed")),
        }
      );
    } else {
      createSub(body, {
        onSuccess: () => {
          toast.success(t("subCategories.created"));
          backToGrid();
        },
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : t("subCategories.saveFailed")),
      });
    }
  }, [backToGrid, createSub, editingId, form, mainCategoryId, saving, t, updateSub]);

  const gridBody = useMemo(() => {
    if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
    if (isFetching) {
      return (
        <div className="flex min-h-[200px] items-center justify-center py-8">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
          <p className="text-sm text-muted-foreground">{t("subCategories.empty")}</p>
          <Can permission={coursePermission(SUB_PERMISSION_BASE, "create")}>
            <Button type="button" size="sm" onClick={openCreateForm} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("subCategories.addNew")}
            </Button>
          </Can>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((row: CourseRow) => {
          const title = getTitle(row);
          const status = String(row.status ?? "").toLowerCase();
          const isActive = status === "active";
          return (
            <div
              key={String(row.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <SubCategoryCardImage row={row} />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground" title={title}>
                    {title}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}
                  >
                    {isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
                {typeof row.description === "string" && row.description.trim() ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{row.description}</p>
                ) : null}
                {(canUpdate || canDelete) && (
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 gap-1.5"
                        onClick={() => openEditForm(row)}
                      >
                        <EditPencil className="h-3.5 w-3.5" />
                        {t("common.edit")}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => handleDelete(row)}
                        disabled={deleting}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [
    canDelete,
    canUpdate,
    deleting,
    error,
    handleDelete,
    isFetching,
    openCreateForm,
    openEditForm,
    rows,
    t,
  ]);

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent side="right" className="w-[70vw] min-w-0">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle>{t("subCategories.title")}</DrawerTitle>
              <DrawerDescription className="line-clamp-2">
                {t("subCategories.under")}{" "}
                <span className="font-medium text-foreground">{mainCategoryTitle}</span>
              </DrawerDescription>
            </div>
            {mode === "grid" && canCreate && (
              <Button type="button" size="sm" className="shrink-0 gap-2" onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                {t("subCategories.addNew")}
              </Button>
            )}
          </div>
        </DrawerHeader>

        {mode === "grid" ? (
          <DrawerBody className="space-y-3">{gridBody}</DrawerBody>
        ) : (
          <>
            <DrawerBody className="space-y-5">
              <button
                type="button"
                onClick={backToGrid}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <NavArrowLeft className="h-4 w-4" />
                {t("subCategories.backToList")}
              </button>

              <div className="space-y-1.5">
                <Label htmlFor="sub-cat-title">
                  {t("common.title")}
                  <span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="sub-cat-title"
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder={t("subCategories.titlePlaceholder")}
                  maxLength={128}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sub-cat-desc">{t("common.description")}</Label>
                <textarea
                  id="sub-cat-desc"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder={t("subCategories.descriptionPlaceholder")}
                  maxLength={512}
                  rows={3}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sub-cat-status">{t("common.status")}</Label>
                <select
                  id="sub-cat-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, status: e.target.value === "inactive" ? "inactive" : "active" }))
                  }
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="active">{t("common.active")}</option>
                  <option value="inactive">{t("common.inactive")}</option>
                </select>
              </div>

              <ImageDropzone
                accept="image/*"
                label={t("subCategories.image")}
                hint={t("subCategories.imageHint")}
                previewMode="wide"
                value={form.thumbnailFile}
                onSelect={(file) => setForm((s) => ({ ...s, thumbnailFile: file }))}
                initialPreviewUrl={form.thumbnailFile ? null : editingThumbnailUrl}
              />
            </DrawerBody>
            <DrawerFooter>
              <Button type="button" variant="outline" onClick={backToGrid} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleSubmit} loading={saving}>
                {editingId != null ? t("common.saveChanges") : t("common.create")}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default MainCategorySubCategoriesDrawer;

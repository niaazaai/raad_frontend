import { useEffect, useState } from "react";
import { Trash } from "iconoir-react";
import { toast } from "sonner";
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
  Spinner,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import type { CourseRow } from "../../hooks/useCourseEntity";
import {
  extractStudentSuccessStoriesFromResponse,
  useCreateStudentSuccessStory,
  useDeleteStudentSuccessStory,
  useStudentSuccessStories,
} from "../../hooks/useStudentSuccessStories";

interface StudentSuccessStoryDrawerProps {
  open: boolean;
  onClose: () => void;
  row: CourseRow | null;
}

function getStudentDisplayName(row: CourseRow): string {
  const full = String(row.full_name ?? "").trim();
  if (full) return full;
  const first = String(row.first_name ?? "").trim();
  const last = String(row.last_name ?? "").trim();
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return String(row.user_name ?? "Student");
}

const StudentSuccessStoryDrawer = ({ open, onClose, row }: StudentSuccessStoryDrawerProps) => {
  const { t } = useTranslation();
  const studentId = row?.id != null ? Number(row.id) : null;
  const validId = studentId != null && !Number.isNaN(studentId) ? studentId : null;

  const { data, isLoading } = useStudentSuccessStories(validId, open);
  const stories = extractStudentSuccessStoriesFromResponse(data);
  const createStory = useCreateStudentSuccessStory(validId ?? 0);
  const deleteStory = useDeleteStudentSuccessStory(validId ?? 0);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) setImageFile(null);
  }, [open, validId]);

  const handleAdd = async () => {
    if (!validId || !imageFile) {
      toast.error(t("course.successStoryModal.imageRequired"));
      return;
    }
    try {
      await createStory.mutateAsync(imageFile);
      setImageFile(null);
      toast.success(t("course.successStoryModal.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("course.updateFailed"));
    }
  };

  const handleDelete = async (storyId: number) => {
    if (!validId) return;
    try {
      await deleteStory.mutateAsync(storyId);
      toast.success(t("course.successStoryModal.removed"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("course.updateFailed"));
    }
  };

  if (!row) return null;

  const displayName = getStudentDisplayName(row);
  const studentCode = row.student_code ? String(row.student_code) : null;
  const isBusy = createStory.isPending || deleteStory.isPending;

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent className="w-[min(640px,96vw)] min-w-[320px]">
        <DrawerHeader>
          <DrawerTitle>{t("course.successStoryModal.title")}</DrawerTitle>
          <DrawerDescription>{t("course.successStoryModal.description")}</DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("course.columns.full_name")}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{displayName}</p>
            {studentCode ? (
              <p className="mt-1 font-mono text-sm text-primary">{studentCode}</p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : stories.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stories.map((story) => {
                const url = typeof story.image_url === "string" ? story.image_url : null;
                return (
                  <div
                    key={story.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/20"
                  >
                    {url ? (
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={t("course.successStoryModal.remove")}
                      className="absolute end-2 top-2 rounded-md bg-danger/90 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      disabled={isBusy}
                      onClick={() => void handleDelete(story.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("course.successStoryModal.noStories")}</p>
          )}

          <ImageDropzone
            accept="image/jpeg,image/png,image/webp,image/gif"
            label={t("course.successStoryModal.imageLabel")}
            hint={t("course.successStoryModal.imageHint")}
            value={imageFile}
            onSelect={setImageFile}
            previewMode="square"
          />
        </DrawerBody>

        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
            {t("common.cancel")}
          </Button>
          <Button type="button" loading={createStory.isPending} disabled={isBusy || !imageFile} onClick={() => void handleAdd()}>
            {t("course.successStoryModal.addStory")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default StudentSuccessStoryDrawer;

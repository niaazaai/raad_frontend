import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  ImageDropzone,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/components/ui";
import { useUpdateCourseEntity, type CourseRow } from "../../hooks/useCourseEntity";
import { useTranslation } from "@/i18n/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { PUBLIC_QUERY_KEYS } from "@/data/constants/publicEndpoints";

interface StudentSuccessStoryModalProps {
  open: boolean;
  onClose: () => void;
  row: CourseRow | null;
}

function getStudentDisplayName(row: CourseRow): string {
  const first = String(row.first_name ?? "").trim();
  const last = String(row.last_name ?? "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return String(row.user_name ?? "Student");
}

const StudentSuccessStoryModal = ({ open, onClose, row }: StudentSuccessStoryModalProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutateAsync: updateStudent, isPending } = useUpdateCourseEntity("lms-class-students");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const existingUrl =
    typeof row?.success_story_image_url === "string" ? row.success_story_image_url : null;

  useEffect(() => {
    if (open) {
      setImageFile(null);
    }
  }, [open, row?.id]);

  const handleSave = async () => {
    const id = row?.id;
    const idNum = typeof id === "number" ? id : Number(id);
    if (Number.isNaN(idNum)) return;

    if (!imageFile && !existingUrl) {
      toast.error(t("course.successStoryModal.imageRequired"));
      return;
    }

    try {
      const body: Record<string, unknown> = {};
      if (imageFile) {
        body.success_story_image_file = imageFile;
      }
      await updateStudent({ id: idNum, body });
      await queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccess });
      await queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccessAll });
      toast.success(t("course.successStoryModal.saved"));
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("course.updateFailed"));
    }
  };

  const handleRemove = async () => {
    const id = row?.id;
    const idNum = typeof id === "number" ? id : Number(id);
    if (Number.isNaN(idNum) || !existingUrl) return;

    try {
      await updateStudent({ id: idNum, body: { remove_success_story_image: true } });
      await queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccess });
      await queryClient.invalidateQueries({ queryKey: PUBLIC_QUERY_KEYS.studentSuccessAll });
      toast.success(t("course.successStoryModal.removed"));
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("course.updateFailed"));
    }
  };

  if (!row) return null;

  const displayName = getStudentDisplayName(row);
  const studentCode = row.student_code ? String(row.student_code) : null;
  const email = row.email ? String(row.email) : null;
  const phone = row.phone_number ? String(row.phone_number) : null;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalOverlay />
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{t("course.successStoryModal.title")}</ModalTitle>
          <ModalDescription>{t("course.successStoryModal.description")}</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("course.columns.full_name")}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{displayName}</p>
            {studentCode ? (
              <p className="mt-1 font-mono text-sm text-primary">{studentCode}</p>
            ) : null}
            {email ? <p className="mt-2 text-sm text-muted-foreground">{email}</p> : null}
            {phone ? <p className="text-sm text-muted-foreground">{phone}</p> : null}
          </div>

          <ImageDropzone
            accept="image/jpeg,image/png,image/webp,image/gif"
            label={t("course.successStoryModal.imageLabel")}
            hint={t("course.successStoryModal.imageHint")}
            value={imageFile}
            onSelect={setImageFile}
            previewMode="square"
            initialPreviewUrl={imageFile ? null : existingUrl}
          />
        </ModalBody>
        <ModalFooter>
          {existingUrl ? (
            <Button
              type="button"
              variant="destructive"
              className="me-auto"
              loading={isPending}
              disabled={isPending}
              onClick={() => void handleRemove()}
            >
              {t("course.successStoryModal.remove")}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="button" loading={isPending} disabled={isPending} onClick={() => void handleSave()}>
            {t("common.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StudentSuccessStoryModal;

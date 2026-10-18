import { motion, useReducedMotion } from "motion/react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui";
import { Modal, ModalContent, ModalOverlay } from "@/components/ui/modal";
import { useTranslation } from "@/i18n/useTranslation";

interface UnitOrderModalProps {
  open: boolean;
  firstUnitLabel: string;
  targetUnitLabel: string;
  onStartFirst: () => void;
  onContinue: () => void;
  onClose: () => void;
}

const UnitOrderModal = ({
  open,
  firstUnitLabel,
  targetUnitLabel,
  onStartFirst,
  onContinue,
  onClose,
}: UnitOrderModalProps) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const fill = (text: string) =>
    text.replace("{first}", firstUnitLabel).replace("{target}", targetUnitLabel);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalOverlay />
      <ModalContent className="max-w-md overflow-hidden">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </span>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t("coursePlayer.unitGateTitle")}
            </h2>
            <p className="text-sm font-medium text-foreground">
              {fill(t("coursePlayer.unitGateBody"))}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("coursePlayer.unitGateHint")}
            </p>
          </div>
          <div className="mt-2 flex w-full flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={onContinue}>
              {t("coursePlayer.unitGateContinue")}
            </Button>
            <Button type="button" className="flex-1" onClick={onStartFirst} autoFocus>
              {fill(t("coursePlayer.unitGateStart"))}
            </Button>
          </div>
        </motion.div>
      </ModalContent>
    </Modal>
  );
};

export default UnitOrderModal;

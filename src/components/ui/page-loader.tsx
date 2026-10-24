import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

interface PageLoaderProps {
  className?: string;
}

const PageLoader = ({ className }: PageLoaderProps) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-screen w-full items-center justify-center bg-background",
        className
      )}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-primary/5 ring-1 ring-primary/10">
          <Spinner className="h-20 w-20 text-primary" />
        </div>
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          {t("common.loading")}
        </p>
      </motion.div>
    </div>
  );
};

export default PageLoader;

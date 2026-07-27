import { useMemo } from "react";
import { Link } from "react-router-dom";
import { NavArrowRight } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Spinner } from "@/components/ui/spinner";
import { usePublicStudentSuccess, getPublicListFromResponse } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

const SuccessStoriesSection = () => {
  const { t } = useTranslation();
  const { data, isLoading } = usePublicStudentSuccess(4);
  const students = useMemo(() => getPublicListFromResponse<{
    id: number;
    full_name: string;
    profile_image_url?: string | null;
    grade?: string | null;
  }>(data), [data]);

  return (
    <section id="success-stories" className={`${sectionShellClass} ${sectionSurface.primary}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
          <span className={sectionBadgeClass}>{t("success.badge")}</span>
          <h2 className={`${sectionTitleClass} mt-4 max-w-2xl`}>{t("success.title")}</h2>
          <p className={`${sectionSubtitleClass} mx-auto`}>{t("success.subtitle")}</p>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("success.empty")}</p>
        ) : (
          <ScrollReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {students.map((student) => (
              <article
                key={student.id}
                className="flex flex-col items-center rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm"
              >
                {student.profile_image_url ? (
                  <img
                    src={student.profile_image_url}
                    alt={student.full_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                    {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
                <h3 className="mt-4 text-base font-semibold text-foreground">{student.full_name}</h3>
                {student.grade ? (
                  <span className="mt-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    {student.grade}
                  </span>
                ) : null}
              </article>
            ))}
          </ScrollReveal>
        )}

        <ScrollReveal className="mt-10 flex justify-center">
          <Link
            to="/student-success"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/15"
          >
            {t("success.viewAll")}
            <NavArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;

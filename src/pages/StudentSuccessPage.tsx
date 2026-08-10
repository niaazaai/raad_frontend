import { useMemo } from "react";
import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Spinner } from "@/components/ui/spinner";
import { usePublicStudentSuccessAll, getPublicListFromResponse } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const StudentSuccessPage = () => {
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();
  const { data, isLoading } = usePublicStudentSuccessAll({ per_page: 100 });
  const students = useMemo(() => getPublicListFromResponse<{
    id: number;
    full_name: string;
    profile_image_url?: string | null;
    success_story_image_url?: string | null;
    grade?: string | null;
    student_code?: string;
  }>(data), [data]);

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <section className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} text-center`}>
          <span className={sectionBadgeClass}>{t("success.badge")}</span>
          <h1 className={`${sectionTitleClass} mt-3`}>{t("success.pageTitle")}</h1>
          <p className={`${sectionSubtitleClass} mx-auto`}>{t("success.pageSubtitle")}</p>
        </div>
      </section>

      <section className={`${sectionShellClass} border-t border-border/60`}>
        <div className={sectionInnerClass}>
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t("success.empty")}</p>
          ) : (
            <ScrollReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {students.map((student) => {
                const imageUrl = student.success_story_image_url ?? student.profile_image_url;
                return (
                <article
                  key={student.id}
                  className="flex flex-col items-center rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={student.full_name} className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                      {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <h2 className="mt-4 text-lg font-semibold text-foreground">{student.full_name}</h2>
                  {student.student_code ? (
                    <p className="mt-1 text-xs text-muted-foreground">{student.student_code}</p>
                  ) : null}
                  {student.grade ? (
                    <span className="mt-3 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                      {student.grade}
                    </span>
                  ) : null}
                </article>
              );
              })}
            </ScrollReveal>
          )}
        </div>
      </section>

      <WebsiteFooter />
    </>
  );
};

export default StudentSuccessPage;

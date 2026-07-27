import { useMemo, useState } from "react";
import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import PublicCourseCard from "@/components/website/PublicCourseCard";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getPublicCoursesFromResponse,
  getPublicCoursesPagination,
  usePublicCourses,
} from "@/hooks";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { useTranslation } from "@/i18n/useTranslation";
import { sectionInnerClass, sectionShellClass, sectionSubtitleClass, sectionTitleClass } from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

function coursePublicViewPath(courseId: number): string {
  return `/course/courses/${courseId}/view`;
}

const ExploreCoursesPage = () => {
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data, isLoading, isFetching, isError } = usePublicCourses({ page, per_page: perPage });
  const courses = useMemo(() => getPublicCoursesFromResponse(data), [data]);
  const pagination = useMemo(() => getPublicCoursesPagination(data), [data]);

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <main className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={sectionInnerClass}>
          <div className="mb-10 text-center md:mb-12">
            <h1 className={sectionTitleClass}>{t("explore.title")}</h1>
            <p className={`${sectionSubtitleClass} mx-auto`}>{t("explore.subtitle")}</p>
          </div>

          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-center text-muted-foreground">{t("explore.error")}</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("explore.empty")}</p>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <PublicCourseCard key={course.id} course={course} enrollHref={coursePublicViewPath(course.id)} />
                ))}
              </div>

              {pagination && pagination.total_pages > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <NavArrowLeft className="h-4 w-4" />
                    {t("explore.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t("explore.page")} {pagination.current_page} {t("explore.of")} {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.has_more_pages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    {t("explore.next")}
                    <NavArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      <WebsiteFooter />
    </>
  );
};

export default ExploreCoursesPage;

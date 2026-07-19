import { Link } from "react-router-dom";
import { BookStack, NavArrowRight } from "iconoir-react";
import { COURSE_ENTITY_REGISTRY, COURSE_ENTITY_SLUGS, type CourseEntitySlug } from "../../data/courseRegistry";
import { COURSE_SIDEBAR_ORDER } from "../../data/courseSidebarNav";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useCourseI18n } from "../../hooks/useCourseI18n";

const CourseHub = () => {
  const { hasPermission } = useAuth();
  const { entityTitle, entityDescription, t } = useCourseI18n();

  const visible = COURSE_ENTITY_SLUGS.filter(
    (slug) =>
      COURSE_SIDEBAR_ORDER.includes(slug) && hasPermission(COURSE_ENTITY_REGISTRY[slug].permission)
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BookStack className="text-primary h-8 w-8 stroke-[1.5]" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("course.hubTitle")}</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {t("course.hubSubtitle")}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <PermissionDeniedCard />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((slug) => (
            <Link key={slug} to={slug === "courses" ? "/course/courses" : `/course/${slug}`}>
              <Card className="hover:border-primary/40 h-full transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">
                    {entityTitle(slug as CourseEntitySlug)}
                  </CardTitle>
                  <NavArrowRight className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-snug">
                    {entityDescription(slug as CourseEntitySlug)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseHub;

import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import HeroSection from "@/components/website/sections/HeroSection";
import AboutSection from "@/components/website/sections/AboutSection";
import MissionVisionSection from "@/components/website/sections/MissionVisionSection";
import QualificationsSection from "@/components/website/sections/QualificationsSection";
import SuccessStoriesSection from "@/components/website/sections/SuccessStoriesSection";
import BlogPreviewSection from "@/components/website/sections/BlogPreviewSection";
import ContactCtaSection from "@/components/website/sections/ContactCtaSection";
import ScrollReveal from "@/components/website/ScrollReveal";
import PublicCourseCard from "@/components/website/PublicCourseCard";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { NavArrowRight } from "iconoir-react";
import { getPublicCoursesFromResponse, usePublicCourses } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { useMemo } from "react";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSubtitleClass,
  sectionTitleClass,
  sectionSurface,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

function coursePublicViewPath(courseId: number): string {
  return `/course/courses/${courseId}/view`;
}

const ProgramsSection = () => {
  const { t } = useTranslation();
  const { data, isLoading } = usePublicCourses({ page: 1, per_page: 3 });
  const latestCourses = useMemo(() => getPublicCoursesFromResponse(data).slice(0, 3), [data]);

  return (
    <section id="programs" className={`${sectionShellClass} ${sectionSurface.muted}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mb-12">
          <div>
            <span className={sectionBadgeClass}>{t("programs.badge")}</span>
            <h2 className={`${sectionTitleClass} mt-3`}>{t("programs.title")}</h2>
            <p className={sectionSubtitleClass}>{t("programs.subtitle")}</p>
          </div>
          <Button asChild variant="outline" className="h-auto shrink-0 gap-2 rounded-full px-6 py-2.5">
            <a href="/explore-courses" className="inline-flex items-center gap-2">
              {t("programs.viewAll")}
              <NavArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : latestCourses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("programs.empty")}</p>
          </div>
        ) : (
          <ScrollReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" distance={24}>
            {latestCourses.map((course) => (
              <PublicCourseCard key={course.id} course={course} enrollHref={coursePublicViewPath(course.id)} />
            ))}
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};

const LandingPage = () => {
  const loginHref = resolveLoginHref();

  return (
    <>
      <LandingNavbar loginHref={loginHref} />
      <HeroSection />
      <AboutSection />
      <MissionVisionSection />
      <ProgramsSection />
      <QualificationsSection />
      <BlogPreviewSection />
      <SuccessStoriesSection />
      <ContactCtaSection />
      <WebsiteFooter />
    </>
  );
};

export default LandingPage;

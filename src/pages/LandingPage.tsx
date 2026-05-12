import { useMemo } from "react";
import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import HeroSection from "@/components/website/sections/HeroSection";
import StatsSection from "@/components/website/sections/StatsSection";
import AboutSection from "@/components/website/sections/AboutSection";
import MissionVisionSection from "@/components/website/sections/MissionVisionSection";
import QualificationsSection from "@/components/website/sections/QualificationsSection";
import CampusSection from "@/components/website/sections/CampusSection";
import TeamSection from "@/components/website/sections/TeamSection";
import SuccessStoriesSection from "@/components/website/sections/SuccessStoriesSection";
import ContactSection from "@/components/website/sections/ContactSection";
import ScrollReveal from "@/components/website/ScrollReveal";
import PublicCourseCard from "@/components/website/PublicCourseCard";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { NavArrowRight } from "iconoir-react";
import { getPublicCoursesFromResponse, usePublicCourses } from "@/hooks";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

function coursePublicViewPath(courseId: number): string {
  return `/course/courses/${courseId}/view`;
}

const ProgramsSection = () => {
  const { data, isLoading } = usePublicCourses({ page: 1, per_page: 3 });
  const latestCourses = useMemo(
    () => getPublicCoursesFromResponse(data).slice(0, 3),
    [data],
  );

  return (
    <section id="programs" className="bg-[#050a18] py-20 md:py-24">
      {/* Faint gradient band */}
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* Header */}
        <ScrollReveal className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="mb-3 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Programs
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Internationally Recognized Programs
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
              Globally accredited qualifications delivered by industry professionals — built for career impact.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-auto shrink-0 gap-2 rounded-full border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10 hover:text-white"
          >
            <a href="/explore-courses" className="inline-flex items-center gap-2">
              View all programs
              <NavArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </ScrollReveal>

        {/* Course grid */}
        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner className="h-8 w-8 text-white/30" />
          </div>
        ) : latestCourses.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] py-16 text-center">
            <p className="text-sm text-white/40">
              No programs available yet — check back soon.
            </p>
          </div>
        ) : (
          <ScrollReveal
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            direction="up"
            distance={30}
          >
            {latestCourses.map((course) => (
              <PublicCourseCard
                key={course.id}
                course={course}
                enrollHref={coursePublicViewPath(course.id)}
              />
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
    <div id="top" className="scroll-smooth bg-[#050a18] text-foreground">
      <LandingNavbar loginHref={loginHref} />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Stats */}
      <StatsSection />

      {/* 3. About */}
      <AboutSection />

      {/* 4. Mission & Vision */}
      <MissionVisionSection />

      {/* 5. Programs (API-driven) */}
      <ProgramsSection />

      {/* 6. Qualifications */}
      <QualificationsSection />

      {/* 7. Campus */}
      <CampusSection />

      {/* 8. Team */}
      <TeamSection />

      {/* 9. Success Stories */}
      <SuccessStoriesSection />

      {/* 10. Contact */}
      <ContactSection />

      {/* Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default LandingPage;

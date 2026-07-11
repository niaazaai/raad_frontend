import ScrollReveal from "@/components/website/ScrollReveal";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

const stories = [
  {
    name: "Khalid Rahmani",
    role: "Senior Auditor, Big4 Firm",
    company: "Kabul, Afghanistan",
    text: "Raad's ACCA preparation program gave me the foundation I needed to pass all my exams on the first attempt.",
    initials: "KR",
    outcome: "ACCA Qualified",
  },
  {
    name: "Fatima Sultani",
    role: "Finance Manager",
    company: "International NGO",
    text: "Two years later, I'm managing finances for an international organization. Raad made this possible.",
    initials: "FS",
    outcome: "CMA Certified",
  },
  {
    name: "Omar Hashimi",
    role: "CFO",
    company: "Leading Afghan Bank",
    text: "The practical approach and real-world case studies prepared me for challenges I face every day in banking.",
    initials: "OH",
    outcome: "CPA Qualified",
  },
];

const SuccessStoriesSection = () => {
  return (
    <section id="success-stories" className={`${sectionShellClass} ${sectionSurface.primary}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-12 flex flex-col items-center text-center md:mb-14">
          <span className={sectionBadgeClass}>Success Stories</span>
          <h2 className={`${sectionTitleClass} mt-4 max-w-2xl`}>Our Graduates Are Making Their Mark</h2>
          <p className={`${sectionSubtitleClass} mx-auto`}>
            Hear from professionals who transformed their careers with Raad.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid gap-5 md:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.name}
              className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition hover:border-primary/25 md:p-7"
            >
              <span className="mb-2 select-none font-serif text-5xl leading-none text-primary/20" aria-hidden>
                &ldquo;
              </span>
              <p className="text-sm italic leading-relaxed text-foreground/80">{story.text}</p>
              <div className="my-5 h-px w-full bg-border" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {story.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{story.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {story.role} · {story.company}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {story.outcome}
                </span>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;

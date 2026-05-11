import ScrollReveal from "@/components/website/ScrollReveal";

interface Story {
  name: string;
  role: string;
  company: string;
  text: string;
  initials: string;
  outcome: string;
}

const stories: Story[] = [
  {
    name: "Khalid Rahmani",
    role: "Senior Auditor, Big4 Firm",
    company: "Kabul, Afghanistan",
    text: "Raad's ACCA preparation program gave me the foundation I needed to pass all my exams on the first attempt. The instructors are world-class and the support is unmatched.",
    initials: "KR",
    outcome: "ACCA Qualified",
  },
  {
    name: "Fatima Sultani",
    role: "Finance Manager",
    company: "International NGO",
    text: "I joined Raad as a fresh graduate with no accounting background. Two years later, I'm managing finances for an international organization. Raad made this possible.",
    initials: "FS",
    outcome: "CMA Certified",
  },
  {
    name: "Omar Hashimi",
    role: "CFO",
    company: "Leading Afghan Bank",
    text: "The quality of education at Raad is genuinely world-class. The practical approach and real-world case studies prepared me for challenges I face every day in banking.",
    initials: "OH",
    outcome: "CPA Qualified",
  },
];

const SuccessStoriesSection = () => {
  return (
    <section id="success-stories" className="bg-[#030710] py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* Section header */}
        <ScrollReveal className="mb-14 flex flex-col items-center text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Success Stories
          </span>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            Our Graduates Are Making Their Mark
          </h2>
          <p className="mt-4 max-w-xl text-base text-white/55">
            Hear from professionals who transformed their careers with Raad.
          </p>
        </ScrollReveal>

        {/* Testimonials — horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide sm:overflow-visible sm:pb-0 md:grid md:grid-cols-3">
          {stories.map((story, i) => (
            <ScrollReveal
              key={story.name}
              delay={i * 0.1}
              className="min-w-[300px] flex-shrink-0 sm:min-w-0"
            >
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.06]">
                {/* Large quote mark */}
                <span
                  className="mb-2 select-none font-serif text-6xl leading-none text-primary/20"
                  aria-hidden
                >
                  &ldquo;
                </span>

                {/* Quote text */}
                <p className="text-sm italic leading-relaxed text-white/75">
                  {story.text}
                </p>

                {/* Divider */}
                <div className="my-5 h-px w-full bg-white/[0.08]" />

                {/* Author row */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {story.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {story.name}
                    </p>
                    <p className="truncate text-xs text-white/50">
                      {story.role} &middot; {story.company}
                    </p>
                  </div>
                </div>

                {/* Outcome badge */}
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                    {story.outcome}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;

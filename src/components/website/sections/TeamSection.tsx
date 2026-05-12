import ScrollReveal from "@/components/website/ScrollReveal";

type MemberColor = "primary" | "auxiliary";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: MemberColor;
}

const team: TeamMember[] = [
  {
    name: "Ahmad Karimi",
    role: "CEO & Founder",
    bio: "ACCA Fellow with 20+ years in professional education.",
    initials: "AK",
    color: "primary",
  },
  {
    name: "Mariam Ahmadi",
    role: "Academic Director",
    bio: "Former Big4 auditor. ACCA examiner and mentor.",
    initials: "MA",
    color: "auxiliary",
  },
  {
    name: "Najibullah Wafa",
    role: "Lead Instructor",
    bio: "CPA, CMA certified. Finance & accounting specialist.",
    initials: "NW",
    color: "primary",
  },
  {
    name: "Zarghona Noori",
    role: "Student Success Manager",
    bio: "Dedicated to student outcomes and career placement.",
    initials: "ZN",
    color: "auxiliary",
  },
];

const avatarStyles: Record<MemberColor, string> = {
  primary: "bg-primary/20 text-primary",
  auxiliary: "bg-auxiliary/20 text-auxiliary",
};

const roleStyles: Record<MemberColor, string> = {
  primary: "text-primary",
  auxiliary: "text-auxiliary",
};

const TeamSection = () => {
  return (
    <section id="team" className="bg-[#050a18] py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">

        {/* Section header */}
        <ScrollReveal className="mb-14 flex flex-col items-center text-center">
          <div>
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Team
            </span>
          </div>
          <div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Meet the Experts Behind Your Success
            </h2>
          </div>
        </ScrollReveal>

        {/* Team grid — each card is a direct child of ScrollReveal for stagger */}
        <ScrollReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(({ name, role, bio, initials, color }) => (
            <div
              key={name}
              className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 text-center transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.07]"
            >
              {/* Avatar */}
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold ${avatarStyles[color]}`}
              >
                {initials}
              </div>

              {/* Name */}
              <h3 className="mt-4 text-lg font-semibold text-white">{name}</h3>

              {/* Role */}
              <p className={`mt-1 text-sm font-medium ${roleStyles[color]}`}>{role}</p>

              {/* Bio */}
              <p className="mt-2 text-sm leading-relaxed text-white/50">{bio}</p>
            </div>
          ))}
        </ScrollReveal>

      </div>
    </section>
  );
};

export default TeamSection;

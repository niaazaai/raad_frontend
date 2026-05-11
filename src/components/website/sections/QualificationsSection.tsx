import ScrollReveal from "@/components/website/ScrollReveal";

type BadgeColor = "primary" | "auxiliary" | "success" | "warning";

interface Qualification {
  name: string;
  full: string;
  badge: string;
  color: BadgeColor;
}

const qualifications: Qualification[] = [
  { name: "ACCA", full: "Association of Chartered Certified Accountants", badge: "Gold Partner", color: "primary" },
  { name: "CMA", full: "Certified Management Accountant", badge: "Authorized Center", color: "auxiliary" },
  { name: "CPA", full: "Certified Public Accountant", badge: "Preparation", color: "success" },
  { name: "CFA", full: "Chartered Financial Analyst", badge: "Preparation", color: "warning" },
  { name: "CIMA", full: "Chartered Inst. of Management Accountants", badge: "Approved", color: "primary" },
  { name: "CAT", full: "Certified Accounting Technician", badge: "Authorized", color: "auxiliary" },
];

const badgeStyles: Record<BadgeColor, string> = {
  primary: "bg-primary/15 text-primary",
  auxiliary: "bg-auxiliary/15 text-auxiliary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const QualificationsSection = () => {
  return (
    <section id="qualifications" className="bg-[#050a18] py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">

        {/* Section header */}
        <ScrollReveal className="mb-14 flex flex-col items-center text-center">
          <div>
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Our Qualifications
            </span>
          </div>
          <div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Globally Recognized Credentials
            </h2>
          </div>
          <div>
            <p className="mt-4 max-w-xl text-base text-white/55">
              Our students earn certifications respected by employers worldwide.
            </p>
          </div>
        </ScrollReveal>

        {/* Qualifications grid — each card is a direct child of ScrollReveal for stagger */}
        <ScrollReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {qualifications.map((q) => (
            <div
              key={q.name}
              className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.07]"
            >
              {/* Abbreviation */}
              <span className="text-4xl font-black text-white/90">{q.name}</span>

              {/* Full name */}
              <span className="mt-1 text-sm text-white/55">{q.full}</span>

              {/* Badge — pushed to bottom */}
              <div className="mt-auto pt-5">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[q.color]}`}
                >
                  {q.badge}
                </span>
              </div>
            </div>
          ))}
        </ScrollReveal>

      </div>
    </section>
  );
};

export default QualificationsSection;

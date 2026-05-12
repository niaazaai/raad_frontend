import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import ContactSection from "@/components/website/sections/ContactSection";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const ContactPage = () => {
  const loginHref = resolveLoginHref();

  return (
    <div className="min-h-screen bg-[#050a18]">
      <LandingNavbar loginHref={loginHref} />

      {/* Page hero */}
      <div className="relative overflow-hidden px-4 pb-16 pt-32 md:pb-20 md:pt-36">
        {/* Orb */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #0069B4 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Contact Us
          </span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/55 md:text-lg">
            Have questions about our programs, admissions, or partnerships? Our team is here to help.
          </p>
        </div>
      </div>

      <ContactSection />

      <WebsiteFooter />
    </div>
  );
};

export default ContactPage;

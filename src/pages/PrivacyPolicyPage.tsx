import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const h2Class = "text-xl font-semibold text-white mt-10 mb-4";
const bodyClass = "text-sm leading-relaxed text-white/70";
const listClass = "mt-3 flex flex-col gap-2 pl-5";
const listItemClass = "list-disc text-sm leading-relaxed text-white/70";

const PrivacyPolicyPage = () => {
  const loginHref = resolveLoginHref();

  return (
    <div className="min-h-screen bg-[#050a18] text-white">
      <LandingNavbar loginHref={loginHref} />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 md:px-8">
        {/* Page header */}
        <div className="mb-10">
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Legal
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-white/40">Last updated: January 2025</p>
        </div>

        {/* ── 1. Introduction ── */}
        <h2 className={h2Class}>1. Introduction</h2>
        <p className={bodyClass}>
          Raad Professional Development Institute (&ldquo;Raad,&rdquo; &ldquo;we,&rdquo;
          &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your
          information when you visit our website or use our learning management platform.
          Please read this policy carefully. If you disagree with its terms, please
          discontinue use of our services.
        </p>

        {/* ── 2. Information We Collect ── */}
        <h2 className={h2Class}>2. Information We Collect</h2>
        <p className={bodyClass}>
          We collect information in the following categories:
        </p>

        <h3 className="mt-5 text-base font-semibold text-white/90">
          Personal Information
        </h3>
        <p className={`mt-2 ${bodyClass}`}>
          When you register, enroll in a course, or contact us, we may collect:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>Full name and date of birth</li>
          <li className={listItemClass}>Email address and phone number</li>
          <li className={listItemClass}>Billing and payment information</li>
          <li className={listItemClass}>Academic history and qualification records</li>
          <li className={listItemClass}>Profile picture (optional)</li>
        </ul>

        <h3 className="mt-5 text-base font-semibold text-white/90">Usage Data</h3>
        <p className={`mt-2 ${bodyClass}`}>
          We automatically collect certain information when you interact with our
          platform, including IP address, browser type, pages viewed, time spent on
          pages, and referring URLs.
        </p>

        <h3 className="mt-5 text-base font-semibold text-white/90">Cookies</h3>
        <p className={`mt-2 ${bodyClass}`}>
          We use cookies and similar tracking technologies to enhance your experience.
          See our{" "}
          <a href="/cookie-policy" className="text-primary underline underline-offset-2 hover:text-primary/80">
            Cookie Policy
          </a>{" "}
          for full details.
        </p>

        {/* ── 3. How We Use Your Information ── */}
        <h2 className={h2Class}>3. How We Use Your Information</h2>
        <p className={bodyClass}>
          We use the information we collect for the following purposes:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>
            <strong className="text-white/90">Education Services:</strong> To process
            enrollment, deliver course content, track progress, and issue certificates.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Communication:</strong> To send you
            program updates, exam schedules, support responses, and relevant
            announcements.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Platform Improvement:</strong> To
            analyze usage patterns, troubleshoot issues, and develop new features.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Legal Compliance:</strong> To meet our
            obligations under applicable laws and regulations.
          </li>
        </ul>

        {/* ── 4. Data Sharing ── */}
        <h2 className={h2Class}>4. Data Sharing</h2>
        <p className={bodyClass}>
          We do not sell, trade, or rent your personal information to third parties.
          We may share data only in the following limited circumstances:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>
            <strong className="text-white/90">Hosting &amp; Infrastructure:</strong>{" "}
            Cloud and server providers that store our platform data under strict
            confidentiality agreements.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Analytics:</strong> Anonymized or
            aggregated usage data shared with analytics tools to understand platform
            performance.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Payment Processors:</strong> Secure,
            PCI-compliant payment gateways handle billing data; Raad does not store
            full card details.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Professional Bodies:</strong> We may
            share enrollment confirmation with ACCA, CMA, or other bodies as required
            for registration.
          </li>
        </ul>

        {/* ── 5. Data Security ── */}
        <h2 className={h2Class}>5. Data Security</h2>
        <p className={bodyClass}>
          We implement industry-standard security measures including TLS encryption
          for data in transit, encrypted storage for sensitive fields, role-based
          access controls, and regular security audits. While we strive to protect
          your data, no method of transmission over the internet is 100% secure, and
          we cannot guarantee absolute security.
        </p>

        {/* ── 6. Your Rights ── */}
        <h2 className={h2Class}>6. Your Rights</h2>
        <p className={bodyClass}>
          You have the following rights regarding your personal data:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>
            <strong className="text-white/90">Access:</strong> Request a copy of the
            personal information we hold about you.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Correction:</strong> Request that
            inaccurate or incomplete data be updated.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Deletion:</strong> Request erasure of
            your personal data, subject to any legal retention obligations.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Objection:</strong> Object to certain
            types of processing, including direct marketing.
          </li>
        </ul>
        <p className={`mt-4 ${bodyClass}`}>
          To exercise any of these rights, please contact us at{" "}
          <a href="mailto:privacy@raad.af" className="text-primary underline underline-offset-2 hover:text-primary/80">
            privacy@raad.af
          </a>
          . We will respond within 30 days.
        </p>

        {/* ── 7. Cookies ── */}
        <h2 className={h2Class}>7. Cookies</h2>
        <p className={bodyClass}>
          Our platform uses essential, functional, and analytics cookies. You can
          manage your cookie preferences through your browser settings or via our
          cookie consent banner. For a full breakdown of cookies we use, please refer
          to our{" "}
          <a href="/cookie-policy" className="text-primary underline underline-offset-2 hover:text-primary/80">
            Cookie Policy
          </a>
          .
        </p>

        {/* ── 8. Contact ── */}
        <h2 className={h2Class}>8. Contact</h2>
        <p className={bodyClass}>
          If you have questions, concerns, or requests related to this Privacy Policy,
          please reach out to us:
        </p>
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-white/70">
          <p className="font-semibold text-white">Raad Professional Development Institute</p>
          <p className="mt-1">Kabul, Afghanistan</p>
          <p className="mt-1">
            Email:{" "}
            <a href="mailto:privacy@raad.af" className="text-primary hover:text-primary/80">
              privacy@raad.af
            </a>
          </p>
          <p className="mt-1">Phone: +93 (0) 700 000 000</p>
        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
};

export default PrivacyPolicyPage;

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

interface CookieRow {
  name: string;
  purpose: string;
  duration: string;
}

const essentialCookies: CookieRow[] = [
  { name: "session_id", purpose: "Maintains your authenticated session on the platform.", duration: "Session" },
  { name: "csrf_token", purpose: "Protects against cross-site request forgery attacks.", duration: "Session" },
  { name: "remember_token", purpose: "Keeps you logged in across browser restarts.", duration: "30 days" },
];

const functionalCookies: CookieRow[] = [
  { name: "locale", purpose: "Stores your preferred language setting.", duration: "1 year" },
  { name: "theme", purpose: "Stores your preferred UI theme (light/dark).", duration: "1 year" },
  { name: "sidebar_state", purpose: "Remembers whether the sidebar is expanded or collapsed.", duration: "30 days" },
];

const analyticsCookies: CookieRow[] = [
  { name: "_ga", purpose: "Google Analytics — distinguishes unique users.", duration: "2 years" },
  { name: "_ga_*", purpose: "Google Analytics — stores session state.", duration: "2 years" },
  { name: "plausible_ignore", purpose: "Opt-out flag for Plausible Analytics.", duration: "Permanent" },
];

const CookieTable = ({ rows }: { rows: CookieRow[] }) => (
  <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08]">
    <table className="w-full min-w-[480px] text-sm">
      <thead>
        <tr className="border-b border-white/[0.08] bg-white/[0.04]">
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
            Name
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
            Purpose
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
            Duration
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.name}
            className={`border-b border-white/[0.05] last:border-0 ${
              i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
            }`}
          >
            <td className="px-4 py-3 font-mono text-xs text-primary/90">{row.name}</td>
            <td className="px-4 py-3 text-white/60">{row.purpose}</td>
            <td className="px-4 py-3 text-white/60">{row.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CookiePolicyPage = () => {
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
            Cookie Policy
          </h1>
          <p className="mt-2 text-sm text-white/40">Last updated: January 2025</p>
        </div>

        {/* ── 1. What Are Cookies ── */}
        <h2 className={h2Class}>1. What Are Cookies</h2>
        <p className={bodyClass}>
          Cookies are small text files stored on your device when you visit a website.
          They are widely used to make websites work more efficiently, remember your
          preferences, and provide information to site owners about how users interact
          with their content.
        </p>
        <p className={`mt-3 ${bodyClass}`}>
          Cookies do not typically contain information that personally identifies you,
          but personal information we store about you may be linked to the information
          stored in and obtained from cookies.
        </p>

        {/* ── 2. How We Use Cookies ── */}
        <h2 className={h2Class}>2. How We Use Cookies</h2>
        <p className={bodyClass}>
          Raad uses cookies for three main purposes:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>
            <strong className="text-white/90">Essential cookies</strong> — Required
            for the platform to function. Without these, services such as secure login
            and form submission cannot operate.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Functional cookies</strong> — Remember
            your preferences (language, theme, layout settings) so you don&apos;t have
            to reconfigure them each visit.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Analytics cookies</strong> — Help us
            understand how visitors use the platform so we can improve content,
            navigation, and performance. Data is collected in aggregate and is not
            linked to identifiable individuals.
          </li>
        </ul>

        {/* ── 3. Types of Cookies We Use ── */}
        <h2 className={h2Class}>3. Types of Cookies We Use</h2>

        <h3 className="mt-5 text-base font-semibold text-white/90">Essential Cookies</h3>
        <p className={`mt-2 ${bodyClass}`}>
          These cookies are strictly necessary for the platform to operate and cannot
          be disabled.
        </p>
        <CookieTable rows={essentialCookies} />

        <h3 className="mt-7 text-base font-semibold text-white/90">Functional Cookies</h3>
        <p className={`mt-2 ${bodyClass}`}>
          These cookies enhance the usability and personalization of the platform.
        </p>
        <CookieTable rows={functionalCookies} />

        <h3 className="mt-7 text-base font-semibold text-white/90">Analytics Cookies</h3>
        <p className={`mt-2 ${bodyClass}`}>
          These cookies help us understand usage patterns and improve the platform.
          You may opt out without affecting core functionality.
        </p>
        <CookieTable rows={analyticsCookies} />

        {/* ── 4. Managing Cookies ── */}
        <h2 className={h2Class}>4. Managing Cookies</h2>
        <p className={bodyClass}>
          You can control and manage cookies in the following ways:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>
            <strong className="text-white/90">Browser settings:</strong> Most modern
            browsers allow you to block, delete, or restrict cookies through their
            privacy or security settings. Consult your browser&apos;s help documentation
            for instructions.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Cookie consent banner:</strong> When you
            first visit our site, you can choose to accept or decline non-essential
            cookies via the consent banner.
          </li>
          <li className={listItemClass}>
            <strong className="text-white/90">Third-party opt-outs:</strong> For
            analytics cookies, you can opt out directly through providers such as{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Google Analytics Opt-out
            </a>
            .
          </li>
        </ul>
        <p className={`mt-4 ${bodyClass}`}>
          Please note that disabling certain cookies may affect the functionality of
          the platform. Essential cookies cannot be disabled without impacting your
          ability to use the service.
        </p>

        {/* ── 5. Updates to This Policy ── */}
        <h2 className={h2Class}>5. Updates to This Policy</h2>
        <p className={bodyClass}>
          We may update this Cookie Policy from time to time to reflect changes in
          technology, legislation, or our data practices. When we make material
          changes, we will update the &ldquo;Last updated&rdquo; date at the top of
          this page. We encourage you to review this policy periodically.
        </p>
        <p className={`mt-3 ${bodyClass}`}>
          Your continued use of the platform after changes are posted constitutes
          your acceptance of the revised policy.
        </p>

        {/* ── 6. Contact ── */}
        <h2 className={h2Class}>6. Contact</h2>
        <p className={bodyClass}>
          If you have questions or concerns about our use of cookies or this policy,
          please contact us:
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

export default CookiePolicyPage;

import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import { CONTACT_INFO } from "@/components/website/websiteData";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const h2Class = "text-xl font-semibold text-foreground mt-10 mb-4";
const bodyClass = "text-sm leading-relaxed text-muted-foreground";
const listClass = "mt-3 flex flex-col gap-2 ps-5";
const listItemClass = "list-disc text-sm leading-relaxed text-muted-foreground";

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

const CookieTable = ({ rows }: { rows: CookieRow[] }) => (
  <div className="mt-4 overflow-x-auto rounded-xl border border-border">
    <table className="w-full min-w-[480px] text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
          <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purpose</th>
          <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-border/60 last:border-0">
            <td className="px-4 py-3 font-mono text-xs text-primary">{row.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{row.purpose}</td>
            <td className="px-4 py-3 text-muted-foreground">{row.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CookiePolicyPage = () => {
  const loginHref = resolveLoginHref();

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <main className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} max-w-3xl`}>
          <div className="mb-10">
            <span className={sectionBadgeClass}>Legal</span>
            <h1 className={`${sectionTitleClass} mt-4`}>Cookie Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2025</p>
          </div>

          <h2 className={h2Class}>1. What Are Cookies</h2>
          <p className={bodyClass}>
            Cookies are small text files stored on your device when you visit a website. They help websites work efficiently and remember your preferences.
          </p>

          <h2 className={h2Class}>2. How We Use Cookies</h2>
          <ul className={listClass}>
            <li className={listItemClass}><strong className="text-foreground">Essential cookies</strong> — Required for secure login and form submission.</li>
            <li className={listItemClass}><strong className="text-foreground">Functional cookies</strong> — Remember language, theme, and layout preferences.</li>
            <li className={listItemClass}><strong className="text-foreground">Analytics cookies</strong> — Help us improve platform performance in aggregate.</li>
          </ul>

          <h2 className={h2Class}>3. Types of Cookies We Use</h2>
          <h3 className="mt-5 text-base font-semibold text-foreground">Essential Cookies</h3>
          <CookieTable rows={essentialCookies} />
          <h3 className="mt-7 text-base font-semibold text-foreground">Functional Cookies</h3>
          <CookieTable rows={functionalCookies} />

          <h2 className={h2Class}>4. Contact</h2>
          <p className={bodyClass}>Questions about cookies? Contact us:</p>
          <div className="mt-4 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Raad Professional Development Institute</p>
            <p className="mt-1">{CONTACT_INFO.location}</p>
            <p className="mt-1">Phone: {CONTACT_INFO.phone}</p>
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </>
  );
};

export default CookiePolicyPage;

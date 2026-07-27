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

const PrivacyPolicyPage = () => {
  const loginHref = resolveLoginHref();

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <main className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} max-w-3xl`}>
          <div className="mb-10">
            <span className={sectionBadgeClass}>Legal</span>
            <h1 className={`${sectionTitleClass} mt-4`}>Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2025</p>
          </div>

          <h2 className={h2Class}>1. Introduction</h2>
          <p className={bodyClass}>
            Raad Professional Development Institute (&ldquo;Raad,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our learning management platform.
          </p>

          <h2 className={h2Class}>2. Information We Collect</h2>
          <p className={bodyClass}>We collect information in the following categories:</p>
          <ul className={listClass}>
            <li className={listItemClass}>Full name, email address, and phone number</li>
            <li className={listItemClass}>Billing and payment information</li>
            <li className={listItemClass}>Academic history and qualification records</li>
            <li className={listItemClass}>Usage data such as IP address and pages viewed</li>
          </ul>

          <h2 className={h2Class}>3. How We Use Your Information</h2>
          <p className={bodyClass}>
            We use collected information to deliver education services, communicate program updates, improve our platform, and comply with legal obligations.
          </p>

          <h2 className={h2Class}>4. Contact</h2>
          <p className={bodyClass}>If you have questions about this Privacy Policy, please contact us:</p>
          <div className="mt-4 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Raad Professional Development Institute</p>
            <p className="mt-1">{CONTACT_INFO.location}</p>
            <p className="mt-1">
              Email:{" "}
              <a href={CONTACT_INFO.emailHref} className="text-primary hover:text-primary-active">
                {CONTACT_INFO.email}
              </a>
            </p>
            <p className="mt-1">Phone: {CONTACT_INFO.phone}</p>
          </div>
        </div>
      </main>

      <WebsiteFooter />
    </>
  );
};

export default PrivacyPolicyPage;

import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import ContactSection from "@/components/website/sections/ContactSection";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const ContactPage = () => {
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <section className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} max-w-2xl text-center`}>
          <span className={sectionBadgeClass}>{t("contact.badge")}</span>
          <h1 className={`${sectionTitleClass} mt-3`}>{t("contact.title")}</h1>
          <p className={`${sectionSubtitleClass} mx-auto md:text-lg`}>{t("contact.subtitle")}</p>
        </div>
      </section>

      <ContactSection />
      <WebsiteFooter />
    </>
  );
};

export default ContactPage;

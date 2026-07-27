import { Link } from "react-router-dom";
import { NavArrowRight } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionTitleClass,
} from "@/components/website/websiteData";

const ContactCtaSection = () => {
  const { t } = useTranslation();

  return (
    <section className={`${sectionShellClass} ${sectionSurface.auxiliary}`}>
      <div className={`${sectionInnerClass} text-center`}>
        <ScrollReveal>
          <span className={sectionBadgeClass}>{t("contactCta.badge")}</span>
          <h2 className={`${sectionTitleClass} mt-4`}>{t("contactCta.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">{t("contactCta.subtitle")}</p>
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-active"
          >
            {t("contactCta.button")}
            <NavArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ContactCtaSection;

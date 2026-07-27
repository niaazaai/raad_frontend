import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import { SOCIAL_ICON_LINKS } from "@/components/website/SocialIcons";
import { AnimatedMail } from "@/components/icons/animated";
import { CONTACT_INFO } from "@/components/website/websiteData";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocaleStore } from "@/store";
import { useSubmitContactForm } from "@/hooks";
import { fetchCsrfCookie } from "@/services";
import { Spinner } from "@/components/ui/spinner";
import { GOOGLE_MAPS_EMBED_URL } from "@/components/website/qualificationData";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

const ContactSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(255),
  email: z.string().email("Valid email required").max(255),
  phone: z.string().max(50).optional(),
  subject: z.enum(["program_inquiry", "acca_information", "cma_information", "general_inquiry", "partnership"]),
  message: z.string().min(10, "Message too short").max(5000),
  website: z.string().max(0).optional(),
});

type ContactFormValues = z.infer<typeof ContactSchema>;

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15";

const ContactSection = () => {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const { mutateAsync, isPending } = useSubmitContactForm();
  const [submitted, setSubmitted] = useState(false);

  const subjectOptions = useMemo(
    () =>
      [
        "program_inquiry",
        "acca_information",
        "cma_information",
        "general_inquiry",
        "partnership",
      ] as const,
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      subject: "general_inquiry",
      message: "",
      website: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    if (values.website) return;
    await fetchCsrfCookie();
    await mutateAsync({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || undefined,
      subject: values.subject,
      message: values.message,
      locale,
    });
    setSubmitted(true);
    reset();
  };

  const contactItems = [
    { icon: MapPin, label: t("contact.location"), value: CONTACT_INFO.location, href: CONTACT_INFO.mapsHref },
    { icon: Phone, label: t("contact.phone"), value: CONTACT_INFO.phone, href: CONTACT_INFO.phoneHref },
    { icon: Mail, label: t("contact.email"), value: CONTACT_INFO.email, href: CONTACT_INFO.emailHref },
    { icon: Clock, label: t("contact.hours"), value: t("contact.hoursValue") },
  ];

  return (
    <section id="contact" className={`${sectionShellClass} ${sectionSurface.auxiliary}`}>
      <div className={`${sectionInnerClass} grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14`}>
        <ScrollReveal className="flex flex-col">
          <span className={sectionBadgeClass}>{t("contact.badge")}</span>
          <h2 className={`${sectionTitleClass} mt-4`}>{t("contact.title")}</h2>
          <p className={sectionSubtitleClass}>{t("contact.subtitle")}</p>

          <ul className="mt-8 space-y-4">
            {contactItems.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-medium text-foreground hover:text-primary">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {SOCIAL_ICON_LINKS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 bg-card text-muted-foreground transition hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </a>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border/70 shadow-sm">
            <iframe
              title={t("contact.mapTitle")}
              src={GOOGLE_MAPS_EMBED_URL}
              className="h-64 w-full border-0 md:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-success/25 bg-success/5 px-8 py-14 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
              </span>
              <h3 className="mt-5 text-xl font-bold text-foreground">{t("contact.successTitle")}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("contact.successBody")}</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/60"
              >
                {t("contact.sendAnother")}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-8"
            >
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register("website")} />

              <div>
                <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-foreground">
                  {t("contact.fullName")} <span className="text-primary">*</span>
                </label>
                <input id="full_name" className={inputClass} {...register("full_name")} />
                {errors.full_name ? <p className="mt-1 text-sm text-danger">{errors.full_name.message}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                    {t("contact.emailAddress")} <span className="text-primary">*</span>
                  </label>
                  <input id="email" type="email" className={inputClass} {...register("email")} />
                  {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email.message}</p> : null}
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
                    {t("contact.phoneOptional")}
                  </label>
                  <input id="phone" type="tel" className={inputClass} {...register("phone")} />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
                  {t("contact.subject")} <span className="text-primary">*</span>
                </label>
                <select id="subject" className={inputClass} {...register("subject")}>
                  {subjectOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(`contact.subjects.${opt}` as "contact.subjects.program_inquiry")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                  {t("contact.message")} <span className="text-primary">*</span>
                </label>
                <textarea id="message" rows={5} className={`${inputClass} resize-none`} {...register("message")} />
                {errors.message ? <p className="mt-1 text-sm text-danger">{errors.message.message}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-active disabled:opacity-60"
              >
                {isPending ? <Spinner className="h-4 w-4" /> : <AnimatedMail size={18} />}
                {isPending ? t("contact.sending") : t("contact.sendMessage")}
              </button>
            </form>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ContactSection;

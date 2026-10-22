import type { ReactNode } from "react";
import { Headphones, Mail, MapPin, Phone } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { CONTACT_INFO } from "@/components/website/websiteData";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type HelpPerson = {
  name: string;
  roleKey?: TranslationKey;
  role?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  image?: string | null;
};

type HelpContactsPayload = {
  instructors?: HelpPerson[];
};

/** Official WhatsApp glyph (brand mark; Lucide has no real WA icon). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ContactLinkButton({
  href,
  icon,
  label,
  variant,
  external,
  className,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  variant: "default" | "outline";
  external?: boolean;
  className?: string;
}) {
  return (
    <Button variant={variant} className={cn("min-w-0", className)} asChild>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        title={label}
      >
        {icon}
        <span className="truncate">{label}</span>
      </a>
    </Button>
  );
}

function ContactButtons({
  email,
  phone,
  whatsapp,
}: {
  email?: string;
  phone?: string;
  whatsapp?: string;
}) {
  const emailValue = email?.trim() || "";
  const phoneValue = phone?.trim() || "";
  const whatsappValue = whatsapp?.trim() || "";
  const phoneHref = phoneValue ? `tel:${phoneValue.replace(/[^\d+]/g, "")}` : null;
  const whatsappHref = whatsappValue ? `https://wa.me/${whatsappValue.replace(/\D/g, "")}` : null;

  if (!emailValue && !phoneValue && !whatsappValue) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {emailValue ? (
        <ContactLinkButton
          href={`mailto:${emailValue}`}
          icon={<Mail className="size-4 shrink-0" />}
          label={emailValue}
          variant="default"
          className="w-full justify-center"
        />
      ) : null}
      {phoneValue && phoneHref && whatsappValue && whatsappHref ? (
        <div className="grid w-full grid-cols-2 gap-2">
          <ContactLinkButton
            href={phoneHref}
            icon={<Phone className="size-4 shrink-0" />}
            label={phoneValue}
            variant="outline"
            className="w-full justify-center"
          />
          <ContactLinkButton
            href={whatsappHref}
            icon={<WhatsAppIcon />}
            label={whatsappValue}
            variant="outline"
            external
            className="w-full justify-center border-[#25D366] bg-transparent text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
          />
        </div>
      ) : phoneValue && phoneHref ? (
        <ContactLinkButton
          href={phoneHref}
          icon={<Phone className="size-4 shrink-0" />}
          label={phoneValue}
          variant="outline"
          className="w-full justify-center"
        />
      ) : whatsappValue && whatsappHref ? (
        <ContactLinkButton
          href={whatsappHref}
          icon={<WhatsAppIcon />}
          label={whatsappValue}
          variant="outline"
          external
          className="w-full justify-center border-[#25D366] bg-transparent text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
        />
      ) : null}
    </div>
  );
}

function SupportSection() {
  const { t } = useTranslation();

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{t("studentHelp.supportTitle")}</h2>
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/8 via-card to-auxiliary/5 shadow-none">
        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                <Headphones className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {t("studentHelp.supportDesk")}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {t("studentHelp.supportTitle")}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("studentHelp.supportBody")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{CONTACT_INFO.location}</span>
            </div>
          </div>

          <div className="border-t border-border/60 bg-background/50 p-5 sm:p-6 md:border-s md:border-t-0">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("studentHelp.phone")} · {t("studentHelp.email")}
            </p>
            <ContactButtons email={CONTACT_INFO.email} phone={CONTACT_INFO.phone} />
          </div>
        </div>
      </Card>
    </section>
  );
}

function InstructorCard({ person }: { person: HelpPerson }) {
  const { t } = useTranslation();
  const role = person.roleKey ? t(person.roleKey) : person.role?.trim() || t("studentHelp.instructorFallback");
  const bio = person.bio?.trim() || "";

  return (
    <Card className="relative w-full overflow-hidden pt-0">
      {person.image ? (
        <div className="flex aspect-video w-full items-center justify-center bg-muted">
          <img
            src={person.image}
            alt=""
            className="max-h-full max-w-full object-contain object-center"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
          {initials(person.name)}
        </div>
      )}
      <CardHeader>
        <CardAction>
          <Badge variant="secondary">{role}</Badge>
        </CardAction>
        <CardTitle className="text-base">{person.name}</CardTitle>
        {bio ? (
          <CardDescription className="line-clamp-3">{bio}</CardDescription>
        ) : (
          <CardDescription className="line-clamp-3">{t("studentHelp.instructorBody")}</CardDescription>
        )}
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <ContactButtons
          email={person.email ?? undefined}
          phone={person.phone ?? undefined}
          whatsapp={person.whatsapp ?? undefined}
        />
      </CardFooter>
    </Card>
  );
}

const StudentHelpPage = () => {
  const { t } = useTranslation();
  const contacts = useQueryApi<HelpContactsPayload>({
    queryKey: ["me", "help-contacts"],
    url: "/me/help-contacts",
    method: RequestMethod.GET,
  });
  const instructors = contacts.data?.data?.instructors ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("studentHelp.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("studentHelp.subtitle")}</p>
      </div>

      <SupportSection />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">{t("studentHelp.instructorTitle")}</h2>
        {contacts.isLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : contacts.isError ? (
          <p className="text-sm text-muted-foreground">{t("studentHelp.instructorsError")}</p>
        ) : instructors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("studentHelp.instructorsEmpty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {instructors.map((person) => (
              <InstructorCard key={person.name} person={person} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentHelpPage;

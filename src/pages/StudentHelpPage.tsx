import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
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

const SUPPORT_TEAM: HelpPerson[] = [
  {
    name: "Raad support",
    roleKey: "studentHelp.supportDesk",
    phone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PersonCard({ person }: { person: HelpPerson }) {
  const { t } = useTranslation();
  const role = person.roleKey ? t(person.roleKey) : person.role || "";
  const bio = person.bio?.trim() || "";
  const email = person.email?.trim() || "";
  const phone = person.phone?.trim() || "";
  const whatsapp = person.whatsapp?.trim() || "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        {person.image ? (
          <img src={person.image} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(person.name)}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-sm font-semibold text-foreground">{person.name}</p>
          {role ? <p className="text-xs text-muted-foreground">{role}</p> : null}
          {bio ? <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{bio}</p> : null}
          {phone && phoneHref ? (
            <a
              href={phoneHref}
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {phone}
            </a>
          ) : null}
          {whatsapp && whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              {whatsapp}
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function InstructorCard({ person }: { person: HelpPerson }) {
  const { t } = useTranslation();
  const role = person.roleKey ? t(person.roleKey) : person.role?.trim() || t("studentHelp.instructorFallback");
  const bio = person.bio?.trim() || "";
  const email = person.email?.trim() || "";
  const phone = person.phone?.trim() || "";
  const whatsapp = person.whatsapp?.trim() || "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;
  const primaryHref = email ? `mailto:${email}` : phoneHref ?? whatsappHref;
  const primaryLabel = email
    ? t("studentHelp.email")
    : phone
      ? t("studentHelp.phone")
      : whatsapp
        ? t("studentHelp.whatsapp")
        : null;

  return (
    <Card className="relative w-full overflow-hidden pt-0">
      <div className="absolute inset-x-0 top-0 z-30 aspect-video bg-black/35" />
      {person.image ? (
        <img
          src={person.image}
          alt=""
          className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
        />
      ) : (
        <div className="relative z-20 flex aspect-video w-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
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
        {primaryHref && primaryLabel ? (
          <Button className="w-full" asChild>
            <a
              href={primaryHref}
              {...(whatsappHref && primaryHref === whatsappHref
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {email ? <Mail className="size-4" /> : null}
              {phone && !email ? <Phone className="size-4" /> : null}
              {whatsapp && !email && !phone ? <MessageCircle className="size-4" /> : null}
              {primaryLabel}
            </a>
          </Button>
        ) : null}
        <div className="flex w-full gap-2">
          {phone && phoneHref && email ? (
            <Button variant="outline" className="flex-1" asChild>
              <a href={phoneHref}>
                <Phone className="size-4" />
                {t("studentHelp.phone")}
              </a>
            </Button>
          ) : null}
          {whatsapp && whatsappHref && (email || phone) ? (
            <Button variant="outline" className="flex-1" asChild>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                {t("studentHelp.whatsapp")}
              </a>
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

function ContactSection({ title, people }: { title: string; people: HelpPerson[] }) {
  if (people.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {people.map((person) => (
          <PersonCard key={`${person.name}-${person.role ?? ""}`} person={person} />
        ))}
      </div>
    </section>
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
      <ContactSection title={t("studentHelp.supportTitle")} people={SUPPORT_TEAM} />
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

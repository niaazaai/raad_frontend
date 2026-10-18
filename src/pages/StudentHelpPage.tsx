import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { CONTACT_INFO } from "@/components/website/websiteData";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";

type HelpPerson = {
  name: string;
  roleKey?: TranslationKey;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
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
  const role = person.roleKey ? t(person.roleKey) : person.role || t("studentHelp.instructorFallback");
  const email = person.email?.trim() || "";
  const phone = person.phone?.trim() || "";
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {person.image ? (
          <img src={person.image} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(person.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{person.name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
          {phone && phoneHref ? (
            <a
              href={phoneHref}
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {phone}
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
          <div className="grid gap-3 sm:grid-cols-2">
            {instructors.map((person) => (
              <PersonCard key={person.name} person={person} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentHelpPage;

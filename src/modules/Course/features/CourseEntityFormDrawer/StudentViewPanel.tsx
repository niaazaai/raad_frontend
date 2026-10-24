import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Fingerprint,
  IdCard,
  Mail,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { isPdfUrl } from "@/lib/openMedia";
import { cn } from "@/lib/utils";
import MediaPreview from "./MediaPreview";

interface StudentViewPanelProps {
  detail: Record<string, unknown>;
}

const display = (value: unknown, fallback = "—"): string => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const DetailField = ({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) => (
  <div className={cn("min-w-0 space-y-1 py-2.5", className)}>
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="break-words text-sm font-medium leading-snug text-foreground">{value}</div>
  </div>
);

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
    </div>
    {children}
  </section>
);

const IdentityRow = ({ children }: { children: ReactNode }) => (
  <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-border/70 [&>*]:px-3.5">
    {children}
  </div>
);

const StudentViewPanel = ({ detail }: StudentViewPanelProps) => {
  const fullName = display(
    detail.full_name ??
      detail.user_name ??
      (`${String(detail.first_name ?? "")} ${String(detail.last_name ?? "")}`.trim() || null)
  );
  const profileUrl =
    typeof detail.profile_image_url === "string" && detail.profile_image_url.trim()
      ? detail.profile_image_url.trim()
      : null;
  const nationalIdUrl =
    typeof detail.national_id_attachment_url === "string" &&
    detail.national_id_attachment_url.trim()
      ? detail.national_id_attachment_url.trim()
      : null;
  const nationalIdPath =
    typeof detail.national_id_attachment === "string" ? detail.national_id_attachment : "";
  const nationalIdIsPdf = isPdfUrl(nationalIdUrl) || isPdfUrl(nationalIdPath);
  const classesTaken = Array.isArray(detail.classes_taken)
    ? (detail.classes_taken as Record<string, unknown>[])
    : [];

  return (
    <div className="space-y-7">
      {/* Full-width profile at top */}
      <div className="w-full">
        {profileUrl ? (
          <MediaPreview
            url={profileUrl}
            alt="Student profile"
            filename="student-profile.jpg"
            className="w-full rounded-xl"
            imageClassName="h-52 w-full max-h-64 object-cover sm:h-56"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-sm text-muted-foreground sm:h-56">
            <div className="flex flex-col items-center gap-2">
              <UserRound className="h-10 w-10 opacity-40" />
              No profile photo
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1 border-b border-border pb-4">
        <p className="text-xl font-semibold tracking-tight text-foreground">{fullName}</p>
        {detail.student_code ? (
          <p className="font-mono text-sm text-primary">{String(detail.student_code)}</p>
        ) : null}
      </div>

      <Section title="Identity" icon={IdCard}>
        <div className="divide-y divide-border/70 overflow-hidden rounded-lg border border-border/80 bg-muted/5">
          <IdentityRow>
            <DetailField label="Date of birth" value={display(detail.date_of_birth)} />
            <DetailField
              label="Gender"
              value={<span className="capitalize">{display(detail.gender)}</span>}
            />
          </IdentityRow>
          <IdentityRow>
            <DetailField label="ACCA ID" value={display(detail.acca_id)} />
            <DetailField
              label="Academic background"
              value={display(detail.academic_background).replace(/_/g, " ")}
            />
          </IdentityRow>
          <IdentityRow>
            <DetailField label="Father name" value={display(detail.father_name)} />
            <DetailField label="National ID number" value={display(detail.national_id)} />
          </IdentityRow>
          <div className="px-3.5">
            <DetailField
              label="Address"
              value={<span className="whitespace-pre-wrap">{display(detail.address)}</span>}
            />
          </div>
        </div>
      </Section>

      <Section title="Contact" icon={Mail}>
        <div className="space-y-1 rounded-lg border border-border/80 bg-muted/5 px-3.5 divide-y divide-border/70">
          <DetailField label="Email" value={display(detail.email)} />
          <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-border/70">
            <DetailField label="Phone" value={display(detail.phone_number)} className="sm:pe-3" />
            <DetailField
              label="WhatsApp"
              value={display(detail.whatsapp_number)}
              className="sm:ps-3"
            />
          </div>
          <DetailField label="Emergency phone" value={display(detail.emergency_phone_number)} />
        </div>
      </Section>

      <Section title="Account" icon={UserRound}>
        <div className="grid gap-0 overflow-hidden rounded-lg border border-border/80 bg-muted/5 sm:grid-cols-2 sm:divide-x sm:divide-border/70">
          <DetailField
            label="Status"
            value={<span className="capitalize">{display(detail.status, "active")}</span>}
            className="px-3.5"
          />
          <DetailField
            label="Linked user"
            value={detail.user_id ? display(detail.user_name ?? detail.user_id) : "None"}
            className="px-3.5"
          />
        </div>
      </Section>

      <Section title="Notes" icon={StickyNote}>
        <p className="whitespace-pre-wrap break-words rounded-lg border border-border/80 bg-muted/5 px-3.5 py-3 text-sm text-foreground">
          {display(detail.notes)}
        </p>
      </Section>

      {classesTaken.length > 0 ? (
        <Section title="Classes taken" icon={BookOpen}>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[280px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-start text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-2.5 py-1.5 font-semibold">Class</th>
                  <th className="px-2.5 py-1.5 font-semibold">Grade</th>
                  <th className="px-2.5 py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {classesTaken.map((cls) => (
                  <tr key={String(cls.id)} className="border-b border-border last:border-b-0">
                    <td className="px-2.5 py-1.5 text-foreground">
                      {display(cls.class_name, `Class #${display(cls.class_id, "")}`)}
                      {cls.class_code ? (
                        <span className="ms-1.5 font-mono text-[11px] text-muted-foreground">
                          {String(cls.class_code)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground">
                      {display(cls.grade, "PENDING")}
                    </td>
                    <td className="px-2.5 py-1.5 capitalize text-muted-foreground">
                      {display(cls.status, "active")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* National ID attachment — full row at bottom */}
      <Section title="National ID document" icon={Fingerprint}>
        {nationalIdUrl ? (
          <MediaPreview
            url={nationalIdUrl}
            alt="National ID"
            filename={nationalIdIsPdf ? "national-id.pdf" : "national-id.jpg"}
            preferPdfCard={nationalIdIsPdf}
            className="w-full rounded-xl"
            imageClassName="max-h-80 w-full object-contain bg-muted/20"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-sm text-muted-foreground">
            No national ID attachment
          </div>
        )}
      </Section>
    </div>
  );
};

export default StudentViewPanel;

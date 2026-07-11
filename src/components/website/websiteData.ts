export const CONTACT_INFO = {
  location: "Kabul, Afghanistan",
  phone: "+93 (0) 700 000 000",
  email: "info@raad.af",
  phoneHref: "https://wa.me/message/5YEFIGBL3BP5B1",
  emailHref: "mailto:info@raad.af",
  mapsHref: "https://maps.google.com/?q=Kabul,Afghanistan",
} as const;

export type QualificationColor = "primary" | "auxiliary" | "success" | "warning";

export interface QualificationItem {
  name: string;
  full: string;
  badge: string;
  color: QualificationColor;
}

export const QUALIFICATIONS: QualificationItem[] = [
  { name: "ACCA", full: "Association of Chartered Certified Accountants", badge: "Gold Partner", color: "primary" },
  { name: "CMA", full: "Certified Management Accountant", badge: "Authorized Center", color: "auxiliary" },
  { name: "CPA", full: "Certified Public Accountant", badge: "Preparation", color: "success" },
  { name: "CFA", full: "Chartered Financial Analyst", badge: "Preparation", color: "warning" },
  { name: "CIMA", full: "Chartered Inst. of Management Accountants", badge: "Approved", color: "primary" },
  { name: "CAT", full: "Certified Accounting Technician", badge: "Authorized", color: "auxiliary" },
];

export type TeamMemberColor = "primary" | "auxiliary";

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: TeamMemberColor;
  image?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Ahmad Karimi",
    role: "CEO & Founder",
    bio: "ACCA Fellow with 20+ years in professional education.",
    initials: "AK",
    color: "primary",
  },
  {
    name: "Mariam Ahmadi",
    role: "Academic Director",
    bio: "Former Big4 auditor. ACCA examiner and mentor.",
    initials: "MA",
    color: "auxiliary",
  },
  {
    name: "Najibullah Wafa",
    role: "Lead Instructor",
    bio: "CPA, CMA certified. Finance & accounting specialist.",
    initials: "NW",
    color: "primary",
  },
  {
    name: "Zarghona Noori",
    role: "Student Success Manager",
    bio: "Dedicated to student outcomes and career placement.",
    initials: "ZN",
    color: "auxiliary",
  },
  {
    name: "Farid Ahmad",
    role: "Operations Director",
    bio: "Streamlines campus operations and student services.",
    initials: "FA",
    color: "primary",
  },
  {
    name: "Sara Hashimi",
    role: "Marketing & Partnerships",
    bio: "Builds global partnerships and community engagement.",
    initials: "SH",
    color: "auxiliary",
  },
];

export const badgeColorStyles: Record<QualificationColor, string> = {
  primary: "bg-primary/10 text-primary",
  auxiliary: "bg-auxiliary/10 text-auxiliary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export const memberColorStyles: Record<TeamMemberColor, { avatar: string; role: string }> = {
  primary: {
    avatar: "bg-primary/20 text-primary",
    role: "text-primary",
  },
  auxiliary: {
    avatar: "bg-auxiliary/20 text-auxiliary",
    role: "text-auxiliary",
  },
};

/** Section shells — light mode uses soft brand tints for separation */
export const sectionShellClass = "relative overflow-hidden py-16 md:py-24";
export const sectionInnerClass = "mx-auto max-w-6xl px-4 md:px-8";
export const sectionBadgeClass =
  "mb-4 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary";
export const sectionTitleClass =
  "text-3xl font-bold tracking-tight text-foreground md:text-4xl [&_strong]:text-primary";
export const sectionSubtitleClass =
  "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base";

export const sectionSurface = {
  default: "bg-background",
  primary: "border-y border-primary/10 bg-gradient-to-br from-primary/[0.07] via-background to-primary/[0.03]",
  auxiliary:
    "border-y border-auxiliary/10 bg-gradient-to-br from-auxiliary/[0.06] via-background to-auxiliary/[0.03]",
  muted: "border-y border-border/70 bg-muted/35",
  card: "border-y border-border/60 bg-card/80",
} as const;

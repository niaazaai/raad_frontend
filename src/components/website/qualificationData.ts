export type QualificationSlug = "acca" | "fia" | "cia";

export interface QualificationDetail {
  slug: QualificationSlug;
  badge: string;
  name: string;
  full: string;
  aboutTitle: string;
  about: string;
  whyTitle: string;
  whyPoints: string[];
  careerTitle: string;
  careerRoles: string[];
  details: { label: string; value: string }[];
  color: "primary" | "auxiliary" | "success";
}

export const QUALIFICATION_DETAILS: Record<QualificationSlug, QualificationDetail> = {
  acca: {
    slug: "acca",
    badge: "Global Finance Qualification",
    name: "ACCA",
    full: "Association of Chartered Certified Accountants",
    aboutTitle: "About the Qualification",
    about:
      "The ACCA qualification is a world-leading accountancy qualification for aspiring financial professionals. It provides students with the skills, knowledge, and values to have successful careers and lead the organizations they work with.",
    whyTitle: "Why Choose Raad for ACCA?",
    whyPoints: [
      "Platinum-Standard Teaching: Learn from ACCA members with industry experience.",
      "Extensive Resources: Access to our physical library and advanced e-library with past papers and kits.",
      "Exam Focus: Regular mock exams and 1-on-1 feedback sessions to ensure you are exam-ready.",
    ],
    careerTitle: "Career Prospects",
    careerRoles: ["Financial Analyst", "Auditor", "Tax Consultant", "Finance Manager", "CFO"],
    details: [
      { label: "Total Exams", value: "13 Exams" },
      { label: "Estimated Duration", value: "2 - 3 Years (Dependent on study pace)" },
      { label: "Entry Requirements", value: "2 A-Levels & 3 GCSEs (Or via FIA route)" },
    ],
    color: "primary",
  },
  fia: {
    slug: "fia",
    badge: "Entry Level Finance",
    name: "FIA",
    full: "Foundations in Accountancy",
    aboutTitle: "About the Qualification",
    about:
      "FIA is the perfect starting point for a career in finance. It covers the key principles of accounting and provides you with a solid foundation. Completion of the FIA Diploma transfers you directly into the skilled module of the ACCA qualification.",
    whyTitle: "Why Choose Raad for FIA?",
    whyPoints: [
      "Supportive Environment: Perfect for beginners, with patient expert guidance.",
      "Practical skills: Learn skills you can apply immediately in junior finance roles.",
      "Progression: Seamless transition to full ACCA study upon completion.",
    ],
    careerTitle: "Career Prospects",
    careerRoles: ["Junior Accountant", "Bookkeeper", "Payroll Administrator", "Accounts Assistant"],
    details: [
      { label: "Total Exams", value: "7 Exams" },
      { label: "Estimated Duration", value: "6 - 12 Months" },
      { label: "Entry Requirements", value: "None (Ideal for high school graduates)" },
    ],
    color: "auxiliary",
  },
  cia: {
    slug: "cia",
    badge: "Internal Audit Expert",
    name: "CIA",
    full: "Certified Internal Auditor",
    aboutTitle: "About the Qualification",
    about:
      "The CIA is the only globally recognized certification for internal auditors. It demonstrates your expertise in internal auditing, risk management, and governance. It is highly valued by employers in both the public and private sectors.",
    whyTitle: "Why Choose Raad for CIA?",
    whyPoints: [
      "Specialized Training: Taught by CIA certified professionals.",
      "Exam Technique: Focus on understanding the specific logic required for CIA exams.",
      "Comprehensive Material: Up-to-date study guides and practice questions.",
    ],
    careerTitle: "Career Prospects",
    careerRoles: ["Internal Auditor", "Risk Manager", "Audit Manager", "Chief Audit Executive"],
    details: [
      { label: "Total Exams", value: "3 Parts" },
      { label: "Estimated Duration", value: "12 - 18 Months" },
      { label: "Prerequisites", value: "Bachelor's Degree (Or equivalent experience)" },
    ],
    color: "success",
  },
};

export const LANDING_QUALIFICATIONS: QualificationSlug[] = ["acca", "fia", "cia"];

export const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3286.1823754634465!2d69.14406249999999!3d34.5489375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d16f004e5c68a7%3A0xb12b4ab97b7f9962!2sRaad%20Educational%20Institute!5e0!3m2!1sen!2sie!4v1768089342312!5m2!1sen!2sie";

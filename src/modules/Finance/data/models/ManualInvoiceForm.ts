import { z } from "zod";

export const OTHER_SERVICE_NAME = "Other";

export const PRESET_SERVICE_NAMES = [
  "Books Gross Sale",
  "Exam Facility Fee",
  "Online Payment Changes",
  "Exchange Gain / (Loss)",
  "Online Payments Risk Allowance Gain/ (Loss)",
  "Other Operating Income",
] as const;

export interface ServiceNameOption {
  value: string;
  label: string;
}

const emptyOr = (pattern: RegExp) => (value: string) => value === "" || pattern.test(value);

export function manualInvoiceContactSchema(message: {
  nationalId: string;
  phone: string;
  email: string;
  service: string;
}) {
  return z.object({
    customer_national_id: z
      .string()
      .trim()
      .max(64, message.nationalId)
      .refine(emptyOr(/^[A-Za-z0-9-]+$/), message.nationalId),
    customer_phone: z
      .string()
      .trim()
      .max(20, message.phone)
      .refine(emptyOr(/^\+?[0-9]{7,15}$/), message.phone),
    customer_email: z
      .string()
      .trim()
      .refine((value) => value === "" || z.string().email().safeParse(value).success, message.email),
    service_name: z
      .string()
      .trim()
      .max(255, message.service)
      .refine((value) => value === "" || (value.toLowerCase() !== "other" && !value.includes(",")), message.service),
  });
}

export function keepPhoneChars(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\+/g, "");
  return `${cleaned.startsWith("+") ? "+" : ""}${digits}`.slice(0, 16);
}

export function keepNationalIdChars(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 64);
}

/**
 * Course wizard enums — values align with Laravel `StoreCourseRequest` / `UpdateCourseRequest`.
 */

export const CourseLanguage = {
  PASHTOO: "PASHTOO",
  DARI: "DARI",
  ENGLISH: "ENGLISH",
} as const;

export type CourseLanguageValue = (typeof CourseLanguage)[keyof typeof CourseLanguage];

export const COURSE_LANGUAGE_OPTIONS: readonly { value: CourseLanguageValue; label: string }[] = [
  { value: CourseLanguage.PASHTOO, label: "Pashto" },
  { value: CourseLanguage.DARI, label: "Dari" },
  { value: CourseLanguage.ENGLISH, label: "English" },
];

export const CourseLevel = {
  ESSENTIAL: "Essential",
  COMPREHENSIVE: "Comprehensive",
  PRACTICE_INTENSIVE: "Practice-Intensive",
  EXPERT_LED: "Expert-Led",
} as const;

export type CourseLevelValue = (typeof CourseLevel)[keyof typeof CourseLevel];

export const COURSE_LEVEL_OPTIONS: readonly { value: CourseLevelValue; label: string }[] = [
  { value: CourseLevel.ESSENTIAL, label: "Essential" },
  { value: CourseLevel.COMPREHENSIVE, label: "Comprehensive" },
  { value: CourseLevel.PRACTICE_INTENSIVE, label: "Practice-Intensive" },
  { value: CourseLevel.EXPERT_LED, label: "Expert-Led" },
];

/** Labels for levels saved before the current option list. Display only — rows are not rewritten. */
const LEGACY_COURSE_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function isCourseLevelValue(raw: unknown): raw is CourseLevelValue {
  const value = String(raw ?? "").trim();
  return COURSE_LEVEL_OPTIONS.some((option) => option.value === value);
}

export function courseLevelLabel(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "—";
  const current = COURSE_LEVEL_OPTIONS.find((option) => option.value === value);
  if (current) return current.label;
  return LEGACY_COURSE_LEVEL_LABELS[value.toUpperCase()] ?? value;
}

import type { CourseEntitySlug } from "../courseRegistry";

export const courseQueryKeys = {
  overview: ["course", "overview"] as const,
  entity: (slug: CourseEntitySlug, params?: Record<string, unknown>) =>
    ["course", "entity", slug, params ?? {}] as const,
};

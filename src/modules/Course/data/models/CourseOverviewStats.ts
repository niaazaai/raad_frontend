import { z } from "zod";

export const CourseOverviewStatsSchema = z.object({
  currency: z.string().optional(),
  main_categories_count: z.number().optional(),
  sub_categories_count: z.number().optional(),
  courses_count: z.number().optional(),
  active_courses_count: z.number().optional(),
  featured_courses_count: z.number().optional(),
  popular_courses_count: z.number().optional(),
  new_courses_count: z.number().optional(),
  free_courses_count: z.number().optional(),
  lessons_count: z.number().optional(),
  modules_count: z.number().optional(),
  assignments_count: z.number().optional(),
  instructors_count: z.number().optional(),
  subscription_plans_count: z.number().optional(),
  subscriptions_count: z.number().optional(),
  active_subscriptions_count: z.number().optional(),
  pending_subscriptions_count: z.number().optional(),
  inactive_subscriptions_count: z.number().optional(),
  expired_subscriptions_count: z.number().optional(),
  cancelled_subscriptions_count: z.number().optional(),
  paying_students_count: z.number().optional(),
  total_revenue: z.number().optional(),
  monthly_revenue: z.number().optional(),
  pending_revenue: z.number().optional(),
});

export type CourseOverviewStats = z.infer<typeof CourseOverviewStatsSchema>;

export function parseCourseOverviewStats(payload: unknown): CourseOverviewStats {
  const parsed = CourseOverviewStatsSchema.safeParse(payload);
  return parsed.success ? parsed.data : {};
}

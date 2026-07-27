// Export all hooks from a single entry point
export {
  useQueryApi,
  useMutationApi,
  useMultiQueryApi,
  useSuspenseQueryApi,
} from "./common/useQueryApi";
export { useDataTableParams } from "./common/useDataTableParams";
export { default as useApi } from "./common/useApi";
export { useDebounce } from "./common/useDebounce";
export {
  usePublicCourses,
  usePublicCourseDetail,
  usePublicCoursePreviewPlayback,
  getPublicCoursesFromResponse,
  getPublicCourseDetailFromResponse,
  getPreviewPlaybackFromResponse,
  getPublicCoursesPagination,
  PUBLIC_COURSES_QUERY_KEY,
  type PublicCourseListItem,
  type PublicCourseDetail,
  type PublicCourseDetailModule,
  type PublicCourseDetailLesson,
  type PublicCoursesPagination,
  type PreviewPlaybackPayload,
  type PublicSubscriptionPlan,
} from "./usePublicCourses";
export {
  useCourseLearn,
  useMyEnrollments,
  getCourseLearnFromResponse,
  getMyEnrollmentsFromResponse,
  getMyEnrollmentsPagination,
  type CourseLearnPayload,
  type CourseLearnLesson,
  type CourseLearnQuizFile,
  type MyEnrollmentItem,
} from "./useStudentLearning";
export { useDashboardStats, useDashboardAnalytics } from "./useDashboardStats";
export type {
  DashboardStats,
  DashboardAnalytics,
  DashboardChartPoint,
  DashboardSparkPoint,
} from "./useDashboardStats";
export { usePublicStats, useSubmitContactForm } from "./usePublicSite";
export type { PublicStats, ContactFormData } from "./usePublicSite";
export {
  usePublicBlogs,
  usePublicBlog,
  usePublicStudentSuccess,
  usePublicStudentSuccessAll,
  getPublicListFromResponse,
  getPublicItemFromResponse,
  getPublicPaginationFromResponse,
} from "./usePublicContent";
export type { PublicBlog, PublicStudentSuccess } from "./usePublicContent";
export { useIsDarkMode, useResolvedTheme } from "./useResolvedTheme";

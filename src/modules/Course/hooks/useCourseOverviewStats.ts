import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { COURSE_ENDPOINTS } from "../data/constants/endpoints";
import { courseQueryKeys } from "../data/constants/queryKeys";
import type { CourseOverviewStats } from "../data/models";

export function useCourseOverviewStats(enabled = true) {
  return useQueryApi<CourseOverviewStats>({
    queryKey: courseQueryKeys.overview,
    url: COURSE_ENDPOINTS.OVERVIEW,
    method: RequestMethod.GET,
    options: {
      enabled,
      staleTime: 60 * 1000,
    },
  });
}

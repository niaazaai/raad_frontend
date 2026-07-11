import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { PUBLIC_ENDPOINTS, PUBLIC_QUERY_KEYS } from "@/data/constants/publicEndpoints";

export interface PublicStats {
  students_enrolled: number;
  programs_count: number;
  courses_conducted: number;
  years_of_excellence: number;
  graduate_employment_percent: number;
}

export interface ContactFormData {
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  locale?: string;
  website?: string;
}

export function usePublicStats() {
  return useQueryApi<PublicStats>({
    queryKey: PUBLIC_QUERY_KEYS.stats,
    url: PUBLIC_ENDPOINTS.STATS,
    method: RequestMethod.GET,
    options: {
      staleTime: 5 * 60 * 1000,
    },
  });
}

export function useSubmitContactForm() {
  return useMutationApi<null, ContactFormData>({
    url: PUBLIC_ENDPOINTS.CONTACT,
    method: RequestMethod.POST,
  });
}

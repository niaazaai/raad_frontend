import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { shouldRetryQuery } from "@/lib/apiError";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider
 *
 * Provides QueryClient to the application with optimized defaults:
 * - 5 minute stale time
 * - 10 minute garbage collection
 * - No automatic refetching
 * - One retry, except 429 and other 4xx responses
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
            refetchOnMount: false,
            refetchOnReconnect: false,
            networkMode: "online",
          },
          mutations: {
            retry: shouldRetryQuery,
            networkMode: "online",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
};

export default QueryProvider;

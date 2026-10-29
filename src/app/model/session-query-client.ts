import { QueryClient } from "@tanstack/react-query";

export function createSessionQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => failureCount < 1 && error.name !== "QueryTimeoutError",
      },
    },
  });
}

import { queryOptions, useQuery } from "@tanstack/react-query";

import { withQueryTimeout } from "@/shared/api";
import { useAuth } from "@/shared/auth";

import { fetchPrograms } from "../api/programs";

export const programsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["programs", userId],
    queryFn: () => withQueryTimeout(fetchPrograms),
  });

export function usePrograms() {
  const { user } = useAuth();
  return useQuery({ ...programsQueryOptions(user?.id), enabled: Boolean(user) });
}

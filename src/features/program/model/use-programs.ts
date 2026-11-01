import { useQuery } from "@tanstack/react-query";

import { withQueryTimeout } from "@/shared/api";
import { useAuth } from "@/shared/auth";

import { fetchPrograms } from "../api/programs";

export function usePrograms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["programs", user?.id],
    queryFn: () => withQueryTimeout(fetchPrograms),
    enabled: Boolean(user),
  });
}

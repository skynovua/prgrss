import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchDashboardData } from "@/pages/dashboard/api/dashboard";
import { withQueryTimeout } from "@/shared/api";

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => withQueryTimeout(fetchDashboardData),
});

export function useDashboard() {
  return useQuery(dashboardQueryOptions);
}

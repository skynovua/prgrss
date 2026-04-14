import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/src/lib/api/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });
}

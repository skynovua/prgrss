import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/pages/dashboard/api/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });
}

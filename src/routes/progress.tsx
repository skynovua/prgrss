import { useQuery } from "@tanstack/react-query";
import { ProgressContent } from "@/src/components/charts/progress-content";
import { getProgressData } from "@/src/lib/api/stats";

export default function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["progress", "30d"],
    queryFn: () => getProgressData("30d"),
  });

  if (isLoading || !data) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100]">
        <div className="bg-primary h-0.5 animate-pulse" />
      </div>
    );
  }

  return <ProgressContent initialData={data} initialPeriod="30d" />;
}

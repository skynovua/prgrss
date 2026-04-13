import { ProgressContent } from "@/components/charts/progress-content";
import { getProgressData } from "@/lib/actions/stats";

export default async function ProgressPage() {
  const initialData = await getProgressData("30d");

  return <ProgressContent initialData={initialData} initialPeriod="30d" />;
}

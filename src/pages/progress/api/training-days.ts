import { supabase } from "@/shared/api";

export async function fetchTrainingDays(since: string | null) {
  const pageSize = 1000;
  const fetchPage = async (offset: number) => {
    let query = supabase
      .from("workouts")
      .select("id, started_at")
      .not("finished_at", "is", null)
      .not("started_at", "is", null)
      .order("started_at")
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (since) query = query.gte("started_at", since);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  };

  const workouts = await fetchPage(0);
  let pageLength = workouts.length;
  while (pageLength === pageSize) {
    const page = await fetchPage(workouts.length);
    workouts.push(...page);
    pageLength = page.length;
  }
  return workouts;
}

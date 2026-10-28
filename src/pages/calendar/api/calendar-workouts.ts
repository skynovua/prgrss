import { supabase } from "@/shared/api";

import { type CalendarWorkout, getWorkoutDurationMinutes } from "../model/calendar";

export async function fetchCalendarWorkouts(
  userId: string,
  start: string,
  end: string,
  signal?: AbortSignal
): Promise<CalendarWorkout[]> {
  const query = supabase
    .from("workouts")
    .select("id, name, started_at, finished_at, sets(exercise_id, exercises(muscle_group))")
    .eq("user_id", userId)
    .gte("started_at", start)
    .lt("started_at", end)
    .order("started_at", { ascending: false })
    .order("id");
  const { data, error } = await (signal ? query.abortSignal(signal) : query);
  if (error) throw error;
  return (data ?? []).map((workout) => ({
    id: workout.id,
    name: workout.name,
    started_at: workout.started_at,
    finished_at: workout.finished_at,
    setsCount: workout.sets.length,
    exerciseCount: new Set(workout.sets.map((set) => set.exercise_id)).size,
    muscleGroups: [
      ...new Set(
        workout.sets.flatMap((set) =>
          set.exercises?.muscle_group ? [set.exercises.muscle_group] : []
        )
      ),
    ],
    durationMinutes: getWorkoutDurationMinutes(workout.started_at, workout.finished_at),
  }));
}

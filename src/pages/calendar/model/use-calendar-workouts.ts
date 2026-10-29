import { useQuery } from "@tanstack/react-query";

import { withQueryTimeout } from "@/shared/api";
import { useAuth } from "@/shared/auth";

import { fetchCalendarWorkouts } from "../api/calendar-workouts";
import { type CalendarView, getCalendarPeriod } from "./calendar";

export function useCalendarWorkouts(dateKey: string, view: CalendarView) {
  const { user } = useAuth();
  const period = getCalendarPeriod(dateKey, view);
  return useQuery({
    queryKey: ["calendar", user?.id, period.startIso, period.endIso],
    queryFn: ({ signal }) =>
      withQueryTimeout(() =>
        fetchCalendarWorkouts(user!.id, period.startIso, period.endIso, signal)
      ),
    enabled: !!user,
    staleTime: 60_000,
  });
}

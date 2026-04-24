import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { WorkoutCalendar } from "@/src/components/workout/workout-calendar";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { useDashboard } from "@/src/lib/hooks/use-dashboard";

export default function CalendarPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <LoaderBar />;
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 pt-3">
      <div className="relative flex items-center justify-center py-1">
        <Link
          to="/dashboard"
          className="text-muted-foreground hover:text-foreground bg-background/85 ring-foreground/8 absolute left-0 flex h-11 w-11 items-center justify-center rounded-full ring-1 backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Календар</h1>
      </div>

      <WorkoutCalendar workouts={data.calendarWorkouts} variant="months" />
    </div>
  );
}

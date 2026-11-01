import { Link } from "@tanstack/react-router";
import { ChevronRight, Dumbbell, Plus } from "lucide-react";

import { StartProgramButton, usePrograms } from "@/features/program";
import { cn } from "@/shared/lib";
import { Button, buttonVariants, RefreshNotice, Skeleton } from "@/shared/ui";

const exerciseLabels = {
  zero: "вправ",
  one: "вправа",
  two: "вправи",
  few: "вправи",
  many: "вправ",
  other: "вправи",
};
const pluralRules = new Intl.PluralRules("uk-UA");

export function DashboardPrograms() {
  const { data, isPending, isError, fetchStatus, refetch } = usePrograms();

  return (
    <section className="flex flex-col gap-3" aria-labelledby="dashboard-programs-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dashboard-programs-title" className="text-base font-semibold">
          Мої шаблони
        </h2>
        {data && data.length > 0 && (
          <Link
            to="/programs"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-mr-2")}
          >
            Усі <ChevronRight data-icon="inline-end" />
          </Link>
        )}
      </div>
      {isError && data && <RefreshNotice onRetry={() => void refetch()} />}
      {isPending && fetchStatus !== "paused" ? (
        <div className="flex gap-3 overflow-hidden" role="status" aria-label="Завантажуємо шаблони">
          {[0, 1].map((index) => (
            <div key={index} className="flex w-40 shrink-0 flex-col gap-2">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground text-sm" role="alert">
            Не вдалося завантажити шаблони тренувань.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Спробувати ще
          </Button>
        </div>
      ) : (
        <div
          className="-mx-5 flex snap-x snap-mandatory scroll-ps-5 scrollbar-none gap-3 overflow-x-auto px-5 pb-2 md:-mx-8 md:scroll-ps-8 md:px-8"
          role="region"
          aria-label="Шаблони тренувань. Прокрути горизонтально, щоб переглянути всі."
          tabIndex={0}
        >
          {data.map((program) => (
            <div key={program.id} className="w-40 shrink-0 snap-start sm:w-44">
              <StartProgramButton
                program={program}
                variant="ghost"
                className="h-full flex-col items-stretch justify-start gap-0 p-0 text-left whitespace-normal"
              >
                <span className="bg-muted text-muted-foreground flex h-28 items-center justify-center rounded-xl">
                  <Dumbbell aria-hidden="true" className="size-8" />
                </span>
                <span className="mt-2 line-clamp-2 text-sm leading-snug font-semibold">
                  {program.name}
                </span>
                <span className="text-muted-foreground mt-1 text-xs">
                  {program.exercises.length}{" "}
                  {exerciseLabels[pluralRules.select(program.exercises.length)]}
                </span>
              </StartProgramButton>
            </div>
          ))}
          <Link
            to="/programs"
            search={{ create: true }}
            className="focus-visible:ring-ring flex w-40 shrink-0 snap-start flex-col gap-2 rounded-xl outline-none focus-visible:ring-2 sm:w-44"
          >
            <span className="border-border bg-muted text-muted-foreground flex h-28 items-center justify-center gap-1 rounded-xl border border-dashed text-sm font-medium">
              <Plus aria-hidden="true" className="size-4" /> Новий
            </span>
            <span className="text-sm leading-snug font-semibold">Створити шаблон</span>
          </Link>
        </div>
      )}
    </section>
  );
}

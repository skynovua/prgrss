import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { toast } from "sonner";

import { ExerciseDetailsById, useExercises } from "@/entities/exercise";
import type { ExerciseData, WorkoutExercise } from "@/entities/workout";
import { saveProgram, StartProgramButton, usePrograms } from "@/features/program";
import { useAuth } from "@/shared/auth";
import { Button, PageError, PageHeader, RefreshNotice, Skeleton } from "@/shared/ui";

import { ProgramEditor } from "./program-editor";
import { ProgramExerciseCard } from "./program-exercise-card";
import { ProgramMuscles, ProgramMusclesLoading } from "./program-muscles";

export default function ProgramDetailPage() {
  const { id } = useParams({ from: "/app/programs/$id" });
  const { from } = useSearch({ from: "/app/programs/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const programs = usePrograms();
  const [editing, setEditing] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<ExerciseData | null>(null);
  const program = programs.data?.find((item) => item.id === id);
  const catalog = useExercises({ enabled: Boolean(program?.exercises.length) });
  useLayoutEffect(() => {
    if (from === "dashboard") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [from, id]);
  const save = useMutation({
    mutationFn: ({ name, exercises }: { name: string; exercises: WorkoutExercise[] }) =>
      saveProgram(user!.id, name, exercises, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Шаблон збережено");
    },
    onError: (error) => toast.error("Не вдалося зберегти шаблон", { description: error.message }),
  });

  if (programs.isPending && programs.fetchStatus !== "paused") return <ProgramDetailLoading />;
  if (!programs.data)
    return <PageError title="Шаблон не завантажився" onRetry={() => void programs.refetch()} />;
  if (!program)
    return (
      <div className="flex flex-col gap-4 p-5">
        <PageError title="Шаблон не знайдено" description="Його видалено або він недоступний." />
        <Link to="/programs" search={{}} className="text-primary text-sm underline">
          До шаблонів
        </Link>
      </div>
    );
  if (catalog.isPending && catalog.fetchStatus !== "paused" && program.exercises.length > 0)
    return <ProgramDetailLoading />;
  if (editing)
    return (
      <ProgramEditor
        key={program.id}
        initialName={program.name}
        initialExercises={program.exercises}
        saving={save.isPending}
        onSave={(name, exercises) => save.mutateAsync({ name, exercises })}
        onBack={() => setEditing(false)}
      />
    );

  const setsCount = program.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pb-8 md:px-8">
      <PageHeader className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          aria-label="Повернутися"
          onClick={() =>
            void navigate({ to: from === "dashboard" ? "/dashboard" : "/programs", search: {} })
          }
        >
          <ArrowLeft />
        </Button>
        <h1 className="min-w-0 flex-1 text-xl font-medium tracking-tight">{program.name}</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Редагувати шаблон"
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
      </PageHeader>
      {programs.isError && <RefreshNotice onRetry={() => void programs.refetch()} />}
      <p className="text-muted-foreground text-sm">
        Вправ: {program.exercises.length} · Підходів: {setsCount}
      </p>
      <StartProgramButton program={program} variant="primary" />
      <section className="flex flex-col gap-3" aria-labelledby="program-exercises-title">
        <h2 id="program-exercises-title" className="text-base font-semibold">
          Вправи та підходи
        </h2>
        {program.exercises.map((entry) => (
          <ProgramExerciseCard
            key={entry.instanceId}
            exercise={entry}
            onOpenDetails={() => setDetailsTarget(entry.exercise)}
          />
        ))}
      </section>
      <ProgramMuscles exercises={program.exercises} />
      {detailsTarget && (
        <ExerciseDetailsById exercise={detailsTarget} onClose={() => setDetailsTarget(null)} />
      )}
    </div>
  );
}

function ProgramDetailLoading() {
  return (
    <div
      className="flex flex-1 flex-col gap-6 px-5 pb-8 md:px-8"
      role="status"
      aria-label="Завантажуємо шаблон"
      aria-busy="true"
    >
      <PageHeader className="flex items-center gap-3" aria-hidden="true">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <Skeleton className="h-6 w-40 max-w-full" />
      </PageHeader>
      <Skeleton className="h-5 w-36" aria-hidden="true" />
      <Skeleton className="h-11 w-full" aria-hidden="true" />
      <section className="flex flex-col gap-3" aria-hidden="true">
        <h2 className="text-base font-semibold">Вправи та підходи</h2>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </section>
      <ProgramMusclesLoading />
    </div>
  );
}

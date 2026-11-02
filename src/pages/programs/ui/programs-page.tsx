import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Ellipsis, Layers3, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useWorkoutDetail, type WorkoutExercise } from "@/entities/workout";
import {
  deleteProgram,
  type Program,
  programFromWorkout,
  saveProgram,
  usePrograms,
} from "@/features/program";
import { useAuth } from "@/shared/auth";
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  PageError,
  PageHeader,
  RefreshNotice,
  Skeleton,
} from "@/shared/ui";

import { ProgramEditor } from "./program-editor";

export default function ProgramsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fromWorkout, create } = useSearch({ from: "/app/programs" });
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<Program | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const source = useWorkoutDetail(fromWorkout);
  const programs = usePrograms();
  const save = useMutation({
    mutationFn: ({
      name,
      exercises,
      id,
    }: {
      name: string;
      exercises: WorkoutExercise[];
      id?: string;
    }) => saveProgram(user!.id, name, exercises, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Програму збережено");
    },
    onError: (error) => toast.error("Не вдалося зберегти програму", { description: error.message }),
  });
  const remove = useMutation({
    mutationFn: (program: Program) => deleteProgram(user!.id, program.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["programs"] });
      setDeleteTarget(null);
      toast.success("Програму видалено");
    },
    onError: (error) => toast.error("Не вдалося видалити програму", { description: error.message }),
  });
  const closeEditor = () => {
    setEditor(null);
    if (fromWorkout || create) void navigate({ to: "/programs", search: {} });
  };

  if (fromWorkout) {
    if (source.isPending)
      return (
        <div className="flex flex-col gap-4 p-5" aria-label="Завантажуємо тренування" role="status">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    if (!source.data)
      return (
        <PageError
          title="Тренування не знайдено"
          description="Його видалено або воно недоступне."
          onRetry={() => void source.refetch()}
        />
      );
    return (
      <ProgramEditor
        key={fromWorkout}
        initialName={source.data.workout.name ?? ""}
        initialExercises={programFromWorkout(source.data.workout, source.data.exercises)}
        saving={save.isPending}
        onSave={(name, exercises) => save.mutateAsync({ name, exercises })}
        onBack={closeEditor}
      />
    );
  }
  const currentEditor = editor ?? (create ? "new" : null);
  if (currentEditor)
    return (
      <ProgramEditor
        key={currentEditor === "new" ? "new" : currentEditor.id}
        initialName={currentEditor === "new" ? "" : currentEditor.name}
        initialExercises={currentEditor === "new" ? [] : currentEditor.exercises}
        saving={save.isPending}
        onSave={(name, exercises) =>
          save.mutateAsync({
            name,
            exercises,
            id: currentEditor === "new" ? undefined : currentEditor.id,
          })
        }
        onBack={closeEditor}
      />
    );

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pb-8 md:px-8">
      <PageHeader className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-medium tracking-tight">Програми</h1>
        <Button
          size="icon"
          variant="secondary"
          aria-label="Створити програму"
          onClick={() => setEditor("new")}
        >
          <Plus />
        </Button>
      </PageHeader>
      {programs.isError && programs.data && (
        <RefreshNotice onRetry={() => void programs.refetch()} />
      )}
      {programs.isPending ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Завантажуємо програми">
          <Skeleton className="h-[4.5rem] w-full" />
          <Skeleton className="h-[4.5rem] w-full" />
        </div>
      ) : !programs.data ? (
        <PageError title="Програми не завантажилися" onRetry={() => void programs.refetch()} />
      ) : programs.data.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers3 />
            </EmptyMedia>
            <EmptyTitle>Поки немає програм</EmptyTitle>
            <EmptyDescription>Створи шаблон, щоб швидше починати тренування.</EmptyDescription>
          </EmptyHeader>
          <Button variant="primary" onClick={() => setEditor("new")}>
            <Plus data-icon="inline-start" /> Створити програму
          </Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {programs.data.map((program) => (
            <Card key={program.id} size="sm" className="py-3">
              <CardContent className="flex items-center gap-2">
                <Link
                  to="/programs/$id"
                  params={{ id: program.id }}
                  search={{}}
                  className="focus-visible:ring-ring min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2"
                >
                  <h2 className="text-sm leading-snug font-semibold">{program.name}</h2>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                    {program.exercises.length
                      ? program.exercises.map((entry) => entry.exercise.name).join(", ")
                      : "Додай вправи до програми"}
                  </p>
                </Link>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Дії для програми ${program.name}`}
                      />
                    }
                  >
                    <Ellipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setEditor(program)}>
                        <Pencil /> Редагувати
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(program)}
                      >
                        <Trash2 /> Видалити
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Видалити програму?"
        description="Шаблон буде видалено. Виконані тренування залишаться в історії."
        confirmText="Видалити"
        isDestructive
        isLoading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget)}
      />
    </div>
  );
}

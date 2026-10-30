import { X } from "lucide-react";
import { lazy, Suspense } from "react";

import { EQUIPMENT_LABELS } from "@/shared/config";
import {
  Badge,
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@/shared/ui";

import { useExercises } from "../hooks/use-exercises";
import type { ExerciseCatalogItem, ExerciseMuscleTarget } from "../model/exercise-catalog";
import { AnatomyLoading } from "./anatomy-loading";

const LazyAnatomyMap = lazy(() =>
  import("./anatomy-map").then(({ AnatomyMap }) => ({ default: AnatomyMap }))
);

type ExerciseDetails = Pick<ExerciseCatalogItem, "name" | "equipment" | "muscles">;

interface ExerciseDetailsDialogProps {
  exercise: ExerciseDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  loadError?: boolean;
}

function MuscleList({ title, muscles }: { title: string; muscles: ExerciseMuscleTarget[] }) {
  if (muscles.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-2">
        {muscles.map((muscle) => (
          <div key={muscle.muscleKey} className="bg-muted flex items-center gap-3 rounded-2xl p-3">
            <span className="min-w-0 flex-1 text-sm font-medium">{muscle.name}</span>
            <Badge variant={muscle.activationScore >= 8 ? "default" : "secondary"}>
              {muscle.activationScore}/10
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExerciseDetailsDialog({
  exercise,
  open,
  onOpenChange,
  loading = false,
  loadError = false,
}: ExerciseDetailsDialogProps) {
  const muscles = exercise?.muscles ?? [];
  const primaryMuscles = muscles.filter((muscle) => muscle.activationScore >= 8);
  const secondaryMuscles = muscles.filter((muscle) => muscle.activationScore < 8);
  const mapMuscles = muscles.map((muscle) => ({ key: muscle.muscleKey, name: muscle.name }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="pt-[env(safe-area-inset-top)] transition-[transform,opacity] duration-250 data-[side=top]:h-dvh data-[side=top]:border-0 data-[side=top]:data-ending-style:-translate-y-full data-[side=top]:data-starting-style:-translate-y-full motion-reduce:transition-none"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
          <SheetHeader className="flex-row items-start gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg leading-snug">
                {exercise?.name ?? "Деталі вправи"}
              </SheetTitle>
              <SheetDescription className="mt-1">
                {exercise?.equipment ? EQUIPMENT_LABELS[exercise.equipment] : "Без обладнання"}
              </SheetDescription>
            </div>
            <SheetClose render={<Button variant="secondary" size="icon-sm" aria-label="Закрити" />}>
              <X />
            </SheetClose>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {exercise && (
              <div className="flex flex-col gap-6">
                {loading ? (
                  <div
                    className="flex flex-col gap-6"
                    role="status"
                    aria-label="Завантажуємо дані вправи"
                    aria-busy="true"
                  >
                    <div className="bg-muted rounded-3xl p-3">
                      <AnatomyLoading compact />
                    </div>
                    {[0, 1].map((group) => (
                      <div key={group} className="flex flex-col gap-2" aria-hidden="true">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : loadError ? (
                  <p className="text-muted-foreground text-sm" role="alert">
                    Не вдалося завантажити дані вправи.
                  </p>
                ) : muscles.length > 0 ? (
                  <Suspense
                    fallback={
                      <div className="bg-muted rounded-3xl p-3">
                        <AnatomyLoading compact />
                      </div>
                    }
                  >
                    <LazyAnatomyMap
                      muscles={mapMuscles}
                      highlights={muscles}
                      compact
                      className="bg-muted rounded-3xl p-3"
                    />
                  </Suspense>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Для цієї вправи анатомічна розмітка ще не додана.
                  </p>
                )}
                <MuscleList title="Основні" muscles={primaryMuscles} />
                <MuscleList title="Додаткові" muscles={secondaryMuscles} />
                {muscles.length > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Ділянки входять до складу відповідного м’яза. Оцінки та зони умовні: техніка й
                    індивідуальні особливості змінюють навантаження.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ExerciseDetailsById({
  exercise,
  onClose,
}: {
  exercise: { id: string; name: string; equipment: string | null };
  onClose: () => void;
}) {
  const { data, isPending, isError } = useExercises();
  const details = data?.find((item) => item.id === exercise.id) ?? { ...exercise, muscles: [] };
  return (
    <ExerciseDetailsDialog
      exercise={details}
      loading={isPending}
      loadError={isError && !data}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
}

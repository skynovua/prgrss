import { Heart, Info, Plus, Search, TrendingUp } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  type ExerciseCatalogItem,
  ExerciseDetailsDialog,
  useFavoriteExerciseIds,
  usePopularExerciseIds,
  useToggleFavoriteExercise,
} from "@/entities/exercise/@x/workout";
import {
  EQUIPMENT_LABELS,
  type Exercise,
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
} from "@/entities/workout";
import { cn } from "@/shared/lib";
import { Input } from "@/shared/ui";
import { ScrollArea } from "@/shared/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { MuscleGroupIcon } from "@/shared/ui";

type SortMode = "all" | "popular" | "favorites";

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  trigger?: React.ReactNode;
}

function isExerciseCatalogItem(exercise: Exercise): exercise is ExerciseCatalogItem {
  return "muscles" in exercise && Array.isArray(exercise.muscles);
}

export function ExercisePicker({ exercises, onSelect, trigger }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [detailsTarget, setDetailsTarget] = useState<ExerciseCatalogItem | null>(null);

  const { data: favoriteIds = [] } = useFavoriteExerciseIds({ enabled: open });
  const { data: popularIds = [] } = usePopularExerciseIds({ enabled: open });
  const toggleFavorite = useToggleFavoriteExercise();

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const popularOrder = useMemo(() => new Map(popularIds.map((id, i) => [id, i])), [popularIds]);

  const filtered = useMemo(() => {
    let result = exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = activeGroup === "all" || ex.muscle_group === activeGroup;
      return matchesSearch && matchesGroup;
    });

    if (sortMode === "favorites") {
      result = result.filter((ex) => favoriteSet.has(ex.id));
    } else if (sortMode === "popular") {
      result = result
        .filter((ex) => popularOrder.has(ex.id))
        .sort((a, b) => (popularOrder.get(a.id) ?? 0) - (popularOrder.get(b.id) ?? 0));
    }

    return result;
  }, [exercises, search, activeGroup, sortMode, favoriteSet, popularOrder]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setOpen(false);
    setSearch("");
    setActiveGroup("all");
    setSortMode("all");
  };

  // Захист від спаму: блокуємо повторний клік на ту саму вправу поки мутація в процесі
  const pendingIds = useRef(new Set<string>());

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, exerciseId: string) => {
      e.stopPropagation();
      if (pendingIds.current.has(exerciseId)) return;

      pendingIds.current.add(exerciseId);
      toggleFavorite.mutate(
        { exerciseId, wasFavorite: favoriteSet.has(exerciseId) },
        {
          onSettled: () => {
            pendingIds.current.delete(exerciseId);
          },
        }
      );
    },
    [toggleFavorite, favoriteSet]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger
          render={
            <Button variant="outline" className="w-full gap-2">
              <Plus data-icon="inline-start" />
              Додати вправу
            </Button>
          }
        />
      )}
      <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem]">
        <SheetHeader>
          <SheetTitle>Вибрати вправу</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <div className="relative mx-3">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Пошук вправ..."
              aria-label="Пошук вправ"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Таби: Всі / Популярні / Вподобані */}
          <div className="flex gap-1.5 px-3" role="group" aria-label="Сортування вправ">
            {[
              { mode: "all" as const, label: "Всі" },
              { mode: "popular" as const, label: "Популярні", icon: TrendingUp },
              { mode: "favorites" as const, label: "Вподобані", icon: Heart },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                aria-pressed={sortMode === mode}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground active:bg-accent"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {/* Фільтр по групі м'язів */}
          <div className="relative">
            <div
              className="mr-3 flex scrollbar-none gap-1.5 overflow-x-auto px-3"
              role="group"
              aria-label="Фільтр за м'язовою групою"
            >
              <button
                type="button"
                onClick={() => setActiveGroup("all")}
                aria-pressed={activeGroup === "all"}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeGroup === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground active:bg-accent"
                }`}
              >
                Всі
              </button>
              {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  aria-pressed={activeGroup === group}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeGroup === group
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground active:bg-accent"
                  }`}
                >
                  {MUSCLE_GROUP_LABELS[group]}
                </button>
              ))}
            </div>
            <div className="from-popover pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent" />
          </div>

          <ScrollArea className="h-[calc(85vh-260px)]">
            <div className="flex flex-col gap-1 pb-6">
              {filtered.map((exercise) => {
                const isFav = favoriteSet.has(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    className="hover:bg-accent flex items-center gap-1 px-3 py-1 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(exercise)}
                      className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
                    >
                      {exercise.muscle_group && (
                        <MuscleGroupIcon group={exercise.muscle_group as MuscleGroup} size="md" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {exercise.muscle_group &&
                            MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup]}{" "}
                          · {exercise.equipment && EQUIPMENT_LABELS[exercise.equipment]}
                        </p>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (isExerciseCatalogItem(exercise)) setDetailsTarget(exercise);
                      }}
                      disabled={!isExerciseCatalogItem(exercise)}
                      aria-label={`Деталі вправи ${exercise.name}`}
                    >
                      <Info />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => handleToggleFavorite(event, exercise.id)}
                      aria-label={
                        isFav
                          ? `Прибрати ${exercise.name} з вподобаних`
                          : `Додати ${exercise.name} до вподобаних`
                      }
                    >
                      <Heart
                        className={cn(
                          isFav ? "fill-primary text-primary" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">
                  {sortMode === "favorites"
                    ? "Немає вподобаних вправ"
                    : sortMode === "popular"
                      ? "Ще немає історії тренувань"
                      : "Нічого не знайдено"}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>

      <ExerciseDetailsDialog
        exercise={detailsTarget}
        open={detailsTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDetailsTarget(null);
        }}
      />
    </Sheet>
  );
}

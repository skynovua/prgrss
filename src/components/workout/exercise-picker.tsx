import { useState, useMemo, useCallback, useRef } from "react";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Plus, Search, Heart, TrendingUp } from "lucide-react";
import {
  type Exercise,
  type MuscleGroup,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "@/src/lib/types";
import {
  useFavoriteExerciseIds,
  useToggleFavoriteExercise,
  usePopularExerciseIds,
} from "@/src/lib/hooks/use-exercises";

type SortMode = "all" | "popular" | "favorites";

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  trigger?: React.ReactNode;
}

export function ExercisePicker({ exercises, onSelect, trigger }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("all");

  const { data: favoriteIds = [] } = useFavoriteExerciseIds();
  const { data: popularIds = [] } = usePopularExerciseIds();
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
        { exerciseId, isFavorite: favoriteSet.has(exerciseId) },
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
              <Plus className="h-4 w-4" />
              Додати вправу
            </Button>
          }
        />
      )}
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Вибрати вправу</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <div className="relative mx-3">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Пошук вправ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Таби: Всі / Популярні / Вподобані */}
          <div className="flex gap-1.5 px-3">
            {[
              { mode: "all" as const, label: "Всі" },
              { mode: "popular" as const, label: "Популярні", icon: TrendingUp },
              { mode: "favorites" as const, label: "Вподобані", icon: Heart },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
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
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-3">
              <button
                onClick={() => setActiveGroup("all")}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
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
                  onClick={() => setActiveGroup(group)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
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
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise)}
                    className="hover:bg-accent flex items-center justify-between px-3 py-3 text-left transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {exercise.muscle_group &&
                          MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup]}{" "}
                        · {exercise.equipment && EQUIPMENT_LABELS[exercise.equipment]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleToggleFavorite(e, exercise.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggleFavorite(e as unknown as React.MouseEvent, exercise.id);
                          }
                        }}
                        className="rounded-full p-1.5 transition-colors active:scale-90"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          }`}
                        />
                      </span>
                      <Plus className="text-muted-foreground h-4 w-4" />
                    </div>
                  </button>
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
    </Sheet>
  );
}

import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Dumbbell,
  EyeOff,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/shared/config";
import { cn } from "@/shared/lib";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  MuscleGroupIcon,
  PageHeader,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

import { useArchiveExercise, usePopularExerciseIds } from "../hooks/use-exercises";
import type { ExerciseCatalogItem } from "../model/exercise-catalog";
import { ExerciseDetailsDialog } from "./exercise-details-dialog";

const exercisePluralRules = new Intl.PluralRules("uk-UA");
const exerciseCountLabels = { one: "вправа", few: "вправи", many: "вправ", other: "вправ" };

interface ExerciseLibraryProps {
  exercises: ExerciseCatalogItem[];
}

export function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
  const archiveMutation = useArchiveExercise();
  const { data: popularExerciseIds = [] } = usePopularExerciseIds();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [activeEquipment, setActiveEquipment] = useState<string>("all");
  const [detailsTarget, setDetailsTarget] = useState<ExerciseCatalogItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ExerciseCatalogItem | null>(null);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("uk");
    return exercises.filter((exercise) => {
      const matchesSearch = [
        exercise.name,
        exercise.muscle_group && MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup],
        exercise.equipment && EQUIPMENT_LABELS[exercise.equipment],
        ...exercise.muscles.map((muscle) => muscle.name),
      ].some((value) => value?.toLocaleLowerCase("uk").includes(normalizedSearch));
      const matchesGroup = activeGroup === "all" || exercise.muscle_group === activeGroup;
      const matchesEquipment = activeEquipment === "all" || exercise.equipment === activeEquipment;
      return matchesSearch && matchesGroup && matchesEquipment;
    });
  }, [activeEquipment, activeGroup, exercises, search]);

  const handleArchive = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget.id, {
      onSuccess: () => setArchiveTarget(null),
    });
  };

  const muscleGroups = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
  const equipmentKeys = Object.keys(EQUIPMENT_LABELS);
  const browsingResults =
    searchOpen ||
    showAll ||
    Boolean(search.trim()) ||
    activeGroup !== "all" ||
    activeEquipment !== "all";
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const popularExercises = popularExerciseIds
    .flatMap((id) => {
      const exercise = exerciseById.get(id);
      return exercise ? [exercise] : [];
    })
    .slice(0, 3);
  const resetFilters = () => {
    setSearch("");
    setSearchOpen(false);
    setActiveGroup("all");
    setActiveEquipment("all");
    setShowAll(false);
    window.scrollTo({ top: 0 });
  };
  const openSearch = () => {
    setSearchOpen(true);
    window.requestAnimationFrame(() => searchRef.current?.focus());
  };
  const renderExercise = (exercise: ExerciseCatalogItem) => {
    const primaryMuscles = exercise.muscles
      .filter((muscle) => muscle.activationScore >= 8)
      .slice(0, 2)
      .map((muscle) => muscle.name)
      .join(" · ");
    const muscleLabel =
      primaryMuscles ||
      (exercise.muscle_group && MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup]);
    return (
      <div key={exercise.id} className="flex items-center gap-2">
        <button
          type="button"
          className="hover:bg-muted focus-visible:ring-ring -mx-2 flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-2 text-left outline-none focus-visible:ring-2"
          onClick={() => setDetailsTarget(exercise)}
        >
          <div
            className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-2xl [&_svg]:size-6 [&>div]:bg-transparent"
            aria-hidden="true"
          >
            {exercise.muscle_group ? (
              <MuscleGroupIcon group={exercise.muscle_group as MuscleGroup} size="md" />
            ) : (
              <Dumbbell className="text-muted-foreground" />
            )}
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-snug font-medium">{exercise.name}</span>
            <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              {muscleLabel && <span>{muscleLabel}</span>}
              {muscleLabel && exercise.equipment && <span aria-hidden="true">·</span>}
              {exercise.equipment && <span>{EQUIPMENT_LABELS[exercise.equipment]}</span>}
              {exercise.is_custom && <Badge variant="secondary">Власна</Badge>}
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </button>
        {exercise.is_custom && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => setArchiveTarget(exercise)}
            aria-label={`Приховати вправу ${exercise.name}`}
          >
            <EyeOff />
          </Button>
        )}
      </div>
    );
  };
  const equipmentItems = equipmentKeys.map((equipment) => ({
    value: equipment,
    label: EQUIPMENT_LABELS[equipment],
  }));

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pb-6 md:px-8">
      {!searchOpen && (
        <PageHeader key="header">
          <div className="w-full">
            {browsingResults ? (
              <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon-lg"
                  className="rounded-full"
                  onClick={resetFilters}
                  aria-label="Повернутися до огляду вправ"
                >
                  <ArrowLeft />
                </Button>
                <h1 className="text-center text-lg leading-snug font-semibold">
                  {activeGroup !== "all"
                    ? MUSCLE_GROUP_LABELS[activeGroup]
                    : activeEquipment !== "all"
                      ? EQUIPMENT_LABELS[activeEquipment]
                      : "Усі вправи"}
                </h1>
                <Button
                  variant="secondary"
                  size="icon-lg"
                  className="rounded-full"
                  onClick={openSearch}
                  aria-label="Пошук вправ"
                >
                  <Search />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <h1 className="min-w-0 text-xl font-medium tracking-tight">Вправи</h1>
                <Button
                  variant="outline"
                  size="icon"
                  render={<Link to="/exercises/new" />}
                  nativeButton={false}
                  aria-label="Додати вправу"
                >
                  <Plus />
                </Button>
              </div>
            )}
          </div>
        </PageHeader>
      )}

      {(!browsingResults || searchOpen) && (
        <PageHeader
          key="search"
          className={cn(
            "gap-2",
            !searchOpen &&
              "relative top-auto z-auto min-h-0 border-0 bg-transparent pt-0 pb-0 backdrop-blur-none before:hidden"
          )}
        >
          {searchOpen && <h1 className="sr-only">Пошук вправ</h1>}
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="exercise-search" className="sr-only">
              Пошук вправ
            </FieldLabel>
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                ref={searchRef}
                id="exercise-search"
                type="search"
                placeholder="Пошук вправ або м’язів"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 rounded-full pl-12"
              />
            </div>
          </Field>
          {searchOpen && (
            <Button
              variant="secondary"
              size="icon-lg"
              className="rounded-full"
              onClick={() => {
                setSearch("");
                setSearchOpen(false);
              }}
              aria-label="Закрити пошук"
            >
              <X />
            </Button>
          )}
        </PageHeader>
      )}

      {!browsingResults ? (
        <div className="flex flex-col gap-8">
          {popularExercises.length > 0 && (
            <section className="flex flex-col gap-2" aria-labelledby="popular-exercises-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="popular-exercises-title" className="text-lg font-semibold">
                    Твої вправи
                  </h2>
                  <p className="text-muted-foreground text-xs">Ті, які ти виконуєш найчастіше</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAll(true);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Усі <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
              <div className="divide-border divide-y">{popularExercises.map(renderExercise)}</div>
            </section>
          )}
          <section className="flex flex-col gap-3" aria-labelledby="muscle-groups-title">
            <div>
              <h2 id="muscle-groups-title" className="text-lg font-semibold">
                За групою м’язів
              </h2>
              <p className="text-muted-foreground text-sm">Обери, що хочеш тренувати</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {muscleGroups.map((group) => {
                const count = exercises.filter(
                  (exercise) => exercise.muscle_group === group
                ).length;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setActiveGroup(group);
                      setShowAll(true);
                      window.scrollTo({ top: 0 });
                    }}
                    className="bg-secondary hover:bg-accent focus-visible:ring-ring relative flex min-h-28 min-w-0 flex-col items-start justify-end overflow-hidden rounded-2xl p-4 text-left outline-none focus-visible:ring-2"
                  >
                    <div
                      className="text-muted-foreground pointer-events-none absolute top-1 right-1 opacity-50 [&_svg]:size-14 [&_svg]:stroke-[18] [&>div]:size-20 [&>div]:bg-transparent"
                      aria-hidden="true"
                    >
                      <MuscleGroupIcon group={group} />
                    </div>
                    <span className="relative text-base font-semibold">
                      {MUSCLE_GROUP_LABELS[group]}
                    </span>
                    <span className="text-muted-foreground relative text-xs">
                      {count}{" "}
                      {exerciseCountLabels[
                        exercisePluralRules.select(count) as keyof typeof exerciseCountLabels
                      ] ?? "вправ"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="flex flex-col gap-3" aria-labelledby="equipment-title">
            <div>
              <h2 id="equipment-title" className="text-lg font-semibold">
                За обладнанням
              </h2>
              <p className="text-muted-foreground text-sm">Знайди вправи під свій простір</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {equipmentKeys.map((equipment) => (
                <Button
                  key={equipment}
                  variant="secondary"
                  onClick={() => {
                    setActiveEquipment(equipment);
                    setShowAll(true);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  {EQUIPMENT_LABELS[equipment]}
                </Button>
              ))}
            </div>
          </section>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setShowAll(true);
              window.scrollTo({ top: 0 });
            }}
          >
            Переглянути всі вправи <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Select
              items={[
                { value: "all", label: "Усі групи м’язів" },
                ...muscleGroups.map((group) => ({
                  value: group,
                  label: MUSCLE_GROUP_LABELS[group],
                })),
              ]}
              value={activeGroup}
              onValueChange={(value) => {
                if (value && (value === "all" || muscleGroups.includes(value as MuscleGroup)))
                  setActiveGroup(value as MuscleGroup | "all");
              }}
            >
              <SelectTrigger
                aria-label="Група м’язів"
                className="bg-secondary rounded-full border-transparent"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Усі групи м’язів</SelectItem>
                  {muscleGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {MUSCLE_GROUP_LABELS[group]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              items={[{ value: "all", label: "Усе обладнання" }, ...equipmentItems]}
              value={activeEquipment}
              onValueChange={(value) => {
                if (value) setActiveEquipment(value);
              }}
            >
              <SelectTrigger
                aria-label="Обладнання"
                className="bg-secondary rounded-full border-transparent"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Усе обладнання</SelectItem>
                  {equipmentKeys.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {EQUIPMENT_LABELS[equipment]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground text-xs" role="status">
            Знайдено {filtered.length} із {exercises.length}
          </p>
          <div className="divide-border divide-y">{filtered.map(renderExercise)}</div>
          {filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <Search className="text-muted-foreground size-5" />
                <p className="text-sm font-medium">Нічого не знайдено</p>
                <p className="text-muted-foreground text-sm">Спробуй змінити пошук або фільтри.</p>
                <Button variant="outline" onClick={resetFilters}>
                  Скинути фільтри
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Діалог приховування */}
      <Dialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Приховати вправу?</DialogTitle>
            <DialogDescription>
              Вправа &quot;{archiveTarget?.name}&quot; зникне з бібліотеки, але залишиться в історії
              тренувань.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setArchiveTarget(null)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? "Приховую..." : "Приховати"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseDetailsDialog
        exercise={detailsTarget}
        open={detailsTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsTarget(null);
        }}
      />
    </div>
  );
}

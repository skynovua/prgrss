import { EyeOff, Plus, Search, Trash2 } from "lucide-react";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/shared/config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  MuscleGroupIcon,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui";

import {
  useAnatomicalMuscles,
  useArchiveExercise,
  useCreateExercise,
} from "../hooks/use-exercises";
import type { ExerciseCatalogItem } from "../model/exercise-catalog";
import { AnatomyLoading } from "./anatomy-loading";
import { ExerciseDetailsDialog } from "./exercise-details-dialog";

const LazyAnatomyMap = lazy(() =>
  import("./anatomy-map").then(({ AnatomyMap }) => ({ default: AnatomyMap }))
);

interface ExerciseLibraryProps {
  exercises: ExerciseCatalogItem[];
}

interface AdditionalMuscle {
  muscleKey: string;
  activationScore: number;
}

export function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
  const createMutation = useCreateExercise();
  const archiveMutation = useArchiveExercise();
  const { data: anatomicalMuscles = [] } = useAnatomicalMuscles();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [activeEquipment, setActiveEquipment] = useState<string>("all");
  const [selectedMuscleKey, setSelectedMuscleKey] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<ExerciseCatalogItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ExerciseCatalogItem | null>(null);

  // Форма нової вправи
  const [newName, setNewName] = useState("");
  const [newPrimaryMuscleKey, setNewPrimaryMuscleKey] = useState<string>("");
  const [newAdditionalMuscles, setNewAdditionalMuscles] = useState<AdditionalMuscle[]>([]);
  const [newEquipment, setNewEquipment] = useState<string>("barbell");

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    const result = exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(normalizedSearch);
      const matchesGroup = activeGroup === "all" || exercise.muscle_group === activeGroup;
      const matchesEquipment = activeEquipment === "all" || exercise.equipment === activeEquipment;
      const matchesMuscle =
        !selectedMuscleKey ||
        exercise.muscles.some(
          (muscle) => muscle.muscleKey === selectedMuscleKey && muscle.activationScore >= 4
        );

      return matchesSearch && matchesGroup && matchesEquipment && matchesMuscle;
    });

    if (!selectedMuscleKey) return result;

    return result.sort((left, right) => {
      const leftScore =
        left.muscles.find((muscle) => muscle.muscleKey === selectedMuscleKey)?.activationScore ?? 0;
      const rightScore =
        right.muscles.find((muscle) => muscle.muscleKey === selectedMuscleKey)?.activationScore ??
        0;
      return rightScore - leftScore || left.name.localeCompare(right.name, "uk");
    });
  }, [activeEquipment, activeGroup, exercises, search, selectedMuscleKey]);

  // Групуємо по м'язових групах для відображення
  const grouped = useMemo(() => {
    const map = new Map<string, ExerciseCatalogItem[]>();
    for (const ex of filtered) {
      const group = ex.muscle_group ?? "other";
      const existing = map.get(group) ?? [];
      existing.push(ex);
      map.set(group, existing);
    }
    return map;
  }, [filtered]);

  const handleCreate = () => {
    if (!newName.trim() || !newPrimaryMuscleKey) return;
    createMutation.mutate(
      {
        name: newName.trim(),
        equipment: newEquipment,
        muscles: [{ muscleKey: newPrimaryMuscleKey, activationScore: 10 }, ...newAdditionalMuscles],
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewName("");
          setNewPrimaryMuscleKey("");
          setNewAdditionalMuscles([]);
        },
      }
    );
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget.id, {
      onSuccess: () => setArchiveTarget(null),
    });
  };

  const handleMuscleSelect = useCallback((muscleKey: string) => {
    setSelectedMuscleKey((current) => (current === muscleKey ? null : muscleKey));
  }, []);

  const muscleGroups = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
  const equipmentKeys = Object.keys(EQUIPMENT_LABELS);
  const selectedMuscle = anatomicalMuscles.find((muscle) => muscle.key === selectedMuscleKey);
  const muscleItems = anatomicalMuscles.map((muscle) => ({
    value: muscle.key,
    label: muscle.name,
  }));
  const equipmentItems = equipmentKeys.map((equipment) => ({
    value: equipment,
    label: EQUIPMENT_LABELS[equipment],
  }));
  const scoreItems = Array.from({ length: 10 }, (_, index) => {
    const score = index + 1;
    return { value: String(score), label: `${score}/10` };
  });
  const usedMuscleKeys = new Set([
    newPrimaryMuscleKey,
    ...newAdditionalMuscles.map((muscle) => muscle.muscleKey),
  ]);
  const availableAdditionalMuscle = anatomicalMuscles.find(
    (muscle) => !usedMuscleKeys.has(muscle.key)
  );

  const handlePrimaryMuscleChange = (muscleKey: string | null) => {
    if (!muscleKey) return;
    setNewPrimaryMuscleKey(muscleKey);
    setNewAdditionalMuscles((muscles) =>
      muscles.filter((muscle) => muscle.muscleKey !== muscleKey)
    );
  };

  const handleAddMuscle = () => {
    if (!availableAdditionalMuscle) return;
    setNewAdditionalMuscles((muscles) => [
      ...muscles,
      { muscleKey: availableAdditionalMuscle.key, activationScore: 5 },
    ]);
  };

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 pt-7 pb-6 md:px-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-medium tracking-tight">Вправи</h1>
          <p className="text-muted-foreground text-sm">Знайди свій наступний рух.</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setAddDialogOpen(true)}
          aria-label="Додати вправу"
        >
          <Plus />
        </Button>
      </header>

      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="exercise-search" className="sr-only">
            Пошук вправ
          </FieldLabel>
          <Input
            id="exercise-search"
            placeholder="Пошук вправ…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel className="sr-only">М’язова група</FieldLabel>
          <div className="scrollbar-none overflow-x-auto">
            <ToggleGroup
              value={[activeGroup]}
              onValueChange={(values) => {
                const group = values[0];
                if (group === "all" || muscleGroups.includes(group as MuscleGroup))
                  setActiveGroup(group as MuscleGroup | "all");
              }}
              aria-label="Фільтр за м’язовою групою"
              spacing={1}
            >
              <ToggleGroupItem value="all">Усі</ToggleGroupItem>
              {muscleGroups.map((group) => (
                <ToggleGroupItem key={group} value={group}>
                  {MUSCLE_GROUP_LABELS[group]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="equipment-filter" className="sr-only">
            Обладнання
          </FieldLabel>
          <Select
            items={[
              { value: "all", label: "Усе обладнання" },
              ...equipmentKeys.map((equipment) => ({
                value: equipment,
                label: EQUIPMENT_LABELS[equipment],
              })),
            ]}
            value={activeEquipment}
            onValueChange={(value) => {
              if (value) setActiveEquipment(value);
            }}
          >
            <SelectTrigger id="equipment-filter">
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
        </Field>
      </FieldGroup>

      <Accordion>
        <AccordionItem value="anatomy">
          <AccordionTrigger>
            {selectedMuscle ? `М’яз: ${selectedMuscle.name}` : "Обрати на мапі м’язів"}
          </AccordionTrigger>
          <AccordionContent>
            <Suspense fallback={<AnatomyLoading />}>
              <LazyAnatomyMap
                muscles={anatomicalMuscles}
                selectedMuscleKey={selectedMuscleKey}
                onMuscleSelect={handleMuscleSelect}
              />
            </Suspense>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="text-muted-foreground text-xs" role="status">
        Знайдено {filtered.length} із {exercises.length} вправ
      </p>

      {selectedMuscleKey && (
        <p className="text-muted-foreground text-xs">Оцінки залучення орієнтовні.</p>
      )}

      {Array.from(grouped.entries()).map(([group, exs]) => (
        <div key={group} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {MUSCLE_GROUP_LABELS[group as MuscleGroup] ?? group}
            </h2>
            <Badge variant="secondary">{exs.length}</Badge>
          </div>
          {exs.map((exercise) => (
            <Card
              key={exercise.id}
              size="sm"
              className="active:bg-muted/60 p-0 transition-colors data-[size=sm]:py-0"
            >
              <CardContent className="flex items-center gap-2 px-3 py-1">
                <button
                  type="button"
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setDetailsTarget(exercise)}
                >
                  {exercise.muscle_group && (
                    <MuscleGroupIcon group={exercise.muscle_group as MuscleGroup} size="sm" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      {exercise.equipment && <span>{EQUIPMENT_LABELS[exercise.equipment]}</span>}
                      {exercise.is_custom && <Badge variant="secondary">Кастомна</Badge>}
                      {selectedMuscleKey && (
                        <Badge variant="outline">
                          {exercise.muscles.find((muscle) => muscle.muscleKey === selectedMuscleKey)
                            ?.activationScore ?? 0}
                          /10
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
                {exercise.is_custom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                    onClick={() => setArchiveTarget(exercise)}
                    aria-label={`Приховати вправу ${exercise.name}`}
                  >
                    <EyeOff />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <Card className="p-0">
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
              <Search className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Нічого не знайдено</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Спробуй змінити фільтри або додай власну вправу до бібліотеки.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Діалог створення вправи */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[min(24rem,calc(100%-2rem))] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Нова вправа</DialogTitle>
            <DialogDescription>Додайте кастомну вправу до бібліотеки.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleCreate();
            }}
          >
            <FieldGroup className="gap-4 pt-2">
              <Field>
                <FieldLabel htmlFor="custom-exercise-name">Назва</FieldLabel>
                <Input
                  id="custom-exercise-name"
                  placeholder="Напр. Жим гантелей під кутом"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-equipment">Обладнання</FieldLabel>
                <Select
                  items={equipmentItems}
                  value={newEquipment}
                  onValueChange={(value) => value && setNewEquipment(value)}
                >
                  <SelectTrigger id="custom-exercise-equipment">
                    <SelectValue>{EQUIPMENT_LABELS[newEquipment]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {equipmentItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-primary-muscle">Основний м&apos;яз</FieldLabel>
                <Select
                  items={muscleItems}
                  value={newPrimaryMuscleKey || null}
                  onValueChange={handlePrimaryMuscleChange}
                >
                  <SelectTrigger id="custom-exercise-primary-muscle">
                    <SelectValue>
                      {anatomicalMuscles.find((muscle) => muscle.key === newPrimaryMuscleKey)
                        ?.name ?? "Оберіть м'яз"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {muscleItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Основний м&apos;яз отримує оцінку 10/10.</FieldDescription>
              </Field>

              <FieldSet>
                <FieldLegend variant="label">Додаткові м&apos;язи</FieldLegend>
                <FieldDescription>
                  Необов&apos;язково. Додайте залучені м&apos;язи й оцінку.
                </FieldDescription>
                <div className="flex flex-col gap-3">
                  {newAdditionalMuscles.map((target, index) => {
                    const rowMuscleItems = anatomicalMuscles
                      .filter(
                        (muscle) =>
                          muscle.key === target.muscleKey || !usedMuscleKeys.has(muscle.key)
                      )
                      .map((muscle) => ({ value: muscle.key, label: muscle.name }));

                    return (
                      <Field key={`${target.muscleKey}-${index}`}>
                        <FieldLabel htmlFor={`additional-muscle-${index}`}>
                          М&apos;яз {index + 1}
                        </FieldLabel>
                        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] gap-2">
                          <Select
                            items={rowMuscleItems}
                            value={target.muscleKey}
                            onValueChange={(value) => {
                              if (!value) return;
                              setNewAdditionalMuscles((muscles) =>
                                muscles.map((muscle, muscleIndex) =>
                                  muscleIndex === index ? { ...muscle, muscleKey: value } : muscle
                                )
                              );
                            }}
                          >
                            <SelectTrigger id={`additional-muscle-${index}`}>
                              <SelectValue>
                                {anatomicalMuscles.find((muscle) => muscle.key === target.muscleKey)
                                  ?.name ?? "М'яз"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
                              <SelectGroup>
                                {rowMuscleItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                          <Select
                            items={scoreItems}
                            value={String(target.activationScore)}
                            onValueChange={(value) => {
                              if (!value) return;
                              setNewAdditionalMuscles((muscles) =>
                                muscles.map((muscle, muscleIndex) =>
                                  muscleIndex === index
                                    ? { ...muscle, activationScore: Number(value) }
                                    : muscle
                                )
                              );
                            }}
                          >
                            <SelectTrigger aria-label={`Оцінка м'яза ${index + 1}`}>
                              <SelectValue>{target.activationScore}/10</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {scoreItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setNewAdditionalMuscles((muscles) =>
                                muscles.filter((_, muscleIndex) => muscleIndex !== index)
                              )
                            }
                            aria-label={`Прибрати додатковий м'яз ${index + 1}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </Field>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMuscle}
                    disabled={!availableAdditionalMuscle}
                  >
                    <Plus data-icon="inline-start" />
                    Додати м&apos;яз
                  </Button>
                </div>
              </FieldSet>

              <Button
                type="submit"
                disabled={!newName.trim() || !newPrimaryMuscleKey || createMutation.isPending}
              >
                {createMutation.isPending ? "Зберігаю..." : "Додати вправу"}
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

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

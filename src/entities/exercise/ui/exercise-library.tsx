import { useState, useMemo, type ReactNode } from "react";
import { Input } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { Dumbbell, Layers3, Plus, Search, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";
import {
  type Exercise,
  type MuscleGroup,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "@/entities/workout";
import { MuscleGroupIcon } from "@/shared/ui";
import { useCreateExercise, useDeleteExercise } from "@/entities/exercise";
import { cn } from "@/shared/lib";

interface ExerciseLibraryProps {
  exercises: Exercise[];
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground active:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

function LibraryStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="bg-background/70 rounded-xl border px-3 py-3">
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
    </div>
  );
}

export function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
  const createMutation = useCreateExercise();
  const deleteMutation = useDeleteExercise();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [activeEquipment, setActiveEquipment] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  // Форма нової вправи
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<string>("chest");
  const [newEquipment, setNewEquipment] = useState<string>("barbell");

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = activeGroup === "all" || ex.muscle_group === activeGroup;
      const matchesEquipment = activeEquipment === "all" || ex.equipment === activeEquipment;
      return matchesSearch && matchesGroup && matchesEquipment;
    });
  }, [exercises, search, activeGroup, activeEquipment]);

  // Групуємо по м'язових групах для відображення
  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const group = ex.muscle_group ?? "other";
      const existing = map.get(group) ?? [];
      existing.push(ex);
      map.set(group, existing);
    }
    return map;
  }, [filtered]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    createMutation.mutate(
      {
        name: newName.trim(),
        muscle_group: newGroup,
        equipment: newEquipment,
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewName("");
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const muscleGroups = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
  const equipmentKeys = Object.keys(EQUIPMENT_LABELS);
  const customCount = exercises.filter((exercise) => exercise.is_custom).length;

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-3 px-1 pt-1">
        <div className="min-w-0">
          <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
            Exercise library
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight">
            Бібліотека вправ
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Шукай базові рухи, фільтруй інвентар і додавай власні вправи.
          </p>
        </div>
        <Button size="icon" onClick={() => setAddDialogOpen(true)} aria-label="Додати вправу">
          <Plus />
        </Button>
      </div>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">Твоя база рухів</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {filtered.length} з {exercises.length} вправ видно зараз.
              </p>
            </div>
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
              <Dumbbell className="size-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <LibraryStat
              icon={<Layers3 className="size-3.5" />}
              label="Усього"
              value={`${exercises.length}`}
              helper="вправ"
            />
            <LibraryStat
              icon={<Sparkles className="size-3.5" />}
              label="Власні"
              value={`${customCount}`}
              helper="кастом"
            />
            <LibraryStat
              icon={<Search className="size-3.5" />}
              label="Фільтр"
              value={`${filtered.length}`}
              helper="знайдено"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="text-muted-foreground size-4" />
              Пошук і фільтри
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              Додати
            </Button>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Пошук вправ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="relative">
            <div className="mr-3 flex scrollbar-none gap-1.5 overflow-x-auto">
              <FilterChip active={activeGroup === "all"} onClick={() => setActiveGroup("all")}>
                Всі
              </FilterChip>
              {muscleGroups.map((group) => (
                <FilterChip
                  key={group}
                  active={activeGroup === group}
                  onClick={() => setActiveGroup(group)}
                >
                  {MUSCLE_GROUP_LABELS[group]}
                </FilterChip>
              ))}
            </div>
            <div className="from-card pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent" />
          </div>

          <div className="relative">
            <div className="mr-3 flex scrollbar-none gap-1.5 overflow-x-auto">
              <FilterChip
                active={activeEquipment === "all"}
                onClick={() => setActiveEquipment("all")}
              >
                Все обладнання
              </FilterChip>
              {equipmentKeys.map((eq) => (
                <FilterChip
                  key={eq}
                  active={activeEquipment === eq}
                  onClick={() => setActiveEquipment(eq)}
                >
                  {EQUIPMENT_LABELS[eq]}
                </FilterChip>
              ))}
            </div>
            <div className="from-card pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent" />
          </div>
        </CardContent>
      </Card>

      {Array.from(grouped.entries()).map(([group, exs]) => (
        <div key={group} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {MUSCLE_GROUP_LABELS[group as MuscleGroup] ?? group}
            </h2>
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              {exs.length}
            </span>
          </div>
          {exs.map((exercise) => (
            <Card key={exercise.id} size="sm" className="p-0 transition-colors active:bg-muted/60">
              <CardContent className="flex items-center gap-3 p-3">
                {exercise.muscle_group && (
                  <MuscleGroupIcon group={exercise.muscle_group as MuscleGroup} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    {exercise.equipment && <span>{EQUIPMENT_LABELS[exercise.equipment]}</span>}
                    {exercise.is_custom && (
                      <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">
                        Кастомна
                      </span>
                    )}
                  </div>
                </div>
                {exercise.is_custom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                    onClick={() => setDeleteTarget(exercise)}
                    aria-label={`Видалити вправу ${exercise.name}`}
                  >
                    <Trash2 />
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
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Нова вправа</DialogTitle>
            <DialogDescription>Додайте кастомну вправу до бібліотеки.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Назва</label>
              <Input
                placeholder="Напр. Жим гантелей під кутом"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">М&apos;язова група</label>
              <Select value={newGroup} onValueChange={(v) => v && setNewGroup(v)}>
                <SelectTrigger>
                  <SelectValue>{MUSCLE_GROUP_LABELS[newGroup as MuscleGroup]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {MUSCLE_GROUP_LABELS[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Обладнання</label>
              <Select value={newEquipment} onValueChange={(v) => v && setNewEquipment(v)}>
                <SelectTrigger>
                  <SelectValue>{EQUIPMENT_LABELS[newEquipment]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {equipmentKeys.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {EQUIPMENT_LABELS[eq]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Зберігаю..." : "Додати вправу"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Діалог видалення */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Видалити вправу?</DialogTitle>
            <DialogDescription>
              Вправа &quot;{deleteTarget?.name}&quot; буде видалена з вашої бібліотеки.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Видаляю..." : "Видалити"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

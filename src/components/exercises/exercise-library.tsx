import { useState, useMemo } from "react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Search, Plus, Trash2 } from "lucide-react";
import {
  type Exercise,
  type MuscleGroup,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "@/src/lib/types";
import { useCreateExercise, useDeleteExercise } from "@/src/lib/hooks/use-exercises";

interface ExerciseLibraryProps {
  exercises: Exercise[];
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Бібліотека вправ</h1>
        <Button size="sm" className="gap-1" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Додати
        </Button>
      </div>

      {/* Пошук */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Пошук вправ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Фільтри: м'язові групи */}
      <div className="relative">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
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
          {muscleGroups.map((group) => (
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
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent" />
      </div>

      {/* Фільтри: обладнання */}
      <div className="relative">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveEquipment("all")}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              activeEquipment === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground active:bg-accent"
            }`}
          >
            Все обладнання
          </button>
          {equipmentKeys.map((eq) => (
            <button
              key={eq}
              onClick={() => setActiveEquipment(eq)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                activeEquipment === eq
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground active:bg-accent"
              }`}
            >
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent" />
      </div>

      {/* Кількість результатів */}
      <p className="text-muted-foreground text-sm">{filtered.length} вправ</p>

      {/* Список вправ по групах */}
      {Array.from(grouped.entries()).map(([group, exs]) => (
        <div key={group} className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {MUSCLE_GROUP_LABELS[group as MuscleGroup] ?? group}
          </h2>
          {exs.map((exercise) => (
            <Card key={exercise.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {exercise.equipment && EQUIPMENT_LABELS[exercise.equipment]}
                    {exercise.is_custom && <span className="text-primary ml-2">• Кастомна</span>}
                  </p>
                </div>
                {exercise.is_custom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                    onClick={() => setDeleteTarget(exercise)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-muted-foreground">Нічого не знайдено</p>
        </div>
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
                  <SelectValue />
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
                  <SelectValue />
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

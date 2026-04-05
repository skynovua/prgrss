"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2 } from "lucide-react";
import {
  type Exercise,
  type MuscleGroup,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/types";
import { createExercise, deleteExercise } from "@/lib/actions/exercise";

interface ExerciseLibraryProps {
  exercises: Exercise[];
}

export function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [activeEquipment, setActiveEquipment] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  // Форма нової вправи
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<string>("chest");
  const [newEquipment, setNewEquipment] = useState<string>("barbell");

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesGroup =
        activeGroup === "all" || ex.muscle_group === activeGroup;
      const matchesEquipment =
        activeEquipment === "all" || ex.equipment === activeEquipment;
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
    setSaving(true);
    try {
      await createExercise({
        name: newName.trim(),
        muscle_group: newGroup,
        equipment: newEquipment,
      });
      setAddDialogOpen(false);
      setNewName("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteExercise(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Пошук вправ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Фільтри м'язових груп */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge
          variant={activeGroup === "all" ? "default" : "outline"}
          className="cursor-pointer shrink-0"
          onClick={() => setActiveGroup("all")}
        >
          Всі
        </Badge>
        {muscleGroups.map((group) => (
          <Badge
            key={group}
            variant={activeGroup === group ? "default" : "outline"}
            className="cursor-pointer shrink-0"
            onClick={() => setActiveGroup(group)}
          >
            {MUSCLE_GROUP_LABELS[group]}
          </Badge>
        ))}
      </div>

      {/* Фільтри обладнання */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge
          variant={activeEquipment === "all" ? "default" : "secondary"}
          className="cursor-pointer shrink-0"
          onClick={() => setActiveEquipment("all")}
        >
          Все обладнання
        </Badge>
        {equipmentKeys.map((eq) => (
          <Badge
            key={eq}
            variant={activeEquipment === eq ? "default" : "secondary"}
            className="cursor-pointer shrink-0"
            onClick={() => setActiveEquipment(eq)}
          >
            {EQUIPMENT_LABELS[eq]}
          </Badge>
        ))}
      </div>

      {/* Кількість результатів */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} вправ
      </p>

      {/* Список вправ по групах */}
      {Array.from(grouped.entries()).map(([group, exs]) => (
        <div key={group} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {MUSCLE_GROUP_LABELS[group as MuscleGroup] ?? group}
          </h2>
          {exs.map((exercise) => (
            <Card key={exercise.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.equipment && EQUIPMENT_LABELS[exercise.equipment]}
                    {exercise.is_custom && (
                      <span className="ml-2 text-primary">• Кастомна</span>
                    )}
                  </p>
                </div>
                {exercise.is_custom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
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
            <DialogDescription>
              Додайте кастомну вправу до бібліотеки.
            </DialogDescription>
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
            <Button onClick={handleCreate} disabled={!newName.trim() || saving}>
              {saving ? "Зберігаю..." : "Додати вправу"}
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Видаляю..." : "Видалити"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

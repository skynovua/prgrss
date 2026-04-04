"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import {
  type Exercise,
  type MuscleGroup,
  MUSCLE_GROUP_LABELS,
} from "@/lib/types";

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ exercises, onSelect }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesGroup =
        activeGroup === "all" || ex.muscle_group === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [exercises, search, activeGroup]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setOpen(false);
    setSearch("");
    setActiveGroup("all");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Додати вправу
          </Button>
        }
      />
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Вибрати вправу</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Пошук вправ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Badge
              variant={activeGroup === "all" ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setActiveGroup("all")}
            >
              Всі
            </Badge>
            {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map(
              (group) => (
                <Badge
                  key={group}
                  variant={activeGroup === group ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setActiveGroup(group)}
                >
                  {MUSCLE_GROUP_LABELS[group]}
                </Badge>
              )
            )}
          </div>

          <ScrollArea className="h-[calc(85vh-200px)]">
            <div className="flex flex-col gap-1">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.muscle_group &&
                        MUSCLE_GROUP_LABELS[
                          exercise.muscle_group as MuscleGroup
                        ]}{" "}
                      ·{" "}
                      {exercise.equipment &&
                        (
                          {
                            barbell: "Штанга",
                            dumbbell: "Гантелі",
                            machine: "Тренажер",
                            bodyweight: "Власна вага",
                            cable: "Блок",
                          } as Record<string, string>
                        )[exercise.equipment]}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  Нічого не знайдено
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

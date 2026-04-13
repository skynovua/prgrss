"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { type Exercise, type MuscleGroup, MUSCLE_GROUP_LABELS } from "@/lib/types";

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
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = activeGroup === "all" || ex.muscle_group === activeGroup;
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

          <ScrollArea className="h-[calc(85vh-200px)]">
            <div className="flex flex-col gap-1 pb-6">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="hover:bg-accent flex items-center justify-between rounded-lg px-3 py-3 text-left transition-colors"
                >
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {exercise.muscle_group &&
                        MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup]}{" "}
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
                  <Plus className="text-muted-foreground h-4 w-4" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">Нічого не знайдено</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

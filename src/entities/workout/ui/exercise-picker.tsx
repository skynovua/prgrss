import { Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  EQUIPMENT_LABELS,
  type Exercise,
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
} from "@/entities/workout";
import { cn } from "@/shared/lib";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  MuscleGroupIcon,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercises: Exercise[]) => void;
  trigger?: React.ReactNode;
}

export function ExercisePicker({ exercises, onSelect, trigger }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk");
    return exercises.filter(
      (exercise) =>
        exercise.name.toLocaleLowerCase("uk").includes(query) &&
        (activeGroup === "all" || exercise.muscle_group === activeGroup) &&
        (equipment === "all" || exercise.equipment === equipment)
    );
  }, [exercises, search, activeGroup, equipment]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
      setActiveGroup("all");
      setEquipment("all");
      setSelectedIds([]);
    }
  };

  const toggleExercise = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const addSelected = () => {
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
    const selected = selectedIds.flatMap((id) => {
      const exercise = byId.get(id);
      return exercise ? [exercise] : [];
    });
    if (!selected.length) return;
    onSelect(selected);
    handleOpenChange(false);
  };

  const groups = [
    { value: "all", label: "Усі групи м’язів" },
    ...Object.entries(MUSCLE_GROUP_LABELS).map(([value, label]) => ({ value, label })),
  ];
  const equipmentOptions = [
    { value: "all", label: "Усе обладнання" },
    ...Object.entries(EQUIPMENT_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} shouldScaleBackground={false} handleOnly>
      {trigger ? (
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      ) : (
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus data-icon="inline-start" />
            Додати вправу
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent
        aria-describedby={undefined}
        className="mt-0 h-[calc(100dvh-env(safe-area-inset-top)-1rem)] max-h-none rounded-t-3xl border-0"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
          <DrawerHeader className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-0 pb-3">
            <Button
              variant="ghost"
              size="sm"
              className="justify-self-start"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
            >
              Очистити
            </Button>
            <DrawerTitle className="min-w-0 text-center text-base leading-snug font-semibold">
              Бібліотека вправ
            </DrawerTitle>
            <span aria-hidden="true" />
          </DrawerHeader>

          <div className="flex shrink-0 flex-col gap-3 px-4 pb-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Пошук вправ…"
                aria-label="Пошук вправ"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                items={groups}
                value={activeGroup}
                onValueChange={(value) => {
                  if (value && (value === "all" || value in MUSCLE_GROUP_LABELS)) {
                    setActiveGroup(value as MuscleGroup | "all");
                  }
                }}
              >
                <SelectTrigger aria-label="Група м’язів" className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                items={equipmentOptions}
                value={equipment}
                onValueChange={(value) => value && setEquipment(value)}
              >
                <SelectTrigger aria-label="Обладнання" className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {equipmentOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
            role="group"
            aria-label="Вибір вправ"
          >
            <div className="flex flex-col gap-1 pb-4">
              {filtered.map((exercise) => {
                const selected = selectedIds.includes(exercise.id);
                const description = [
                  exercise.muscle_group &&
                    MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup],
                  exercise.equipment && EQUIPMENT_LABELS[exercise.equipment],
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleExercise(exercise.id)}
                    className={cn(
                      "hover:bg-accent focus-visible:ring-ring flex min-h-16 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left outline-none focus-visible:ring-2",
                      selected && "bg-accent"
                    )}
                  >
                    {exercise.muscle_group && (
                      <MuscleGroupIcon group={exercise.muscle_group as MuscleGroup} size="md" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-base leading-snug font-medium">
                        {exercise.name}
                      </span>
                      {description && (
                        <span className="text-muted-foreground mt-0.5 block text-sm">
                          {description}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "border-input flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                        selected && "border-foreground bg-foreground text-background"
                      )}
                      aria-hidden="true"
                    >
                      {selected && <Check className="size-4" />}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-muted-foreground py-8 text-center text-sm">Нічого не знайдено</p>
              )}
            </div>
          </div>
          <div className="border-border bg-popover shrink-0 border-t px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-full"
              disabled={selectedIds.length === 0}
              onClick={addSelected}
            >
              Додати вправи {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

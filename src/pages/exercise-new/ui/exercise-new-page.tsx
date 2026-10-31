import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AnatomyPreview, useAnatomicalMuscles, useCreateExercise } from "@/entities/exercise";
import { EQUIPMENT_LABELS } from "@/shared/config";
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

interface AdditionalMuscle {
  id: string;
  muscleKey: string;
  activationScore: number;
}

const equipmentItems = Object.entries(EQUIPMENT_LABELS).map(([value, label]) => ({ value, label }));
const scoreItems = Array.from({ length: 10 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `${value}/10` };
});

export default function ExerciseNewPage() {
  const navigate = useNavigate();
  const createMutation = useCreateExercise();
  const { data: muscles, isPending, isError, refetch } = useAnatomicalMuscles();
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState("barbell");
  const [primaryMuscleKey, setPrimaryMuscleKey] = useState("");
  const [primaryScore, setPrimaryScore] = useState(10);
  const [additionalMuscles, setAdditionalMuscles] = useState<AdditionalMuscle[]>([]);
  const anatomicalMuscles = muscles ?? [];
  const muscleItems = anatomicalMuscles.map((muscle) => ({
    value: muscle.key,
    label: muscle.name,
  }));
  const selectedTargets = [
    ...(primaryMuscleKey ? [{ muscleKey: primaryMuscleKey, activationScore: primaryScore }] : []),
    ...additionalMuscles.filter((muscle) => muscle.muscleKey),
  ];
  const highlights = selectedTargets.flatMap((target) => {
    const muscle = anatomicalMuscles.find((item) => item.key === target.muscleKey);
    return muscle
      ? [
          {
            ...target,
            name: muscle.name,
            muscleGroup: muscle.muscle_group,
            sortOrder: muscle.sort_order,
          },
        ]
      : [];
  });
  const usedMuscleKeys = new Set(selectedTargets.map((target) => target.muscleKey));
  const canAddMuscle = anatomicalMuscles.some((muscle) => !usedMuscleKeys.has(muscle.key));
  const hasIncompleteMuscle = additionalMuscles.some((muscle) => !muscle.muscleKey);
  const canSave = Boolean(
    name.trim() && primaryMuscleKey && !hasIncompleteMuscle && muscles?.length
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || createMutation.isPending) return;
    createMutation.mutate(
      { name: name.trim(), equipment, muscles: selectedTargets },
      { onSuccess: () => void navigate({ to: "/exercises" }) }
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8 md:px-8 md:pt-8">
      <header className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          render={<Link to="/exercises" />}
          nativeButton={false}
          aria-label="Повернутися до вправ"
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-medium tracking-tight">Нова вправа</h1>
          <p className="text-muted-foreground text-sm">Додай власну вправу до бібліотеки</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="custom-exercise-name">Назва вправи</FieldLabel>
            <Input
              id="custom-exercise-name"
              placeholder="Наприклад, жим гантелей"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="custom-exercise-equipment">Обладнання</FieldLabel>
            <Select
              items={equipmentItems}
              value={equipment}
              onValueChange={(value) => value && setEquipment(value)}
            >
              <SelectTrigger id="custom-exercise-equipment">
                <SelectValue />
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
        </FieldGroup>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="exercise-muscles-title"
          aria-busy={isPending}
        >
          <div className="flex flex-col gap-1">
            <h2 id="exercise-muscles-title" className="text-lg font-semibold">
              Залучені м’язи
            </h2>
            <p className="text-muted-foreground text-sm">
              Обери м’язи та вкажи, наскільки активно вони працюють.
            </p>
          </div>

          {isError && !muscles && (
            <div role="alert" className="flex flex-wrap items-center gap-3">
              <p className="text-muted-foreground text-sm">Не вдалося завантажити список м’язів.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Спробувати ще
              </Button>
            </div>
          )}
          {isPending && (
            <p role="status" className="sr-only">
              Завантажуємо м’язи…
            </p>
          )}

          <FieldGroup className="gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
              <Field>
                <FieldLabel htmlFor="custom-exercise-primary-muscle">Основний м’яз</FieldLabel>
                <Select
                  items={muscleItems}
                  value={primaryMuscleKey || null}
                  onValueChange={(value) => {
                    if (!value) return;
                    setPrimaryMuscleKey(value);
                    setAdditionalMuscles((current) =>
                      current.filter((muscle) => muscle.muscleKey !== value)
                    );
                  }}
                >
                  <SelectTrigger id="custom-exercise-primary-muscle" disabled={!muscles?.length}>
                    <SelectValue placeholder="Обери м’яз" />
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
              </Field>
              <Field>
                <FieldLabel htmlFor="primary-muscle-score">Оцінка</FieldLabel>
                <Select
                  items={scoreItems.slice(7)}
                  value={String(primaryScore)}
                  onValueChange={(value) => value && setPrimaryScore(Number(value))}
                >
                  <SelectTrigger
                    id="primary-muscle-score"
                    aria-label="Навантаження основного м’яза"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {scoreItems.slice(7).map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <FieldDescription>Основний м’яз має оцінку від 8 до 10.</FieldDescription>
          </FieldGroup>

          <div className="bg-muted flex flex-col gap-3 rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">Карта навантаження</h3>
                <p className="text-muted-foreground text-xs">Темніший відтінок — вища оцінка.</p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">1–10</span>
            </div>
            <div className="mx-auto w-full max-w-56">
              <AnatomyPreview highlights={highlights} />
              <div
                className="text-muted-foreground mt-2 grid grid-cols-2 gap-3 text-center text-xs"
                aria-hidden="true"
              >
                <span>Спереду</span>
                <span>Ззаду</span>
              </div>
            </div>
            {highlights.length === 0 && (
              <p className="text-muted-foreground text-center text-xs">
                Обери м’яз, щоб побачити його на схемі
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Додаткові м’язи</h3>
              <p className="text-muted-foreground text-xs">
                Необов’язково. Оцінки 8–10 позначають основні м’язи в деталях вправи.
              </p>
            </div>
            {additionalMuscles.map((target, index) => {
              const availableItems = muscleItems.filter(
                (item) => item.value === target.muscleKey || !usedMuscleKeys.has(item.value)
              );
              return (
                <div
                  key={target.id}
                  className="bg-card border-border flex flex-col gap-2 rounded-2xl border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">М’яз {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setAdditionalMuscles((current) =>
                          current.filter((muscle) => muscle.id !== target.id)
                        )
                      }
                      aria-label={`Прибрати додатковий м’яз ${index + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
                    <Select
                      items={availableItems}
                      value={target.muscleKey || null}
                      onValueChange={(value) => {
                        if (value)
                          setAdditionalMuscles((current) =>
                            current.map((muscle) =>
                              muscle.id === target.id ? { ...muscle, muscleKey: value } : muscle
                            )
                          );
                      }}
                    >
                      <SelectTrigger aria-label={`Додатковий м’яз ${index + 1}`}>
                        <SelectValue placeholder="Обери м’яз" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {availableItems.map((item) => (
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
                        if (value)
                          setAdditionalMuscles((current) =>
                            current.map((muscle) =>
                              muscle.id === target.id
                                ? { ...muscle, activationScore: Number(value) }
                                : muscle
                            )
                          );
                      }}
                    >
                      <SelectTrigger aria-label={`Навантаження додаткового м’яза ${index + 1}`}>
                        <SelectValue />
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
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                setAdditionalMuscles((current) => [
                  ...current,
                  { id: crypto.randomUUID(), muscleKey: "", activationScore: 5 },
                ])
              }
              disabled={!primaryMuscleKey || !canAddMuscle || hasIncompleteMuscle}
            >
              <Plus data-icon="inline-start" /> Додати м’яз
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Оцінки орієнтовні: навантаження залежить від техніки та індивідуальних особливостей.
          </p>
        </section>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canSave || createMutation.isPending}
        >
          {createMutation.isPending ? "Зберігаємо…" : "Зберегти вправу"}
        </Button>
      </form>
    </div>
  );
}

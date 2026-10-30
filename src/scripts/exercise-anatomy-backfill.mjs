import { anatomicalMuscles, systemExercises } from "./exercise-catalog-config.mjs";

// Лише перевірені назви та обладнання. Подібність тексту або група м’язів
// самі по собі не визначають техніку вправи.
const aliases = [
  ["Hack-присідання", "machine", "hack-squat"],
  ["Випади з гантелями", "dumbbell", "barbell-lunge"],
  ["Відведення рук у кросовері", "cable", "cable-lateral-raise"],
  ["Жим в хаммері (плечі)", "machine", "machine-shoulder-press"],
  ["Жим у хаммері (грудні)", "machine", "machine-chest-press"],
  ["Згинання ніг лежачи", "machine", "leg-curl"],
  ["Згинання рук з гантелями", "dumbbell", "dumbbell-curl"],
  ["Згинання рук зі штангою", "barbell", "barbell-curl"],
  ["Згинання рук на блоці", "cable", "cable-curl"],
  ["Махи гантелями в нахилі", "dumbbell", "rear-delt-fly"],
  ["Підтягування", "bodyweight", "pull-up"],
  ["Розгинання ніг сидячи", "machine", "leg-extension"],
  ["Розгинання рук на блоці", "cable", "triceps-pushdown"],
  ["Тяга в хаммері (спина)", "machine", "chest-supported-row"],
  ["Тяга верхнього блоку", "cable", "lat-pulldown"],
  ["Тяга нижнього блоку", "cable", "seated-cable-row"],
  ["Тяга Т-грифа", "barbell", "t-bar-row"],
  ["Французький жим лежачи", "barbell", "french-press"],
];

const normalizeName = (name) => name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const signature = (name, equipment) => `${normalizeName(name)}|${equipment}`;
const byKey = new Map(systemExercises.map((exercise) => [exercise.key, exercise]));
const byName = new Map(
  systemExercises.map((exercise) => [
    signature(exercise.name, exercise.equipment),
    exercise.muscles,
  ])
);

for (const [name, equipment, key] of aliases) {
  const definition = byKey.get(key);
  if (!definition) throw new Error(`Unknown anatomy profile: ${key}`);
  byName.set(signature(name, equipment), definition.muscles);
}

export function resolveExerciseAnatomy(exercise) {
  if (exercise.is_custom || exercise.user_id != null) return null;
  const definition = byKey.get(exercise.catalog_key);
  if (definition && definition.equipment === exercise.equipment) return definition.muscles;
  return byName.get(signature(exercise.name, exercise.equipment)) ?? null;
}

export function planExerciseAnatomyBackfill(exercises) {
  const missing = exercises.filter(
    (exercise) =>
      !exercise.is_custom && exercise.user_id == null && exercise.exercise_muscles.length === 0
  );
  const resolved = [];
  const unresolved = [];
  for (const exercise of missing) {
    const muscles = resolveExerciseAnatomy(exercise);
    if (muscles) resolved.push({ exercise, muscles });
    else unresolved.push(exercise);
  }
  return { resolved, unresolved };
}

export async function backfillExerciseAnatomy(supabase, { apply = false } = {}) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id,name,equipment,catalog_key,is_custom,is_active,exercise_muscles(muscle_key)")
    .eq("is_custom", false)
    .is("user_id", null)
    .order("name");
  if (error) throw error;

  const { resolved, unresolved } = planExerciseAnatomyBackfill(data ?? []);
  const records = resolved.flatMap(({ exercise, muscles }) =>
    muscles.map((muscle) => ({ exercise_id: exercise.id, ...muscle }))
  );
  const { data: existingMuscles, error: musclesError } = await supabase
    .from("anatomical_muscles")
    .select("key");
  if (musclesError) throw musclesError;
  const existingKeys = new Set((existingMuscles ?? []).map((muscle) => muscle.key));
  const neededKeys = new Set(records.map((record) => record.muscle_key));
  const missingMuscles = anatomicalMuscles.filter(
    (muscle) => neededKeys.has(muscle.key) && !existingKeys.has(muscle.key)
  );
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        musclesToAdd: missingMuscles.map((muscle) => muscle.name),
        exercisesToBackfill: resolved.map(({ exercise }) => exercise.name),
        assignments: records.length,
        unresolved: unresolved.map(({ name, equipment, is_active }) => ({
          name,
          equipment,
          is_active,
        })),
      },
      null,
      2
    )
  );

  if (apply && records.length > 0) {
    if (missingMuscles.length > 0) {
      const { error: musclesInsertError } = await supabase
        .from("anatomical_muscles")
        .upsert(missingMuscles, { onConflict: "key", ignoreDuplicates: true });
      if (musclesInsertError) throw musclesInsertError;
    }
    const { error: insertError } = await supabase.from("exercise_muscles").upsert(records, {
      onConflict: "exercise_id,muscle_key",
      ignoreDuplicates: true,
    });
    if (insertError) throw insertError;
  }
  return { resolved, unresolved };
}

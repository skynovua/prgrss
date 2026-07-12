import { createClient } from "@supabase/supabase-js";

import { anatomicalMuscles, systemExercises } from "./exercise-catalog-config.mjs";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL or VITE_SUPABASE_URL for exercise catalog sync.");
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY for exercise catalog sync."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const GROUPS = new Set(["chest", "back", "legs", "shoulders", "arms", "core"]);
const EQUIPMENT = new Set(["barbell", "dumbbell", "machine", "bodyweight", "cable"]);

function assertUnique(values, key, label) {
  const seen = new Set();

  for (const value of values) {
    if (seen.has(value[key])) {
      throw new Error(`Duplicate ${label}: ${String(value[key])}`);
    }

    seen.add(value[key]);
  }
}

function validateConfig() {
  assertUnique(anatomicalMuscles, "key", "muscle key");
  assertUnique(anatomicalMuscles, "sort_order", "muscle sort_order");
  assertUnique(systemExercises, "key", "exercise key");

  const muscleKeys = new Set(anatomicalMuscles.map((muscle) => muscle.key));

  for (const muscle of anatomicalMuscles) {
    if (!muscle.name?.trim()) throw new Error(`Muscle ${muscle.key} is missing a name.`);
    if (!GROUPS.has(muscle.muscle_group)) {
      throw new Error(`Muscle ${muscle.key} has invalid muscle_group ${muscle.muscle_group}.`);
    }
  }

  for (const exercise of systemExercises) {
    if (!exercise.name?.trim()) throw new Error(`Exercise ${exercise.key} is missing a name.`);
    if (!EQUIPMENT.has(exercise.equipment)) {
      throw new Error(`Exercise ${exercise.key} has invalid equipment ${exercise.equipment}.`);
    }
    if (exercise.muscles.length === 0) {
      throw new Error(`Exercise ${exercise.key} must target at least one muscle.`);
    }

    const assignedMuscles = new Set();
    let hasPrimaryMuscle = false;

    for (const target of exercise.muscles) {
      if (!muscleKeys.has(target.muscle_key)) {
        throw new Error(`Exercise ${exercise.key} references unknown muscle ${target.muscle_key}.`);
      }
      if (assignedMuscles.has(target.muscle_key)) {
        throw new Error(`Exercise ${exercise.key} repeats muscle ${target.muscle_key}.`);
      }
      if (
        !Number.isInteger(target.activation_score) ||
        target.activation_score < 1 ||
        target.activation_score > 10
      ) {
        throw new Error(`Exercise ${exercise.key} has invalid score for ${target.muscle_key}.`);
      }

      assignedMuscles.add(target.muscle_key);
      hasPrimaryMuscle ||= target.activation_score >= 8;
    }

    if (!hasPrimaryMuscle) {
      throw new Error(
        `Exercise ${exercise.key} must have a primary muscle with score 8 or higher.`
      );
    }
  }
}

async function syncMuscles() {
  const { error } = await supabase.from("anatomical_muscles").upsert(
    anatomicalMuscles.map((muscle) => ({
      ...muscle,
      is_active: true,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "key" }
  );

  if (error) throw error;
}

async function assignCatalogKeysToLegacyExercises() {
  const { data: existing, error } = await supabase
    .from("exercises")
    .select("id, catalog_key, name, equipment")
    .is("user_id", null);

  if (error) throw error;

  const existingByKey = new Set(
    (existing ?? []).flatMap((exercise) => (exercise.catalog_key ? [exercise.catalog_key] : []))
  );

  for (const definition of systemExercises) {
    if (existingByKey.has(definition.key)) continue;

    const legacyMatch = (existing ?? []).find(
      (exercise) =>
        exercise.catalog_key === null &&
        exercise.name === definition.name &&
        exercise.equipment === definition.equipment
    );

    if (!legacyMatch) continue;

    const { error: updateError } = await supabase
      .from("exercises")
      .update({ catalog_key: definition.key })
      .eq("id", legacyMatch.id);

    if (updateError) throw updateError;
  }
}

async function syncExercises() {
  await assignCatalogKeysToLegacyExercises();

  const primaryGroupByMuscle = new Map(
    anatomicalMuscles.map((muscle) => [muscle.key, muscle.muscle_group])
  );
  const now = new Date().toISOString();
  const records = systemExercises.map((exercise) => {
    const primaryTarget = [...exercise.muscles].sort(
      (left, right) => right.activation_score - left.activation_score
    )[0];

    return {
      catalog_key: exercise.key,
      name: exercise.name,
      equipment: exercise.equipment,
      muscle_group: primaryGroupByMuscle.get(primaryTarget.muscle_key),
      user_id: null,
      is_custom: false,
      is_active: true,
      updated_at: now,
    };
  });

  const { error } = await supabase.from("exercises").upsert(records, { onConflict: "catalog_key" });

  if (error) throw error;

  const { data: activeExercises, error: selectError } = await supabase
    .from("exercises")
    .select("id, catalog_key")
    .in(
      "catalog_key",
      systemExercises.map((exercise) => exercise.key)
    );

  if (selectError) throw selectError;

  const exerciseIdByKey = new Map(
    (activeExercises ?? []).map((exercise) => [exercise.catalog_key, exercise.id])
  );

  if (exerciseIdByKey.size !== systemExercises.length) {
    throw new Error("Some system exercises could not be resolved after sync.");
  }

  const activeIds = [...exerciseIdByKey.values()];
  const { error: deleteTargetsError } = await supabase
    .from("exercise_muscles")
    .delete()
    .in("exercise_id", activeIds);

  if (deleteTargetsError) throw deleteTargetsError;

  const muscleAssignments = systemExercises.flatMap((exercise) =>
    exercise.muscles.map((target) => ({
      exercise_id: exerciseIdByKey.get(exercise.key),
      muscle_key: target.muscle_key,
      activation_score: target.activation_score,
      updated_at: now,
    }))
  );

  const { error: assignmentsError } = await supabase
    .from("exercise_muscles")
    .upsert(muscleAssignments, { onConflict: "exercise_id,muscle_key" });

  if (assignmentsError) throw assignmentsError;

  const { data: catalogExercises, error: catalogError } = await supabase
    .from("exercises")
    .select("id, catalog_key")
    .is("user_id", null)
    .not("catalog_key", "is", null);

  if (catalogError) throw catalogError;

  const configuredKeys = new Set(systemExercises.map((exercise) => exercise.key));
  const staleIds = (catalogExercises ?? [])
    .filter((exercise) => !configuredKeys.has(exercise.catalog_key))
    .map((exercise) => exercise.id);

  if (staleIds.length > 0) {
    const { error: deactivateError } = await supabase
      .from("exercises")
      .update({ is_active: false, updated_at: now })
      .in("id", staleIds);

    if (deactivateError) throw deactivateError;
  }
}

validateConfig();
await syncMuscles();
await syncExercises();

console.log(
  `Synced ${anatomicalMuscles.length} anatomical muscles and ${systemExercises.length} system exercises.`
);

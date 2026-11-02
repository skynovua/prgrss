import type { WorkoutExercise } from "@/entities/workout";
import { parseWorkoutNumber } from "@/entities/workout";
import { supabase } from "@/shared/api";
import type { Json } from "@/shared/db";

import { readProgramExercises, templateFromWorkout } from "../model/program";

export async function fetchPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((program) => ({
    ...program,
    exercises: readProgramExercises(program.workout_template),
  }));
}

export type Program = Awaited<ReturnType<typeof fetchPrograms>>[number];

export async function saveProgram(
  userId: string,
  name: string,
  exercises: WorkoutExercise[],
  id?: string
) {
  const workoutTemplate = JSON.parse(JSON.stringify(exercises)) as Json;
  const values = { name: name.trim(), is_template: true, workout_template: workoutTemplate };
  if (!values.name || !exercises.length) throw new Error("Додай назву та хоча б одну вправу");
  const query = supabase.from("programs");
  const { data, error } = id
    ? await query.update(values).eq("id", id).eq("user_id", userId).select("id").maybeSingle()
    : await query
        .insert({ ...values, user_id: userId })
        .select("id")
        .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Програму не знайдено або вона недоступна");
}

export async function deleteProgram(userId: string, id: string) {
  const { data, error } = await supabase
    .from("programs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Програму не знайдено або вона недоступна");
}

export async function updateProgramTemplate(
  programId: string,
  originalTemplate: Json,
  exercises: WorkoutExercise[]
) {
  const hasInvalidInput = exercises.some((exercise) =>
    exercise.sets.some((set) =>
      Object.values(set.inputValues ?? {}).some(
        (value) => value.trim() !== "" && parseWorkoutNumber(value) == null
      )
    )
  );
  if (hasInvalidInput)
    throw new Error(
      "У незавершених підходах є некоректні значення. Залиш шаблон без змін та відредагуй його окремо."
    );
  const template = JSON.parse(JSON.stringify(templateFromWorkout(exercises))) as Json;
  const { data, error } = await supabase.rpc("update_program_template_if_unchanged", {
    target_program_id: programId,
    original_template: originalTemplate,
    updated_template: template,
  });
  if (error) throw new Error(error.message);
  if (!data)
    throw new Error("Шаблон уже змінено або видалено. Відкрий його, щоб перевірити зміни.");
}

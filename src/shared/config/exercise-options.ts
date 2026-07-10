export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Груди",
  back: "Спина",
  legs: "Ноги",
  shoulders: "Плечі",
  arms: "Руки",
  core: "Кор",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Штанга",
  dumbbell: "Гантелі",
  machine: "Тренажер",
  bodyweight: "Власна вага",
  cable: "Блок",
};

// Пікер живе у workout, бо додає вправу до поточної сесії. Перенесення
// композиції на вищий шар потребує окремого виділення workout-екрана, тому
// цей вузький контракт явно фіксує тимчасову залежність між сутностями.
export {
  useFavoriteExerciseIds,
  usePopularExerciseIds,
  useToggleFavoriteExercise,
} from "../hooks/use-exercises";
export type { ExerciseCatalogItem } from "../model/exercise-catalog";
export { ExerciseDetailsDialog } from "../ui/exercise-details-dialog";

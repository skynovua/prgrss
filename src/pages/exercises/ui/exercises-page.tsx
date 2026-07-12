import { ExerciseLibrary } from "@/entities/exercise";
import { useExercises } from "@/entities/exercise";
import { Button, LoaderBar } from "@/shared/ui";

export default function ExercisesPage() {
  const { data: exercises, isPending, isError, refetch } = useExercises();

  if (isPending) {
    return <LoaderBar />;
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-muted-foreground text-lg">Не вдалося завантажити вправи</p>
        <p className="text-muted-foreground text-sm">Перевірте з'єднання з інтернетом</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Спробувати ще раз
        </Button>
      </div>
    );
  }

  return <ExerciseLibrary exercises={exercises ?? []} />;
}

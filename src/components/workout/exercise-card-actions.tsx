import { useLocation, useNavigate } from "@tanstack/react-router";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

interface ExerciseCardActionsProps {
  exerciseId: string;
  exerciseName: string;
  onDelete?: () => void;
}

export function ExerciseCardActions({
  exerciseId,
  exerciseName,
  onDelete,
}: ExerciseCardActionsProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleOpenStats = () => {
    navigate({
      to: "/progress/exercise/$exerciseId",
      params: { exerciseId },
      search: { from: pathname },
    });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={`Дії для вправи ${exerciseName}`}
          />
        }
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <EllipsisVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleOpenStats}>Статистика</DropdownMenuItem>

        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              Видалити
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

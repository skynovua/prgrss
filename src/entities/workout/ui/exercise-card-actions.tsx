import { useLocation, useNavigate } from "@tanstack/react-router";
import { EllipsisVertical } from "lucide-react";

import { Button } from "@/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";

interface ExerciseCardActionsProps {
  exerciseId: string;
  exerciseName: string;
  onDelete?: () => void;
  onSettings?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ExerciseCardActions({
  exerciseId,
  exerciseName,
  onDelete,
  onSettings,
  onMoveUp,
  onMoveDown,
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
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleOpenStats}>Статистика</DropdownMenuItem>
          {onSettings && (
            <DropdownMenuItem onClick={onSettings}>Налаштування вправи</DropdownMenuItem>
          )}
          {(onMoveUp || onMoveDown) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!onMoveUp} onClick={onMoveUp}>
                Перемістити вище
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!onMoveDown} onClick={onMoveDown}>
                Перемістити нижче
              </DropdownMenuItem>
            </>
          )}

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                Видалити
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

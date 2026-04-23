import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleOpenStats = () => {
    navigate({
      to: "/progress/exercise/$exerciseId",
      params: { exerciseId },
      search: { from: pathname },
    });
  };

  const handleDelete = () => {
    setConfirmOpen(true);
  };

  return (
    <>
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
              <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled>
                Видалити
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Видалити вправу?"
          description={`Вправа "${exerciseName}" буде видалена разом з усіма її сетами.`}
          confirmText="Видалити"
          isDestructive
          onConfirm={() => {
            onDelete();
            setConfirmOpen(false);
          }}
        />
      )}
    </>
  );
}

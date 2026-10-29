import { RefreshCw } from "lucide-react";

import { Button } from "./button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";

export function PageError({
  title = "Не вдалося завантажити сторінку",
  description = "Перевір з’єднання та спробуй ще раз.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Empty className="min-h-72 px-5 py-10">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          <span role="alert">{description}</span>
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            Спробувати ще
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function RefreshNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="status">
      <p className="text-muted-foreground text-sm">
        Не вдалося оновити дані. Показуємо останні завантажені.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Спробувати ще
      </Button>
    </div>
  );
}

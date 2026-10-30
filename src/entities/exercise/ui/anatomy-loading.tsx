import { Skeleton } from "@/shared/ui";

export function AnatomyLoading({
  layout = "tabs",
  compact = false,
}: {
  layout?: "tabs" | "both";
  compact?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label="Завантажуємо анатомічну мапу"
      aria-busy="true"
    >
      {layout === "tabs" && <Skeleton className="h-9 w-full rounded-lg" aria-hidden="true" />}
      <div
        className={layout === "both" ? "grid grid-cols-2 gap-3" : "flex justify-center"}
        aria-hidden="true"
      >
        {Array.from({ length: layout === "both" ? 2 : 1 }, (_, index) => (
          <Skeleton
            key={index}
            className={`mx-auto aspect-[637/1242] w-full rounded-2xl ${compact ? "max-w-44" : "max-w-72"}`}
          />
        ))}
      </div>
    </div>
  );
}

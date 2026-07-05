import { Badge } from "@/shared/ui";
import { cn } from "@/shared/lib";

interface WeightUnitLabelProps {
  isDoubleWeight?: boolean;
  className?: string;
}

interface WeightValueProps extends WeightUnitLabelProps {
  weight: number | null | undefined;
  emptyLabel?: string;
}

export function WeightUnitLabel({ isDoubleWeight = false, className }: WeightUnitLabelProps) {
  return (
    <span className={cn("inline-flex items-center justify-center gap-1", className)}>
      <span>кг</span>
      {isDoubleWeight && (
        <Badge
          variant="secondary"
          className="h-4 min-w-0 rounded-full px-1.5 text-[10px] leading-none font-semibold"
        >
          x2
        </Badge>
      )}
    </span>
  );
}

export function WeightValue({
  weight,
  isDoubleWeight = false,
  className,
  emptyLabel = "—",
}: WeightValueProps) {
  if (weight == null) {
    return <span className={className}>{emptyLabel}</span>;
  }

  return (
    <span className={cn("inline-flex items-center justify-center gap-1", className)}>
      <span>{weight}</span>
      <WeightUnitLabel isDoubleWeight={isDoubleWeight} />
    </span>
  );
}

import { useAchievements } from "@/src/lib/hooks/use-achievements";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { Achievement } from "@/src/lib/api/achievements";

const TIER_STYLES = {
  bronze: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    bar: "bg-muted-foreground/50",
    label: "Бронза",
  },
  silver: {
    bg: "bg-primary/10",
    text: "text-primary/70",
    bar: "bg-primary/50",
    label: "Срібло",
  },
  gold: {
    bg: "bg-primary/20",
    text: "text-primary",
    bar: "bg-primary",
    label: "Золото",
  },
} as const;

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const style = TIER_STYLES[achievement.tier];
  const percent = Math.round(achievement.progress * 100);

  return (
    <div
      className={`border-border rounded-xl border p-4 transition-opacity ${
        achievement.unlocked ? "opacity-100" : "opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.bg} text-lg`}
        >
          {achievement.icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{achievement.title}</span>
            <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
          </div>
          <p className="text-muted-foreground text-xs">{achievement.description}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all ${style.bar}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-muted-foreground min-w-[3ch] text-right text-[10px] font-medium">
              {percent}%
            </span>
          </div>
          <span className="text-muted-foreground text-[10px]">
            {formatNumber(achievement.current)} / {formatNumber(achievement.target)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements();

  if (isLoading) return <LoaderBar />;

  const unlocked = achievements?.filter((a) => a.unlocked) ?? [];
  const locked = achievements?.filter((a) => !a.unlocked) ?? [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="text-muted-foreground hover:text-foreground -ml-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Ачівки</h1>
        {unlocked.length > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {unlocked.length}/{achievements?.length ?? 0}
          </span>
        )}
      </div>

      {unlocked.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Розблоковано
          </h2>
          <div className="grid gap-3">
            {unlocked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            В прогресі
          </h2>
          <div className="grid gap-3">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {(!achievements || achievements.length === 0) && (
        <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
          Починай тренуватися, щоб отримати ачівки!
        </div>
      )}
    </div>
  );
}

import { useAchievements } from "@/src/lib/hooks/use-achievements";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Link } from "@tanstack/react-router";
import type { Achievement } from "@/src/lib/api/achievements";
import {
  BarChart3,
  ChevronLeft,
  Dumbbell,
  Flame,
  Layers3,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const TIER_STYLES = {
  bronze: {
    bg: "bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(180,83,9,0.14))] dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.28),rgba(146,64,14,0.24))]",
    text: "text-amber-900 dark:text-amber-200",
    bar: "bg-[linear-gradient(90deg,#f59e0b,#b45309)]",
    label: "Бронза",
  },
  silver: {
    bg: "bg-[linear-gradient(135deg,rgba(226,232,240,0.9),rgba(148,163,184,0.3))] dark:bg-[linear-gradient(135deg,rgba(226,232,240,0.2),rgba(100,116,139,0.18))]",
    text: "text-slate-700 dark:text-slate-100",
    bar: "bg-[linear-gradient(90deg,#cbd5e1,#64748b)]",
    label: "Срібло",
  },
  gold: {
    bg: "bg-[linear-gradient(135deg,rgba(253,224,71,0.4),rgba(250,204,21,0.16))] dark:bg-[linear-gradient(135deg,rgba(250,204,21,0.34),rgba(161,98,7,0.22))]",
    text: "text-yellow-900 dark:text-yellow-100",
    bar: "bg-[linear-gradient(90deg,#fde047,#eab308)]",
    label: "Золото",
  },
} as const;

const TIER_ORDER = ["bronze", "silver", "gold"] as const;

type AchievementTier = Achievement["tier"];

interface AchievementGroup {
  key: string;
  title: string;
  icon: string;
  tiers: Record<AchievementTier, Achievement | undefined>;
}

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  workouts: Dumbbell,
  streak: Flame,
  volume: BarChart3,
  sets: Layers3,
  exercises: Target,
  "1rm": Trophy,
};

function getAchievementTiers(group: AchievementGroup): Achievement[] {
  return TIER_ORDER.map((tier) => group.tiers[tier]).filter((tier): tier is Achievement =>
    Boolean(tier)
  );
}

function getNextTier(group: AchievementGroup): Achievement {
  const tiers = getAchievementTiers(group);
  return tiers.find((tier) => !tier.unlocked) ?? tiers[tiers.length - 1];
}

function getRemainingProgress(group: AchievementGroup): number {
  const nextTier = getNextTier(group);
  return Math.max(nextTier.target - nextTier.current, 0);
}

function AchievementIcon({
  achievementKey,
  className,
  strokeWidth,
}: {
  achievementKey: string;
  className?: string;
  strokeWidth?: number;
}) {
  const IconComponent = ACHIEVEMENT_ICONS[achievementKey] ?? Trophy;

  return <IconComponent className={className} strokeWidth={strokeWidth} />;
}

function groupAchievements(achievements: Achievement[]): AchievementGroup[] {
  const grouped = new Map<string, AchievementGroup>();

  for (const achievement of achievements) {
    const separatorIndex = achievement.id.lastIndexOf("_");
    const key = separatorIndex === -1 ? achievement.id : achievement.id.slice(0, separatorIndex);
    const existing = grouped.get(key);

    if (existing) {
      existing.tiers[achievement.tier] = achievement;
      continue;
    }

    grouped.set(key, {
      key,
      title: achievement.title,
      icon: achievement.icon,
      tiers: {
        bronze: achievement.tier === "bronze" ? achievement : undefined,
        silver: achievement.tier === "silver" ? achievement : undefined,
        gold: achievement.tier === "gold" ? achievement : undefined,
      },
    });
  }

  return Array.from(grouped.values());
}

function isCompleted(group: AchievementGroup): boolean {
  return TIER_ORDER.every((tier) => group.tiers[tier]?.unlocked);
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function getEnterStyle(order: number) {
  return {
    animationDelay: `${order * 70}ms`,
    animationFillMode: "both" as const,
  };
}

function AchievementCard({ group, order }: { group: AchievementGroup; order: number }) {
  const tiers = getAchievementTiers(group);
  const unlockedCount = tiers.filter((tier) => tier.unlocked).length;
  const nextTier = getNextTier(group);
  const accentTier = unlockedCount === tiers.length ? tiers[tiers.length - 1] : nextTier;
  const style = TIER_STYLES[accentTier.tier];
  const percent = Math.round(nextTier.progress * 100);
  const remaining = getRemainingProgress(group);
  const isComplete = unlockedCount === tiers.length;
  const statusLabel = isComplete
    ? "Усі рівні відкрито"
    : `Ще ${formatNumber(remaining)} до ${TIER_STYLES[nextTier.tier].label.toLowerCase()}`;

  return (
    <Card
      size="sm"
      style={getEnterStyle(order)}
      className={`animate-in fade-in-0 slide-in-from-bottom-3 gap-0 rounded-3xl py-0 shadow-none ring-1 transition-all duration-500 hover:-translate-y-0.5 ${
        isComplete
          ? "from-primary/12 via-background to-primary/5 ring-primary/15 bg-linear-to-br"
          : "bg-card/85 ring-foreground/6"
      } ${unlockedCount === 0 ? "opacity-80" : "opacity-100"}`}
    >
      <CardContent className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.bg} shadow-sm ring-1 ring-black/5`}
          >
            <AchievementIcon
              achievementKey={group.key}
              className={`size-4.5 ${style.text}`}
              strokeWidth={2.1}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight">
                  {group.title}
                </span>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                  {nextTier.description}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.bg} ${style.text}`}
              >
                {unlockedCount}/{tiers.length}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap gap-1.5">
              {tiers.map((tier) => {
                const tierStyle = TIER_STYLES[tier.tier];

                return (
                  <span
                    key={tier.id}
                    className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                      tier.unlocked
                        ? `${tierStyle.bg} ${tierStyle.text} border-transparent`
                        : "bg-background/70 text-muted-foreground border-border"
                    }`}
                  >
                    {tierStyle.label}
                  </span>
                );
              })}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="bg-muted/80 h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${style.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-foreground min-w-[3ch] text-right text-[11px] font-semibold">
                {percent}%
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">{statusLabel}</span>
              <span className="text-foreground/80 font-medium">
                {isComplete
                  ? `${formatNumber(nextTier.target)} / ${formatNumber(nextTier.target)}`
                  : `${formatNumber(nextTier.current)} / ${formatNumber(nextTier.target)}`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements();

  if (isLoading) return <LoaderBar />;

  const groups = groupAchievements(achievements ?? []);
  const completed = groups.filter(isCompleted);
  const inProgress = groups.filter((group) => !isCompleted(group));
  const sortedInProgress = [...inProgress].sort((left, right) => {
    const progressDiff = getNextTier(right).progress - getNextTier(left).progress;

    if (progressDiff !== 0) return progressDiff;

    return getRemainingProgress(left) - getRemainingProgress(right);
  });
  const nextUp = sortedInProgress[0];
  const nextUpTier = nextUp ? getNextTier(nextUp) : null;
  const nextUpPercent = nextUpTier ? Math.round(nextUpTier.progress * 100) : 0;
  const unlockedTiers = (achievements ?? []).filter((achievement) => achievement.unlocked).length;
  const totalTiers = achievements?.length ?? 0;

  return (
    <div className="relative flex flex-1 flex-col gap-5 overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.08),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)]" />

      <div
        style={getEnterStyle(0)}
        className="animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-3 duration-300"
      >
        <Link
          to="/dashboard"
          className="text-muted-foreground hover:text-foreground bg-background/80 ring-foreground/8 -ml-1 flex h-9 w-9 items-center justify-center rounded-2xl ring-1 backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Ачівки</h1>
            {unlockedTiers > 0 && (
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[11px] font-semibold">
                {unlockedTiers}/{totalTiers}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Відстежуй регулярність, обсяг і силовий прогрес в одному місці.
          </p>
        </div>
      </div>

      {nextUp && nextUpTier && (
        <Card
          style={getEnterStyle(1)}
          className="animate-in fade-in-0 slide-in-from-bottom-4 from-primary/15 via-background to-primary/5 ring-primary/10 overflow-hidden rounded-[2rem] bg-linear-to-br py-0 shadow-none ring-1 duration-500"
        >
          <CardContent className="relative px-5 py-5">
            <div className="bg-primary/10 pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full blur-2xl" />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.24em] uppercase">
                  Найближча ачівка
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-background/80 flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                    <AchievementIcon
                      achievementKey={nextUp.key}
                      className={`h-5 w-5 ${TIER_STYLES[nextUpTier.tier].text}`}
                      strokeWidth={2.1}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">{nextUp.title}</h2>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {nextUpTier.description}
                    </p>
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold ${TIER_STYLES[nextUpTier.tier].bg} ${TIER_STYLES[nextUpTier.tier].text}`}
              >
                {TIER_STYLES[nextUpTier.tier].label}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="bg-muted/80 h-2.5 flex-1 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${TIER_STYLES[nextUpTier.tier].bar}`}
                  style={{ width: `${nextUpPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{nextUpPercent}%</span>
            </div>

            <div className="text-muted-foreground mt-3 flex items-center justify-between gap-3 text-sm">
              <span>
                Ще {formatNumber(getRemainingProgress(nextUp))} до{" "}
                {TIER_STYLES[nextUpTier.tier].label.toLowerCase()}
              </span>
              <span className="text-foreground/80 font-medium">
                {formatNumber(nextUpTier.current)} / {formatNumber(nextUpTier.target)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedInProgress.length > 0 && (
        <section
          style={getEnterStyle(2)}
          className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-2 duration-500"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.24em] uppercase">
              У процесі
            </h2>
          </div>
          <div className="grid gap-3">
            {sortedInProgress.map((group, index) => (
              <AchievementCard key={group.key} group={group} order={index + 3} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section
          style={getEnterStyle(sortedInProgress.length + 3)}
          className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-2 duration-500"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.24em] uppercase">
              Завершено
            </h2>
          </div>
          <div className="grid gap-3">
            {completed.map((group, index) => (
              <AchievementCard
                key={group.key}
                group={group}
                order={sortedInProgress.length + index + 4}
              />
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

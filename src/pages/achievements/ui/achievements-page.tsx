import { Link } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  ChevronLeft,
  Clock3,
  Dumbbell,
  Flame,
  Layers3,
  Lock,
  type LucideIcon,
  Repeat2,
  Shapes,
  Target,
  Trophy,
} from "lucide-react";
import { useState } from "react";

import type { Achievement } from "@/entities/achievement";
import { useAchievements, useMarkAchievementsSeen } from "@/entities/achievement";
import { cn } from "@/shared/lib";
import { LoaderBar } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";
import { Sheet, SheetContent } from "@/shared/ui";

const TIER_STYLES = {
  bronze: {
    bg: "achievement-tier-bronze",
    text: "text-(--achievement-bronze-fg)",
    bar: "achievement-ring-bronze",
    ring: "var(--achievement-bronze-ring)",
    label: "Бронза",
  },
  silver: {
    bg: "achievement-tier-silver",
    text: "text-(--achievement-silver-fg)",
    bar: "achievement-ring-silver",
    ring: "var(--achievement-silver-ring)",
    label: "Срібло",
  },
  gold: {
    bg: "achievement-tier-gold",
    text: "text-(--achievement-gold-fg)",
    bar: "achievement-ring-gold",
    ring: "var(--achievement-gold-ring)",
    label: "Золото",
  },
} as const;

const TIER_ORDER = ["bronze", "silver", "gold"] as const;

type AchievementTier = Achievement["tier"];
type CollectionFilter = "progress" | "completed" | "all";

interface AchievementGroup {
  key: string;
  slug: string;
  title: string;
  tiers: Record<AchievementTier, Achievement | undefined>;
}

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  workouts: Dumbbell,
  streak: Flame,
  volume: BarChart3,
  sets: Layers3,
  exercises: Target,
  "1rm": Trophy,
  reps: Repeat2,
  duration: Clock3,
  balance: Shapes,
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

function getDisplayTier(group: AchievementGroup): AchievementTier {
  const tiers = getAchievementTiers(group);
  const unlockedTier = [...tiers].reverse().find((tier) => tier.unlocked);

  return unlockedTier?.tier ?? getNextTier(group).tier;
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
    const key = achievement.familyKey;
    const existing = grouped.get(key);

    if (existing) {
      existing.tiers[achievement.tier] = achievement;
      continue;
    }

    grouped.set(key, {
      key,
      slug: achievement.slug,
      title: achievement.title,
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

function getAchievementVisual(group: AchievementGroup) {
  const tiers = getAchievementTiers(group);
  const unlockedCount = tiers.filter((tier) => tier.unlocked).length;
  const nextTier = getNextTier(group);
  const accentTier = getDisplayTier(group);
  const style = TIER_STYLES[accentTier];
  const percent = Math.round(nextTier.progress * 100);
  const ringDegrees = Math.max(percent * 3.6, unlockedCount === 0 ? 18 : 48);
  const ringStyle = {
    ["--achievement-ring-progress" as string]: `${ringDegrees}deg`,
    ["--achievement-ring-color" as string]: style.ring,
  };

  return { tiers, unlockedCount, nextTier, accentTier, style, percent, ringStyle };
}

function getUnseenIds(group: AchievementGroup) {
  return getAchievementTiers(group)
    .filter((tier) => tier.unlocked && tier.unlockedAt && !tier.seenAt)
    .map((tier) => tier.id);
}

function ProgressTrack({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("bg-muted h-1.5 overflow-hidden rounded-full", className)}>
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
      />
    </div>
  );
}

function AchievementMedallion({
  group,
  size = "md",
}: {
  group: AchievementGroup;
  size?: "sm" | "md" | "lg";
}) {
  const { style, ringStyle } = getAchievementVisual(group);
  const iconSizeClass = size === "lg" ? "size-8" : size === "md" ? "size-5" : "size-4";
  const innerSizeClass = size === "lg" ? "size-18" : size === "md" ? "size-12" : "size-9";

  return (
    <div className="relative flex aspect-square items-center justify-center">
      <div
        className="absolute inset-0 rounded-full bg-[conic-gradient(var(--achievement-ring-color)_0deg_var(--achievement-ring-progress),color-mix(in_oklab,var(--border)_78%,transparent)_var(--achievement-ring-progress)_360deg)]"
        style={ringStyle}
      />
      <div className="bg-card absolute inset-[10%] rounded-full" />
      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full",
          innerSizeClass,
          style.bg
        )}
      >
        <AchievementIcon
          achievementKey={group.key}
          className={cn(iconSizeClass, style.text)}
          strokeWidth={2.1}
        />
      </div>
    </div>
  );
}

function AchievementFocusCard({
  group,
  isNew,
  onSelect,
}: {
  group: AchievementGroup;
  isNew: boolean;
  onSelect: (group: AchievementGroup) => void;
}) {
  const { nextTier, style, percent } = getAchievementVisual(group);
  const remaining = getRemainingProgress(group);

  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className="bg-card text-card-foreground ring-border/80 active:bg-muted/70 flex w-full items-center gap-3 rounded-xl p-3 text-left shadow-[0_18px_50px_rgb(0_0_0/0.08)] ring-1 transition-colors dark:shadow-[0_18px_50px_rgb(0_0_0/0.28)]"
    >
      <div className="size-16 shrink-0">
        <AchievementMedallion group={group} size="md" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-tight">{group.title}</p>
          {isNew && (
            <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase">
              New
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              style.bg,
              style.text
            )}
          >
            {style.label}
          </span>
          <span className="text-muted-foreground text-xs">
            {remaining > 0 ? `Ще ${remaining}` : "Відкрито"}
          </span>
        </div>
        <ProgressTrack percent={percent} className="mt-3" />
        <p className="text-muted-foreground mt-1 text-xs">
          {nextTier.current} / {nextTier.target} · {percent}%
        </p>
      </div>
    </button>
  );
}

function AchievementCollectionCard({
  group,
  isNew,
  onSelect,
}: {
  group: AchievementGroup;
  isNew: boolean;
  onSelect: (group: AchievementGroup) => void;
}) {
  const { tiers, nextTier, percent } = getAchievementVisual(group);

  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className="bg-card text-card-foreground ring-border/80 active:bg-muted/70 flex min-h-36 flex-col gap-3 rounded-xl p-3 text-left ring-1 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="size-12">
          <AchievementMedallion group={group} size="sm" />
        </div>
        {isNew && (
          <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase">
            New
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-5 font-semibold tracking-tight">{group.title}</p>
        <div className="mt-2 flex gap-1">
          {tiers.map((tier) => {
            const tierStyle = TIER_STYLES[tier.tier];

            return (
              <span
                key={tier.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  tier.unlocked ? tierStyle.bar : "bg-border"
                )}
              />
            );
          })}
        </div>
        <ProgressTrack percent={percent} className="mt-3" />
        <p className="text-muted-foreground mt-1 text-xs">
          {nextTier.current} / {nextTier.target}
        </p>
      </div>
    </button>
  );
}

function AchievementDetailContent({ group }: { group: AchievementGroup }) {
  const tiers = getAchievementTiers(group);
  const currentTier = getDisplayTier(group);
  const style = TIER_STYLES[currentTier];
  const nextTier = getNextTier(group);
  const nextTierPercent = Math.round(nextTier.progress * 100);
  const remaining = getRemainingProgress(group);

  return (
    <div className="flex flex-col gap-5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-4 px-1 pt-1">
        <div className="size-24 shrink-0">
          <AchievementMedallion group={group} size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase",
              style.bg,
              style.text
            )}
          >
            {style.label}
          </span>
          <h2 className="mt-3 text-2xl leading-tight font-bold tracking-tight">{group.title}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">{nextTier.description}</p>
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Прогрес рівня</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {nextTier.current} / {nextTier.target}
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums">{nextTierPercent}%</span>
          </div>
          <ProgressTrack percent={nextTierPercent} className="mt-3 h-2" />
          <p className="text-muted-foreground mt-3 text-sm">
            {remaining > 0 ? `До наступного рівня: ${remaining}` : "Цей рівень уже відкрито."}
          </p>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 px-1 text-sm font-semibold tracking-tight">Рівні</h3>
        <div className="grid gap-2">
          {tiers.map((tier) => {
            const isNext = tier.id === nextTier.id;
            const isUnlocked = tier.unlocked;
            const isLocked = !isUnlocked;
            const tierStyle = TIER_STYLES[tier.tier];
            const tierPercent = Math.round(tier.progress * 100);

            return (
              <div
                key={tier.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-3",
                  isNext ? "bg-muted/35" : isLocked ? "bg-muted/15 opacity-80" : "bg-transparent"
                )}
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                  {isUnlocked ? (
                    <span className={cn("size-2 rounded-full", tierStyle.bar)} />
                  ) : (
                    <Lock className="text-muted-foreground size-3.5" strokeWidth={2} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{tierStyle.label}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {tier.current}/{tier.target}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">{tier.description}</p>
                  <ProgressTrack percent={tierPercent} className="mt-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements();
  const [selectedAchievementSlug, setSelectedAchievementSlug] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("progress");
  const markAchievementsSeen = useMarkAchievementsSeen();

  const currentNewSlugs = Array.from(
    new Set(
      (achievements ?? [])
        .filter(
          (achievement) => achievement.unlocked && achievement.unlockedAt && !achievement.seenAt
        )
        .map((achievement) => achievement.slug)
    )
  );
  if (isLoading) return <LoaderBar />;

  const groups = groupAchievements(achievements ?? []);
  const highlightedSlugSet = new Set(currentNewSlugs);
  const completed = groups.filter(isCompleted);
  const inProgress = groups.filter((group) => !isCompleted(group));
  const sortedInProgress = [...inProgress].sort((left, right) => {
    const progressDiff = getNextTier(right).progress - getNextTier(left).progress;

    if (progressDiff !== 0) return progressDiff;

    return getRemainingProgress(left) - getRemainingProgress(right);
  });
  const baseOrderedGroups = [...sortedInProgress, ...completed];
  const orderedGroups = [
    ...baseOrderedGroups.filter((group) => highlightedSlugSet.has(group.slug)),
    ...baseOrderedGroups.filter((group) => !highlightedSlugSet.has(group.slug)),
  ];
  const highlightedGroups = orderedGroups.filter((group) => highlightedSlugSet.has(group.slug));
  const selectedGroup =
    selectedAchievementSlug === null
      ? null
      : (orderedGroups.find((group) => group.slug === selectedAchievementSlug) ?? null);
  const unlockedTiers = (achievements ?? []).filter((achievement) => achievement.unlocked).length;
  const totalTiers = achievements?.length ?? 0;
  const completionPercent = totalTiers === 0 ? 0 : Math.round((unlockedTiers / totalTiers) * 100);
  const closestGroups = sortedInProgress.slice(0, 3);
  const collectionGroups =
    collectionFilter === "progress"
      ? orderedGroups.filter((group) => !isCompleted(group))
      : collectionFilter === "completed"
        ? orderedGroups.filter(isCompleted)
        : orderedGroups;

  const handleSelectGroup = (group: AchievementGroup) => {
    setSelectedAchievementSlug(group.slug);
    void markAchievementsSeen(getUnseenIds(group));
  };

  return (
    <Sheet
      open={selectedGroup !== null}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedAchievementSlug(null);
        }
      }}
    >
      <div className="relative flex flex-1 flex-col gap-5 p-4">
        <div className="flex items-start gap-3 px-1 pt-1">
          <Link
            to="/dashboard"
            className="text-muted-foreground hover:text-foreground bg-background/80 ring-foreground/8 -ml-1 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 backdrop-blur-sm transition-colors"
            aria-label="Назад на dashboard"
          >
            <ChevronLeft className="size-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
              Achievement shelf
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight">Ачівки</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Відкривай рівні, тримай прогрес у фокусі й добивай найближчі цілі.
            </p>
          </div>
        </div>

        {orderedGroups.length > 0 && (
          <Card className="overflow-hidden p-0">
            <CardContent className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="bg-primary/10 text-primary inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                    Progress
                  </div>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight">
                    Твоя полиця досягнень
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {unlockedTiers} з {totalTiers} рівнів відкрито, {completed.length} сімейств
                    завершено повністю.
                  </p>
                </div>

                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                  <Award className="size-5" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <SummaryTile label="Відкрито" value={`${unlockedTiers}`} helper="рівнів" />
                <SummaryTile label="Нові" value={`${highlightedGroups.length}`} helper="сімейств" />
                <SummaryTile label="Готовність" value={`${completionPercent}%`} helper="колекції" />
              </div>
            </CardContent>
          </Card>
        )}

        {highlightedGroups.length > 0 && (
          <AchievementSection title="Нові" description="Щойно відкриті або оновлені сімейства.">
            <div className="flex flex-col gap-2">
              {highlightedGroups.map((group) => (
                <AchievementFocusCard
                  key={group.slug}
                  group={group}
                  isNew
                  onSelect={handleSelectGroup}
                />
              ))}
            </div>
          </AchievementSection>
        )}

        {closestGroups.length > 0 && (
          <AchievementSection
            title="Найближче до відкриття"
            description="Цілі з найкращим прогресом прямо зараз."
          >
            <div className="flex flex-col gap-2">
              {closestGroups.map((group) => (
                <AchievementFocusCard
                  key={group.slug}
                  group={group}
                  isNew={highlightedSlugSet.has(group.slug)}
                  onSelect={handleSelectGroup}
                />
              ))}
            </div>
          </AchievementSection>
        )}

        {orderedGroups.length > 0 && (
          <AchievementSection title="Колекція" description="Переглядай прогрес по сімействах.">
            <div className="flex scrollbar-none gap-2 overflow-x-auto">
              <CollectionFilterChip
                active={collectionFilter === "progress"}
                onClick={() => setCollectionFilter("progress")}
              >
                У процесі
              </CollectionFilterChip>
              <CollectionFilterChip
                active={collectionFilter === "completed"}
                onClick={() => setCollectionFilter("completed")}
              >
                Завершені
              </CollectionFilterChip>
              <CollectionFilterChip
                active={collectionFilter === "all"}
                onClick={() => setCollectionFilter("all")}
              >
                Всі
              </CollectionFilterChip>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {collectionGroups.map((group) => (
                <AchievementCollectionCard
                  key={group.slug}
                  group={group}
                  isNew={highlightedSlugSet.has(group.slug)}
                  onSelect={handleSelectGroup}
                />
              ))}
            </div>

            {collectionGroups.length === 0 && (
              <Card className="p-0">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Тут поки порожньо</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Зміни фільтр або заверши кілька тренувань.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </AchievementSection>
        )}

        {(!achievements || achievements.length === 0) && (
          <Card className="p-0">
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Починай тренуватися, щоб отримати ачівки</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Завершуй тренування, тримай streak і нарощуй об&apos;єм, щоб відкривати нові
                  рівні.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <SheetContent
        side="bottom"
        className="overflow-y-auto rounded-t-[2rem] px-0 pt-[calc(env(safe-area-inset-top)+1.25rem)]"
      >
        {selectedGroup && <AchievementDetailContent group={selectedGroup} />}
      </SheetContent>
    </Sheet>
  );
}

function AchievementSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CollectionFilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

function SummaryTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="bg-background/70 rounded-2xl border px-3 py-3 backdrop-blur-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground pb-0.5 text-xs">{helper}</span>
      </div>
    </div>
  );
}

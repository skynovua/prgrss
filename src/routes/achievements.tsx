import { useState } from "react";
import { useAchievements, useMarkAchievementsSeen } from "@/src/lib/hooks/use-achievements";
import { LoaderBar } from "@/src/components/ui/loader-bar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Sheet, SheetContent } from "@/src/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import type { Achievement } from "@/src/lib/api/achievements";
import {
  Award,
  Clock3,
  BarChart3,
  ChevronLeft,
  Dumbbell,
  Flame,
  Layers3,
  Lock,
  Repeat2,
  Shapes,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

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

function AchievementTile({ group }: { group: AchievementGroup; order: number }) {
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

  return { group, tiers, style, ringStyle };
}

function AchievementTileButton({
  group,
  isNew,
  isHighlighted,
  onSelect,
}: {
  group: AchievementGroup;
  isNew: boolean;
  isHighlighted: boolean;
  onSelect: (group: AchievementGroup) => void;
}) {
  const { tiers, style, ringStyle } = AchievementTile({ group, order: 0 });

  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className={`flex flex-col items-center gap-2 rounded-[1.75rem] px-2 py-2 text-center transition-colors duration-500 ${
        isHighlighted ? "bg-foreground/[0.035]" : "bg-transparent"
      }`}
    >
      <div className="group relative flex aspect-square w-full items-center justify-center">
        {isHighlighted && (
          <span className="border-foreground/12 pointer-events-none absolute inset-0 rounded-full border" />
        )}
        <div
          className="absolute inset-[8%] rounded-full bg-[conic-gradient(var(--achievement-ring-color)_0deg_var(--achievement-ring-progress),color-mix(in_oklab,var(--border)_78%,transparent)_var(--achievement-ring-progress)_360deg)] transition-transform duration-500 group-hover:scale-[1.02]"
          style={ringStyle}
        />
        <div className="bg-background/95 absolute inset-[13%] rounded-full shadow-sm ring-1 ring-black/5 backdrop-blur-sm" />
        <div
          className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style.bg}`}
        >
          <AchievementIcon
            achievementKey={group.key}
            className={`h-5 w-5 ${style.text}`}
            strokeWidth={2.1}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-semibold tracking-tight">{group.title}</p>
        {isNew && (
          <span className="bg-foreground/8 text-foreground/75 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase">
            New
          </span>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1">
        {tiers.map((tier) => {
          const tierStyle = TIER_STYLES[tier.tier];

          return (
            <span
              key={tier.id}
              className={`h-1.5 w-1.5 rounded-full ${tier.unlocked ? tierStyle.bar : "bg-border"}`}
            />
          );
        })}
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

  return (
    <div className="flex flex-col gap-7 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center gap-3 px-2 pt-2 text-center">
        <div className="relative flex size-36 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-[conic-gradient(var(--achievement-ring-color)_0deg_var(--achievement-ring-progress),color-mix(in_oklab,var(--border)_78%,transparent)_var(--achievement-ring-progress)_360deg)]"
            style={{
              ["--achievement-ring-progress" as string]: `${Math.max(nextTierPercent * 3.6, 18)}deg`,
              ["--achievement-ring-color" as string]: style.ring,
            }}
          />
          <div className="bg-popover absolute inset-[10%] rounded-full" />
          <div
            className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full ${style.bg}`}
          >
            <AchievementIcon
              achievementKey={group.key}
              className={`h-7 w-7 ${style.text}`}
              strokeWidth={2.1}
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold tracking-tight">{group.title}</h2>

        <p className="max-w-88 text-sm leading-6 tracking-tight">{nextTier.description}</p>
      </div>

      <div className="grid gap-2">
        {tiers.map((tier) => {
          const isNext = tier.id === nextTier.id;
          const isUnlocked = tier.unlocked;
          const isLocked = !isUnlocked;

          return (
            <div
              key={tier.id}
              className={`flex items-start gap-3 rounded-[1.25rem] px-3 py-3 ${
                isNext ? "bg-muted/35" : isLocked ? "bg-muted/18" : "bg-transparent"
              }`}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {isUnlocked ? (
                  <span className={`h-2 w-2 rounded-full ${TIER_STYLES[tier.tier].bar}`} />
                ) : (
                  <Lock className="text-muted-foreground h-3.5 w-3.5" strokeWidth={2} />
                )}
              </span>
              <div className={`min-w-0 flex-1 ${isLocked ? "opacity-55" : "opacity-100"}`}>
                <span className="text-sm font-semibold">{TIER_STYLES[tier.tier].label}</span>

                <p
                  className={`text-muted-foreground mt-1 text-xs leading-5 tracking-tight ${
                    isLocked ? "opacity-80" : ""
                  }`}
                >
                  {tier.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAchievements();
  const [selectedAchievementSlug, setSelectedAchievementSlug] = useState<string | null>(null);
  const [hasDismissedAutoOpen, setHasDismissedAutoOpen] = useState(false);
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
  const currentNewIds = (achievements ?? [])
    .filter((achievement) => achievement.unlocked && achievement.unlockedAt && !achievement.seenAt)
    .map((achievement) => achievement.id);

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
  const visibleInProgress = orderedGroups.filter(
    (group) => !highlightedSlugSet.has(group.slug) && !isCompleted(group)
  );
  const visibleCompleted = orderedGroups.filter(
    (group) => !highlightedSlugSet.has(group.slug) && isCompleted(group)
  );
  const effectiveSelectedAchievementSlug =
    selectedAchievementSlug ??
    (!hasDismissedAutoOpen && currentNewSlugs.length > 0 ? currentNewSlugs[0] : null);
  const selectedGroup =
    effectiveSelectedAchievementSlug === null
      ? null
      : (orderedGroups.find((group) => group.slug === effectiveSelectedAchievementSlug) ?? null);
  const unlockedTiers = (achievements ?? []).filter((achievement) => achievement.unlocked).length;
  const totalTiers = achievements?.length ?? 0;
  const completionPercent = totalTiers === 0 ? 0 : Math.round((unlockedTiers / totalTiers) * 100);

  return (
    <Sheet
      open={selectedGroup !== null}
      onOpenChange={(open) => {
        if (!open) {
          setHasDismissedAutoOpen(true);
          setSelectedAchievementSlug(null);
          void markAchievementsSeen(currentNewIds);
        }
      }}
    >
      <div className="relative flex flex-1 flex-col gap-5 overflow-hidden p-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-muted-foreground hover:text-foreground bg-background/80 ring-foreground/8 -ml-1 flex h-9 w-9 items-center justify-center rounded-2xl ring-1 backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Ачівки</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Відстежуй прогрес, відкривай нові рівні та дивись, що залишилось до наступної цілі.
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

                <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <SummaryTile label="Відкрито" value={`${unlockedTiers}`} helper="рівнів" />
                <SummaryTile label="Нові" value={`${highlightedGroups.length}`} helper="сімейств" />
                <SummaryTile label="Готовність" value={`${completionPercent}%`} helper="колекції" />
              </div>
            </CardContent>
          </Card>
        )}

        {highlightedGroups.length > 0 && (
          <AchievementSection
            title="Нові ачівки"
            description="Щойно відкриті або оновлені сімейства."
          >
            {highlightedGroups.map((group) => (
              <AchievementTileButton
                key={group.slug}
                group={group}
                isNew
                isHighlighted
                onSelect={(selectedGroup) => {
                  setHasDismissedAutoOpen(true);
                  setSelectedAchievementSlug(selectedGroup.slug);
                }}
              />
            ))}
          </AchievementSection>
        )}

        {visibleInProgress.length > 0 && (
          <AchievementSection
            title="У процесі"
            description="Найближчі цілі, які можна добити наступними тренуваннями."
          >
            {visibleInProgress.map((group) => (
              <AchievementTileButton
                key={group.slug}
                group={group}
                isNew={false}
                isHighlighted={false}
                onSelect={(selectedGroup) => {
                  setHasDismissedAutoOpen(true);
                  setSelectedAchievementSlug(selectedGroup.slug);
                }}
              />
            ))}
          </AchievementSection>
        )}

        {visibleCompleted.length > 0 && (
          <AchievementSection
            title="Завершені"
            description="Сімейства, в яких вже відкрито всі рівні."
          >
            {visibleCompleted.map((group) => (
              <AchievementTileButton
                key={group.slug}
                group={group}
                isNew={false}
                isHighlighted={false}
                onSelect={(selectedGroup) => {
                  setHasDismissedAutoOpen(true);
                  setSelectedAchievementSlug(selectedGroup.slug);
                }}
              />
            ))}
          </AchievementSection>
        )}

        {(!achievements || achievements.length === 0) && (
          <Card className="p-0">
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">
                <Award className="text-muted-foreground h-5 w-5" />
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
      <div className="grid grid-cols-3 gap-x-3 gap-y-5">{children}</div>
    </section>
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

import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Layers3,
  LockKeyhole,
  type LucideIcon,
  Repeat2,
  Shapes,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Achievement } from "@/entities/achievement";
import { useAchievements, useMarkAchievementsSeen } from "@/entities/achievement";
import { cn } from "@/shared/lib";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  RefreshNotice,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui";

import {
  type AchievementTrack,
  buildAchievementTracks,
  formatMetric,
  getBestTier,
  getClosestTrack,
  getGoalDescription,
  getNextTier,
  getProgressPercent,
  getRemainingLabel,
  getUnseenRewards,
  isEarned,
  TIER_LABELS,
} from "../model/achievement-tracks";
import { AchievementsHeader, AchievementsLoading } from "./achievements-loading";

const TIER_TONES = {
  bronze: "achievement-tier-bronze",
  silver: "achievement-tier-silver",
  gold: "achievement-tier-gold",
};
const ICONS: Record<string, LucideIcon> = {
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
type CollectionFilter = "all" | "progress" | "earned";

function RewardEmblem({
  icon: Icon,
  tier,
  size = "default",
}: {
  icon: LucideIcon;
  tier?: Achievement["tier"];
  size?: "default" | "large";
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        size === "large" ? "size-28" : "size-16"
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "ring-background absolute inset-0 rounded-[28%] border-2 ring-4",
          tier
            ? cn(TIER_TONES[tier], "border-current/15")
            : "bg-muted text-muted-foreground border-border border-dashed"
        )}
      />
      <span
        className={cn(
          "absolute inset-1.5 flex items-center justify-center rounded-[24%] border border-current/10",
          tier ? TIER_TONES[tier] : "text-muted-foreground",
          size === "large" ? "[&>svg]:size-11" : "[&>svg]:size-7"
        )}
      >
        <Icon className={size === "large" ? "size-11" : "size-7"} strokeWidth={1.6} />
      </span>
      {!tier && (
        <LockKeyhole className="bg-card text-muted-foreground absolute -right-1 -bottom-1 size-5 rounded-full p-0.5" />
      )}
    </span>
  );
}

function ProgressTrack({ value, label }: { value: number; label: string }) {
  return (
    <span
      className="bg-muted block h-1.5 overflow-hidden rounded-full"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span className="bg-primary block h-full rounded-full" style={{ width: `${value}%` }} />
    </span>
  );
}

function TierStars({ track }: { track: AchievementTrack }) {
  const earned = track.tiers.filter(isEarned).length;
  return (
    <span
      className="inline-flex gap-1"
      role="img"
      aria-label={`Здобуто рівнів: ${earned} із ${track.tiers.length}`}
    >
      {track.tiers.map((achievement) => (
        <Star
          key={achievement.id}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            isEarned(achievement) ? "text-foreground fill-current" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}

function NextReward({ track, onSelect }: { track: AchievementTrack; onSelect: () => void }) {
  const next = getNextTier(track);
  if (!next) return null;
  const percent = getProgressPercent(next);
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="gap-4 px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-primary flex items-center gap-2 text-xs font-medium">
            <Target className="size-3.5" />
            Наступна нагорода
          </p>
          <Badge variant="secondary">{TIER_LABELS[next.tier]}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <RewardEmblem icon={ICONS[track.key] ?? Award} tier={next.tier} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>{track.title}</CardTitle>
            <CardDescription>{getGoalDescription(next)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{getRemainingLabel(next)}</span>
          <span className="text-muted-foreground text-xs tabular-nums">{percent}%</span>
        </div>
        <ProgressTrack value={percent} label={`Прогрес до нагороди «${track.title}»`} />
        <p className="text-muted-foreground text-xs">
          {next.current.toLocaleString("uk-UA", { maximumFractionDigits: 1 })} /{" "}
          {formatMetric(track.key, next.target)}
        </p>
      </CardContent>
      <CardFooter className="px-5">
        <Button variant="outline" className="w-full justify-between" onClick={onSelect}>
          Деталі цілі
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function CollectionItem({ track, onSelect }: { track: AchievementTrack; onSelect: () => void }) {
  const best = getBestTier(track);
  const next = getNextTier(track);
  const hasNew = getUnseenRewards(track).length > 0;
  return (
    <Button
      variant="outline"
      className="h-auto min-w-0 flex-col items-stretch gap-3 p-4 whitespace-normal"
      onClick={onSelect}
      aria-label={`${track.title}. ${best ? TIER_LABELS[best.tier] : "Ще не здобуто"}${hasNew ? ". Нова нагорода" : ""}. ${next ? `${next.current.toLocaleString("uk-UA")} із ${formatMetric(track.key, next.target)}` : "Усі рівні здобуто"}`}
    >
      <span className="flex min-h-5 items-center justify-between gap-2">
        <TierStars track={track} />
        {hasNew && <Badge variant="secondary">Нова</Badge>}
      </span>
      <span className="flex justify-center py-2">
        <RewardEmblem icon={ICONS[track.key] ?? Award} tier={best?.tier} />
      </span>
      <span className="flex flex-1 flex-col gap-1 text-center">
        <span className="text-sm font-semibold">{track.title}</span>
        <span className="text-muted-foreground text-xs">
          {best ? TIER_LABELS[best.tier] : "Ще попереду"}
        </span>
      </span>
      {next ? (
        <span className="flex flex-col gap-2 text-left">
          <ProgressTrack value={getProgressPercent(next)} label={`Прогрес «${track.title}»`} />
          <span className="text-muted-foreground text-xs leading-5 tabular-nums">
            {next.current.toLocaleString("uk-UA", { maximumFractionDigits: 1 })} /{" "}
            {formatMetric(track.key, next.target)}
          </span>
        </span>
      ) : (
        <span className="text-foreground flex items-center justify-center gap-1.5 py-1 text-xs">
          <Check />
          Усі рівні здобуто
        </span>
      )}
    </Button>
  );
}

function RewardDetails({ track }: { track: AchievementTrack }) {
  const best = getBestTier(track);
  const next = getNextTier(track);
  const unseen = getUnseenRewards(track);
  const hasNew = unseen.length > 0;
  const highlighted = hasNew ? unseen[unseen.length - 1] : (best ?? next);
  return (
    <>
      <SheetHeader className="items-center gap-3 px-5 pt-8 text-center">
        <RewardEmblem icon={ICONS[track.key] ?? Award} tier={best?.tier} size="large" />
        {highlighted && (
          <Badge variant={hasNew ? "default" : "secondary"}>
            {hasNew ? "Нова нагорода · " : ""}
            {TIER_LABELS[highlighted.tier]}
          </Badge>
        )}
        <SheetTitle>{track.title}</SheetTitle>
        <SheetDescription>
          {hasNew
            ? "Ще одна перемога у твоїй колекції. Твої зусилля дають результат."
            : "Кожен рівень — новий крок. Здобуті нагороди залишаються з тобою."}
        </SheetDescription>
        <TierStars track={track} />
      </SheetHeader>
      <div className="flex flex-col gap-4 px-5">
        <h2 className="text-sm font-semibold">Шлях нагороди</h2>
        <ol className="flex flex-col">
          {track.tiers.map((achievement, index) => {
            const earned = isEarned(achievement);
            const isNext = achievement.id === next?.id;
            return (
              <li key={achievement.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < track.tiers.length - 1 && (
                  <span
                    className="bg-border absolute top-10 bottom-0 left-5 w-px"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-10 shrink-0 items-center justify-center rounded-full border",
                    earned
                      ? TIER_TONES[achievement.tier]
                      : isNext
                        ? "bg-accent text-accent-foreground border-border"
                        : "bg-background text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {earned ? (
                    <Check className="size-4" />
                  ) : isNext ? (
                    <Target className="size-4" />
                  ) : (
                    <LockKeyhole className="size-4" />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{TIER_LABELS[achievement.tier]}</span>
                    <span
                      className={cn(
                        "text-xs",
                        earned || isNext ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {earned ? "Здобуто" : isNext ? "Наступна ціль" : "Попереду"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-5">
                    {getGoalDescription(achievement)}
                  </p>
                  {earned ? (
                    achievement.unlockedAt && (
                      <p className="text-muted-foreground text-xs">
                        {new Date(achievement.unlockedAt).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )
                  ) : (
                    <>
                      <ProgressTrack
                        value={getProgressPercent(achievement)}
                        label={`Прогрес: ${TIER_LABELS[achievement.tier]}`}
                      />
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {achievement.current.toLocaleString("uk-UA", { maximumFractionDigits: 1 })}{" "}
                        / {formatMetric(track.key, achievement.target)}
                      </p>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {track.key === "1rm" && (
          <p className="text-muted-foreground border-t pt-4 text-xs leading-5">
            1ПМ — розрахункова вага одного повторення за твоїми записаними підходами. Виконувати
            максимальну спробу для цієї нагороди не потрібно.
          </p>
        )}
        {track.key === "streak" && (
          <p className="text-muted-foreground border-t pt-4 text-xs leading-5">
            Серія рахується за тижнями з тренуваннями поспіль. Перерва змінює поточний прогрес, але
            зберігає здобуті нагороди.
          </p>
        )}
      </div>
      <SheetFooter className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <SheetClose render={<Button className="w-full" />}>
          {hasNew ? "Чудово!" : "Зрозуміло"}
        </SheetClose>
      </SheetFooter>
    </>
  );
}

export default function AchievementsPage() {
  const { data: achievements = [], isPending, isError, refetch } = useAchievements();
  const markSeen = useMarkAchievementsSeen();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<CollectionFilter>("all");
  const tracks = buildAchievementTracks(achievements);
  const selected = tracks.find((track) => track.key === selectedKey);
  const closest = getClosestTrack(tracks);
  const earned = achievements.filter(isEarned).length;
  const percent = achievements.length ? Math.round((earned / achievements.length) * 100) : 0;
  const unseenTracks = tracks.filter((track) => getUnseenRewards(track).length > 0);
  const unseenCount = unseenTracks.reduce(
    (count, track) => count + getUnseenRewards(track).length,
    0
  );
  const inProgress = tracks.filter((track) => getNextTier(track));
  const earnedTracks = tracks.filter((track) => getBestTier(track));
  const visibleTracks =
    filter === "progress" ? inProgress : filter === "earned" ? earnedTracks : tracks;

  function closeDetails() {
    const ids = selected ? getUnseenRewards(selected).map((achievement) => achievement.id) : [];
    setSelectedKey(null);
    if (ids.length)
      void markSeen(ids).catch(() => toast.error("Не вдалося позначити нагороду переглянутою"));
  }

  if (isPending) return <AchievementsLoading onRetry={() => void refetch()} />;

  return (
    <Sheet
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) closeDetails();
      }}
    >
      <div className="flex flex-1 flex-col gap-6 px-5 pb-6 md:px-8">
        <AchievementsHeader />
        {isError && achievements.length > 0 && <RefreshNotice onRetry={() => void refetch()} />}
        {isError && achievements.length === 0 ? (
          <section className="flex flex-col items-center gap-4 py-12 text-center" role="alert">
            <Award className="text-muted-foreground size-10" />
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">Нагороди не завантажилися</h2>
              <p className="text-muted-foreground text-sm">
                Спробуй ще раз — твій прогрес збережено.
              </p>
            </div>
            <Button variant="outline" onClick={() => void refetch()}>
              Спробувати ще
            </Button>
          </section>
        ) : tracks.length === 0 ? (
          <section className="flex flex-col items-center gap-4 py-12 text-center">
            <RewardEmblem icon={Trophy} size="large" />
            <h2 className="text-lg font-semibold">Колекція ще готується</h2>
            <p className="text-muted-foreground max-w-xs text-sm leading-6">
              Коли нагороди стануть доступними, тут з’являться цілі та твій прогрес.
            </p>
            <Link to="/workout/new" className={buttonVariants({ variant: "primary" })}>
              Почати тренування
            </Link>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-4" aria-labelledby="collection-summary">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h2 id="collection-summary" className="text-muted-foreground text-sm">
                    Нагород у колекції
                  </h2>
                  <p className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-4xl font-medium tracking-tight">{earned}</span>
                    <span className="text-muted-foreground text-lg">/ {achievements.length}</span>
                  </p>
                </div>
                <RewardEmblem icon={Trophy} tier={earned > 0 ? "gold" : undefined} />
              </div>
              <ProgressTrack value={percent} label="Зібрано нагород" />
              <p className="text-muted-foreground text-xs">
                Бронза → Срібло → Золото. Кожен значок має свій шлях.
              </p>
            </section>

            {unseenCount > 0 && (
              <Button
                variant="secondary"
                className="h-auto justify-between gap-3 px-4 py-3"
                onClick={() => setSelectedKey(unseenTracks[0].key)}
              >
                <span className="flex items-center gap-2">
                  <Sparkles />
                  <span>Нові нагороди: {unseenCount}</span>
                </span>
                <ChevronRight data-icon="inline-end" />
              </Button>
            )}

            {closest ? (
              <NextReward track={closest} onSelect={() => setSelectedKey(closest.key)} />
            ) : (
              <div className="bg-accent text-accent-foreground flex items-center gap-3 rounded-xl p-4">
                <Trophy className="size-5 shrink-0" />
                <p className="text-sm">
                  Усю колекцію зібрано. Кожна нагорода — результат твоєї роботи.
                </p>
              </div>
            )}

            <section className="flex flex-col gap-4" aria-labelledby="collection-title">
              <h2 id="collection-title" className="text-base font-semibold">
                Значки
              </h2>
              <div className="scrollbar-none overflow-x-auto">
                <ToggleGroup
                  value={[filter]}
                  onValueChange={(values) => {
                    const value = values[0];
                    if (value === "all" || value === "progress" || value === "earned")
                      setFilter(value);
                  }}
                  aria-label="Фільтр колекції"
                  spacing={1}
                >
                  <ToggleGroupItem value="all">Усі · {tracks.length}</ToggleGroupItem>
                  <ToggleGroupItem value="progress">
                    У процесі · {inProgress.length}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="earned">Здобуті · {earnedTracks.length}</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {filter !== "all" && (
                <p className="text-muted-foreground text-xs leading-5">
                  {filter === "earned"
                    ? "Значки, у яких уже здобуто хоча б один рівень."
                    : "Значки, у яких ще можна відкрити наступний рівень."}
                </p>
              )}
              <p className="sr-only" role="status">
                Показано значків: {visibleTracks.length}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleTracks.map((track) => (
                  <CollectionItem
                    key={track.key}
                    track={track}
                    onSelect={() => setSelectedKey(track.key)}
                  />
                ))}
              </div>
              {visibleTracks.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Star className="text-muted-foreground size-8" />
                  <p className="text-sm font-medium">
                    {filter === "earned" ? "Перші нагороди ще попереду" : "Усі цілі пройдено"}
                  </p>
                  <p className="text-muted-foreground max-w-xs text-sm leading-6">
                    {filter === "earned"
                      ? "Завершуй тренування — значки відкриватимуться автоматично."
                      : "Переглянь значки, які вже є у твоїй колекції."}
                  </p>
                  <Button variant="outline" onClick={() => setFilter("all")}>
                    Переглянути всі
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl px-0 pt-0"
        showCloseButton={false}
      >
        {selected && <RewardDetails track={selected} />}
      </SheetContent>
    </Sheet>
  );
}

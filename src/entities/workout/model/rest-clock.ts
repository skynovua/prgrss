export interface RestClock {
  endsAt: number | null;
  remainingSeconds: number;
}

export function getRestSeconds(clock: RestClock | null, now: number) {
  if (!clock) return 0;
  return clock.endsAt == null
    ? clock.remainingSeconds
    : Math.max(0, Math.ceil((clock.endsAt - now) / 1000));
}

export function startRestClock(seconds: number, now: number): RestClock {
  return { endsAt: now + seconds * 1000, remainingSeconds: seconds };
}

export function toggleRestClock(clock: RestClock, now: number): RestClock {
  const remainingSeconds = getRestSeconds(clock, now);
  return {
    endsAt: clock.endsAt == null ? now + remainingSeconds * 1000 : null,
    remainingSeconds,
  };
}

export function extendRestClock(clock: RestClock, seconds: number, now: number): RestClock {
  const remainingSeconds = Math.min(3600, getRestSeconds(clock, now) + seconds);
  return {
    remainingSeconds,
    endsAt:
      clock.endsAt == null
        ? null
        : Math.min(now + 3600000, Math.max(now, clock.endsAt) + seconds * 1000),
  };
}

export function formatRestTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

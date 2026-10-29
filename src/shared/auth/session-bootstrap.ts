import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Подія авторизації має пріоритет над старою відповіддю початкового getSession.
export function subscribeToSession(
  auth: SupabaseClient["auth"],
  onChange: (state: SessionState) => void,
  timeoutMs = 15_000
) {
  let active = true;
  let receivedEvent = false;
  const finish = (session: Session | null, error: string | null = null) => {
    if (!active) return;
    clearTimeout(timer);
    onChange({ user: session?.user ?? null, loading: false, error });
  };
  const timer = setTimeout(() => {
    finish(null, "Перевірка сесії триває надто довго. Перевір з’єднання та спробуй ще.");
  }, timeoutMs);
  const {
    data: { subscription },
  } = auth.onAuthStateChange((_event, session) => {
    receivedEvent = true;
    finish(session);
  });

  void auth.getSession().then(
    ({ data, error }) => {
      if (!receivedEvent) finish(data.session, error ? "Не вдалося перевірити сесію." : null);
    },
    () => {
      if (!receivedEvent) finish(null, "Не вдалося перевірити сесію.");
    }
  );

  return () => {
    active = false;
    clearTimeout(timer);
    subscription.unsubscribe();
  };
}

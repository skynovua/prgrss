import { LoadingNotice, PageError } from "@/shared/ui";

export function AppStartup({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  return (
    <main className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-6 px-5">
      <p className="font-logo text-2xl" aria-label="PRGRSS">
        PR<span className="text-primary">G</span>RSS
      </p>
      {error ? (
        <PageError title="Не вдалося відкрити PRGRSS" description={error} onRetry={onRetry} />
      ) : (
        <LoadingNotice onRetry={onRetry} />
      )}
    </main>
  );
}

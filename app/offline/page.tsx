export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Офлайн</h1>
      <p className="text-muted-foreground">
        Немає з&apos;єднання з інтернетом. Тренування зберігаються локально і
        синхронізуються автоматично.
      </p>
    </div>
  );
}

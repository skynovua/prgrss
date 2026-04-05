export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <div className="border-muted-foreground/30 border-t-foreground h-4 w-4 animate-spin rounded-full border-2" />
        Завантаження...
      </div>
    </div>
  );
}

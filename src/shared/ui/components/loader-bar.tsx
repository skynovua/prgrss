export function LoaderBar() {
  return (
    <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-100">
      <div className="bg-primary h-0.5 animate-pulse" />
    </div>
  );
}

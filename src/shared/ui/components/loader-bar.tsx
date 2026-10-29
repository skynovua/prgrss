import { useEffect, useState } from "react";

export function LoaderBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 250);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-100" aria-hidden="true">
      <div className="bg-primary h-0.5 animate-pulse motion-reduce:animate-none" />
    </div>
  );
}

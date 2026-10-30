import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { useAuth } from "@/shared/auth";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    navigate({ to: user ? "/dashboard" : "/login" });
  }, [loading, navigate, user]);

  return (
    <main
      className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-6 px-5"
      role="status"
    >
      <p className="font-logo text-2xl" aria-label="PRGRSS">
        PR<span className="text-primary">G</span>RSS
      </p>
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Входимо до PRGRSS…
      </div>
    </main>
  );
}

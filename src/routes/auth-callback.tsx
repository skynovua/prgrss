import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/src/lib/supabase/client";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase клієнт автоматично обробляє ?code= з URL (PKCE flow)
    // Потрібно лише дочекатися результату через onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate({ to: "/dashboard" });
      } else if (event === "INITIAL_SESSION") {
        // Сесія ще не готова — чекаємо SIGNED_IN
      } else {
        navigate({ to: "/login" });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="bg-primary h-0.5 w-32 animate-pulse" />
    </div>
  );
}

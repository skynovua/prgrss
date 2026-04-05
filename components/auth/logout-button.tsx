"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        setError("Не вдалося вийти з акаунту.");
        setLoading(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Не вдалося вийти з акаунту.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Вийти з акаунту
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

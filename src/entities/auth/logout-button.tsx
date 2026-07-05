import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui";
import { createClient } from "@/shared/api";

export function LogoutButton() {
  const navigate = useNavigate();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

      navigate({ to: "/login" });
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
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Вийти з акаунту
      </Button>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Вийти з акаунту?"
        description="Ви впевнені, що хочете вийти? Незбережені дані можуть бути втрачені."
        confirmText="Вийти"
        isDestructive
        isLoading={loading}
        onConfirm={handleLogout}
      />
    </div>
  );
}

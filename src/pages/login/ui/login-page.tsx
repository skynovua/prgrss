import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";
import { useAuth } from "@/shared/auth";
import { createClient } from "@/shared/api";
import { Activity, Download, Flame, Loader2, ShieldCheck, X } from "lucide-react";
import { isStandalone } from "@/shared/lib";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const supabase = createClient();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<"google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (!isStandalone() && !localStorage.getItem("pwa-banner-dismissed")) {
      const timer = setTimeout(() => setShowInstall(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [authLoading, navigate, user]);

  const handleLogin = async (provider: "google") => {
    try {
      setLoading(provider);
      setError(null);

      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        setError(`Помилка: ${error.message}`);
        setLoading(null);
      }
    } catch (err) {
      setError(`Виняток: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="relative px-5 py-6 text-center">
            <div className="from-primary/10 absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
            <div className="relative flex flex-col items-center gap-4">
              <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
                <span className="text-2xl font-black">P</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                    Workout Tracker
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">PRGRSS</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Логуй тренування, стеж за прогресом і тримай історію занять в одному місці.
                </p>
              </div>

              <div className="grid w-full grid-cols-3 gap-2 text-center">
                <HeroPill icon={<Activity className="h-4 w-4" />} label="Логер" />
                <HeroPill icon={<Flame className="h-4 w-4" />} label="Прогрес" />
                <HeroPill icon={<ShieldCheck className="h-4 w-4" />} label="Захист" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full p-0">
          <CardContent className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-sm font-medium">Увійти в акаунт</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Авторизація потрібна для синхронізації тренувань, профілю та статистики між
                пристроями.
              </p>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full gap-3"
              onClick={() => handleLogin("google")}
              disabled={loading !== null}
            >
              {loading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Увійти з Google
            </Button>

            {error && <p className="text-destructive text-center text-sm">{error}</p>}
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-xs">
          Входячи, ви погоджуєтесь з умовами використання
        </p>
      </div>

      {showInstall && (
        <div className="animate-in slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] duration-300">
          <div className="bg-card border-border mx-auto flex max-w-sm items-center gap-3 rounded-xl border p-4 shadow-lg">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Download className="h-5 w-5" />
            </div>
            <Link to="/install" className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">Встановити додаток</span>
              <span className="text-muted-foreground text-xs">Швидший доступ з головного екрана</span>
            </Link>
            <button
              onClick={() => {
                setShowInstall(false);
                localStorage.setItem("pwa-banner-dismissed", "1");
              }}
              className="text-muted-foreground hover:text-foreground ml-auto shrink-0 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-background/70 rounded-2xl border px-3 py-3 backdrop-blur-sm">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

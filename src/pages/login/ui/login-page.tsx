import { Link, useNavigate } from "@tanstack/react-router";
import { Download, Loader2, Moon, Sun, X } from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

import { createClient } from "@/shared/api";
import { useAuth } from "@/shared/auth";
import { isStandalone } from "@/shared/lib";
import { useTheme } from "@/shared/theme";
import { Button } from "@/shared/ui";

function GoogleIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
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
  const { resolvedTheme, setTheme } = useTheme();
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
    <div className="bg-background text-foreground relative flex min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-12 px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between gap-4">
          <p className="font-logo text-xl tracking-normal">
            PR<span className="text-primary">G</span>RSS
          </p>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              resolvedTheme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"
            }
            onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
          >
            {resolvedTheme === "light" ? <Moon /> : <Sun />}
          </Button>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-8 pb-12">
          <div className="flex flex-col gap-5">
            <span className="text-muted-foreground text-sm font-medium">
              Маленькі кроки. Помітні зміни.
            </span>
            <h1 className="font-heading text-4xl leading-[1.12] font-medium tracking-tight sm:text-5xl">
              Твій ритм.
              <br />
              Твій прогрес.
            </h1>
            <p className="text-muted-foreground text-base leading-7">
              Записуй тренування, помічай свої досягнення та рухайся вперед у власному темпі.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => handleLogin("google")}
              disabled={loading !== null}
            >
              {loading === "google" ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <GoogleIcon data-icon="inline-start" />
              )}
              Увійти з Google
            </Button>

            {error && (
              <p role="alert" className="text-destructive text-center text-sm">
                {error}
              </p>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-5">
            Входячи, ви погоджуєтесь з умовами використання
          </p>
        </div>
      </div>

      {showInstall && (
        <div className="animate-in slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] duration-300">
          <div className="bg-card border-border mx-auto flex max-w-sm items-center gap-3 rounded-xl border p-4 shadow-lg">
            <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Download className="h-5 w-5" />
            </div>
            <Link to="/install" className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">Встановити додаток</span>
              <span className="text-muted-foreground text-xs">
                Швидший доступ з головного екрана
              </span>
            </Link>
            <button
              type="button"
              aria-label="Закрити пропозицію встановлення"
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

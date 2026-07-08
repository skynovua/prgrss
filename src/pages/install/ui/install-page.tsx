import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Button } from "@/shared/ui";
import {
  Share,
  Plus,
  MoreVertical,
  Download,
  Monitor,
  Smartphone,
  Sparkles,
  Zap,
  Bell,
} from "lucide-react";
import { type Platform, detectPlatform, isStandalone } from "@/shared/lib";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [platform] = useState<Platform>(() => detectPlatform());
  const [installed, setInstalled] = useState(() => isStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <div className="flex min-h-screen flex-col justify-center gap-6 p-4">
        <Card className="overflow-hidden p-0">
          <CardContent className="relative px-4 py-5 text-center">
            <div className="from-primary/10 absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-2xl">
                <Download className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">PRGRSS already installed</h1>
                <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
                  Застосунок уже працює на цьому пристрої як окремий app experience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <Card className="overflow-hidden p-0">
        <CardContent className="relative px-4 py-5 text-center">
          <div className="from-primary/10 absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
              <span className="text-2xl font-black">P</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  App Install
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Встанови PRGRSS</h1>
              <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
                Додай застосунок на головний екран, щоб запускати його миттєво і користуватись ним
                як окремим тренувальним app.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3">
              <BenefitPill icon={<Zap className="h-4 w-4" />} label="Швидкий старт" />
              <BenefitPill icon={<Bell className="h-4 w-4" />} label="Нагадування" />
              <BenefitPill icon={<Sparkles className="h-4 w-4" />} label="App mode" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Нативний prompt (Chrome / Edge / Samsung) */}
      {deferredPrompt && (
        <Card className="border-primary/30 bg-primary/5 p-0">
          <CardContent className="flex flex-col items-center gap-3 p-4">
            <Button onClick={handleInstallClick} size="lg" className="w-full justify-center gap-2">
              <Download className="mr-2 h-5 w-5" />
              Встановити додаток
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Браузер уже готовий показати native install prompt.
            </p>
          </CardContent>
        </Card>
      )}

      {/* iOS Safari */}
      {platform === "ios" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5" />
              iPhone / iPad (Safari)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Step number={1}>
              Натисни кнопку{" "}
              <span className="bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                <Share className="h-4 w-4" /> Поділитися
              </span>{" "}
              внизу екрана
            </Step>
            <Step number={2}>
              Прокрути вниз і натисни{" "}
              <span className="bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                <Plus className="h-4 w-4" /> На Початковий екран
              </span>
            </Step>
            <Step number={3}>
              Натисни <strong>Додати</strong> у верхньому правому куті
            </Step>
          </CardContent>
        </Card>
      )}

      {/* Android Chrome */}
      {platform === "android" && !deferredPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5" />
              Android (Chrome)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Step number={1}>
              Натисни{" "}
              <span className="bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                <MoreVertical className="h-4 w-4" /> меню
              </span>{" "}
              (три крапки вгорі)
            </Step>
            <Step number={2}>
              Обери{" "}
              <span className="bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                <Plus className="h-4 w-4" /> Додати на головний екран
              </span>
            </Step>
            <Step number={3}>
              Натисни <strong>Встановити</strong>
            </Step>
          </CardContent>
        </Card>
      )}

      {/* Desktop */}
      {platform === "desktop" && !deferredPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-5 w-5" />
              Комп'ютер (Chrome / Edge)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Step number={1}>
              Натисни іконку{" "}
              <span className="bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5">
                <Download className="h-4 w-4" /> встановлення
              </span>{" "}
              в адресному рядку (праворуч)
            </Step>
            <Step number={2}>
              Натисни <strong>Встановити</strong> у спливаючому вікні
            </Step>
          </CardContent>
        </Card>
      )}

      {/* Переваги */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle className="text-base">Що ти отримаєш</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground flex flex-col gap-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              Повноекранний режим без адресного рядка
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              Іконка на головному екрані
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              Зручний запуск з головного екрана
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              Миттєвий запуск як нативний додаток
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function BenefitPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-background/70 rounded-2xl border px-3 py-3 text-center backdrop-blur-sm">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </div>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

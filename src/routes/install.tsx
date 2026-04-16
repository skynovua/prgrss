import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Share, Plus, MoreVertical, Download, Monitor, Smartphone } from "lucide-react";
import { type Platform, detectPlatform, isStandalone } from "@/src/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
          <Download className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Вже встановлено!</h1>
        <p className="text-muted-foreground max-w-sm">
          PRGRSS вже працює як додаток на твоєму пристрої.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-2xl">
          <span className="text-2xl font-black">P</span>
        </div>
        <h1 className="text-2xl font-bold">Встанови PRGRSS</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Додай на головний екран для швидкого доступу, роботи офлайн та повноекранного режиму.
        </p>
      </div>

      {/* Нативний prompt (Chrome / Edge / Samsung) */}
      {deferredPrompt && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <Button onClick={handleInstallClick} size="lg" className="w-full">
              <Download className="mr-2 h-5 w-5" />
              Встановити додаток
            </Button>
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
      <Card>
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
              Працює офлайн у залі
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

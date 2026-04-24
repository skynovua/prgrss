import { CloudOff, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 p-4">
      <Card className="overflow-hidden p-0">
        <CardContent className="relative px-4 py-5 text-center">
          <div className="from-primary/10 absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-2xl">
              <CloudOff className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">Ти зараз офлайн</h1>
              <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
                З&apos;єднання з інтернетом недоступне, але тренування й активна сесія продовжують
                працювати локально.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Тренування не загубляться"
          description="Дані активного тренування зберігаються на пристрої й дочекаються синхронізації."
        />
        <InfoCard
          icon={<RefreshCcw className="h-5 w-5" />}
          title="Синхронізація автоматична"
          description="Щойно мережа повернеться, застосунок сам підтягне актуальні дані й відправить локальні зміни."
        />
      </div>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium">Що можна робити зараз</p>
          <ul className="text-muted-foreground flex flex-col gap-2 text-sm">
            <li>Продовжувати або почати тренування</li>
            <li>Вносити підходи та вагу без мережі</li>
            <li>Повернутись сюди й оновити сторінку, коли інтернет з&apos;явиться</li>
          </ul>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Спробувати знову
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-0">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

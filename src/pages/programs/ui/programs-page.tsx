import { Link } from "@tanstack/react-router";
import { CalendarRange, ChevronRight, Dumbbell, Layers3 } from "lucide-react";

import { Button } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui";

export default function ProgramsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <Card className="overflow-hidden p-0">
        <CardContent className="relative px-4 py-4">
          <div className="from-primary/10 absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Soon
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight">Програми</h1>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  Тут з&apos;являться шаблони тренувальних циклів: готові спліти, блоки на кілька
                  тижнів і швидкий старт нового тренування по структурованому плану.
                </p>
              </div>

              <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<CalendarRange className="h-4 w-4" />}
                label="Цикли"
                value="4-12 тижнів"
              />
              <InfoTile
                icon={<Layers3 className="h-4 w-4" />}
                label="Шаблони"
                value="Upper/Lower, Full Body"
              />
              <InfoTile
                icon={<Dumbbell className="h-4 w-4" />}
                label="Мета"
                value="Швидкий повтор тренувань"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="flex flex-col gap-4 p-4">
          <div>
            <h2 className="text-sm font-medium">Що тут буде</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Коли секція буде готова, ти зможеш зберігати улюблені структури тренувань і запускати
              нову сесію без ручного додавання вправ щоразу.
            </p>
          </div>

          <div className="grid gap-2.5 text-sm">
            <FeatureRow
              title="Шаблони під ціль"
              description="Сила, гіпертрофія, full body, upper/lower."
            />
            <FeatureRow
              title="Швидкий старт"
              description="Запуск нового тренування з готовим набором вправ."
            />
            <FeatureRow
              title="Гнучке редагування"
              description="Підлаштування вправ і сетів під конкретний день."
            />
          </div>

          <Link to="/workout/new">
            <Button variant="outline" className="w-full justify-between">
              Почати тренування без програми
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-background/70 rounded-2xl border px-3 py-3 backdrop-blur-sm">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm leading-snug font-medium">{value}</p>
    </div>
  );
}

function FeatureRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border px-3 py-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

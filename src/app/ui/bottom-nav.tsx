import { Link, type LinkProps, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Dumbbell, Home, Plus, Settings, TrendingUp } from "lucide-react";

import { cn } from "@/shared/lib";

interface NavItem {
  href: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  accent: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Головна", icon: Home, accent: false },
  { href: "/exercises", label: "Вправи", icon: Dumbbell, accent: false },
  { href: "/workout/new", label: "Старт", icon: Plus, accent: true },
  { href: "/progress", label: "Прогрес", icon: TrendingUp, accent: false },
  { href: "/settings", label: "Більше", icon: Settings, accent: false },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Основна навігація"
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          if (item.accent) {
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-label="Почати тренування"
                aria-current={isActive ? "page" : undefined}
                className="flex items-center justify-center"
              >
                <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
                  <Icon className="size-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2 : 1.75} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Plus, TrendingUp, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Головна", icon: Home, accent: false },
  { href: "/exercises", label: "Вправи", icon: Dumbbell, accent: false },
  { href: "/workout/new", label: "Старт", icon: Plus, accent: true },
  { href: "/progress", label: "Прогрес", icon: TrendingUp, accent: false },
  { href: "/settings", label: "Більше", icon: Settings, accent: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="flex -translate-y-1 flex-col items-center gap-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex min-w-0 flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

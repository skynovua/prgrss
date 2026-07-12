import { Link, type LinkProps, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Dumbbell, Home, Plus, Settings, TrendingUp } from "lucide-react";

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
      className="border-border/80 bg-card/92 supports-backdrop-filter:bg-card/80 fixed inset-x-0 bottom-0 z-50 border-t shadow-[0_-18px_40px_rgb(0_0_0/0.12)] backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          if (item.accent) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex -translate-y-1 flex-col items-center gap-0.5"
              >
                <div className="bg-primary text-primary-foreground shadow-primary/30 flex size-12 items-center justify-center rounded-full shadow-[0_0_22px_rgb(204_255_0/0.32)]">
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex min-w-0 flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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

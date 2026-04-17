import { Link, useLocation, type LinkProps } from "@tanstack/react-router";
import { Home, Dumbbell, Plus, TrendingUp, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
      className="border-border/80 bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur"
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
                <div className="bg-primary text-primary-foreground shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
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

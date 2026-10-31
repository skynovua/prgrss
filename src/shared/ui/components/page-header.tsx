import type { ComponentProps } from "react";

import { cn } from "@/shared/lib";

export function PageHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "border-border/30 bg-background/50 before:bg-background sticky top-[env(safe-area-inset-top,0px)] z-30 -mx-5 flex min-h-[4.5rem] items-center border-b px-5 pt-4 pb-3 backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-0 before:-top-[env(safe-area-inset-top,0px)] before:h-[env(safe-area-inset-top,0px)] before:content-[''] md:-mx-8 md:px-8",
        className
      )}
      {...props}
    />
  );
}

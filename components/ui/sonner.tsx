"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--secondary)",
          "--success-text": "var(--secondary-foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--secondary)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--destructive)",
          "--warning-bg": "var(--secondary)",
          "--warning-text": "oklch(0.85 0.15 85)",
          "--warning-border": "oklch(0.85 0.15 85 / 30%)",
          "--info-bg": "var(--secondary)",
          "--info-text": "var(--secondary-foreground)",
          "--info-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

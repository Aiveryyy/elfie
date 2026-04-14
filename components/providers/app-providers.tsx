"use client";

import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";

function AppearanceSync() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.accent = settings.accentTheme;
    root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
    root.style.colorScheme = "light";
  }, [settings.accentTheme, settings.reducedMotion]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={180}>
      <AppearanceSync />
      {children}
    </TooltipProvider>
  );
}

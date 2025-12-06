"use client";

import { ReactNode, useMemo } from "react";
import type { Theme } from "@/context/AppSettingsContext";

interface PageBackgroundProps {
  children: ReactNode;
  theme: Theme;
  backgroundColor?: string; // Optional override, will be ignored if theme is provided
}

const THEME_COLORS: Record<Theme, string> = {
  Plain: "#C7C7C7",
  Retro: "#FFD700", // Yellow
  Teen: "#FFA500", // Orange
};

export function PageBackground({
  children,
  theme,
  backgroundColor,
}: PageBackgroundProps) {
  // Get background color from theme, or use provided override
  const bgColor = useMemo(() => {
    return backgroundColor || THEME_COLORS[theme];
  }, [theme, backgroundColor]);

  // iOS Safari fix: The CSS class handles the height fix
  // -webkit-fill-available ensures full height coverage in iOS Safari
  // even when Safari's address bar shows/hides
  return (
    <div
      className="h-screen w-full"
      style={{
        backgroundColor: bgColor,
      }}
    >
      {children}
    </div>
  );
}

"use client";

import { ReactNode, useMemo } from "react";
import type { Theme } from "@/context/AppSettingsContext";
import { PAGE_BACKGROUND_COLORS } from "@/lib/themeConfig";

interface PageBackgroundProps {
  children: ReactNode;
  theme: Theme;
  backgroundColor?: string; // Optional override, will be ignored if theme is provided
}

export function PageBackground({
  children,
  theme,
  backgroundColor,
}: PageBackgroundProps) {
  // Get background color from theme, or use provided override
  const bgColor = useMemo(() => {
    return backgroundColor || PAGE_BACKGROUND_COLORS[theme];
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

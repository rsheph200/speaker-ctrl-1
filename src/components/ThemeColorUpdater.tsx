"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/context/AppSettingsContext";
import type { Theme } from "@/context/AppSettingsContext";

// Map themes to their background colors for status bar
const THEME_STATUS_BAR_COLORS: Record<Theme, string> = {
  Plain: "#C7C7C7",      // Light gray
  Retro: "#FFD700",      // Yellow/gold
  Mood: "#000000",       // Black (gradient starts with black)
  Circular: "#C7C7C7",   // Light gray (same as Plain)
};

export function ThemeColorUpdater() {
  const { theme } = useAppSettings();

  useEffect(() => {
    const color = THEME_STATUS_BAR_COLORS[theme];
    
    // Update or create the theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", color);
  }, [theme]);

  return null;
}

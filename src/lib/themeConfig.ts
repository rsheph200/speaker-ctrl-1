import type { Theme } from "@/context/AppSettingsContext";

// Header text colors
export const HEADER_THEME_TEXT_COLORS: Record<Theme, string> = {
  Plain: "#737373",
  Retro: "#8B6914", // Darker gold
  Mood: "#959595", // White for contrast on gradient
  Circular: "#737373",
};

// Header subtitle colors
export const HEADER_THEME_SUBTEXT_COLORS: Record<Theme, string> = {
  Plain: "#898989",
  Retro: "#A0822D", // Medium gold
  Mood: "#959595", // Light gray for contrast
  Circular: "#898989",
};

// Footer text colors
export const FOOTER_THEME_TEXT_COLORS: Record<Theme, string> = {
  Plain: "#909090",
  Retro: "#B8860B", // Darker gold for footer
  Mood: "#738492", // Dark blue-gray for contrast on gradient
  Circular: "#909090",
};

// Chevron colors
export const CHEVRON_THEME_COLORS: Record<Theme, string> = {
  Plain: "#737373",
  Retro: "#8B6914", // Darker gold
  Mood: "#959595", // White for contrast on gradient
  Circular: "#737373",
};

// Logo colors
export const LOGO_THEME_COLORS: Record<Theme, string> = {
  Plain: "#959595",
  Retro: "#B8860B", // Dark goldenrod
  Mood: "#959595", // White for contrast on gradient
  Circular: "#959595",
};

// Page background colors (for Plain and Retro themes)
export const PAGE_BACKGROUND_COLORS: Record<Theme, string> = {
  Plain: "#C7C7C7",
  Retro: "#FFD700", // Yellow
  Mood: "#FFA500", // Orange (not used, Mood uses gradient)
  Circular: "#C7C7C7",
};

// Mood theme gradient background
export const TEEN_GRADIENT_BACKGROUND =
  "linear-gradient(180deg, #000 0%, #0A161F 36.06%, #374749 50.48%, #849697 63.94%, #DCEEE9 100%)";

// Mood theme blur filter (currently commented out, but available)
export const TEEN_BLUR_FILTER = "blur(87px)";

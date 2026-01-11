import type { ReactNode } from "react";

export interface SourceMode {
  id: string;
  displayName: string;
  className?: string; // For CSS styling
  showControls: boolean; // Whether to show play/pause controls
  artworkPlaceholder?: ReactNode; // Placeholder component (optional)
}

// Mode registry
const modes: Record<string, SourceMode> = {
  spotify: {
    id: "spotify",
    displayName: "Spotify",
    className: "mode-spotify",
    showControls: true,
  },
  bluetooth: {
    id: "bluetooth",
    displayName: "Bluetooth",
    className: "mode-bluetooth",
    showControls: false, // Bluetooth is controlled by the connected device
  },
  none: {
    id: "none",
    displayName: "None",
    className: "mode-none",
    showControls: false,
  },
};

// Default mode for unknown sources
const defaultMode: SourceMode = {
  id: "unknown",
  displayName: "Unknown",
  className: "mode-unknown",
  showControls: false,
};

/**
 * Get mode configuration for a given source
 * @param source - The source string ("bluetooth", "spotify", "none", etc.)
 * @returns SourceMode configuration object
 */
export function getModeConfig(source: string | null | undefined): SourceMode {
  if (!source) {
    return modes.none;
  }

  const normalizedSource = source.toLowerCase().trim();
  return modes[normalizedSource] || defaultMode;
}

/**
 * Register a new mode (for future extensibility)
 * @param mode - SourceMode configuration to register
 */
export function registerMode(mode: SourceMode): void {
  modes[mode.id.toLowerCase()] = mode;
}

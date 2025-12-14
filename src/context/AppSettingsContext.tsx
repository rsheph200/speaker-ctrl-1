"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "Plain" | "Retro" | "Mood" | "Circular";

type AppSettingsContextValue = {
  dummyMode: boolean;
  setDummyMode: (next: boolean) => void;
  toggleDummyMode: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(
  undefined
);
const STORAGE_KEY = "aea-app-settings";

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [dummyMode, setDummyMode] = useState(false);
  const [theme, setTheme] = useState<Theme>("Plain");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (typeof parsed?.dummyMode === "boolean") {
        setDummyMode(parsed.dummyMode);
      }
      if (
        parsed?.theme === "Plain" ||
        parsed?.theme === "Retro" ||
        parsed?.theme === "Mood" ||
        parsed?.theme === "Circular"
      ) {
        setTheme(parsed.theme);
      }
    } catch (error) {
      console.warn("Failed to load stored settings", error);
    }
  }, []);

  // Persist whenever the settings change
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ dummyMode, theme })
      );
    } catch (error) {
      console.warn("Failed to persist settings", error);
    }
  }, [dummyMode, theme]);

  const toggleDummyMode = useCallback(() => {
    setDummyMode((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      dummyMode,
      setDummyMode,
      toggleDummyMode,
      theme,
      setTheme,
    }),
    [dummyMode, toggleDummyMode, theme]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }

  return context;
}

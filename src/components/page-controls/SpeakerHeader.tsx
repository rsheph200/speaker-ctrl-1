"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakerPowerControls } from "@/components/speaker/base";
import { useAppSettings } from "@/context/AppSettingsContext";
import { AEALogo } from "./assets/AEALogo";
import { DownChevron } from "./assets/DownChevron";
import {
  HEADER_THEME_TEXT_COLORS,
  HEADER_THEME_SUBTEXT_COLORS,
  CHEVRON_THEME_COLORS,
} from "@/lib/themeConfig";

interface SpeakerHeaderProps {
  health: any;
  source: string | null;
  availableSources: string[];
  onSourceChange: (source: string) => void;
  onRestart: () => void;
  onShutdown: () => void;
}

export function SpeakerHeader({
  health,
  source,
  availableSources,
  onSourceChange,
  onRestart,
  onShutdown,
}: SpeakerHeaderProps) {
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLButtonElement>(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [modePanelTop, setModePanelTop] = useState(0);
  const [themePanelTop, setThemePanelTop] = useState(0);
  const [settingsPanelTop, setSettingsPanelTop] = useState(0);
  const {
    dummyMode,
    toggleDummyMode,
    theme: selectedTheme,
    setTheme,
  } = useAppSettings();

  useEffect(() => {
    if (!settingsMenuOpen) return;

    if (settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSettingsPanelTop(rect.bottom + 8);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setSettingsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsMenuOpen]);

  useEffect(() => {
    if (!modeMenuOpen) return;

    if (modeButtonRef.current) {
      const rect = modeButtonRef.current.getBoundingClientRect();
      setModePanelTop(rect.bottom + 8);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeMenuRef.current &&
        !modeMenuRef.current.contains(event.target as Node) &&
        modeButtonRef.current &&
        !modeButtonRef.current.contains(event.target as Node)
      ) {
        setModeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modeMenuOpen]);

  useEffect(() => {
    if (!themeMenuOpen) return;

    if (themeButtonRef.current) {
      const rect = themeButtonRef.current.getBoundingClientRect();
      setThemePanelTop(rect.bottom + 8);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node) &&
        themeButtonRef.current &&
        !themeButtonRef.current.contains(event.target as Node)
      ) {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [themeMenuOpen]);

  return (
    <header className="flex w-full items-start justify-between gap-2 text-center pt-1 pr-1">
      {/* Logo */}
      <div className="flex flex-col items-center pt-1.5 pl-2">
        <AEALogo theme={selectedTheme} />
        <p
          className="text-[8px]"
          style={{ color: HEADER_THEME_SUBTEXT_COLORS[selectedTheme] }}
        >
          (All Ears Audio)
        </p>
      </div>

      {/* Mode */}
      <div className="relative">
        <button
          ref={modeButtonRef}
          type="button"
          onClick={() => setModeMenuOpen(!modeMenuOpen)}
          className={`group flex items-center py-1.5 pl-2 pr-3 rounded-lg text-[11px] transition-all duration-150 hover:text-neutral-800 hover:bg-neutral-300 relative z-50 ${
            modeMenuOpen ? "text-neutral-800 bg-neutral-300" : ""
          }`}
          style={{
            color: modeMenuOpen
              ? undefined
              : HEADER_THEME_TEXT_COLORS[selectedTheme],
          }}
        >
          <DownChevron
            color={
              modeMenuOpen ? "#1f2937" : CHEVRON_THEME_COLORS[selectedTheme]
            }
          />
          Mode
          {source
            ? `: ${source
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")}`
            : ""}
        </button>

        {modeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setModeMenuOpen(false)}
            />
            <div
              ref={modeMenuRef}
              className="fixed inset-x-4 z-50 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg"
              style={{ top: `${modePanelTop}px` }}
            >
              <div className="mb-4">
                <div
                  className="group flex items-center py-1.5 pl-2 pr-3 rounded-lg text-[11px]"
                  style={{ color: HEADER_THEME_TEXT_COLORS[selectedTheme] }}
                >
                  <DownChevron color={CHEVRON_THEME_COLORS[selectedTheme]} />
                  Mode
                  {source
                    ? `: ${source
                        .split("-")
                        .map(
                          (part) => part.charAt(0).toUpperCase() + part.slice(1)
                        )
                        .join(" ")}`
                    : ""}
                </div>
              </div>
              <ul className="space-y-2">
                {availableSources.map((sourceOption) => {
                  const label = sourceOption
                    .split("-")
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(" ");
                  const isSelected = source === sourceOption;

                  return (
                    <li key={sourceOption}>
                      <button
                        type="button"
                        onClick={() => {
                          onSourceChange(sourceOption);
                          setModeMenuOpen(false);
                        }}
                        className={`w-full rounded-xl p-3 text-left text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Theme */}
      <div className="relative">
        <button
          ref={themeButtonRef}
          type="button"
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className={`group flex items-center py-1.5 pl-2 pr-3 rounded-lg text-[11px] transition-all duration-150 hover:text-neutral-800 hover:bg-neutral-300 relative z-50 ${
            themeMenuOpen ? "text-neutral-800 bg-neutral-300" : ""
          }`}
          style={{
            color: themeMenuOpen
              ? undefined
              : HEADER_THEME_TEXT_COLORS[selectedTheme],
          }}
        >
          <DownChevron
            color={
              themeMenuOpen ? "#1f2937" : CHEVRON_THEME_COLORS[selectedTheme]
            }
          />
          Theme
          {selectedTheme ? `: ${selectedTheme}` : ""}
        </button>

        {themeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setThemeMenuOpen(false)}
            />
            <div
              ref={themeMenuRef}
              className="fixed inset-x-4 z-50 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg"
              style={{ top: `${themePanelTop}px` }}
            >
              <div className="mb-4">
                <div
                  className="group flex items-center py-1.5 pl-2 pr-3 rounded-lg text-[11px]"
                  style={{ color: HEADER_THEME_TEXT_COLORS[selectedTheme] }}
                >
                  <DownChevron color={CHEVRON_THEME_COLORS[selectedTheme]} />
                  Theme
                  {selectedTheme ? `: ${selectedTheme}` : ""}
                </div>
              </div>
              <ul className="space-y-2">
                {["Plain", "Retro", "Teen"].map((themeOption) => {
                  const isSelected = selectedTheme === themeOption;

                  return (
                    <li key={themeOption}>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme(themeOption as "Plain" | "Retro" | "Teen");
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full rounded-xl p-3 text-left text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {themeOption}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Settings */}
      <div className="relative">
        <button
          ref={settingsButtonRef}
          type="button"
          onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
          className={`group flex items-center py-1.5 pl-2 pr-3 rounded-lg text-[11px] transition-all duration-150 hover:text-neutral-800 hover:bg-neutral-300 relative z-50 ${
            settingsMenuOpen ? "text-neutral-800 bg-neutral-300" : ""
          }`}
          style={{
            color: settingsMenuOpen
              ? undefined
              : HEADER_THEME_TEXT_COLORS[selectedTheme],
          }}
        >
          <DownChevron
            color={
              settingsMenuOpen ? "#1f2937" : CHEVRON_THEME_COLORS[selectedTheme]
            }
          />
          Settings
        </button>

        {settingsMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setSettingsMenuOpen(false)}
            />
            <div
              ref={settingsMenuRef}
              className="fixed inset-x-4 z-50 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg"
              style={{ top: `${settingsPanelTop}px` }}
            >
              <div className="mb-4">
                <div
                  className="group flex items-center py-1.5 pl-2 pr-3 rounded-lg text-[11px]"
                  style={{ color: HEADER_THEME_TEXT_COLORS[selectedTheme] }}
                >
                  <DownChevron color={CHEVRON_THEME_COLORS[selectedTheme]} />
                  Settings
                </div>
              </div>
              <div className="space-y-6">
                {health?.wifi_signal_dbm !== null &&
                  health?.wifi_signal_dbm !== undefined && (
                    <div className="space-y-2 text-gray-300">
                      <p className="text-sm uppercase tracking-wide text-gray-400">
                        Wi-Fi Signal
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {typeof health.wifi_signal_dbm === "number" ||
                        typeof health.wifi_signal_dbm === "string"
                          ? `${health.wifi_signal_dbm}`
                          : "—"}
                        <span className="ml-1 text-base text-gray-400">
                          dBm
                        </span>
                      </p>
                    </div>
                  )}
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-gray-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Developer
                      </p>
                      <p className="text-sm font-semibold text-white">
                        Dummy Data Mode
                      </p>
                      <p className="text-xs text-gray-400">
                        Preview the UI without live MQTT/Spotify.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDummyMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dummyMode ? "bg-green-500" : "bg-gray-500"
                      }`}
                      aria-pressed={dummyMode}
                      aria-label="Toggle dummy data mode"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          dummyMode ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        dummyMode ? "text-green-400" : "text-gray-200"
                      }`}
                    >
                      {dummyMode ? "Enabled" : "Live"}
                    </span>
                  </p>
                </div>
                <SpeakerPowerControls
                  onRestart={onRestart}
                  onShutdown={onShutdown}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

"use client";

import { SpeakerIcon } from "./assets/SpeakerIcon";
import type { Theme } from "@/context/AppSettingsContext";
import { FOOTER_THEME_TEXT_COLORS } from "@/lib/themeConfig";

interface SpeakerFooterProps {
  connected: boolean;
  status: string;
  health: any;
  theme?: Theme;
}

function SpeakerInfoCard({
  connected,
  status,
  health,
  theme = "Plain",
}: {
  connected: boolean;
  status: string;
  health: any;
  theme?: Theme;
}) {
  const statusParts: string[] = [];
  const healthParts: string[] = [];

  // Add speaker status (top line)
  if (connected) {
    statusParts.push("Speaker online");
    statusParts.push("All systems go");
  } else if (status) {
    const statusText = String(status);
    const sentenceCase =
      statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase();
    statusParts.push(sentenceCase);
  }

  // Add health information (bottom line)
  const liveTime = health?.live || health?.uptime;
  if (liveTime) {
    const formattedTime = String(liveTime)
      .replace(/\s*hour(s)?\s*/gi, "h ")
      .replace(/\s*minute(s)?\s*/gi, "m ")
      .replace(/\s*,\s*/g, " ")
      .trim()
      .replace(/\s+/g, " ");
    healthParts.push(`Uptime ${formattedTime}`);
  }

  if (
    health?.memory_usage_percent !== null &&
    health?.memory_usage_percent !== undefined
  ) {
    healthParts.push(`M: ${health.memory_usage_percent}%`);
  }

  if (
    health?.disk_usage_percent !== null &&
    health?.disk_usage_percent !== undefined
  ) {
    healthParts.push(`D: ${health.disk_usage_percent}%`);
  }

  if (health?.cpu_temp !== null && health?.cpu_temp !== undefined) {
    healthParts.push(`CPU: ${health.cpu_temp}°C`);
  }

  const statusText = statusParts.length > 0 ? statusParts.join(". ") + "." : "";
  const healthText = healthParts.length > 0 ? healthParts.join(", ") : "";

  const textColor = FOOTER_THEME_TEXT_COLORS[theme];

  return (
    <div
      className="flex justify-end items-end sm:gap-0.5 gap-1 text-[9px]"
      style={{ color: textColor }}
    >
      <SpeakerIcon
        color={connected ? "#34AE5F" : "#f87171"}
        className="h-9 w-8 sm:h-6 sm:w-6 mt-[1.5px]"
      />
      <div
        className="flex flex-col text-[9px] pb-0.25"
        style={{ color: textColor }}
      >
        {statusText && <span className="leading-tight">{statusText}</span>}
        {healthText && <span className="leading-tight">{healthText}</span>}
      </div>
    </div>
  );
}

export function SpeakerFooter({
  connected,
  status,
  health,
  theme = "Plain",
}: SpeakerFooterProps) {
  const textColor = FOOTER_THEME_TEXT_COLORS[theme];

  return (
    <footer
      className="flex w-full justify-between p-2 text-[9px]"
      style={{ color: textColor }}
    >
      <div className="max-w-[45%] sm:max-w-none">
        <SpeakerInfoCard
          connected={connected}
          status={status}
          health={health}
          theme={theme}
        />
      </div>

      <div
        className="flex flex-col justify-end items-end pr-0.25 text-right max-w-[40%] sm:max-w-none"
        style={{ color: textColor }}
      >
        <p className="leading-tight text-right">
          Custom audio experience services.{" "}
        </p>
        <p className="leading-tight text-right">
          Designed, Manufactured and produced in house.
        </p>
      </div>
    </footer>
  );
}

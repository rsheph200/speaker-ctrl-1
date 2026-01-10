"use client";

import { useState, useEffect, useRef } from "react";
import { SpeakerIcon } from "./assets/SpeakerIcon";
import type { Theme } from "@/context/AppSettingsContext";
import { FOOTER_THEME_TEXT_COLORS } from "@/lib/themeConfig";
import { useSpeakers } from "@/lib/useSpeakers";

interface SpeakerFooterProps {
  connected: boolean;
  status: string;
  health: any;
  theme?: Theme;
}

function Speaker1Icon({
  connected,
  theme = "Plain",
}: {
  connected: boolean;
  theme?: Theme;
}) {
  return (
    <SpeakerIcon
      color={connected ? "#34AE5F" : "#f87171"}
      className="h-9 w-8 sm:h-6 sm:w-6 mt-[1.5px]"
    />
  );
}

function Speaker1Text({
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
      className="flex flex-col text-[9px] pb-0.25 sm:gap-0.5 gap-1"
      style={{ color: textColor }}
    >
      {statusText && <span className="leading-tight">{statusText}</span>}
      {healthText && <span className="leading-tight">{healthText}</span>}
    </div>
  );
}

function Speaker2InfoCard({
  speaker2,
  theme = "Plain",
}: {
  speaker2: any;
  theme?: Theme;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const statusParts: string[] = [];
  const healthParts: string[] = [];

  // Add speaker status (top line)
  if (speaker2.status === "online") {
    statusParts.push("Speaker 2 online");
    if (speaker2.snapclient?.connected) {
      statusParts.push("All systems go");
    } else {
      statusParts.push("Snapclient disconnected");
    }
  } else {
    statusParts.push("Speaker 2 offline");
  }

  // Add health information (bottom line)
  if (speaker2.system?.uptime_hours) {
    const hours = Math.floor(speaker2.system.uptime_hours);
    const minutes = Math.floor((speaker2.system.uptime_hours - hours) * 60);
    const formattedTime = `${hours}h ${minutes}m`;
    healthParts.push(`Uptime ${formattedTime}`);
  }

  if (
    speaker2.system?.memory_percent !== null &&
    speaker2.system?.memory_percent !== undefined
  ) {
    healthParts.push(`M: ${speaker2.system.memory_percent.toFixed(1)}%`);
  }

  if (
    speaker2.system?.cpu_percent !== null &&
    speaker2.system?.cpu_percent !== undefined
  ) {
    healthParts.push(`CPU: ${speaker2.system.cpu_percent.toFixed(1)}%`);
  }

  if (
    speaker2.system?.cpu_temp !== null &&
    speaker2.system?.cpu_temp !== undefined
  ) {
    healthParts.push(`Temp: ${speaker2.system.cpu_temp.toFixed(1)}°C`);
  }

  const statusText = statusParts.length > 0 ? statusParts.join(". ") + "." : "";
  const healthText = healthParts.length > 0 ? healthParts.join(", ") : "";

  const textColor = FOOTER_THEME_TEXT_COLORS[theme];
  const connected = speaker2.status === "online";

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showTooltip]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-end text-[9px] -ml-[6px]"
      style={{ color: textColor }}
    >
      <button
        ref={iconRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        className="cursor-pointer focus:outline-none"
        aria-label="Toggle Speaker 2 information"
      >
        <SpeakerIcon
          color={connected ? "#34AE5F" : "#f87171"}
          className="h-9 w-8 sm:h-6 sm:w-6 mt-[1.5px]"
        />
      </button>
      {showTooltip && (
        <div
          className="absolute bottom-full right-0 mb-2 flex flex-col text-[9px] pb-0.25 whitespace-nowrap z-50"
          style={{ color: textColor }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm rounded px-2 py-1 border border-white/10">
            {statusText && (
              <span className="leading-tight block">{statusText}</span>
            )}
            {healthText && (
              <span className="leading-tight block">{healthText}</span>
            )}
          </div>
        </div>
      )}
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
  const { getSpeaker } = useSpeakers();
  const speaker2 = getSpeaker("ru-speaker-2");
  const speaker2Active = speaker2?.status === "online";

  return (
    <footer
      className="flex w-full justify-between p-2 text-[9px]"
      style={{ color: textColor }}
    >
      <div className="flex items-end gap-1 max-w-[45%] sm:max-w-none">
        <Speaker1Icon connected={connected} theme={theme} />
        {speaker2Active && speaker2 && (
          <Speaker2InfoCard speaker2={speaker2} theme={theme} />
        )}
        <Speaker1Text
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

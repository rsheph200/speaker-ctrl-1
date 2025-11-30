"use client";

import { SpeakerIcon } from "./assets/SpeakerIcon";

interface SpeakerFooterProps {
  connected: boolean;
  status: string;
  health: any;
}

function SpeakerInfoCard({
  connected,
  status,
  health,
}: {
  connected: boolean;
  status: string;
  health: any;
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

  return (
    <div className="flex justify-end items-end gap-0.5 text-[9px]  text-[#909090]">
      <SpeakerIcon color={connected ? "#34AE5F" : "#f87171"} className="h-6 w-6 mt-[1.5px]" />
      <div className="flex flex-col text-[9px]  text-[#909090] pb-0.25">
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
}: SpeakerFooterProps) {
  return (
    <footer className="flex w-full justify-between p-2 text-[9px]  text-[#909090]">
      <SpeakerInfoCard connected={connected} status={status} health={health} />

      <div className="flex flex-col justify-end items-end pr-0.25">
        <p className="leading-tight">Custom audio experience services. </p>
        <p className="leading-tight">Designed, Manufactured and produced in house.</p>
      </div>
    </footer>
  );
}

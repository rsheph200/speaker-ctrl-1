"use client";

import { SpeakerVolume } from "./volume";

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

interface SpotifyVolumeControlProps {
  volume: number;
  onChange?: (value: number) => void;
  authenticated: boolean;
  className?: string;
  label?: string;
  disconnectedMessage?: string;
}

const defaultLabel = "Player volume";
const defaultDisconnectedMessage =
  "Connect Spotify to manage playback volume from the web player.";

export function SpotifyVolumeControl({
  volume,
  onChange,
  authenticated,
  className,
  label = defaultLabel,
  disconnectedMessage = defaultDisconnectedMessage,
}: SpotifyVolumeControlProps) {
  return (
    <section className={cls("space-y-4 text-gray-300", className)}>
      <p className="text-sm uppercase tracking-wide text-gray-400">
        Spotify Volume
      </p>
      <SpeakerVolume
        volume={volume}
        onChange={onChange}
        disabled={!authenticated}
        label={authenticated ? label : `${label} (connect to adjust)`}
      />
      {!authenticated && (
        <p className="text-sm text-gray-400">{disconnectedMessage}</p>
      )}
    </section>
  );
}

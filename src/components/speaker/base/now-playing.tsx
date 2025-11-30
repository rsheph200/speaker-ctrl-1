"use client";

import type { ReactNode } from "react";
import { SpeakerNowPlayingArtwork } from "./player-controls/SpeakerNowPlayingArtwork";
import { SpeakerNowPlayingControlButton } from "./player-controls/SpeakerNowPlayingControlButton";
import { SpeakerNowPlayingControls } from "./player-controls/SpeakerNowPlayingControls";
import { SpeakerNowPlayingDetails } from "./player-controls/SpeakerNowPlayingDetails";
import { SpeakerNowPlayingProgress } from "./player-controls/SpeakerNowPlayingProgress";
import type { NowPlayingInfo, SpotifyControlActions } from "./types";

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

interface SpeakerNowPlayingProps {
  info: NowPlayingInfo;
  actions?: SpotifyControlActions;
  className?: string;
  showControls?: boolean;
  hideWhenIdle?: boolean;
  playLabel?: ReactNode;
  pauseLabel?: ReactNode;
  nextLabel?: ReactNode;
  previousLabel?: ReactNode;
}

export function SpeakerNowPlaying({
  info,
  actions,
  className,
  showControls = true,
  hideWhenIdle = true,
  playLabel = "Play",
  pauseLabel = "Pause",
  nextLabel = "Next",
  previousLabel = "Previous",
}: SpeakerNowPlayingProps) {
  if (hideWhenIdle && (!info.track || info.state === "idle")) {
    return null;
  }

  const duration = typeof info.durationMs === "number" ? info.durationMs : 0;
  const position = typeof info.positionMs === "number" ? info.positionMs : 0;
  const isPlaying = info.state === "playing";

  return (
    <section
      className={cls("space-y-6 text-gray-300", className)}
      data-component="speaker-now-playing"
      data-state={info.state ?? "unknown"}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <SpeakerNowPlayingArtwork
          src={info.artwork ?? undefined}
          className="h-24 w-24 rounded-lg object-cover shadow-lg md:h-32 md:w-32"
        />
        <SpeakerNowPlayingDetails
          track={info.track}
          artist={info.artist}
          album={info.album}
        />
      </div>
      <SpeakerNowPlayingProgress durationMs={duration} positionMs={position} />
      {showControls ? (
        <SpeakerNowPlayingControls>
          <SpeakerNowPlayingControlButton
            onClick={actions?.previous}
            disabled={!actions?.previous}
            variant="previous"
          >
            {previousLabel}
          </SpeakerNowPlayingControlButton>
          <SpeakerNowPlayingControlButton
            onClick={actions?.playPause}
            disabled={!actions?.playPause}
            variant="play-pause"
            isActive={isPlaying}
          >
            {isPlaying ? pauseLabel : playLabel}
          </SpeakerNowPlayingControlButton>
          <SpeakerNowPlayingControlButton
            onClick={actions?.next}
            disabled={!actions?.next}
            variant="next"
          >
            {nextLabel}
          </SpeakerNowPlayingControlButton>
        </SpeakerNowPlayingControls>
      ) : null}
    </section>
  );
}

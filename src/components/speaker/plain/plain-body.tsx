"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { useArtworkColor } from "@/lib/useArtworkColor";
import { SpeakerVisualizer } from "@/components/speaker/base";
import { SpeakerNowPlayingArtwork } from "@/components/speaker/base/player-controls/SpeakerNowPlayingArtwork";
import { PlainProgress } from "./plain-progress";
import { PlainPlayerControls } from "./plain-player-controls";
import type { SourceMode } from "@/lib/sourceModes";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
      {children}
    </div>
  );
}

interface SpeakerBodyProps {
  mounted: boolean;
  showNowPlaying: boolean;
  artwork: string | null;
  track: string | null;
  artist: string | null;
  album: string | null;
  duration: number | null;
  position: number | null;
  resolvedState: string;
  visualizerResetTrigger: number | null;
  authenticated: boolean;
  volume: number;
  spotifyVolumeLevel: number;
  mode: SourceMode;
  onLogin: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onSpotifyVolumeChange: (volume: number) => void;
}

export function SpeakerBody({
  mounted,
  showNowPlaying,
  artwork,
  track,
  artist,
  album,
  duration,
  position,
  resolvedState,
  visualizerResetTrigger,
  authenticated,
  volume,
  spotifyVolumeLevel,
  onLogin,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onSpotifyVolumeChange,
  mode,
}: SpeakerBodyProps) {
  const artworkColor = useArtworkColor(artwork);

  return (
    <div
      className={`flex flex-col w-screen h-full md:h-auto items-center justify-between px-2 gap-2 my-12 ${mode.className || ""}`}
      data-mode={mode.id}
    >
      <div className="rounded-3xl w-full max-w-[660px] h-full md:h-[460px] bg-[#202020]">
        <div className="flex flex-col items-center justify-between h-full">
          <div className="flex w-full items-start justify-between pr-4 pt-4 h-20">
            <div className="-mt-1">
              <SpeakerVisualizer
                artwork={artwork ?? null}
                height={100}
                className="w-[80px]"
                resetTrigger={visualizerResetTrigger}
              />
            </div>
            <div className="">
              {mounted && showNowPlaying && (
                <SpeakerNowPlayingArtwork
                  src={artwork ?? undefined}
                  source={mode.id}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
            </div>
          </div>
          <div>
            {mounted && showNowPlaying && (
              <div className="flex-1 items-center justify-center pb-2">
                {track && (
                  <p className="text-2xl text-[#919090] text-center">{track}</p>
                )}
                {artist && (
                  <p className="text-2xl text-[#919090] opacity-60 text-center">
                    {artist}
                  </p>
                )}
                {album && (
                  <p className="text-2xl text-[#919090] opacity-40 text-center">
                    {album}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex w-full items-end h-20 justify-between px-5 pb-4">
            {mounted && showNowPlaying && (
              <PlainProgress
                durationMs={duration}
                positionMs={position}
                className="flex items-center gap-2 w-full"
                currentTimeClassName="font-medium text-[#919090] text-md"
                totalTimeClassName="font-medium text-[#919090] opacity-60 text-md"
                barContainerClassName="flex-1 h-1 relative rounded-full"
                circleClassName="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-100"
                circleColor={artworkColor}
              />
            )}
          </div>
        </div>
      </div>

      {mounted && showNowPlaying && mode.showControls && (
        <PlainPlayerControls
          resolvedState={resolvedState}
          authenticated={authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
          onPrevious={onPrevious}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onVolumeChange={onVolumeChange}
          onSpotifyVolumeChange={onSpotifyVolumeChange}
          className="flex gap-6 w-full max-w-[660px] justify-between px-7"
          previousButtonClassName="flex items-center justify-center transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          playPauseButtonClassName="flex items-center justify-center transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          nextButtonClassName="flex items-center justify-center transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          volumeButtonClassName="flex items-center justify-center transition-colors hover:opacity-80"
          volumeMenuClassName="space-y-6"
          volumeMenuContainerClassName="absolute left-0 right-0 bottom-full z-50 mb-2 w-full rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg"
        />
      )}

      {mounted && !authenticated && (
        <Card>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-green-600"
            >
              <Music size={20} />
              <span>Connect Spotify</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

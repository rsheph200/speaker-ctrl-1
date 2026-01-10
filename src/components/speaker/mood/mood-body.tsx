"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { useArtworkColor } from "@/lib/useArtworkColor";
import { SpeakerVisualizer } from "@/components/speaker/base";
import { SpeakerNowPlayingArtwork } from "@/components/speaker/base/player-controls/SpeakerNowPlayingArtwork";
import { MoodProgress } from "./mood-progress";
import { MoodPlayerControls } from "./mood-player-controls";

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
}: SpeakerBodyProps) {
  const artworkColor = useArtworkColor(artwork);

  return (
    <div
      className="flex flex-col h-auto items-center justify-between p-2 gap-2 my-12 mx-2 bg-[#04090D] rounded-xl"
      style={{ width: "calc(100% - 1rem)", maxWidth: "660px" }}
    >
      <div className="w-full">
        <div className="flex flex-col items-center justify-between h-full gap-8">
          <div className="flex w-full items-start justify-between pr-4 pt-4 gap-2">
            <div className="-mt-1 flex-shrink-0">
              <SpeakerVisualizer
                artwork={artwork ?? null}
                height={100}
                className="w-[70px] sm:w-[80px]"
                resetTrigger={visualizerResetTrigger}
              />
            </div>

            <div className="flex-1 min-w-0 flex items-center justify-center">
              {mounted && showNowPlaying && (
                <div className="w-full flex flex-col items-center justify-center pb-2 overflow-hidden">
                  {track && (
                    <p className="text-lg sm:text-2xl text-[#767885] text-center truncate w-full">
                      {track}
                    </p>
                  )}
                  {artist && (
                    <p className="text-lg sm:text-2xl text-[#767885] opacity-60 text-center truncate w-full">
                      {artist}
                    </p>
                  )}
                  {album && (
                    <p className="text-lg sm:text-2xl text-[#767885] opacity-40 text-center truncate w-full">
                      {album}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              {mounted && showNowPlaying && (
                <SpeakerNowPlayingArtwork
                  src={artwork ?? undefined}
                  className="sm:h-12 h-10 w-10 sm:w-12 rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          <div className="flex w-full items-end justify-between px-4 pb-3">
            {mounted && showNowPlaying && (
              <MoodProgress
                durationMs={duration}
                positionMs={position}
                className="flex items-center gap-4 w-full"
                currentTimeClassName="font-medium text-[#767885] text-md"
                totalTimeClassName="font-medium text-[#767885] opacity-60 text-md"
                barContainerClassName="flex-1 h-1 relative rounded-full"
                circleClassName="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-100"
                circleColor={artworkColor}
              />
            )}
          </div>
        </div>
      </div>

      {mounted && showNowPlaying && (
        <MoodPlayerControls
          resolvedState={resolvedState}
          authenticated={authenticated}
          volume={volume}
          spotifyVolumeLevel={spotifyVolumeLevel}
          onPrevious={onPrevious}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onVolumeChange={onVolumeChange}
          onSpotifyVolumeChange={onSpotifyVolumeChange}
          className="flex gap-6 w-full max-w-[660px] justify-between"
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

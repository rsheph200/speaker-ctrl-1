"use client";

import { Music } from "lucide-react";
import { useArtworkColor } from "@/lib/useArtworkColor";
import { CircleSpeakerVisualizer } from "@/components/speaker/base";
import { CircularProgress } from "./circular-progress";
import { CircularPlayerControls } from "./circular-player-controls";
import { CircularTrackDisplay } from "./circular-track-display";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
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
    <div className="flex flex-col w-screen h-full md:h-auto items-center justify-between px-2 gap-2 my-12">
      <div className="rounded-full w-[672px] h-[672px] relative overflow-visible">
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <CircleSpeakerVisualizer
            size={672}
            className="rounded-full"
            resetTrigger={visualizerResetTrigger}
          />
        </div>
        <div className="flex flex-col items-center justify-between h-full relative z-10">
          <div className="flex-1 flex items-center justify-center">
            <CircularTrackDisplay
              mounted={mounted}
              showNowPlaying={showNowPlaying}
              artwork={artwork}
              track={track}
              artist={artist}
              album={album}
            />
          </div>

          {/* <div className="flex w-full items-end h-20 justify-between px-5 pb-4">
            {mounted && showNowPlaying && (
              <CircularProgress
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
          </div> */}
        </div>
      </div>

      {mounted && showNowPlaying && (
        <CircularPlayerControls
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
          volumeMenuContainerClassName="absolute left-0 right-0 bottom-full z-50 mb-2 w-full rounded-full border border-white/20 bg-white/10 p-6 backdrop-blur-lg"
        />
      )}

      {mounted && !authenticated && (
        <Card>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-green-600"
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

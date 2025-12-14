"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakerVolume, SpotifyVolumeControl } from "@/components/speaker/base";
import { VolumeIcon } from "@/components/page-controls/assets/VolumeIcon";
import { MoreIcon } from "@/components/page-controls/assets/MoreIcon";
import { PlayIcon } from "@/components/page-controls/assets/PlayIcon";
import { PauseIcon } from "@/components/page-controls/assets/PauseIcon";
import { NextIcon } from "@/components/page-controls/assets/NextIcon";
import { PreviousIcon } from "@/components/page-controls/assets/PreviousIcon";

interface CircularPlayerControlsProps {
  resolvedState: string;
  authenticated: boolean;
  volume: number;
  spotifyVolumeLevel: number;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onVolumeChange: (volume: number) => void;
  onSpotifyVolumeChange: (volume: number) => void;
  className?: string;
  previousButtonClassName?: string;
  playPauseButtonClassName?: string;
  nextButtonClassName?: string;
  volumeButtonClassName?: string;
  volumeMenuClassName?: string;
  volumeMenuContainerClassName?: string;
}

export function CircularPlayerControls({
  resolvedState,
  authenticated,
  volume,
  spotifyVolumeLevel,
  onPrevious,
  onPlayPause,
  onNext,
  onVolumeChange,
  onSpotifyVolumeChange,
  className,
  previousButtonClassName,
  playPauseButtonClassName,
  nextButtonClassName,
  volumeButtonClassName,
  volumeMenuClassName,
  volumeMenuContainerClassName,
}: CircularPlayerControlsProps) {
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);
  const [popoverBottom, setPopoverBottom] = useState<number | null>(null);
  const volumeMenuRef = useRef<HTMLDivElement>(null);
  const volumeButtonRef = useRef<HTMLButtonElement>(null);

  const [replayShuffleMenuOpen, setReplayShuffleMenuOpen] = useState(false);
  const [replayShufflePopoverBottom, setReplayShufflePopoverBottom] = useState<
    number | null
  >(null);
  const replayShuffleMenuRef = useRef<HTMLDivElement>(null);
  const replayShuffleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!volumeMenuOpen || !volumeButtonRef.current) return;

    const updatePopoverPosition = () => {
      if (volumeButtonRef.current) {
        const rect = volumeButtonRef.current.getBoundingClientRect();
        setPopoverBottom(window.innerHeight - rect.top + 8);
      }
    };

    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition);
    window.addEventListener("resize", updatePopoverPosition);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeMenuRef.current &&
        !volumeMenuRef.current.contains(event.target as Node) &&
        volumeButtonRef.current &&
        !volumeButtonRef.current.contains(event.target as Node)
      ) {
        setVolumeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePopoverPosition);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [volumeMenuOpen]);

  useEffect(() => {
    if (!replayShuffleMenuOpen || !replayShuffleButtonRef.current) return;

    const updatePopoverPosition = () => {
      if (replayShuffleButtonRef.current) {
        const rect = replayShuffleButtonRef.current.getBoundingClientRect();
        setReplayShufflePopoverBottom(window.innerHeight - rect.top + 8);
      }
    };

    updatePopoverPosition();
    window.addEventListener("scroll", updatePopoverPosition);
    window.addEventListener("resize", updatePopoverPosition);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        replayShuffleMenuRef.current &&
        !replayShuffleMenuRef.current.contains(event.target as Node) &&
        replayShuffleButtonRef.current &&
        !replayShuffleButtonRef.current.contains(event.target as Node)
      ) {
        setReplayShuffleMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePopoverPosition);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [replayShuffleMenuOpen]);

  return (
    <div className={className}>
      <div className="relative flex justify-center z-50">
        <button
          ref={replayShuffleButtonRef}
          type="button"
          onClick={() => setReplayShuffleMenuOpen(!replayShuffleMenuOpen)}
          className={`group w-12 h-12 rounded-full hover:bg-neutral-300 transition-all duration-150 ease-in-out text-neutral-500 group-hover:text-neutral-700 ${
            replayShuffleMenuOpen ? "bg-neutral-300 text-neutral-700" : ""
          } relative z-50 ${volumeButtonClassName || ""}`}
        >
          <MoreIcon
            color="currentColor"
            className={`text-neutral-500 group-hover:text-neutral-800 transition-colors duration-150 ease-in-out ${
              replayShuffleMenuOpen ? "text-neutral-800" : ""
            }`}
          />
        </button>

        {replayShuffleMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setReplayShuffleMenuOpen(false)}
            />
            <div
              ref={replayShuffleMenuRef}
              style={{
                bottom:
                  replayShufflePopoverBottom !== null
                    ? `${replayShufflePopoverBottom}px`
                    : undefined,
              }}
              className={`fixed left-1/2 -translate-x-1/2 right-0 w-full max-w-[660px] z-50 rounded-2xl border border-white/20 bg-white/20 p-6 backdrop-blur-lg ${volumeMenuContainerClassName || ""}`}
            >
              <div className="space-y-4 text-gray-300">
                <p className="text-sm">Replay</p>
                <p className="text-sm">Shuffle</p>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onPrevious}
        disabled={!onPrevious}
        className={`group w-12 h-12 rounded-full hover:bg-neutral-300 transition-all duration-150 ease-in-out text-neutral-500 group-hover:text-neutral-700 ${previousButtonClassName || ""}`}
      >
        <PreviousIcon
          color="currentColor"
          className="text-neutral-500 group-hover:text-neutral-800 transition-colors duration-150 ease-in-out"
        />
      </button>

      <button
        type="button"
        onClick={onPlayPause}
        disabled={!onPlayPause}
        className={`group w-12 h-12 rounded-full hover:bg-neutral-300 transition-all duration-150 ease-in-out text-neutral-500 group-hover:text-neutral-700 ${playPauseButtonClassName || ""}`}
      >
        {resolvedState === "playing" ? (
          <PauseIcon
            color="currentColor"
            className="text-neutral-500 group-hover:text-neutral-800 transition-colors duration-150 ease-in-out"
          />
        ) : (
          <PlayIcon
            color="currentColor"
            className="text-neutral-500 group-hover:text-neutral-800 transition-colors duration-150 ease-in-out"
          />
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!onNext}
        className={`group w-12 h-12 rounded-full hover:bg-neutral-300 transition-all duration-150 ease-in-out text-neutral-500 group-hover:text-neutral-700 ${nextButtonClassName || ""}`}
      >
        <NextIcon
          color="currentColor"
          className="text-neutral-500 group-hover:text-neutral-800 transition-colors duration-150 ease-in-out"
        />
      </button>

      <div className="relative flex justify-center z-50">
        <button
          ref={volumeButtonRef}
          type="button"
          onClick={() => setVolumeMenuOpen(!volumeMenuOpen)}
          className={`group w-12 h-12 rounded-full hover:bg-neutral-300 transition-all duration-150 ease-in-out text-neutral-500 group-hover:text-neutral-700 ${
            volumeMenuOpen ? "bg-neutral-300 text-neutral-700" : ""
          } relative z-50 ${volumeButtonClassName || ""}`}
        >
          <VolumeIcon
            color="currentColor"
            className={`text-neutral-500 group-hover:text-neutral-800 transition-colors duration-150 ease-in-out ${
              volumeMenuOpen ? "text-neutral-800" : ""
            }`}
          />
        </button>

        {volumeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setVolumeMenuOpen(false)}
            />
            <div
              ref={volumeMenuRef}
              style={{
                bottom:
                  popoverBottom !== null ? `${popoverBottom}px` : undefined,
              }}
              className={`fixed left-1/2 -translate-x-1/2 right-0 w-full max-w-[660px] z-50 rounded-2xl border border-white/20 bg-white/20 p-6 backdrop-blur-lg ${volumeMenuContainerClassName || ""}`}
            >
              <div className={volumeMenuClassName}>
                <div className="space-y-4 text-gray-300">
                  <p className="text-sm uppercase tracking-wide text-gray-400">
                    Speaker Volume
                  </p>
                  <SpeakerVolume volume={volume} onChange={onVolumeChange} />
                </div>
                <SpotifyVolumeControl
                  volume={spotifyVolumeLevel}
                  onChange={onSpotifyVolumeChange}
                  authenticated={authenticated}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

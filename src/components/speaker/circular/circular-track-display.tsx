"use client";

import { useState, useEffect, useRef } from "react";
import { SpeakerNowPlayingArtwork } from "@/components/speaker/base/player-controls/SpeakerNowPlayingArtwork";

interface TrackInfo {
  track: string | null;
  album: string | null;
  artist: string | null;
  artwork: string | null;
}

interface CircularTrackDisplayProps {
  mounted: boolean;
  showNowPlaying: boolean;
  artwork: string | null;
  track: string | null;
  artist: string | null;
  album: string | null;
}

function TrackRow({
  track,
  album,
  artist,
  artwork,
  opacity = 1,
  animate = false,
}: TrackInfo & { opacity?: number; animate?: boolean }) {
  const [showArtwork, setShowArtwork] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Always start with placeholder
    setShowArtwork(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show artwork after 1500ms delay if artwork is available
    timeoutRef.current = setTimeout(() => {
      if (artwork) {
        setShowArtwork(true);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [artwork]);

  return (
    <div
      className={`flex items-center gap-2 px-4 ${animate ? "track-enter" : ""}`}
      style={{ opacity }}
    >
      <div className="flex items-center justify-between gap-4 w-[340px]">
        {track && (
          <p className="text-[10px] text-[#C7C7C7] truncate text-left">
            {track}
          </p>
        )}
        {album && (
          <p className="text-[10px] text-[#C7C7C7] truncate text-center">
            {album}
          </p>
        )}
        {artist && (
          <p className="text-[10px] text-[#C7C7C7] truncate text-right">
            {artist}
          </p>
        )}
      </div>
      <div className="h-4 w-4 rounded-full flex-shrink-0 relative mb-0.25">
        {showArtwork && artwork ? (
          <SpeakerNowPlayingArtwork
            src={artwork}
            className="h-4 w-4 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-4 w-4 rounded-full bg-[#777777] flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

export function CircularTrackDisplay({
  mounted,
  showNowPlaying,
  artwork,
  track,
  artist,
  album,
}: CircularTrackDisplayProps) {
  const [trackList, setTrackList] = useState<TrackInfo[]>([]);
  const lastTrackRef = useRef<string | null>(null);
  const latestValuesRef = useRef<{
    track: string | null;
    album: string | null;
    artist: string | null;
    artwork: string | null;
  }>({ track: null, album: null, artist: null, artwork: null });

  useEffect(() => {
    // Always keep the latest values in a ref
    latestValuesRef.current = { track, album, artist, artwork };

    if (mounted && showNowPlaying && track) {
      // Only add if this is a different track than the last one
      if (track !== lastTrackRef.current) {
        // Add the track immediately so text appears right away
        // Artwork will show after delay in TrackRow component
        setTrackList((prev) => [
          ...prev,
          {
            track: latestValuesRef.current.track,
            album: latestValuesRef.current.album,
            artist: latestValuesRef.current.artist,
            artwork: latestValuesRef.current.artwork,
          },
        ]);
        lastTrackRef.current = track;
      } else if (track === lastTrackRef.current) {
        // Update artwork, album, and artist for the current track when they change
        setTrackList((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex].track === track) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              album: album,
              artist: artist,
              artwork: artwork,
            };
          }
          return updated;
        });
      }
    }
  }, [mounted, showNowPlaying, track, album, artist, artwork]);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {trackList.map((item, index) => {
        const isCurrent = index === trackList.length - 1;
        return (
          <TrackRow
            key={index}
            track={item.track}
            album={item.album}
            artist={item.artist}
            artwork={item.artwork}
            opacity={isCurrent ? 1 : 0.4}
            animate={isCurrent}
          />
        );
      })}
    </div>
  );
}

"use client";

interface SpeakerNowPlayingArtworkProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function SpeakerNowPlayingArtwork({
  src,
  alt = "Album artwork",
  className,
}: SpeakerNowPlayingArtworkProps) {
  if (!src) {
    return null;
  }

  return <img src={src} alt={alt} className={className} />;
}

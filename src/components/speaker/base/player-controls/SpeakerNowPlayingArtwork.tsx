"use client";

interface SpeakerNowPlayingArtworkProps {
  src?: string | null;
  alt?: string;
  className?: string;
  source?: string | null; // "bluetooth" | "spotify" | "none" | etc.
}

export function SpeakerNowPlayingArtwork({
  src,
  alt = "Album artwork",
  className,
  source,
}: SpeakerNowPlayingArtworkProps) {
  // If we have artwork, show it
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }

  // If no artwork and source is bluetooth, show placeholder
  if (source === "bluetooth") {
    return (
      <div
        className={`${className || ""} flex items-center justify-center bg-gray-800 rounded-lg`}
        aria-label="Bluetooth audio - no artwork available"
      >
        <svg
          className="w-1/2 h-1/2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Music note icon */}
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    );
  }

  // For other sources or no source, return null (no placeholder)
  return null;
}

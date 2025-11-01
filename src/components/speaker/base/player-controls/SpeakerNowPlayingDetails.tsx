'use client';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerNowPlayingDetailsProps {
  track?: string | null;
  artist?: string | null;
  album?: string | null;
  className?: string;
  trackClassName?: string;
  artistClassName?: string;
  albumClassName?: string;
}

export function SpeakerNowPlayingDetails({
  track,
  artist,
  album,
  className,
  trackClassName,
  artistClassName,
  albumClassName,
}: SpeakerNowPlayingDetailsProps) {
  if (!track && !artist && !album) {
    return null;
  }

  return (
    <div className={cls('flex-1 space-y-2', className)}>
      {track ? (
        <p className={cls('text-2xl font-bold text-white', trackClassName)}>
          {track}
        </p>
      ) : null}
      {artist ? (
        <p className={cls('text-lg text-gray-300', artistClassName)}>
          {artist}
        </p>
      ) : null}
      {album ? (
        <p className={cls('text-sm text-gray-400', albumClassName)}>
          {album}
        </p>
      ) : null}
    </div>
  );
}

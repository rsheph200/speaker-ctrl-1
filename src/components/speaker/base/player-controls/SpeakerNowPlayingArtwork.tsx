'use client';

import type { ReactNode } from 'react';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerNowPlayingArtworkProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}

export function SpeakerNowPlayingArtwork({
  src,
  alt = 'Album artwork',
  className,
  imageClassName,
  children,
}: SpeakerNowPlayingArtworkProps) {
  if (!src && !children) {
    return null;
  }

  return (
    <figure className={cls('flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cls(
            'h-24 w-24 rounded-lg object-cover shadow-lg md:h-32 md:w-32',
            imageClassName,
          )}
        />
      ) : (
        children
      )}
    </figure>
  );
}

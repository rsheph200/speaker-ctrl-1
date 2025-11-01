'use client';

import type { ReactNode } from 'react';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerNowPlayingControlsProps {
  children?: ReactNode;
  className?: string;
}

export function SpeakerNowPlayingControls({
  children,
  className,
}: SpeakerNowPlayingControlsProps) {
  if (!children) {
    return null;
  }

  return (
    <div className={cls('flex justify-center gap-6', className)}>
      {children}
    </div>
  );
}

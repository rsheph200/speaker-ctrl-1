'use client';

import type { ReactNode } from 'react';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerPowerControlsProps {
  onRestart?: () => void;
  onShutdown?: () => void;
  className?: string;
  restartLabel?: ReactNode;
  shutdownLabel?: ReactNode;
}

const defaultRestartLabel = 'Restart';
const defaultShutdownLabel = 'Shutdown';

export function SpeakerPowerControls({
  onRestart,
  onShutdown,
  className,
  restartLabel = defaultRestartLabel,
  shutdownLabel = defaultShutdownLabel,
}: SpeakerPowerControlsProps) {
  return (
    <section className={cls('space-y-4 text-gray-300', className)} data-component="speaker-power-controls">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRestart}
          disabled={!onRestart}
          className="flex-1 rounded-xl bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {restartLabel}
        </button>
        <button
          type="button"
          onClick={onShutdown}
          disabled={!onShutdown}
          className="flex-1 rounded-xl bg-red-500 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {shutdownLabel}
        </button>
      </div>
    </section>
  );
}

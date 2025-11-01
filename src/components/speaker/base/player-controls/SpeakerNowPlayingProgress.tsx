'use client';

export type TimeFormatter = (value: number) => string;

const defaultFormatTime: TimeFormatter = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerNowPlayingProgressProps {
  durationMs?: number | null;
  positionMs?: number | null;
  className?: string;
  timeClassName?: string;
  currentTimeClassName?: string;
  totalTimeClassName?: string;
  barClassName?: string;
  fillClassName?: string;
  ariaLabel?: string;
  formatTime?: TimeFormatter;
}

export function SpeakerNowPlayingProgress({
  durationMs,
  positionMs,
  className,
  timeClassName,
  currentTimeClassName,
  totalTimeClassName,
  barClassName,
  fillClassName,
  ariaLabel = 'Track progress',
  formatTime = defaultFormatTime,
}: SpeakerNowPlayingProgressProps) {
  const duration = typeof durationMs === 'number' ? Math.max(durationMs, 0) : 0;

  if (duration === 0) {
    return null;
  }

  const position = typeof positionMs === 'number' ? Math.min(Math.max(positionMs, 0), duration) : 0;
  const progressPercent = duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

  return (
    <div className={cls('space-y-2', className)}>
      <div className={cls('flex justify-between text-xs text-gray-400', timeClassName)}>
        <span
          className={cls('font-medium text-white', currentTimeClassName)}
        >
          {formatTime(position)}
        </span>
        <span
          className={cls('font-medium text-gray-400', totalTimeClassName)}
        >
          {formatTime(duration)}
        </span>
      </div>
      <div
        className={cls('h-1 w-full overflow-hidden rounded-full bg-gray-700', barClassName)}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
      >
        <div
          className={cls('h-full bg-purple-500 transition-all duration-100', fillClassName)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

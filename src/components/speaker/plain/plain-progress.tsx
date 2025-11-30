"use client";

export type TimeFormatter = (value: number) => string;

const defaultFormatTime: TimeFormatter = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

interface PlainProgressProps {
  durationMs?: number | null;
  positionMs?: number | null;
  formatTime?: TimeFormatter;
  className?: string;
  currentTimeClassName?: string;
  totalTimeClassName?: string;
  barContainerClassName?: string;
  circleClassName?: string;
  circleColor?: string | null;
  ariaLabel?: string;
}

export function PlainProgress({
  durationMs,
  positionMs,
  formatTime = defaultFormatTime,
  className,
  currentTimeClassName,
  totalTimeClassName,
  barContainerClassName,
  circleClassName,
  circleColor,
  ariaLabel = "Track progress",
}: PlainProgressProps) {
  const duration = typeof durationMs === "number" ? Math.max(durationMs, 0) : 0;

  if (duration === 0) {
    return null;
  }

  const position =
    typeof positionMs === "number"
      ? Math.min(Math.max(positionMs, 0), duration)
      : 0;
  const progressPercent =
    duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

  const circleStyle: React.CSSProperties = {
    left: `${progressPercent}%`,
    backgroundColor: circleColor || "#ffffff",
  };

  return (
    <div className={className}>
      <span className={currentTimeClassName}>{formatTime(position)}</span>
      <div
        className={barContainerClassName}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
      >
        <div className={circleClassName} style={circleStyle} />
      </div>
      <span className={totalTimeClassName}>{formatTime(duration)}</span>
    </div>
  );
}

"use client";

import type { ChangeEvent } from "react";

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

interface SpeakerVolumeProps {
  volume: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const defaultLabel = "Harware Volume";

export function SpeakerVolume({
  volume,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  label = defaultLabel,
  disabled = false,
}: SpeakerVolumeProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const nextValue = Number(event.target.value);
    if (Number.isNaN(nextValue)) {
      return;
    }

    onChange?.(nextValue);
  };

  const sliderClasses = cls(
    "mt-2 h-2 w-full appearance-none rounded-lg bg-gray-700",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    "[::-moz-range-thumb]:h-6",
    "[::-moz-range-thumb]:w-6",
    "[::-moz-range-thumb]:rounded-full",
    "[::-moz-range-thumb]:border-none",
    "[::-moz-range-thumb]:bg-purple-500",
    "[::-moz-range-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.5)]",
    "[::-webkit-slider-thumb]:h-6",
    "[::-webkit-slider-thumb]:w-6",
    "[::-webkit-slider-thumb]:appearance-none",
    "[::-webkit-slider-thumb]:rounded-full",
    "[::-webkit-slider-thumb]:bg-purple-500",
    "[::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.5)]"
  );

  return (
    <section
      className={cls("space-y-4 text-gray-300", className)}
      data-component="speaker-volume"
    >
      <div className="space-y-4">
        <label className="block text-sm tracking-wide text-gray-400">
          {label}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={volume}
            onChange={handleChange}
            className={sliderClasses}
            aria-valuenow={volume}
            aria-label={label}
            disabled={disabled}
          />
        </label>
        <output
          className={cls(
            "text-center text-3xl font-bold text-white",
            disabled && "text-white/40"
          )}
          aria-live="polite"
        >
          {volume}%
        </output>
      </div>
    </section>
  );
}

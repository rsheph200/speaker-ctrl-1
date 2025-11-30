'use client';

import type { ReactNode } from 'react';
import type { SpeakerHealth } from './types';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface HealthMetric {
  key: keyof SpeakerHealth;
  label: ReactNode;
  suffix?: ReactNode;
}

interface SpeakerSystemHealthProps {
  health?: SpeakerHealth | null;
  className?: string;
  metrics?: HealthMetric[];
  emptyLabel?: ReactNode;
}

const defaultEmptyLabel = 'No health data available';

const defaultMetrics: HealthMetric[] = [
  { key: 'cpu_temp', label: 'CPU', suffix: '°C' },
  { key: 'memory_usage_percent', label: 'M', suffix: '%' },
  { key: 'disk_usage_percent', label: 'D', suffix: '%' },
  { key: 'wifi_signal_dbm', label: 'Wi-Fi Signal', suffix: ' dBm' },
];

const formatValue = (raw: unknown, suffix?: ReactNode) => {
  if (raw === null || raw === undefined) {
    return '—';
  }

  const isNumberLike = typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '');
  const value = isNumberLike ? String(raw) : '';

  if (!value) {
    return '—';
  }

  return (
    <>
      {value}
      {suffix ? <span className="text-sm text-gray-400">{suffix}</span> : null}
    </>
  );
};

export function SpeakerSystemHealth({
  health,
  className,
  metrics = defaultMetrics,
  emptyLabel = defaultEmptyLabel,
}: SpeakerSystemHealthProps) {
  if (!health) {
    return (
      <section className={cls('text-sm text-gray-400', className)} data-component="speaker-system-health">
        <p>{emptyLabel}</p>
      </section>
    );
  }

  const parts: string[] = [];

  // Add live/uptime first if available
  const liveTime = health.live || health.uptime;
  if (liveTime) {
    // Format time string: replace "hour"/"hours" with "h" and "minute"/"minutes" with "m"
    const formattedTime = String(liveTime)
      .replace(/\s*hour(s)?\s*/gi, 'h ')
      .replace(/\s*minute(s)?\s*/gi, 'm ')
      .replace(/\s*,\s*/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
    parts.push(`Uptime ${formattedTime}`);
  }

  // Add metrics in order
  metrics.forEach(({ key, label, suffix }) => {
    const value = health[key];
    if (value !== null && value !== undefined && value !== '') {
      const suffixStr = suffix ? String(suffix).trim() : '';
      parts.push(`${label}: ${value}${suffixStr}`);
    }
  });

  const text = parts.length > 0 ? parts.join(', ') : emptyLabel;

  return (
    <section className={cls('text-sm text-gray-400', className)} data-component="speaker-system-health">
      <p>{text}</p>
    </section>
  );
}

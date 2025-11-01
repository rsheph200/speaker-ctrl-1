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
  { key: 'cpu_temp', label: 'CPU Temp', suffix: '°C' },
  { key: 'memory_usage_percent', label: 'Memory', suffix: '%' },
  { key: 'disk_usage_percent', label: 'Disk', suffix: '%' },
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
      {suffix ? <span className="text-base text-gray-400">{suffix}</span> : null}
    </>
  );
};

export function SpeakerSystemHealth({
  health,
  className,
  metrics = defaultMetrics,
  emptyLabel = defaultEmptyLabel,
}: SpeakerSystemHealthProps) {
  return (
    <section className={cls('space-y-4 text-gray-300', className)} data-component="speaker-system-health">
      {!health ? (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map(({ key, label, suffix }) => (
            <div key={String(key)} className="space-y-1">
              <dt className="text-sm text-gray-400">{label}</dt>
              <dd className="text-2xl font-bold text-white">
                {formatValue(health[key], suffix)}
              </dd>
            </div>
          ))}
          {health.uptime && (
            <div className="md:col-span-4">
              <dt className="text-sm text-gray-400">Uptime</dt>
              <dd className="text-sm text-gray-400">{health.uptime}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

'use client';

import type { ReactNode } from 'react';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerStatusProps {
  connected: boolean;
  status?: string | null;
  className?: string;
  descriptionLabel?: ReactNode;
  connectedLabel?: ReactNode;
  disconnectedLabel?: ReactNode;
}

const defaultDescriptionLabel = 'State';
const defaultConnectedLabel = 'Connected';
const defaultDisconnectedLabel = 'Disconnected';

export function SpeakerStatus({
  connected,
  status,
  className,
  descriptionLabel = defaultDescriptionLabel,
  connectedLabel = defaultConnectedLabel,
  disconnectedLabel = defaultDisconnectedLabel,
}: SpeakerStatusProps) {
  const connectionLabel = connected ? connectedLabel : disconnectedLabel;

  return (
    <section
      className={cls('space-y-4 text-gray-300', className)}
      aria-live="polite"
      data-component="speaker-status"
      data-connected={connected ? 'true' : 'false'}
    >
      {connectionLabel != null && (
        <div className="inline-flex items-center gap-2 text-gray-300">
          <span
            className={connected ? 'h-2.5 w-2.5 rounded-full bg-green-400' : 'h-2.5 w-2.5 rounded-full bg-red-400'}
          />
          <span className="text-sm uppercase tracking-wide text-gray-400">{connectionLabel}</span>
        </div>
      )}
      {status && (
        <dl className="space-y-2">
          <div className="space-y-1">
            {descriptionLabel ? (
              <dt className="text-xs uppercase tracking-wide text-gray-400">{descriptionLabel}</dt>
            ) : null}
            <dd className="text-lg capitalize text-white">{status}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

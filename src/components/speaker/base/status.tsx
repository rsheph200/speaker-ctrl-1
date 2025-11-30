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
  
  // Build the text as a single sentence
  const parts: string[] = [];
  
  if (connectionLabel) {
    // Convert to sentence case and add period
    const labelText = String(connectionLabel);
    const sentenceCase = labelText.charAt(0).toUpperCase() + labelText.slice(1).toLowerCase();
    parts.push(sentenceCase.endsWith('.') ? sentenceCase : `${sentenceCase}.`);
  }
  
  if (status) {
    // Convert to sentence case
    const statusText = String(status);
    const sentenceCase = statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase();
    parts.push(sentenceCase);
  }
  
  const text = parts.length > 0 ? parts.join(' ') : '';

  return (
    <section
      className={cls('text-sm text-gray-400', className)}
      aria-live="polite"
      data-component="speaker-status"
      data-connected={connected ? 'true' : 'false'}
    >
      <p>{text}</p>
    </section>
  );
}

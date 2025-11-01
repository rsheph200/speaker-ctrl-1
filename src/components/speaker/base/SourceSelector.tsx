'use client';
'use client';

import type { ReactNode } from 'react';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerSourceSelectorProps {
  sources: string[];
  selectedSource?: string | null;
  onSelect?: (source: string) => void;
  className?: string;
  formatSourceLabel?: (source: string) => ReactNode;
  emptyLabel?: ReactNode;
}

const defaultEmptyLabel = 'No sources available';

const defaultFormatSourceLabel = (source: string) =>
  source
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function SpeakerSourceSelector({
  sources,
  selectedSource,
  onSelect,
  className,
  formatSourceLabel = defaultFormatSourceLabel,
  emptyLabel = defaultEmptyLabel,
}: SpeakerSourceSelectorProps) {
  return (
    <section
      className={cls('space-y-4 text-gray-300', className)}
      data-component="speaker-source-selector"
      data-selected-source={selectedSource ?? ''}
    >
      <div className="space-y-3">
        {sources.length === 0 ? (
          <p className="text-sm text-gray-400">{emptyLabel}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {sources.map((source) => {
              const label = formatSourceLabel(source);
              const isSelected = selectedSource === source;

              return (
                <li key={source}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(source)}
                    aria-pressed={isSelected}
                    className={cls(
                      'w-full rounded-xl p-4 font-medium transition-all',
                      isSelected
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10',
                    )}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

interface SpeakerNowPlayingControlButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode;
  className?: string;
  variant?: 'previous' | 'play-pause' | 'next' | (string & {});
  isActive?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function SpeakerNowPlayingControlButton({
  children,
  className,
  variant,
  isActive,
  type = 'button',
  disabled,
  onClick,
  ...rest
}: SpeakerNowPlayingControlButtonProps) {
  const baseClasses =
    'rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50';
  const variantClasses =
    variant === 'play-pause'
      ? 'bg-purple-500 p-5 shadow-lg shadow-purple-500/50 hover:bg-purple-600'
      : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls(baseClasses, variantClasses, className)}
      data-variant={variant}
      data-active={isActive ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

import { connectVisualizer, type VizFrame } from '@/lib/mqttVisualizer';

interface SpeakerVisualizerProps {
  className?: string;
  height?: number;
}

const baseClass = 'flex w-full flex-col gap-3 text-gray-300';

export function SpeakerVisualizer({
  className,
  height = 140,
}: SpeakerVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<VizFrame | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'receiving' | 'error'>('connecting');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const draw = () => {
      resizeCanvasToDisplaySize(canvas);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const frame = frameRef.current;

      if (frame && frame.bars.length > 0) {
        const bars = frame.bars;
        const maxBars = Math.min(bars.length, 96);
        const step = Math.floor(bars.length / maxBars) || 1;

        const weights = new Array(maxBars).fill(0);
        for (let i = 0; i < maxBars; i++) {
          let sample = 0;
          for (let j = 0; j < step; j++) {
            sample += bars[i * step + j] ?? 0;
          }
          weights[i] = sample / step;
        }

        const width = canvas.width;
        const heightPx = canvas.height;
        const gap = width * 0.002;
        const barWidth = (width - gap * (weights.length - 1)) / weights.length;

        const gradient = ctx.createLinearGradient(0, heightPx, 0, heightPx * 0.1);
        gradient.addColorStop(0, '#22d3ee');
        gradient.addColorStop(0.5, '#818cf8');
        gradient.addColorStop(1, '#f472b6');

        ctx.fillStyle = gradient;
        ctx.beginPath();

        weights.forEach((weight, index) => {
          const normalized = clamp(weight, 0, 1) ** 1.85;
          const barHeight = Math.max(normalized * heightPx * 0.95, heightPx * 0.04);
          const x = index * (barWidth + gap);
          const y = heightPx - barHeight;

          ctx.roundRect(x, y, barWidth, barHeight, Math.min(barWidth * 0.35, 8));
        });

        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, canvas.height * 0.8, canvas.width, 2);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_MQTT_URL;

    if (!url) {
      console.error('Missing NEXT_PUBLIC_MQTT_URL for visualizer');
      setStatus('error');
      return;
    }

    setStatus('connecting');

    const client = connectVisualizer({
      url,
      onFrame: frame => {
        frameRef.current = frame;
        setStatus('receiving');
      },
      onStatus: nextStatus => {
        if (nextStatus === 'connected') {
          setStatus('connected');
        } else if (nextStatus === 'disconnected') {
          setStatus('disconnected');
        } else if (nextStatus === 'error') {
          setStatus('error');
        }
      },
    });

    return () => {
      client.end(true);
    };
  }, []);

  const statusLabel = status === 'receiving' ? 'Streaming audio data' : status === 'connected' ? 'Connected' : status === 'disconnected' ? 'Disconnected' : status === 'error' ? 'Error' : 'Connecting';

  return (
    <section className={[baseClass, className].filter(Boolean).join(' ')}>
      <header className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
        <span>Audio Visualizer</span>
        <span>{statusLabel}</span>
      </header>
      <canvas
        ref={canvasRef}
        className="w-full flex-1 rounded-lg bg-black/40"
        style={{ height }}
      />
    </section>
  );
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const { clientWidth, clientHeight } = canvas;
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.floor(clientWidth * pixelRatio);
  const height = Math.floor(clientHeight * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

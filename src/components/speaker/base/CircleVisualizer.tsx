'use client';

import { useEffect, useRef, useState } from 'react';

import { connectVisualizer, type VizFrame } from '@/lib/mqttVisualizer';

interface CircleVisualizerProps {
  className?: string;
  height?: number;
}

const baseClass = 'flex w-full flex-col gap-3 text-gray-300';

export function CircleVisualizer({
  className,
  height = 140,
}: CircleVisualizerProps) {
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
        // Calculate audio level using multiple methods for better responsiveness
        const bars = frame.bars;
        
        // Method 1: RMS (if available and meaningful) - good for overall energy
        const rmsLevel = frame.rms > 0 ? frame.rms : null;
        
        // Method 2: Average of all bars
        const sum = bars.reduce((acc, val) => acc + val, 0);
        const average = sum / bars.length;
        
        // Method 3: Peak value (highest bar) - captures transients and dynamics
        const peak = Math.max(...bars);
        
        // Method 4: Weighted average (emphasize higher frequencies for more sensitivity)
        const weightedSum = bars.reduce((acc, val, idx) => {
          const weight = 1 + (idx / bars.length) * 0.5; // Higher frequencies weighted more
          return acc + val * weight;
        }, 0);
        const weightedAvg = weightedSum / bars.reduce((acc, _, idx) => acc + (1 + (idx / bars.length) * 0.5), 0);
        
        // Combine methods: prefer RMS if available, otherwise use max of average/weighted, boosted by peak
        const baseLevel = rmsLevel !== null ? rmsLevel : Math.max(average, weightedAvg);
        // Boost with peak to capture transients, ensuring we get full dynamic range
        const audioLevel = Math.min(baseLevel * 1.15 + peak * 0.25, 1);
        
        // Use a gentler power curve for smoother, more responsive scaling
        const normalized = clamp(audioLevel, 0, 1) ** 1.15;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;
        const minRadius = maxRadius * 0.15; // Increased from 0.1 for more visible scaling
        const radius = minRadius + (maxRadius - minRadius) * normalized;

        // Create gradient for the circle
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#22d3ee');
        gradient.addColorStop(0.5, '#818cf8');
        gradient.addColorStop(1, '#f472b6');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Show a small idle circle
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, canvas.height * 0.05, 0, Math.PI * 2);
        ctx.fill();
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
        <span>Circle Visualizer</span>
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


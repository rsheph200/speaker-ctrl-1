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
  const historyRef = useRef<number[]>([]); // Track recent peak values for adaptive normalization
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
        
        // Calculate activity metrics that are independent of absolute volume
        const peak = Math.max(...bars);
        const sum = bars.reduce((acc, val) => acc + val, 0);
        const average = sum / bars.length;
        
        // Peak-to-average ratio: indicates dynamics and activity (not volume-dependent)
        const peakToAvg = average > 0 ? peak / average : 0;
        
        // Variance: measures how spread out the frequency content is (activity indicator)
        const variance = bars.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / bars.length;
        const stdDev = Math.sqrt(variance);
        
        // Frequency content distribution: count how many bins have significant energy
        const threshold = average * 1.5; // Relative to current average
        const activeBins = bars.filter(val => val > threshold).length;
        const activityRatio = activeBins / bars.length;
        
        // Combine activity metrics (not volume-dependent)
        // Peak-to-avg shows dynamics, variance shows spread, activityRatio shows distribution
        const activityScore = Math.min(
          (peakToAvg * 0.4 + stdDev * 50 * 0.3 + activityRatio * 0.3),
          1
        );
        
        // Adaptive normalization: track recent peak values to normalize against current range
        historyRef.current.push(peak);
        if (historyRef.current.length > 60) { // Keep last ~1 second of data (assuming ~60fps)
          historyRef.current.shift();
        }
        
        // Calculate dynamic range from recent history
        const recentMax = Math.max(...historyRef.current);
        const recentMin = Math.min(...historyRef.current);
        const recentRange = recentMax - recentMin;
        
        // Normalize peak value based on recent dynamic range (not absolute volume)
        let normalizedPeak = 0;
        if (recentRange > 0) {
          normalizedPeak = (peak - recentMin) / recentRange;
        } else if (peak > 0) {
          // If no range yet, use peak relative to a small threshold
          normalizedPeak = Math.min(peak * 100, 1);
        }
        
        // Combine activity score with normalized peak for final visualization level
        // Activity score emphasizes dynamics, normalized peak shows current position in range
        const visualLevel = activityScore * 0.6 + normalizedPeak * 0.4;
        
        // Apply gentle curve for smooth visualization
        const normalized = clamp(visualLevel, 0, 1) ** 0.9;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.5;
        const minRadius = maxRadius * 0.05; // Much smaller minimum for dramatic size variation
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


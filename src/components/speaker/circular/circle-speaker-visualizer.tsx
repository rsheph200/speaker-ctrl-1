"use client";

import { useEffect, useRef } from "react";

import { connectVisualizer, type VizFrame } from "@/lib/mqttVisualizer";
import { getDummyVisualizerFrame } from "@/lib/dummy/visualizerFrames";
import { useAppSettings } from "@/context/AppSettingsContext";

interface CircleSpeakerVisualizerProps {
  className?: string;
  size?: number;
  resetTrigger?: number | null;
  /**
   * Maximum radius as a percentage of canvas size (0.0 to 0.5)
   * 0.5 = 50% of canvas = circle fills entire canvas at max
   * Default: 0.5
   */
  maxRadiusPercent?: number;
  /**
   * Minimum radius as a percentage of maxRadius (0.0 to 1.0)
   * 0.65 = 65% of maxRadius = circle starts at 65% of max size
   * Default: 0.65
   */
  minRadiusPercent?: number;
}

const CIRCLE_COLOR = "#250505";

export function CircleSpeakerVisualizer({
  className,
  size = 672,
  resetTrigger = null,
  maxRadiusPercent = 0.5,
  minRadiusPercent = 0.75,
}: CircleSpeakerVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<VizFrame | null>(null);
  const dummyFrameIndexRef = useRef(0);
  const historyRef = useRef<number[]>([]);
  const smoothedValueRef = useRef<number>(0);
  const doubleSmoothedValueRef = useRef<number>(0);
  const { dummyMode } = useAppSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const draw = () => {
      resizeCanvasToDisplaySize(canvas);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const frame = frameRef.current;

      if (frame && frame.bars.length > 0) {
        const bars = frame.bars;

        // Calculate overall audio level
        const peak = Math.max(...bars);

        // Track history for adaptive normalization
        historyRef.current.push(peak);
        if (historyRef.current.length > 60) {
          historyRef.current.shift();
        }

        // Calculate dynamic range from recent history
        const recentMax = Math.max(...historyRef.current);
        const recentMin = Math.min(...historyRef.current);
        const recentRange = recentMax - recentMin;

        // Normalize peak value based on recent dynamic range
        let normalizedPeak = 0;
        if (recentRange > 0) {
          normalizedPeak = (peak - recentMin) / recentRange;
        } else if (peak > 0) {
          normalizedPeak = Math.min(peak * 100, 1);
        }

        // Apply gentle curve for smooth visualization
        const normalized = clamp(normalizedPeak, 0, 1) ** 0.4;

        // Calculate the change magnitude for adaptive smoothing
        const previousValue = smoothedValueRef.current;
        const changeMagnitude = Math.abs(normalized - previousValue);

        // Adaptive smoothing: quick response for small changes, smooth for large changes
        // Small changes (< 0.08): use higher factor (0.3) for quick response
        // Large changes (> 0.15): use lower factor (0.05) for smooth transitions
        // Medium changes: interpolate between the two
        let smoothingFactor: number;
        if (changeMagnitude < 0.08) {
          // Quick response for small changes
          smoothingFactor = 0.3;
        } else if (changeMagnitude > 0.15) {
          // Smooth transitions for large changes
          smoothingFactor = 0.05;
        } else {
          // Interpolate between quick and smooth for medium changes
          const t = (changeMagnitude - 0.08) / 0.07; // 0 to 1 as change goes from 0.08 to 0.15
          smoothingFactor = 0.3 - (0.3 - 0.05) * t;
        }

        const smoothed =
          previousValue + (normalized - previousValue) * smoothingFactor;
        smoothedValueRef.current = smoothed;

        // Apply second layer of smoothing with same adaptive factor
        const previousDoubleSmoothed = doubleSmoothedValueRef.current;
        const doubleSmoothed =
          previousDoubleSmoothed +
          (smoothed - previousDoubleSmoothed) * smoothingFactor;
        doubleSmoothedValueRef.current = doubleSmoothed;

        // Apply easing function for even smoother transitions (ease-in-out curve)
        const eased = easeInOutCubic(doubleSmoothed);

        // Keep circle centered - always draw from center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Calculate min and max radius based on props
        // maxRadiusPercent: percentage of canvas size (0.0 to 0.5, where 0.5 = fills entire canvas)
        const maxRadius =
          Math.min(canvas.width, canvas.height) * maxRadiusPercent;
        // minRadiusPercent: percentage of maxRadius (0.0 to 1.0, where 1.0 = same as max)
        const minRadius = maxRadius * minRadiusPercent;
        const radius = minRadius + (maxRadius - minRadius) * eased;

        // Draw solid color circle - grows from center based on audio input
        ctx.fillStyle = CIRCLE_COLOR;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Show a small idle circle at center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius =
          Math.min(canvas.width, canvas.height) * maxRadiusPercent;
        // Use minRadius for idle state, slightly smaller (80% of minRadius)
        const idleRadius = maxRadius * minRadiusPercent * 0.8;

        ctx.fillStyle = CIRCLE_COLOR;
        ctx.beginPath();
        ctx.arc(centerX, centerY, idleRadius, 0, Math.PI * 2);
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
    if (resetTrigger !== null) {
      smoothedValueRef.current = 0;
      doubleSmoothedValueRef.current = 0;
      historyRef.current = [];
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (dummyMode) {
      const interval = window.setInterval(() => {
        const frame = getDummyVisualizerFrame(dummyFrameIndexRef.current++);
        frameRef.current = frame;
      }, 110);

      return () => {
        window.clearInterval(interval);
      };
    }

    const url = process.env.NEXT_PUBLIC_MQTT_URL;

    if (!url) {
      console.error("Missing NEXT_PUBLIC_MQTT_URL for visualizer");
      return;
    }

    const client = connectVisualizer({
      url,
      onFrame: (frame) => {
        frameRef.current = frame;
      },
      onStatus: () => {
        // Status handling if needed
      },
    });

    return () => {
      client.end(true);
    };
  }, [dummyMode]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
    />
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

// Easing function for smooth transitions (ease-in-out cubic)
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

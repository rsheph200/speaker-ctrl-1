'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { connectVisualizer, type VizFrame } from '@/lib/mqttVisualizer';

interface SpeakerVisualizerProps {
  className?: string;
  height?: number;
  artwork?: string | null;
  scale?: number;
  resetTrigger?: number | null;
}

const baseClass = 'flex flex-col gap-3 text-gray-300';
const defaultGradientStops = ['#1e293b', '#2563eb', '#818cf8', '#f472b6', '#818cf8', '#2563eb', '#1e293b'] as const;
const accentPalette = ['#f97316', '#ec4899', '#fde047', '#a855f7', '#22d3ee', '#14b8a6'] as const;
type RGB = [number, number, number];

export function SpeakerVisualizer({
  className,
  height = 40,
  artwork,
  scale = 1,
  resetTrigger = null,
}: SpeakerVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<VizFrame | null>(null);
  const historyRefs = useRef<number[][]>([[], [], [], [], [], []]); // Track recent peak values for each of 6 frequency bands
  const smoothedValuesRef = useRef<number[]>([0, 0, 0, 0, 0, 0]); // Store smoothed normalized values for each bar
  const gradientStopsRef = useRef<string[]>([...defaultGradientStops]);
  const activeColorRef = useRef<RGB | null>(null);
  const gradientTransitionFrameRef = useRef<number | null>(null);
  const gradientDelayTimeoutRef = useRef<number | null>(null);
  const latestColorRef = useRef<RGB | null>(null);
  const allowColorRef = useRef(true);
  const pendingResetRef = useRef(false);
  const lastResetTriggerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'receiving' | 'error'>('connecting');

  const transitionToColor = useCallback((nextColor: RGB | null, duration = 500) => {
    if (nextColor && colorsEqual(activeColorRef.current, nextColor) && !gradientTransitionFrameRef.current) {
      return;
    }

    if (gradientTransitionFrameRef.current) {
      cancelAnimationFrame(gradientTransitionFrameRef.current);
      gradientTransitionFrameRef.current = null;
    }

    const fromStops = [...gradientStopsRef.current];
    const toStops = getStopsForColor(nextColor);

    if (duration <= 0) {
      gradientStopsRef.current = toStops;
      activeColorRef.current = nextColor;
      return;
    }

    const fromRgb = fromStops.map(hexToRgb);
    const toRgb = toStops.map(hexToRgb);
    const start = performance.now();

    const step = (timestamp: number) => {
      const progress = clamp((timestamp - start) / duration, 0, 1);
      const blended = fromRgb.map((color, index) => mixColor(color, toRgb[index], progress));
      gradientStopsRef.current = blended.map(rgbToHex);

      if (progress < 1) {
        gradientTransitionFrameRef.current = requestAnimationFrame(step);
      } else {
        gradientStopsRef.current = toStops;
        activeColorRef.current = nextColor;
        gradientTransitionFrameRef.current = null;
      }
    };

    gradientTransitionFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (resetTrigger == null || resetTrigger === lastResetTriggerRef.current) {
      return;
    }

    lastResetTriggerRef.current = resetTrigger;
    pendingResetRef.current = true;
    allowColorRef.current = false;

    if (gradientDelayTimeoutRef.current !== null) {
      window.clearTimeout(gradientDelayTimeoutRef.current);
      gradientDelayTimeoutRef.current = null;
    }

    transitionToColor(null, 350);

    const timeoutId = window.setTimeout(() => {
      gradientDelayTimeoutRef.current = null;
      allowColorRef.current = true;
      pendingResetRef.current = false;

      if (latestColorRef.current) {
        transitionToColor(latestColorRef.current, 600);
      }
    }, 3000);

    gradientDelayTimeoutRef.current = timeoutId;

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        if (gradientDelayTimeoutRef.current === timeoutId) {
          gradientDelayTimeoutRef.current = null;
        }
      }
    };
  }, [resetTrigger, transitionToColor]);

  useEffect(() => {
    let isCancelled = false;

    if (!artwork) {
      latestColorRef.current = null;
      if (allowColorRef.current) {
        transitionToColor(null, pendingResetRef.current ? 350 : 200);
        pendingResetRef.current = false;
      }
      return () => {
        isCancelled = true;
      };
    }

    extractDominantColor(artwork)
      .then(color => {
        if (isCancelled) {
          return;
        }

        latestColorRef.current = color;

        if (!color) {
          if (allowColorRef.current) {
            transitionToColor(null, 0);
          }
          return;
        }

        if (pendingResetRef.current && !allowColorRef.current) {
          allowColorRef.current = true;
          pendingResetRef.current = false;
          if (gradientDelayTimeoutRef.current !== null) {
            window.clearTimeout(gradientDelayTimeoutRef.current);
            gradientDelayTimeoutRef.current = null;
          }
        }

        if (allowColorRef.current) {
          transitionToColor(color, pendingResetRef.current ? 600 : 400);
          pendingResetRef.current = false;
        }
      })
      .catch(() => {
        if (!isCancelled && allowColorRef.current) {
          transitionToColor(null, 0);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [artwork, transitionToColor]);

  useEffect(() => {
    return () => {
      if (gradientDelayTimeoutRef.current !== null) {
        window.clearTimeout(gradientDelayTimeoutRef.current);
        gradientDelayTimeoutRef.current = null;
      }
      if (gradientTransitionFrameRef.current) {
        cancelAnimationFrame(gradientTransitionFrameRef.current);
        gradientTransitionFrameRef.current = null;
      }
    };
  }, []);

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

      // Clear canvas to transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const frame = frameRef.current;

      if (frame && frame.bars.length > 0) {
        const bars = frame.bars;
        const numBands = 6;
        
        // Split frequency spectrum into 6 equal bands
        const binsPerBand = Math.floor(bars.length / numBands);
        const weights = new Array(numBands).fill(0);
        
        // Calculate energy for each frequency band
        for (let band = 0; band < numBands; band++) {
          const startIdx = band * binsPerBand;
          const endIdx = band === numBands - 1 ? bars.length : (band + 1) * binsPerBand;
          
          // Calculate peak for this frequency band
          let bandPeak = 0;
          for (let i = startIdx; i < endIdx; i++) {
            const value = bars[i] ?? 0;
            bandPeak = Math.max(bandPeak, value);
          }
          
          // Use peak value for this band (can also use average or RMS)
          const bandEnergy = bandPeak;
          weights[band] = bandEnergy;
          
          // Track history for this specific frequency band
          historyRefs.current[band].push(bandEnergy);
          if (historyRefs.current[band].length > 60) { // Keep last ~1 second of data
            historyRefs.current[band].shift();
          }
        }

        const width = canvas.width;
        const heightPx = canvas.height;
        const centerY = heightPx / 2;
        const gap = width * 0.01; // Increased gap for better spacing with fewer bars
        
        // Base size for bars - controls maximum width and minimum height baseline
        const baseBarSize = Math.min(width, heightPx) * 0.15; // Change this to adjust maximum bar width (in pixels)
        const idleScale = 0.55; // Width/height scale when idle
        const widthScaleRange = 1 - idleScale;
        
        type BarData = {
          barWidth: number;
          barHeight: number;
          halfHeight: number;
        };
        
        const barData: BarData[] = weights.map((weight, index) => {
          // Normalize each bar based on its own frequency band's recent dynamic range
          const bandHistory = historyRefs.current[index];
          const recentMax = bandHistory.length > 0 ? Math.max(...bandHistory) : 0;
          const recentMin = bandHistory.length > 0 ? Math.min(...bandHistory) : 0;
          const recentRange = recentMax - recentMin;
          
          let normalized = 0;
          if (recentRange > 0) {
            normalized = (weight - recentMin) / recentRange;
          } else if (weight > 0) {
            // If no range yet, use weight relative to a small threshold
            normalized = Math.min(weight * 100, 1);
          }

          // Apply gentle curve for smooth visualization
          normalized = clamp(normalized, 0, 1) ** 0.9;
          
          // Sensitivity multiplier - lower values = less sensitive (bars won't reach max as easily)
          // Adjust this between 0.3-0.8 to control sensitivity (default: 0.5)
          const sensitivity = 0.6;
          normalized = normalized * sensitivity;
          
          // Apply exponential smoothing for smoother transitions
          const smoothingFactor = 0.2; // Lower = smoother but slower response (0.1-0.3 range)
          const previousValue = smoothedValuesRef.current[index];
          const smoothed = previousValue + (normalized - previousValue) * smoothingFactor;
          smoothedValuesRef.current[index] = smoothed;
          
          const widthScale = idleScale + widthScaleRange * smoothed;
          const barWidth = baseBarSize * widthScale;
          
          // Bar height extends equally above and below center
          const minHeight = baseBarSize * idleScale;
          const maxHeight = heightPx * 1.5;
          const barHeight = Math.max(smoothed * maxHeight, minHeight);
          const halfHeight = barHeight / 2;
          
          return { barWidth, barHeight, halfHeight };
        });
        
        const anchorBarWidth = baseBarSize;
        const totalAnchorWidth = barData.length * anchorBarWidth + gap * (barData.length - 1);
        const anchorStartX = (width - totalAnchorWidth) / 2;

        ctx.fillStyle = createBarGradient(ctx, heightPx, gradientStopsRef.current);
        ctx.beginPath();

        barData.forEach(({ barWidth, barHeight, halfHeight }, index) => {
          const centerX = anchorStartX + index * (anchorBarWidth + gap) + anchorBarWidth / 2;
          const x = centerX - barWidth / 2;
          const y = centerY - halfHeight;
          const borderRadius = barWidth / 2;
          ctx.roundRect(x, y, barWidth, barHeight, borderRadius);
        });

        ctx.fill();
      } else {
        // Show a centered idle line
        const centerY = canvas.height / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, centerY - 1, canvas.width, 1);
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
    <section className={[baseClass, className].filter(Boolean).join(' ')} >
      <canvas
        ref={canvasRef}
        className="w-full flex-1 rounded-lg"
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

function createBarGradient(ctx: CanvasRenderingContext2D, height: number, stops: string[]) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  const colorStops = stops.length ? stops : [...defaultGradientStops];

  if (colorStops.length === 1) {
    gradient.addColorStop(0, colorStops[0]);
    gradient.addColorStop(1, colorStops[0]);
    return gradient;
  }

  const denominator = colorStops.length - 1;
  colorStops.forEach((color, index) => {
    gradient.addColorStop(index / denominator, color);
  });

  return gradient;
}

function getStopsForColor(color: RGB | null) {
  return color ? createGradientStops(color) : [...defaultGradientStops];
}

async function extractDominantColor(src: string): Promise<RGB | null> {
  try {
    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    context.drawImage(image, 0, 0, size, size);
    const data = context.getImageData(0, 0, size, size).data;

    let total = 0;
    let r = 0;
    let g = 0;
    let b = 0;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha === 0) {
        continue;
      }

      r += data[i] * alpha;
      g += data[i + 1] * alpha;
      b += data[i + 2] * alpha;
      total += alpha;
    }

    if (!total) {
      return null;
    }

    return [
      Math.round(r / total),
      Math.round(g / total),
      Math.round(b / total),
    ];
  } catch (error) {
    console.warn('Unable to extract artwork color', error);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.src = src;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
  });
}

function createGradientStops(color: RGB): string[] {
  const center = mixColor(color, [255, 255, 255], 0.05);
  const nearCenter = mixColor(color, [255, 255, 255], 0.02);
  const accent = hexToRgb(pickAccentColor(color));
  const edgeBase = mixColor(color, accent, 0.08);
  const outerEdge = mixColor(edgeBase, [0, 0, 0], 0.06);

  return [
    rgbToHex(outerEdge),
    rgbToHex(edgeBase),
    rgbToHex(nearCenter),
    rgbToHex(center),
    rgbToHex(nearCenter),
    rgbToHex(edgeBase),
    rgbToHex(outerEdge),
  ];
}

function mixColor(color: RGB, target: RGB, amount: number): RGB {
  return [
    Math.round(clamp(color[0] + (target[0] - color[0]) * amount, 0, 255)),
    Math.round(clamp(color[1] + (target[1] - color[1]) * amount, 0, 255)),
    Math.round(clamp(color[2] + (target[2] - color[2]) * amount, 0, 255)),
  ];
}

function rgbToHex([r, g, b]: RGB) {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function colorsEqual(a: RGB | null, b: RGB | null) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function pickAccentColor(color: RGB): string {
  const [h, s] = rgbToHsl(color);
  if (!Number.isFinite(h) || s < 0.05) {
    return accentPalette[0];
  }
  const normalizedHue = Math.max(0, Math.min(359, h));
  const index = Math.floor((normalizedHue / 360) * accentPalette.length);
  return accentPalette[index] ?? accentPalette[0];
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6;
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }

    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  return [h, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    [rPrime, gPrime, bPrime] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [rPrime, gPrime, bPrime] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [rPrime, gPrime, bPrime] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [rPrime, gPrime, bPrime] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [rPrime, gPrime, bPrime] = [x, 0, c];
  } else {
    [rPrime, gPrime, bPrime] = [c, 0, x];
  }

  return [
    Math.round((rPrime + m) * 255),
    Math.round((gPrime + m) * 255),
    Math.round((bPrime + m) * 255),
  ];
}
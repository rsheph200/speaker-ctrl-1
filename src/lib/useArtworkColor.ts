"use client";

import { useEffect, useState } from "react";

type RGB = [number, number, number];
type HSL = [number, number, number]; // [hue, saturation, lightness]

async function extractDominantColor(src: string): Promise<RGB | null> {
  try {
    const image = await loadImage(src);
    const canvas = document.createElement("canvas");
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

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
    console.warn("Unable to extract artwork color", error);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = src;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
  });
}

function rgbToHex([r, g, b]: RGB): string {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate the relative luminance of an RGB color
 * Uses the formula from WCAG: 0.299*R + 0.587*G + 0.114*B
 * Returns a value between 0 (darkest) and 255 (brightest)
 */
function calculateLuminance([r, g, b]: RGB): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl([r, g, b]: RGB): HSL {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / delta + 4) / 6;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb([h, s, l]: HSL): RGB {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r: number, g: number, b: number;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;

    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Lighten a dark color by increasing its lightness
 * Only lightens colors below the threshold, leaving bright colors unchanged
 */
function lightenDarkColor(
  rgb: RGB,
  threshold: number = 100,
  targetLightness: number = 65
): RGB {
  const luminance = calculateLuminance(rgb);

  // If the color is already bright enough, return it unchanged
  if (luminance >= threshold) {
    return rgb;
  }

  // Convert to HSL to adjust lightness
  const [h, s, l] = rgbToHsl(rgb);

  // Increase lightness to target, but don't go above the current lightness too much
  // Use a smooth transition: if very dark, bring it closer to target
  const newLightness = Math.min(
    targetLightness,
    l + (targetLightness - l) * 0.6
  );

  // Convert back to RGB
  return hslToRgb([h, s, newLightness]);
}

/**
 * Hook to extract the dominant color from album artwork
 * @param artwork - The URL of the artwork image
 * @returns The extracted color as a hex string, or null if extraction fails
 */
export function useArtworkColor(artwork: string | null): string | null {
  const [artworkColor, setArtworkColor] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!artwork) {
      setArtworkColor(null);
      return;
    }

    extractDominantColor(artwork)
      .then((color) => {
        if (isCancelled) {
          return;
        }

        if (color) {
          // Lighten dark colors to ensure visibility
          const lightenedColor = lightenDarkColor(color);
          setArtworkColor(rgbToHex(lightenedColor));
        } else {
          setArtworkColor(null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setArtworkColor(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [artwork]);

  return artworkColor;
}

/**
 * Utility function to extract RGB color from artwork (for use outside of React components)
 * @param artwork - The URL of the artwork image
 * @returns The extracted color as RGB tuple, or null if extraction fails
 */
export async function extractArtworkColor(
  artwork: string
): Promise<RGB | null> {
  return extractDominantColor(artwork);
}

/**
 * Utility function to convert RGB to hex string
 * @param rgb - RGB color tuple
 * @returns Hex color string
 */
export function rgbToHexColor([r, g, b]: RGB): string {
  return rgbToHex([r, g, b]);
}

"use client";

import { ReactNode } from "react";
import { MOOD_GRADIENT_BACKGROUND } from "@/lib/themeConfig";

interface MoodBackgroundProps {
  children: ReactNode;
}

export function MoodBackground({ children }: MoodBackgroundProps) {
  return (
    <div
      className="h-screen w-full"
      style={{
        background: MOOD_GRADIENT_BACKGROUND,
        // filter: MOOD_BLUR_FILTER, // Uncomment to enable blur
      }}
    >
      {children}
    </div>
  );
}

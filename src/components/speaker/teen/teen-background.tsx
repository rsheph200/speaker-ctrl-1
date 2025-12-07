"use client";

import { ReactNode } from "react";
import { TEEN_GRADIENT_BACKGROUND } from "@/lib/themeConfig";

interface TeenBackgroundProps {
  children: ReactNode;
}

export function TeenBackground({ children }: TeenBackgroundProps) {
  return (
    <div
      className="h-screen w-full"
      style={{
        background: TEEN_GRADIENT_BACKGROUND,
        // filter: TEEN_BLUR_FILTER, // Uncomment to enable blur
      }}
    >
      {children}
    </div>
  );
}

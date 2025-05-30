"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";

interface ChaosCardsMemorizeProps {
  theme: CulturalTheme;
  timeLeft: number;
}

export function ChaosCardsMemorize({
  theme,
  timeLeft,
}: ChaosCardsMemorizeProps) {
  return (
    <div className="text-center">
      <p
        className="text-lg font-medium mb-2"
        style={{ color: theme.colors.text }}
      >
        Memorize the sequence of {theme.culture} symbols!
      </p>

      {/* Progress Bar */}
      <div
        className="w-full rounded-full h-2 mt-2"
        style={{ backgroundColor: theme.colors.primary + "30" }}
      >
        <div
          className="h-2 rounded-full transition-all duration-1000"
          style={{
            width: `${(timeLeft / 15) * 100}%`,
            backgroundColor: theme.colors.primary,
          }}
        />
      </div>

      {/* Time Display */}
      <div className="mt-2 text-sm font-mono">{timeLeft}s remaining</div>
    </div>
  );
}

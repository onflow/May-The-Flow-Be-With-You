"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";

interface ChaosCardsMemorizeProps {
  theme: CulturalTheme;
  timeLeft: number;
  memoryTechnique?: string;
  culturalStory?: string;
  difficulty?: number;
  perfectRounds?: number;
}

export function ChaosCardsMemorize({
  theme,
  timeLeft,
  memoryTechnique = "observation",
  culturalStory = "",
  difficulty = 3,
  perfectRounds = 0,
}: ChaosCardsMemorizeProps) {
  // Memory technique guidance
  const getTechniqueGuidance = (technique: string) => {
    switch (technique) {
      case "loci":
        return "🏛️ Place each symbol in a familiar location in your mind";
      case "linking":
        return "🔗 Create a story connecting each symbol to the next";
      case "story":
        return "📖 Weave all symbols into one memorable narrative";
      case "cultural":
        return "🌍 Use the cultural context to remember each symbol";
      default:
        return "👁️ Observe carefully and memorize the sequence";
    }
  };
  return (
    <div className="text-center space-y-4">
      {/* Difficulty & Progress Info */}
      <div className="flex justify-center items-center gap-4 text-sm">
        <div style={{ color: theme.colors.text + "80" }}>
          Level {difficulty} •{" "}
          {perfectRounds > 0
            ? `${perfectRounds} perfect rounds`
            : "First attempt"}
        </div>
      </div>

      <p
        className="text-lg font-medium mb-2"
        style={{ color: theme.colors.text }}
      >
        Memorize the sequence of {theme.culture} symbols!
      </p>

      {/* Memory Technique Guidance */}
      <div
        className="p-3 rounded-lg border-l-4 text-sm"
        style={{
          backgroundColor: theme.colors.primary + "10",
          borderColor: theme.colors.primary,
          color: theme.colors.text + "90",
        }}
      >
        <div className="font-medium mb-1">Memory Technique:</div>
        <div>{getTechniqueGuidance(memoryTechnique)}</div>
      </div>

      {/* Cultural Story */}
      {culturalStory && (
        <div
          className="p-3 rounded-lg text-sm italic"
          style={{
            backgroundColor: theme.colors.secondary + "10",
            color: theme.colors.text + "80",
          }}
        >
          {culturalStory}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className="w-full rounded-full h-3 mt-4"
        style={{ backgroundColor: theme.colors.primary + "30" }}
      >
        <div
          className="h-3 rounded-full transition-all duration-1000"
          style={{
            width: `${(timeLeft / Math.max(timeLeft + 1, 15)) * 100}%`,
            backgroundColor: theme.colors.primary,
          }}
        />
      </div>

      {/* Time Display */}
      <div
        className="mt-2 text-lg font-mono font-bold"
        style={{ color: theme.colors.primary }}
      >
        {timeLeft}s remaining
      </div>
    </div>
  );
}

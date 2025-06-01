"use client";

import React from "react";
import { CulturalTheme } from "../../../../config/culturalThemes";
import { DIFFICULTY_LEVELS } from "../types";

interface DifficultySelectorProps {
  theme: CulturalTheme;
  difficulty: number;
  onDifficultyChange: (difficulty: number) => void;
  gameSpecificLevels?: typeof DIFFICULTY_LEVELS;
  title?: string;
}

export function DifficultySelector({
  theme,
  difficulty,
  onDifficultyChange,
  gameSpecificLevels = DIFFICULTY_LEVELS,
  title = "🎯 Choose Your Challenge Level",
}: DifficultySelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
        {title}
      </h3>
      <div className="mobile-grid">
        {gameSpecificLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => onDifficultyChange(level.value)}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left touch-target ${
              difficulty === level.value
                ? `border-2 shadow-lg`
                : "border-gray-200 hover:border-gray-300 hover:shadow-md active:scale-95"
            }`}
            style={{
              borderColor:
                difficulty === level.value ? theme.colors.primary : undefined,
              backgroundColor:
                difficulty === level.value
                  ? theme.colors.background
                  : undefined,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="text-xl sm:text-2xl">{level.icon}</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm sm:text-base">
                  {level.label}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {level.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

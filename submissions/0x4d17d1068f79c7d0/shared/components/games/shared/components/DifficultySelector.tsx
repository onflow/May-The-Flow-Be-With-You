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
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gameSpecificLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => onDifficultyChange(level.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              difficulty === level.value
                ? `border-2 shadow-lg`
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
            style={{
              borderColor: difficulty === level.value ? theme.colors.primary : undefined,
              backgroundColor: difficulty === level.value ? theme.colors.background : undefined,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <div className="font-semibold text-gray-800">{level.label}</div>
                <div className="text-sm text-gray-600">{level.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

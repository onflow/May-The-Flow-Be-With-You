"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";

interface ChaosCardsSetupProps {
  theme: CulturalTheme;
  gameInfo: any;
  difficulty: number;
  onDifficultyChange: (difficulty: number) => void;
  onStartGame: () => void;
  isLoading: boolean;
}

export function ChaosCardsSetup({
  theme,
  gameInfo,
  difficulty,
  onDifficultyChange,
  onStartGame,
  isLoading
}: ChaosCardsSetupProps) {
  return (
    <>
      {/* Difficulty Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Cards:</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
            className="px-2 py-1 border rounded"
          >
            <option value={3}>3 (Easy)</option>
            <option value={4}>4 (Medium)</option>
            <option value={5}>5 (Hard)</option>
            <option value={6}>6 (Expert)</option>
          </select>
        </div>
        
        <button
          onClick={onStartGame}
          disabled={isLoading}
          className="px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {isLoading ? (
            "Starting..."
          ) : (
            <>
              {theme.id === "griot"
                ? "🥁"
                : theme.id === "sage"
                ? "🧘"
                : theme.id === "dreamtime"
                ? "🎨"
                : "🏛️"}{" "}
              Start {gameInfo.name}
            </>
          )}
        </button>
      </div>

      {/* Game Instructions */}
      <div
        className="mt-6 p-4 rounded-lg border"
        style={{
          backgroundColor: theme.colors.background + "80",
          borderColor: theme.colors.primary + "40",
        }}
      >
        <h4
          className="font-semibold mb-2"
          style={{ color: theme.colors.text }}
        >
          {gameInfo.description}
        </h4>
        <ol
          className="text-sm space-y-1"
          style={{ color: theme.colors.text + "80" }}
        >
          <li>1. Choose your difficulty level (3-6 cards)</li>
          <li>
            2. Study the {theme.culture} symbols and their sequence for 15
            seconds
          </li>
          <li>3. Recall the symbols in the correct order</li>
          <li>4. Earn 10 points for each correct selection!</li>
        </ol>
      </div>
    </>
  );
}

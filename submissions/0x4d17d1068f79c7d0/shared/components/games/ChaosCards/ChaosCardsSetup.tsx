"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";

interface ChaosCardsSetupProps {
  theme: CulturalTheme;
  gameInfo: any;
  difficulty: number; // Current active difficulty (may be higher than baseline)
  baselineDifficulty?: number; // User's chosen baseline difficulty
  onDifficultyChange: (difficulty: number) => void;
  onStartGame: () => void;
  isLoading: boolean;
  perfectRounds?: number;
  totalRounds?: number;
}

export function ChaosCardsSetup({
  theme,
  gameInfo,
  difficulty,
  baselineDifficulty = difficulty,
  onDifficultyChange,
  onStartGame,
  isLoading,
  perfectRounds = 0,
  totalRounds = 0,
}: ChaosCardsSetupProps) {
  // Check if difficulty has progressed beyond baseline
  const hasProgressed = difficulty > baselineDifficulty;
  return (
    <>
      {/* Progress Info */}
      {totalRounds > 0 && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ backgroundColor: theme.colors.primary + "10" }}
        >
          <div className="text-center">
            <div
              className="text-sm"
              style={{ color: theme.colors.text + "80" }}
            >
              Progress: {totalRounds} games played • {perfectRounds} perfect
              rounds
            </div>
            {hasProgressed && (
              <div
                className="text-sm mt-1 font-medium"
                style={{ color: theme.colors.primary }}
              >
                🚀 Difficulty increased to {difficulty} cards! (from{" "}
                {baselineDifficulty} baseline)
              </div>
            )}
            {perfectRounds >= 1 && !hasProgressed && (
              <div
                className="text-xs mt-1"
                style={{ color: theme.colors.primary }}
              >
                🎯 Difficulty will increase after {2 - (perfectRounds % 2)} more
                perfect rounds!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Difficulty Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">
            Starting Difficulty:
            {hasProgressed && (
              <span
                className="text-xs ml-1"
                style={{ color: theme.colors.primary }}
              >
                (Currently: {difficulty} cards)
              </span>
            )}
          </label>
          <select
            value={baselineDifficulty}
            onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
            className="px-2 py-1 border rounded"
          >
            <option value={5}>5 (Easy)</option>
            <option value={6}>6 (Medium)</option>
            <option value={7}>7 (Hard)</option>
            <option value={8}>8 (Expert)</option>
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
        <h4 className="font-semibold mb-2" style={{ color: theme.colors.text }}>
          {gameInfo.description}
        </h4>
        <ol
          className="text-sm space-y-1"
          style={{ color: theme.colors.text + "80" }}
        >
          <li>
            1. Choose your starting difficulty: 5-8 cards. Difficulty
            automatically increases with perfect rounds!
          </li>
          <li>
            2. Study the {theme.culture} symbols and their sequence (time
            decreases with difficulty)
          </li>
          <li>3. Use the suggested memory technique for better recall</li>
          <li>4. Recall the symbols in the correct order</li>
          <li>5. Earn 10 points for each correct selection!</li>
        </ol>
      </div>
    </>
  );
}

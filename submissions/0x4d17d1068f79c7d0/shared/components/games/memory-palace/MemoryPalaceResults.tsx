"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { VRFBadge } from "../../VRFVerification";
import { getProgressionContext } from "../shared/utils/gameProgressionUtils";

interface MemoryItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  room: string;
  coordinates: { x: number; y: number };
  culturalContext?: string;
}

interface MemoryPalaceResultsProps {
  theme: CulturalTheme;
  gameInfo: any;
  score: number;
  items: MemoryItem[];
  userGuesses: string[];
  culturalCategory: string;
  lastVerification: any;
  gameMode: string;
  onPlayAgain: () => void;
  isLoading: boolean;
  perfectRounds: number;
  totalRounds: number;
  memoryTechnique: string;
  difficulty: number;
  baselineDifficulty: number;
  scoreBreakdown?: string[];
}

export function MemoryPalaceResults({
  theme,
  gameInfo,
  score,
  items,
  userGuesses,
  culturalCategory,
  lastVerification,
  gameMode,
  onPlayAgain,
  isLoading,
  perfectRounds,
  totalRounds,
  memoryTechnique,
  difficulty,
  baselineDifficulty,
  scoreBreakdown,
}: MemoryPalaceResultsProps) {
  // Calculate accuracy
  const correctGuesses = userGuesses.filter(
    (guess, index) => guess === items[index]?.name
  ).length;
  const accuracy = items.length > 0 ? (correctGuesses / items.length) * 100 : 0;
  const isPerfect = accuracy === 100;

  // Get performance level
  const getPerformanceLevel = (acc: number) => {
    if (acc >= 100)
      return { label: "Perfect!", color: "text-green-600", icon: "🏆" };
    if (acc >= 80)
      return { label: "Excellent", color: "text-blue-600", icon: "⭐" };
    if (acc >= 60)
      return { label: "Good", color: "text-yellow-600", icon: "👍" };
    if (acc >= 40)
      return { label: "Fair", color: "text-orange-600", icon: "📈" };
    return { label: "Keep Practicing", color: "text-red-600", icon: "💪" };
  };

  const performance = getPerformanceLevel(accuracy);

  // Get technique-specific feedback
  const getTechniqueFeedback = (technique: string, acc: number) => {
    const feedbackMap = {
      loci: {
        good: "Excellent use of spatial memory! Your mental palace is strong.",
        improve:
          "Try creating more vivid location-item associations in your palace.",
      },
      journey: {
        good: "Great memory journey! Your route through the palace was effective.",
        improve:
          "Focus on creating stronger connections between items along your path.",
      },
      spatial: {
        good: "Outstanding spatial awareness! You mastered the layout perfectly.",
        improve:
          "Practice visualizing the relative positions and distances more clearly.",
      },
      cultural: {
        good: "Wonderful use of cultural context! The stories enhanced your memory.",
        improve:
          "Try connecting items more deeply to their cultural significance.",
      },
    };

    const feedback =
      feedbackMap[technique as keyof typeof feedbackMap] || feedbackMap.loci;
    return acc >= 70 ? feedback.good : feedback.improve;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {performance.icon}
          </div>
          <div>
            <h2
              className="text-3xl font-bold"
              style={{ color: theme.colors.primary }}
            >
              Memory Palace Complete!
            </h2>
            <p className="text-gray-600">
              Your journey through the palace is finished
            </p>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="text-center">
        <div className="inline-block p-8 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl border-2 border-yellow-200 shadow-lg">
          <div
            className="text-5xl font-bold mb-2"
            style={{ color: theme.colors.primary }}
          >
            {score}
          </div>
          <div className="text-lg text-gray-700 mb-2">Points Earned</div>
          <div className={`text-xl font-semibold ${performance.color}`}>
            {performance.label}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-lg border shadow-sm">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {Math.round(accuracy)}%
          </div>
          <div className="text-sm text-gray-600">Accuracy</div>
          <div className="text-xs text-gray-500 mt-1">
            {correctGuesses}/{items.length} correct
          </div>
        </div>

        <div className="text-center p-6 bg-white rounded-lg border shadow-sm">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {perfectRounds}
          </div>
          <div className="text-sm text-gray-600">Perfect Rounds</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalRounds > 0
              ? Math.round((perfectRounds / totalRounds) * 100)
              : 0}
            % success rate
          </div>
          {/* Progression context using shared utility */}
          <div className="text-xs text-blue-600 mt-2 font-medium">
            {getProgressionContext(perfectRounds)}
          </div>
        </div>

        <div className="text-center p-6 bg-white rounded-lg border shadow-sm">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {difficulty}
          </div>
          <div className="text-sm text-gray-600">Items Memorized</div>
          <div className="text-xs text-gray-500 mt-1">
            {memoryTechnique} technique
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          📝 Detailed Results
        </h3>
        <div className="space-y-3">
          {items.map((item, index) => {
            const userGuess = userGuesses[index];
            const isCorrect = userGuess === item.name;
            const guessedItem = items.find((i) => i.name === userGuess);

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-3 rounded-lg border-2 ${
                  isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <span className="text-sm font-bold text-gray-500 w-8">
                  #{index + 1}
                </span>

                {/* Correct item */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.emoji}
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>

                {/* Result indicator */}
                <div className="flex-1 text-center">
                  {isCorrect ? (
                    <span className="text-green-600 font-semibold">
                      ✓ Correct
                    </span>
                  ) : (
                    <div className="text-red-600">
                      <span className="font-semibold">✗ Incorrect</span>
                      {userGuess && userGuess !== "" ? (
                        <div className="text-xs mt-1">
                          You selected: {guessedItem?.emoji || "❓"} {userGuess}
                        </div>
                      ) : (
                        <div className="text-xs mt-1">
                          Item placed in wrong room
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Breakdown */}
      {scoreBreakdown && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-800 mb-3">
            📊 Score Breakdown
          </h3>
          <div className="space-y-1">
            {scoreBreakdown.map((line, index) => (
              <div key={index} className="text-sm text-blue-700">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technique Feedback */}
      <div
        className="p-6 rounded-lg border-l-4"
        style={{
          backgroundColor: theme.colors.background,
          borderLeftColor: theme.colors.primary,
        }}
      >
        <h3
          className="font-semibold mb-2"
          style={{ color: theme.colors.primary }}
        >
          🧠 Memory Technique Feedback
        </h3>
        <p className="text-gray-700 text-sm">
          {getTechniqueFeedback(memoryTechnique, accuracy)}
        </p>
      </div>

      {/* VRF Verification */}
      {lastVerification && gameMode === "onchain" && (
        <div className="text-center">
          <VRFBadge verificationData={lastVerification} gameMode={gameMode} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onPlayAgain}
          disabled={isLoading}
          className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Building New Palace...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>🏛️</span>
              {(() => {
                const hasProgressed = difficulty > baselineDifficulty;
                if (isPerfect && hasProgressed) {
                  return `Build ${difficulty}-Item Palace`;
                } else if (isPerfect) {
                  return "Build Next Palace";
                } else {
                  return "Build Another Palace";
                }
              })()}
            </div>
          )}
        </button>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-700 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <span>🏠</span>
            Return to Games
          </div>
        </button>
      </div>

      {/* Encouragement Message */}
      <div className="text-center">
        <div className="inline-block p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            {isPerfect
              ? "🎉 Outstanding! You've mastered this palace. Try a higher difficulty!"
              : accuracy >= 70
              ? "🌟 Great work! Your memory palace skills are developing well."
              : "💪 Keep practicing! Each attempt strengthens your memory palace abilities."}
          </p>
        </div>
      </div>
    </div>
  );
}

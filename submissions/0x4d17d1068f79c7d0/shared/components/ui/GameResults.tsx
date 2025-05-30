"use client";

import React from "react";
import { GameResult, GameType } from "../../types/game";
import { GameScoreShare } from "../SocialShare";
import { Trophy, Target, Clock, Star } from "lucide-react";

interface GameResultsProps {
  result: GameResult;
  gameType: GameType;
  onPlayAgain: () => void;
  onBackToMenu?: () => void;
  isLoading?: boolean;
  showShare?: boolean;
  customMessage?: string;
}

export function GameResults({
  result,
  gameType,
  onPlayAgain,
  onBackToMenu,
  isLoading = false,
  showShare = true,
  customMessage,
}: GameResultsProps) {
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: "Excellent", color: "green", icon: "🏆" };
    if (accuracy >= 75) return { level: "Great", color: "blue", icon: "🎯" };
    if (accuracy >= 60) return { level: "Good", color: "yellow", icon: "👍" };
    return { level: "Keep Practicing", color: "gray", icon: "💪" };
  };

  const performance = getPerformanceLevel(result.accuracy);

  return (
    <div className="space-y-6">
      {/* Main Results Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        {/* Performance Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${performance.color}-100 text-${performance.color}-800 font-medium mb-4`}>
          <span className="text-lg">{performance.icon}</span>
          {performance.level}
        </div>

        {/* Score Display */}
        <div className="mb-6">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {result.score}
          </div>
          <div className="text-lg text-gray-600">
            Final Score
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Accuracy</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {result.accuracy}%
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-700">Duration</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-700">Perfect</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {result.perfect ? "Yes!" : "No"}
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="flex justify-center gap-2 mb-6">
          {result.perfect && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              🎯 Perfect Score
            </div>
          )}
          {result.newRecord && (
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              🏆 New Record
            </div>
          )}
          {result.accuracy >= 90 && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ⭐ Master Level
            </div>
          )}
        </div>

        {/* Custom Message */}
        {customMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{customMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Play Again
              </>
            )}
          </button>

          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Menu
            </button>
          )}

          {showShare && result.accuracy >= 70 && (
            <GameScoreShare
              gameType={gameType}
              score={result.score}
              accuracy={result.accuracy}
            />
          )}
        </div>
      </div>

      {/* Memory Tip */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
          <span>🧠</span>
          Memory Master Tip
        </h4>
        <p className="text-purple-700 text-sm">
          {getMemoryTip(result.accuracy)}
        </p>
      </div>
    </div>
  );
}

function getMemoryTip(accuracy: number): string {
  if (accuracy >= 90) {
    return "Excellent work! You're mastering the ancient art of memory. Try increasing the difficulty or exploring new memory techniques to continue your growth.";
  } else if (accuracy >= 75) {
    return "Great progress! Focus on creating more vivid and unusual mental images. The more absurd and memorable, the better your recall will be.";
  } else if (accuracy >= 60) {
    return "Good effort! Try the Method of Loci - associate each item with a specific location in a familiar place. Walk through that place mentally to recall the sequence.";
  } else {
    return "Keep practicing! Start with easier difficulties and focus on one memory technique at a time. Consistency is key to building your memory palace.";
  }
}

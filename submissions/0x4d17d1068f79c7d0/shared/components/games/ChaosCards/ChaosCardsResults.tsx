"use client";

import React, { useState, useEffect } from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { GameScoreShare } from "../../SocialShare";
import { VRFBadge } from "../../VRFVerification";
import { ProgressiveEnhancement } from "../../ProgressiveEnhancement";
import { Card } from "../shared";
import { getProgressionContext } from "../shared/utils/gameProgressionUtils";

interface ChaosCardsResultsProps {
  theme: CulturalTheme;
  gameInfo: any;
  score: number;
  cards: Card[];
  culturalCategory: string;
  lastVerification: any;
  gameMode: "offchain" | "onchain";
  onPlayAgain: () => void;
  isLoading: boolean;
  perfectRounds?: number;
  totalRounds?: number;
  memoryTechnique?: string;
  difficulty?: number;
  baselineDifficulty?: number;
  userSequence?: string[]; // Add user's answers
  scoreBreakdown?: string[]; // Add score breakdown
}

export function ChaosCardsResults({
  theme,
  gameInfo,
  score,
  cards,
  culturalCategory,
  lastVerification,
  gameMode,
  onPlayAgain,
  isLoading,
  perfectRounds = 0,
  totalRounds = 0,
  memoryTechnique = "observation",
  difficulty = cards.length,
  baselineDifficulty = 5,
  userSequence = [],
  scoreBreakdown = [],
}: ChaosCardsResultsProps) {
  // Local state to override loading when save completes
  const [localLoading, setLocalLoading] = useState(isLoading);

  // Reset local loading state after a delay to ensure save completes
  useEffect(() => {
    if (isLoading) {
      setLocalLoading(true);
      // Set a timeout to reset loading state
      const timeout = setTimeout(() => {
        setLocalLoading(false);
      }, 3000); // 3 second timeout
      return () => clearTimeout(timeout);
    } else {
      setLocalLoading(false);
    }
  }, [isLoading]);

  // Calculate accuracy based on correct answers, not score comparison
  const correctAnswers = userSequence.filter(
    (answer, index) => answer === cards[index]?.id
  ).length;
  const accuracy = Math.round((correctAnswers / cards.length) * 100);
  const isPerfect = correctAnswers === cards.length;

  // Calculate max score for other purposes
  const basePointsPerCard = 5 + Math.max(0, (difficulty - 5) * 2);
  const maxScore = cards.length * basePointsPerCard;

  // Memory science insights
  const getMemoryInsight = (cardCount: number, isPerfect: boolean) => {
    if (cardCount <= 5) {
      return isPerfect
        ? "🧠 Excellent! You're mastering basic short-term memory capacity."
        : "💡 Tip: Try grouping items into meaningful chunks to improve recall.";
    } else if (cardCount === 7) {
      return isPerfect
        ? "🎯 Amazing! You've reached Miller's 'magical number seven' - the average limit of short-term memory!"
        : "📚 You're approaching the 'magical number seven' - the typical limit of human short-term memory.";
    } else if (cardCount >= 8) {
      return isPerfect
        ? "🚀 Incredible! You're exceeding normal short-term memory limits - you're developing expert-level memory techniques!"
        : "🧩 Challenge accepted! You're pushing beyond normal memory limits. Try advanced techniques like the Method of Loci.";
    }
    return "";
  };

  const memoryInsight = getMemoryInsight(cards.length, isPerfect);
  const hasProgressed = difficulty > baselineDifficulty;
  const nextMilestone = difficulty < 7 ? 7 : difficulty < 10 ? 10 : 12;

  // Enhanced color scheme
  const colors = {
    success: "#10b981", // emerald-500
    error: "#ef4444", // red-500
    warning: "#f59e0b", // amber-500
    info: "#3b82f6", // blue-500
    purple: "#8b5cf6", // violet-500
    successBg: "#ecfdf5", // emerald-50
    errorBg: "#fef2f2", // red-50
    warningBg: "#fffbeb", // amber-50
    infoBg: "#eff6ff", // blue-50
    purpleBg: "#f5f3ff", // violet-50
  };

  return (
    <div className="p-8 text-center space-y-4">
      <h3
        className="text-2xl font-bold mb-2"
        style={{ color: theme.colors.text }}
      >
        {gameInfo.name} Complete! {isPerfect ? "🎯" : "🎉"}
      </h3>

      <div className="space-y-2">
        <p className="text-lg font-bold">Final Score: {score} points</p>
        <p className="text-sm" style={{ color: theme.colors.text }}>
          Accuracy: {accuracy}% • Level {cards.length} • {memoryTechnique}{" "}
          technique
        </p>

        {/* Enhanced Score Breakdown (optimized rendering) */}
        {scoreBreakdown?.length > 0 && (
          <div
            className="mt-3 p-3 rounded-lg"
            style={{
              backgroundColor: colors.infoBg,
              border: `1px solid ${colors.info}30`,
            }}
          >
            <h4
              className="text-sm font-medium mb-2"
              style={{ color: colors.info }}
            >
              🎯 Score Breakdown
            </h4>
            <div className="space-y-1">
              {scoreBreakdown.map((item, index) => (
                <div
                  key={`breakdown-${index}`}
                  className="text-xs"
                  style={{ color: theme.colors.text }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Answer Breakdown */}
      <div className="space-y-3">
        <h4
          className="text-sm sm:text-base font-medium text-center"
          style={{ color: theme.colors.text }}
        >
          Your Sequence vs Correct Order
        </h4>
        <div className="grid grid-cols-1 gap-2 w-full">
          {cards.map((card, index) => {
            const userAnswer = userSequence[index];
            const isCorrect = userAnswer === card.id;
            const userCard = cards.find((c) => c.id === userAnswer);

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: isCorrect
                    ? colors.successBg
                    : colors.errorBg,
                  borderColor: isCorrect ? colors.success : colors.error,
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span
                    className="text-xs sm:text-sm font-medium px-2 py-1 rounded flex-shrink-0"
                    style={{
                      backgroundColor: isCorrect
                        ? colors.success
                        : colors.error,
                      color: "white",
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xl sm:text-2xl flex-shrink-0">
                    {card.emoji}
                  </span>
                  <span className="text-sm sm:text-base font-medium truncate">
                    {card.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isCorrect ? (
                    <span
                      className="text-lg sm:text-xl"
                      style={{ color: colors.success }}
                    >
                      ✓
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span
                        className="text-lg sm:text-xl"
                        style={{ color: colors.error }}
                      >
                        ✗
                      </span>
                      {userCard && (
                        <div
                          className="text-xs sm:text-sm flex items-center gap-1"
                          style={{ color: colors.error }}
                        >
                          <span className="hidden sm:inline">You:</span>
                          <span>{userCard.emoji}</span>
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

      {/* Memory Science Insight */}
      {memoryInsight && (
        <div
          className="p-3 rounded-lg border-l-4"
          style={{
            backgroundColor:
              cards.length >= 7 ? colors.purpleBg : colors.infoBg,
            borderLeftColor: cards.length >= 7 ? colors.purple : colors.info,
          }}
        >
          <div
            className="text-sm font-medium"
            style={{
              color: cards.length >= 7 ? colors.purple : colors.info,
            }}
          >
            {memoryInsight}
          </div>
        </div>
      )}

      {/* Progress & Achievement Info */}
      <div
        className="p-3 rounded-lg space-y-2"
        style={{
          backgroundColor: isPerfect ? colors.successBg : colors.warningBg,
          border: `1px solid ${isPerfect ? colors.success : colors.warning}`,
        }}
      >
        <div className="text-sm space-y-1">
          <div style={{ color: theme.colors.text }}>
            Perfect Rounds: {isPerfect ? perfectRounds + 1 : perfectRounds} •
            Total Games: {totalRounds}
          </div>

          {/* Always show progression context using shared utility */}
          <div className="text-xs font-medium" style={{ color: colors.info }}>
            {getProgressionContext(
              isPerfect ? perfectRounds + 1 : perfectRounds
            )}
          </div>

          {hasProgressed && (
            <div
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: colors.purple }}
            >
              🚀 Progressed from {baselineDifficulty} to {difficulty} cards!
            </div>
          )}

          {isPerfect && (
            <div
              style={{ color: colors.success }}
              className="font-medium flex items-center gap-1"
            >
              🎯 Perfect round!
            </div>
          )}

          {/* Mastery Progress */}
          <div
            className="text-xs mt-2 pt-2 border-t"
            style={{
              borderColor: isPerfect
                ? colors.success + "40"
                : colors.warning + "40",
            }}
          >
            <div style={{ color: theme.colors.text }}>
              Journey to Mastery: {difficulty} cards
              {difficulty < nextMilestone &&
                ` → Next milestone: ${nextMilestone} cards`}
            </div>
            {difficulty >= 7 && (
              <div
                className="text-xs mt-1 flex items-center gap-1"
                style={{ color: colors.purple }}
              >
                🏆 You've surpassed average human short-term memory capacity!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-4">
        <button
          onClick={onPlayAgain}
          disabled={localLoading}
          className="px-4 sm:px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg text-sm sm:text-base touch-target"
          style={{
            backgroundColor: isPerfect ? colors.success : colors.info,
            boxShadow: `0 4px 12px ${
              isPerfect ? colors.success : colors.info
            }30`,
          }}
        >
          {localLoading
            ? "Saving..."
            : (() => {
                const hasProgressed = difficulty > baselineDifficulty;
                if (isPerfect && hasProgressed) {
                  return `🚀 Continue at ${difficulty} Cards`;
                } else if (isPerfect) {
                  return "🎯 Continue Journey";
                } else {
                  return "🔄 Try Again";
                }
              })()}
        </button>

        {score >= 30 && (
          <GameScoreShare
            gameType={`cultural_chaos_cards_${culturalCategory}`}
            score={score}
            accuracy={accuracy}
          />
        )}
      </div>

      {/* VRF Verification Details */}
      {lastVerification && (
        <div className="mt-4">
          <VRFBadge verificationData={lastVerification} gameMode={gameMode} />
        </div>
      )}

      {/* Progressive Enhancement for Anonymous Users */}
      <div className="mt-4">
        <ProgressiveEnhancement
          gameResult={{
            score,
            accuracy: score / maxScore,
            perfect: score === maxScore,
          }}
        />
      </div>
    </div>
  );
}

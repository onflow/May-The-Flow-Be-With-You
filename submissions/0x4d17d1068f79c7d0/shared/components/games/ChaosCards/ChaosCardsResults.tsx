"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { GameScoreShare } from "../../SocialShare";
import { VRFVerification } from "../../VRFVerification";
import { ProgressiveEnhancement } from "../../ProgressiveEnhancement";

interface Card {
  id: string;
  symbol: string;
  name: string;
  color: string;
  culturalContext?: string;
}

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
}: ChaosCardsResultsProps) {
  const accuracy = Math.round((score / (cards.length * 10)) * 100);
  const maxScore = cards.length * 10;
  const isPerfect = score === maxScore;

  return (
    <div className="text-center space-y-4">
      <h3
        className="text-2xl font-bold mb-2"
        style={{ color: theme.colors.text }}
      >
        {gameInfo.name} Complete! {isPerfect ? "🎯" : "🎉"}
      </h3>

      <div className="space-y-2">
        <p className="text-lg">
          Final Score: {score} / {maxScore}
        </p>
        <p className="text-sm" style={{ color: theme.colors.text + "80" }}>
          Accuracy: {accuracy}% • Level {cards.length} • {memoryTechnique}{" "}
          technique
        </p>
      </div>

      {/* Progress & Achievement Info */}
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: theme.colors.primary + "10" }}
      >
        <div className="text-sm space-y-1">
          <div style={{ color: theme.colors.text + "80" }}>
            Perfect Rounds: {isPerfect ? perfectRounds + 1 : 0} • Total Games:{" "}
            {totalRounds}
          </div>
          {isPerfect && (
            <div
              style={{ color: theme.colors.primary }}
              className="font-medium"
            >
              🎯 Perfect round!{" "}
              {(perfectRounds + 1) % 2 === 0
                ? "Difficulty will increase next game!"
                : ""}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center mb-4">
        <button
          onClick={onPlayAgain}
          disabled={isLoading}
          className="px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {isLoading ? "Saving..." : "🔄 Play Again"}
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
          <VRFVerification
            verificationData={lastVerification}
            gameMode={gameMode}
          />
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

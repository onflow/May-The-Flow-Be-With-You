"use client";

import React, { useState } from "react";
import { getThemeByCategory } from "../../../config/culturalThemes";
import { ModeSelector } from "../../ModeSelector";
import { VRFBadge } from "../../VRFVerification";
import { ChaosCardsSetup } from "./ChaosCardsSetup";
import { ChaosCardsMemorize } from "./ChaosCardsMemorize";
import { ChaosCardsRecall } from "./ChaosCardsRecall";
import { ChaosCardsResults } from "./ChaosCardsResults";
import { ChaosCardsDisplay } from "./ChaosCardsDisplay";
import { useChaosCardsGame } from "./hooks/useChaosCardsGame";

interface ChaosCardsGameProps {
  culturalCategory?: string;
}

export function ChaosCardsGame({
  culturalCategory = "randomness-revolution",
}: ChaosCardsGameProps) {
  const theme = getThemeByCategory(culturalCategory);
  const gameInfo = theme.gameAdaptations.cardGame;
  const [showModeSelector, setShowModeSelector] = useState(false);

  const {
    gameState,
    isLoading,
    error,
    lastVerification,
    gameMode,
    startGame,
    handleCardSelect,
    handleDifficultyChange,
    handleReset,
    timeLeft,
    memoryTechnique,
    culturalStory,
    perfectRounds,
    totalRounds,
    cards,
    shuffledCards,
  } = useChaosCardsGame(culturalCategory, theme);

  const renderGamePhase = () => {
    switch (gameState.phase) {
      case "setup":
        return (
          <ChaosCardsSetup
            theme={theme}
            gameInfo={gameInfo}
            difficulty={gameState.gameData.difficulty}
            onDifficultyChange={handleDifficultyChange}
            onStartGame={startGame}
            isLoading={isLoading}
            perfectRounds={perfectRounds}
            totalRounds={totalRounds}
          />
        );

      case "memorize":
        return (
          <ChaosCardsMemorize
            theme={theme}
            timeLeft={timeLeft}
            memoryTechnique={memoryTechnique}
            culturalStory={culturalStory}
            difficulty={gameState.gameData.difficulty}
            perfectRounds={perfectRounds}
          />
        );

      case "recall":
        return (
          <ChaosCardsRecall
            theme={theme}
            cards={cards} // Use original sequence for progress indicator
            currentGuess={gameState.gameData.currentGuess}
          />
        );

      case "results":
        return (
          <ChaosCardsResults
            theme={theme}
            gameInfo={gameInfo}
            score={gameState.score}
            cards={cards} // Use original sequence for results
            culturalCategory={culturalCategory}
            lastVerification={lastVerification}
            gameMode={gameMode}
            onPlayAgain={startGame}
            isLoading={isLoading}
            perfectRounds={perfectRounds}
            totalRounds={totalRounds}
            memoryTechnique={memoryTechnique}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full">
      {/* Mode Selector */}
      {showModeSelector && (
        <div className="mb-6">
          <ModeSelector
            currentMode={gameMode}
            onModeChange={(mode) => {
              setShowModeSelector(false);
              handleReset();
            }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Game Header */}
      <div
        className="mb-6 p-4 rounded-lg border-2"
        style={{
          background: `linear-gradient(to right, ${theme.colors.background}, ${theme.colors.background}DD)`,
          borderColor: theme.colors.primary + "40",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 items-center">
            <div className="text-sm">
              <span className="font-semibold">Phase:</span> {gameState.phase}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Score:</span> {gameState.score}
            </div>
            {gameState.phase === "memorize" && (
              <div className="text-sm">
                <span className="font-semibold">Time:</span> {timeLeft}s
              </div>
            )}

            {/* VRF Badge */}
            {lastVerification && (
              <VRFBadge
                verificationData={lastVerification}
                gameMode={gameMode}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle Button */}
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {gameMode === "onchain" ? "🏆 Competitive" : "🎮 Practice"} Mode
            </button>
          </div>
        </div>

        {/* Phase-specific content */}
        {renderGamePhase()}
      </div>

      {/* Game Status Display */}
      <div
        className="mb-6 p-4 rounded-lg border"
        style={{
          backgroundColor: theme.colors.background + "40",
          borderColor: theme.colors.primary + "20",
        }}
      >
        {/* Cards Display */}
        {gameState.gameData.cards.length > 0 && (
          <ChaosCardsDisplay
            theme={theme}
            cards={gameState.phase === "recall" ? shuffledCards : cards}
            phase={gameState.phase}
            userSequence={gameState.gameData.userSequence}
            onCardSelect={handleCardSelect}
          />
        )}
      </div>
    </div>
  );
}

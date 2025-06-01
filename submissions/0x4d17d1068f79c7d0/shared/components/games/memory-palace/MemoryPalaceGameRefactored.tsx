"use client";

import React, { useState, useEffect } from "react";
import { getThemeByCategory } from "../../../config/culturalThemes";
import {
  useGameCore,
  useGameTimer,
  MemoryPalaceGameData,
  generatePalaceLayout,
  generateMemoryItems,
  calculateMemoryPalaceScore,
  createMemoryPalaceStory,
} from "../shared";
import { GameHeader } from "../shared/components/GameHeader";
import { MemoryPalaceSetup } from "./MemoryPalaceSetup";
import { MemoryPalaceLearn } from "./MemoryPalaceLearn";
import { MemoryPalaceMemorize } from "./MemoryPalaceMemorize";
import { MemoryPalaceRecall } from "./MemoryPalaceRecall";
import { MemoryPalaceResults } from "./MemoryPalaceResults";
import {
  calculateProgressiveDifficulty,
  calculatePerfectRounds,
  createEnhancedScoreResult,
} from "../shared/utils/gameProgressionUtils";

interface MemoryPalaceGameRefactoredProps {
  culturalCategory?: string;
}

export function MemoryPalaceGameRefactored({
  culturalCategory = "randomness-revolution",
}: MemoryPalaceGameRefactoredProps) {
  const theme = getThemeByCategory(culturalCategory);
  const gameInfo = theme.gameAdaptations.memoryPalace;
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showItems, setShowItems] = useState(false); // Track if items should be visible

  // Using shared progressive difficulty calculation

  // Calculate memorization time based on difficulty
  const calculateMemorizationTime = (difficulty: number) => {
    // Start at 25s for 4 items, reduce by 2s per difficulty level above 4, min 10s
    return Math.max(25 - (difficulty - 4) * 2, 10);
  };

  // Initial game data
  const initialGameData: MemoryPalaceGameData = {
    rooms: [],
    items: [],
    userPath: [],
    userGuesses: [],
    currentGuess: 0,
    difficulty: 4, // Start with 4 items like Chaos Cards
    baselineDifficulty: 4,
    perfectRounds: 0,
    totalRounds: 0,
    memoryTechnique: "loci",
    culturalStory: "",
  };

  // Generate game content function
  const generateGameContent = async (
    seed: number,
    gameData: MemoryPalaceGameData
  ) => {
    const rooms = generatePalaceLayout(
      seed,
      culturalCategory,
      gameData.difficulty
    );
    const items = generateMemoryItems(
      seed,
      rooms,
      culturalCategory,
      gameData.difficulty
    );
    const culturalStory = createMemoryPalaceStory(
      gameData.memoryTechnique,
      culturalCategory,
      theme.name
    );

    return {
      rooms,
      items,
      culturalStory,
      userPath: [],
      userGuesses: [],
      currentGuess: 0,
    };
  };

  // Enhanced score calculation function
  const calculateScore = (
    gameData: MemoryPalaceGameData,
    timeSpent: number
  ) => {
    const isProgression = gameData.difficulty > gameData.baselineDifficulty;
    return calculateMemoryPalaceScore(
      gameData.userGuesses,
      gameData.items,
      timeSpent,
      gameData.difficulty,
      gameData.memoryTechnique,
      isProgression
    );
  };

  // Use shared game core
  const {
    gameState,
    isLoading,
    error,
    lastVerification,
    gameMode,
    startGame,
    handleDifficultyChange,
    handleTechniqueChange,
    nextPhase,
    completeGame,
    handleReset,
    updateGameData,
  } = useGameCore({
    gameType: "memory_palace",
    culturalCategory,
    initialGameData,
    generateGameContent,
    calculateScore,
  });

  // Timer for memorize and recall phases
  const timer = useGameTimer({
    initialTime: calculateMemorizationTime(gameState.gameData.difficulty),
    onTimeUp: () => {
      if (gameState.phase === "memorize") {
        nextPhase("recall", 60);
      } else if (gameState.phase === "recall") {
        completeGame(60);
      }
    },
  });

  // Handle item selection during recall
  const handleItemGuess = (itemName: string) => {
    if (gameState.phase !== "recall") return;

    const newUserGuesses = [...gameState.gameData.userGuesses, itemName];
    const isComplete = newUserGuesses.length >= gameState.gameData.items.length;

    updateGameData({
      userGuesses: newUserGuesses,
      currentGuess: gameState.gameData.currentGuess + 1,
    });

    if (isComplete) {
      timer.stop();
      console.log("🔍 Memory Palace game complete! Calling completeGame...");

      // Calculate if this was a perfect round
      const correctAnswers = newUserGuesses.filter(
        (guess, index) => guess === gameState.gameData.items[index]?.name
      ).length;
      const isPerfectRound = correctAnswers === gameState.gameData.items.length;

      console.log("🔍 Memory Palace results:", {
        correctAnswers,
        totalItems: gameState.gameData.items.length,
        isPerfectRound,
        timeSpent: 60 - timer.timeLeft,
      });

      // Update perfect rounds and calculate new difficulty
      const newPerfectRounds = isPerfectRound
        ? gameState.gameData.perfectRounds + 1
        : gameState.gameData.perfectRounds;
      const newDifficulty = calculateProgressiveDifficulty(
        gameState.gameData.baselineDifficulty,
        newPerfectRounds
      );

      // Update game data before completing
      updateGameData({
        perfectRounds: newPerfectRounds,
        difficulty: newDifficulty,
        totalRounds: gameState.gameData.totalRounds + 1,
      });

      // Calculate score for this completion
      const timeSpent = 60 - timer.timeLeft;
      const isProgression =
        newDifficulty > gameState.gameData.baselineDifficulty;
      const scoreResult = calculateMemoryPalaceScore(
        newUserGuesses,
        gameState.gameData.items,
        timeSpent,
        gameState.gameData.difficulty,
        gameState.gameData.memoryTechnique,
        isProgression
      );

      console.log(
        "🔍 Memory Palace calling completeGame with timeSpent:",
        timeSpent
      );
      completeGame(timeSpent, scoreResult);
    }
  };

  // Handle complete submission from recall component
  const handleCompleteSubmission = (userGuesses: string[]) => {
    console.log(
      "🔍 Memory Palace handleCompleteSubmission called with:",
      userGuesses
    );
    if (gameState.phase !== "recall") return;

    timer.stop();

    // Calculate if this was a perfect round
    const correctAnswers = userGuesses.filter(
      (guess, index) => guess === gameState.gameData.items[index]?.name
    ).length;
    const isPerfectRound = correctAnswers === gameState.gameData.items.length;

    // Update perfect rounds and calculate new difficulty using shared utilities
    const newPerfectRounds = calculatePerfectRounds(
      gameState.gameData.perfectRounds,
      isPerfectRound
    );
    const newDifficulty = calculateProgressiveDifficulty(
      gameState.gameData.baselineDifficulty,
      newPerfectRounds
    );

    // Create updated game data with the user guesses
    const updatedGameData = {
      ...gameState.gameData,
      userGuesses,
      perfectRounds: newPerfectRounds,
      difficulty: newDifficulty,
      totalRounds: gameState.gameData.totalRounds + 1,
      currentGuess: userGuesses.length,
    };

    // Update game data
    updateGameData(updatedGameData);

    // Calculate score with the updated data
    const timeSpent = 60 - timer.timeLeft;
    const isProgression =
      updatedGameData.difficulty > updatedGameData.baselineDifficulty;
    const scoreResult = calculateMemoryPalaceScore(
      updatedGameData.userGuesses,
      updatedGameData.items,
      timeSpent,
      updatedGameData.difficulty,
      updatedGameData.memoryTechnique,
      isProgression
    );

    // Calculate accuracy for the game result
    const accuracy = (correctAnswers / gameState.gameData.items.length) * 100;

    // Enhanced score result using shared utility
    const enhancedScoreResult = createEnhancedScoreResult(
      scoreResult,
      accuracy,
      newPerfectRounds
    );

    completeGame(timeSpent, enhancedScoreResult);
  };

  // Start memorize phase
  const startMemorizePhase = () => {
    setShowItems(true); // Show items when memorization starts
    const memorizationTime = calculateMemorizationTime(
      gameState.gameData.difficulty
    );
    nextPhase("memorize", memorizationTime);
    timer.reset(memorizationTime);
    timer.start();
  };

  // Reset item visibility when starting a new game
  useEffect(() => {
    if (gameState.phase === "setup" || gameState.phase === "learn") {
      setShowItems(false);
    }
  }, [gameState.phase]);

  // Start recall phase
  const startRecallPhase = () => {
    nextPhase("recall", 60);
    timer.reset(60);
    timer.start();
  };

  const renderGamePhase = () => {
    switch (gameState.phase) {
      case "setup":
        return (
          <MemoryPalaceSetup
            theme={theme}
            gameInfo={gameInfo}
            difficulty={gameState.gameData.difficulty}
            baselineDifficulty={gameState.gameData.baselineDifficulty}
            memoryTechnique={gameState.gameData.memoryTechnique}
            onDifficultyChange={handleDifficultyChange}
            onTechniqueChange={handleTechniqueChange}
            onStartGame={startGame}
            isLoading={isLoading}
            perfectRounds={gameState.gameData.perfectRounds}
            totalRounds={gameState.gameData.totalRounds}
          />
        );

      case "learn":
        return (
          <MemoryPalaceLearn
            theme={theme}
            rooms={gameState.gameData.rooms}
            items={gameState.gameData.items}
            memoryTechnique={gameState.gameData.memoryTechnique}
            culturalStory={gameState.gameData.culturalStory}
            difficulty={gameState.gameData.difficulty}
            showItems={showItems}
            onStartMemorize={startMemorizePhase}
          />
        );

      case "memorize":
        return (
          <MemoryPalaceMemorize
            theme={theme}
            rooms={gameState.gameData.rooms}
            items={gameState.gameData.items}
            timeLeft={timer.timeLeft}
            memoryTechnique={gameState.gameData.memoryTechnique}
            culturalStory={gameState.gameData.culturalStory}
            difficulty={gameState.gameData.difficulty}
            perfectRounds={gameState.gameData.perfectRounds}
            onStartRecall={startRecallPhase}
          />
        );

      case "recall":
        return (
          <MemoryPalaceRecall
            theme={theme}
            rooms={gameState.gameData.rooms}
            items={gameState.gameData.items}
            userGuesses={gameState.gameData.userGuesses}
            currentGuess={gameState.gameData.currentGuess}
            timeLeft={timer.timeLeft}
            onItemGuess={handleItemGuess}
            onCompleteSubmission={handleCompleteSubmission}
            onPlaceItem={(itemId, roomId, position) => {
              // This will be handled by the new recall component internally
              console.log(
                "Item placed:",
                itemId,
                "in room:",
                roomId,
                "at position:",
                position
              );
            }}
          />
        );

      case "results":
        return (
          <MemoryPalaceResults
            theme={theme}
            gameInfo={gameInfo}
            score={gameState.score}
            items={gameState.gameData.items}
            userGuesses={gameState.gameData.userGuesses}
            culturalCategory={culturalCategory}
            lastVerification={lastVerification}
            gameMode={gameMode}
            onPlayAgain={startGame}
            isLoading={isLoading}
            perfectRounds={gameState.gameData.perfectRounds}
            totalRounds={gameState.gameData.totalRounds}
            memoryTechnique={gameState.gameData.memoryTechnique}
            difficulty={gameState.gameData.difficulty}
            baselineDifficulty={gameState.gameData.baselineDifficulty}
            scoreBreakdown={gameState.gameData.scoreBreakdown}
          />
        );

      case "loading":
        return (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Generating palace...</span>
          </div>
        );

      case "error":
        return (
          <div className="text-center p-8">
            <div className="text-red-600 mb-4">⚠️ {error}</div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Shared Game Header */}
      <GameHeader
        theme={theme}
        gameInfo={gameInfo}
        gameIcon="🏛️"
        gameMode={gameMode}
        lastVerification={lastVerification}
        showModeSelector={showModeSelector}
        onToggleModeSelector={() => setShowModeSelector(true)}
        onCloseModeSelector={() => setShowModeSelector(false)}
        gameType="memory_palace"
      />

      {/* Game Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {renderGamePhase()}
      </div>
    </div>
  );
}

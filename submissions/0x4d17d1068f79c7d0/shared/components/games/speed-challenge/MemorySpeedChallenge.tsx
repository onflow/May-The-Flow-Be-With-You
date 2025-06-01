"use client";

import React, { useState } from "react";
import { getThemeByCategory } from "../../../config/culturalThemes";
import {
  useGameCore,
  useGameTimer,
  SpeedChallengeGameData,
  SpeedItem,
  generateSpeedItems,
  calculateSpeedChallengeScore,
  createSpeedChallengeStory,
  MEMORY_TECHNIQUES,
  DIFFICULTY_LEVELS,
} from "../shared";
import { GameHeader } from "../shared/components/GameHeader";
import {
  calculatePerfectRounds,
  createEnhancedScoreResult,
  getProgressionContext,
} from "../shared/utils/gameProgressionUtils";

interface SpeedChallengeProps {
  culturalCategory?: string;
}

export default function MemorySpeedChallenge({
  culturalCategory = "randomness-revolution",
}: SpeedChallengeProps) {
  const theme = getThemeByCategory(culturalCategory);

  // Using shared progressive difficulty calculation

  // Initial game data for Speed Challenge
  const initialGameData: SpeedChallengeGameData = {
    difficulty: 5,
    baselineDifficulty: 5,
    perfectRounds: 0,
    totalRounds: 0,
    memoryTechnique: "chunking",
    culturalStory: "",
    items: [],
    currentSequence: [],
    userAnswers: [],
    currentStep: 0,
    sequenceLength: 5,
    challengeType: "recall",
    timePerItem: 2,
  };

  // Generate game content function
  const generateGameContent = async (
    seed: number,
    gameData: SpeedChallengeGameData
  ) => {
    const items = generateSpeedItems(
      seed,
      culturalCategory,
      gameData.difficulty,
      gameData.memoryTechnique
    );
    const culturalStory = createSpeedChallengeStory(
      gameData.memoryTechnique,
      culturalCategory,
      theme.name
    );

    return {
      items,
      currentSequence: items.slice(0, gameData.sequenceLength),
      culturalStory,
      userAnswers: [],
      currentStep: 0,
    };
  };

  // Calculate score function
  const calculateScore = (
    gameData: SpeedChallengeGameData,
    timeSpent: number
  ) => {
    return calculateSpeedChallengeScore(
      gameData.userAnswers,
      gameData.currentSequence,
      timeSpent,
      gameData.memoryTechnique
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
    gameType: "speed_challenge",
    culturalCategory,
    initialGameData,
    generateGameContent,
    calculateScore,
  });

  // Timer for memorize and recall phases
  const timer = useGameTimer({
    initialTime: 30,
    onTimeUp: () => {
      if (gameState.phase === "memorize") {
        nextPhase("recall", 60);
      } else if (gameState.phase === "recall") {
        completeGame(60);
      }
    },
  });

  // Current input state
  const [currentInput, setCurrentInput] = useState("");

  // Mode selector state
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Game info for header
  const gameInfo = theme.gameAdaptations?.speedChallenge || {
    name: "Speed Challenge",
    description: "Rapid memory encoding and recall training",
    culturalContext: `Train your memory speed using ${theme.name} traditions and proven memory techniques.`,
  };

  // Handle user input for current step
  const handleAnswer = (answer: string) => {
    const newAnswers = [...gameState.gameData.userAnswers];
    newAnswers[gameState.gameData.currentStep] = answer;

    const nextStep = gameState.gameData.currentStep + 1;
    const isComplete = nextStep >= gameState.gameData.currentSequence.length;

    if (isComplete) {
      console.log("🔍 Speed Challenge game complete! Calling completeGame...");

      // Calculate if this was a perfect round
      const correctAnswers = newAnswers.filter(
        (userAnswer, index) =>
          userAnswer.toLowerCase() ===
          gameState.gameData.currentSequence[index]?.value.toLowerCase()
      ).length;
      const isPerfectRound =
        correctAnswers === gameState.gameData.currentSequence.length;

      console.log("🔍 Speed Challenge results:", {
        newAnswers,
        correctAnswers,
        totalItems: gameState.gameData.currentSequence.length,
        isPerfectRound,
        timeSpent: 60 - timer.timeLeft,
      });

      // Update perfect rounds using shared utility
      const newPerfectRounds = calculatePerfectRounds(
        gameState.gameData.perfectRounds,
        isPerfectRound
      );

      // Create updated game data with the user answers and perfect rounds
      const updatedGameData = {
        ...gameState.gameData,
        userAnswers: newAnswers,
        currentStep: gameState.gameData.currentStep,
        perfectRounds: newPerfectRounds,
        totalRounds: gameState.gameData.totalRounds + 1,
      };

      // Update game data
      updateGameData(updatedGameData);

      // Calculate score with the updated data
      const timeSpent = 60 - timer.timeLeft;
      const scoreResult = calculateScore(updatedGameData, timeSpent);

      // Calculate accuracy for the game result
      const accuracy =
        (correctAnswers / gameState.gameData.currentSequence.length) * 100;

      // Enhanced score result using shared utility
      const enhancedScoreResult = createEnhancedScoreResult(
        scoreResult,
        accuracy,
        newPerfectRounds
      );

      console.log(
        "🔍 Speed Challenge calculated score with perfect rounds:",
        enhancedScoreResult
      );

      console.log(
        "🔍 Speed Challenge calling completeGame with timeSpent:",
        timeSpent
      );
      completeGame(timeSpent, enhancedScoreResult);
    } else {
      updateGameData({
        userAnswers: newAnswers,
        currentStep: nextStep,
      });
    }
  };

  // Submit current answer
  const submitAnswer = () => {
    if (!currentInput.trim()) return;
    handleAnswer(currentInput.trim());
    setCurrentInput("");
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitAnswer();
    }
  };

  // Start memorize phase
  const startMemorizePhase = () => {
    timer.reset(
      gameState.gameData.timePerItem * gameState.gameData.sequenceLength
    );
    timer.start();
    nextPhase("memorize");
  };

  // Start recall phase
  const startRecallPhase = () => {
    timer.reset(60); // 60 seconds for recall
    timer.start();
    nextPhase("recall");
  };

  // Item display component
  const ItemDisplay = ({
    item,
    showAnswer = false,
  }: {
    item: SpeedItem;
    showAnswer?: boolean;
  }) => {
    if (item.type === "color") {
      return (
        <div className="flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          {showAnswer && (
            <div className="text-xs mt-1 font-mono">{item.value}</div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div className="px-4 py-3 bg-white rounded-lg border-2 border-gray-300 shadow-sm font-mono text-lg font-bold text-gray-800 min-w-[80px] text-center">
          {item.displayValue || item.value}
        </div>
        {showAnswer && item.memoryHint && (
          <div className="text-xs mt-1 text-gray-500 max-w-[120px] text-center">
            {item.memoryHint}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Shared Game Header */}
      <GameHeader
        theme={theme}
        gameInfo={gameInfo}
        gameIcon="⚡"
        gameMode={gameMode}
        lastVerification={lastVerification}
        showModeSelector={showModeSelector}
        onToggleModeSelector={() => setShowModeSelector(true)}
        onCloseModeSelector={() => setShowModeSelector(false)}
        gameType="speed_challenge"
      />

      {/* Game Content */}
      {gameState.phase === "setup" && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">
              Configure Your Challenge
            </h3>

            {/* Difficulty Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <select
                value={gameState.gameData.difficulty}
                onChange={(e) =>
                  handleDifficultyChange(parseInt(e.target.value))
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.icon} {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Memory Technique Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Memory Technique
              </label>
              <select
                value={gameState.gameData.memoryTechnique}
                onChange={(e) => handleTechniqueChange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(MEMORY_TECHNIQUES).map(([key, technique]) => (
                  <option key={key} value={key}>
                    {technique.icon} {technique.label} - {technique.description}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startGame}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "🚀 Start Speed Challenge"}
            </button>
          </div>
        </div>
      )}

      {/* Learn Phase */}
      {gameState.phase === "learn" && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">
              {MEMORY_TECHNIQUES[gameState.gameData.memoryTechnique].icon}{" "}
              {MEMORY_TECHNIQUES[gameState.gameData.memoryTechnique].label}
            </h3>
            <p className="text-gray-700 mb-4">
              {MEMORY_TECHNIQUES[gameState.gameData.memoryTechnique].tip}
            </p>
            {gameState.gameData.culturalStory && (
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                <p className="text-sm italic text-gray-600">
                  {gameState.gameData.culturalStory}
                </p>
              </div>
            )}
            <button
              onClick={startMemorizePhase}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              🧠 Start Memorizing
            </button>
          </div>
        </div>
      )}

      {/* Memorize Phase */}
      {gameState.phase === "memorize" && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Memorize These Items</h3>
            <div className="text-lg font-medium mb-4">
              Time Remaining: {timer.timeLeft}s
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center mb-6">
              {gameState.gameData.currentSequence.map((item, index) => (
                <div key={item.id} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                  <ItemDisplay item={item} />
                </div>
              ))}
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    (timer.timeLeft /
                      (gameState.gameData.timePerItem *
                        gameState.gameData.sequenceLength)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recall Phase */}
      {gameState.phase === "recall" && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">Recall the Sequence</h3>
            <div className="text-lg font-medium mb-4">
              Item {gameState.gameData.currentStep + 1} of{" "}
              {gameState.gameData.currentSequence.length}
            </div>
            <div className="max-w-md mx-auto mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your answer"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <button
                  onClick={submitAnswer}
                  disabled={!currentInput.trim()}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((gameState.gameData.currentStep + 1) /
                      gameState.gameData.currentSequence.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {gameState.phase === "results" && (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
            <h3 className="text-2xl font-bold mb-4">
              Speed Challenge Complete! ⚡
            </h3>
            <div
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.primary }}
            >
              Score: {gameState.score}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.round(
                    ((gameState.gameData.userAnswers?.filter(
                      (answer, index) =>
                        answer?.toLowerCase() ===
                        gameState.gameData.currentSequence[
                          index
                        ]?.value.toLowerCase()
                    ).length || 0) /
                      gameState.gameData.currentSequence.length) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {gameState.gameData.perfectRounds}
                </div>
                <div className="text-sm text-gray-600">Perfect Rounds</div>
                <div className="text-xs text-blue-600 mt-1 font-medium">
                  {getProgressionContext(gameState.gameData.perfectRounds)}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {gameState.gameData.difficulty}
                </div>
                <div className="text-sm text-gray-600">Items</div>
                <div className="text-xs text-gray-500 mt-1">
                  {gameState.gameData.memoryTechnique} technique
                </div>
              </div>
            </div>

            {gameState.gameData.scoreBreakdown && (
              <div className="text-sm text-gray-600 mb-4">
                {gameState.gameData.scoreBreakdown.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                {(() => {
                  const isPerfect =
                    gameState.gameData.userAnswers?.filter(
                      (answer, index) =>
                        answer?.toLowerCase() ===
                        gameState.gameData.currentSequence[
                          index
                        ]?.value.toLowerCase()
                    ).length === gameState.gameData.currentSequence.length;
                  const hasProgressed =
                    gameState.gameData.difficulty >
                    gameState.gameData.baselineDifficulty;

                  if (isPerfect && hasProgressed) {
                    return `⚡ Continue at ${gameState.gameData.difficulty} Items`;
                  } else if (isPerfect) {
                    return "⚡ Next Challenge";
                  } else {
                    return "🔄 Try Again";
                  }
                })()}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                ⚙️ New Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

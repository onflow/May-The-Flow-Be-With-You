"use client";

import React, { useState, useEffect } from "react";
import { getThemeByCategory } from "../../../config/culturalThemes";
import {
  GameHeader,
  useGameCore,
  useGameTimer,
  ChaosCardsGameData,
  Card,
  gameUtils,
} from "../shared";
import { ModeSelector } from "../../ModeSelector";
import { ChaosCardsSetup } from "./ChaosCardsSetup";
import { ChaosCardsLearn } from "./ChaosCardsLearn";
import { ChaosCardsMemorize } from "./ChaosCardsMemorize";
import { ChaosCardsRecall } from "./ChaosCardsRecall";
import { ChaosCardsResults } from "./ChaosCardsResults";
import { ChaosCardsDisplay } from "./ChaosCardsDisplay";
import {
  calculateProgressiveDifficulty,
  calculatePerfectRounds,
  createEnhancedScoreResult,
} from "../shared/utils/gameProgressionUtils";

interface ChaosCardsGameRefactoredProps {
  culturalCategory?: string;
}

export function ChaosCardsGameRefactored({
  culturalCategory = "randomness-revolution",
}: ChaosCardsGameRefactoredProps) {
  const theme = getThemeByCategory(culturalCategory);
  const gameInfo = theme.gameAdaptations.cardGame;
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showCards, setShowCards] = useState(false); // Track if cards should be visible

  // Initial game data
  const initialGameData: ChaosCardsGameData = {
    cards: [],
    shuffledCards: [],
    userSequence: [],
    currentGuess: 0,
    difficulty: 5,
    baselineDifficulty: 5,
    perfectRounds: 0,
    totalRounds: 0,
    memoryTechnique: "observation",
    culturalStory: "",
  };

  // Generate game content function
  const generateGameContent = async (
    seed: number,
    gameData: ChaosCardsGameData
  ) => {
    // Create seeded random generator for consistent randomization
    const random = gameUtils.createSeededRandom(seed);

    // Use cultural objects as symbols, with fallback emojis
    const allCulturalObjects = [...theme.items.objects];
    const fallbackSymbols = [
      "🔥",
      "⚡",
      "🌟",
      "💎",
      "🎯",
      "🚀",
      "⭐",
      "🎪",
      "🎭",
      "🎨",
    ];

    // Shuffle cultural objects using the seed to get different objects each game
    const shuffledCulturalObjects = gameUtils.shuffleArray(
      allCulturalObjects,
      seed
    );
    const culturalObjects = shuffledCulturalObjects.slice(
      0,
      Math.max(10, gameData.difficulty)
    );

    // Map cultural objects to emojis
    const emojiMap: Record<string, string> = {
      // Greek/Classical
      Scroll: "📜",
      Amphora: "🏺",
      Lyre: "🎵",
      "Olive Branch": "🫒",
      "Laurel Crown": "👑",
      Stylus: "✒️",
      "Wax Tablet": "📝",
      Chiton: "👘",
      Sandals: "👡",
      Coin: "🪙",
      Shield: "🛡️",
      Spear: "🗡️",

      // African/Griot
      Djembe: "🥁",
      Kora: "🎵",
      "Talking Drum": "🥁",
      Calabash: "🥥",
      "Cowrie Shell": "🐚",
      "Baobab Seed": "🌰",
      "Gold Weight": "⚖️",
      "Adinkra Symbol": "🔣",
      "Shea Butter": "🧴",
      "Kente Cloth": "🧵",

      // Eastern/Asian
      Bamboo: "🎋",
      Lotus: "🪷",
      "Tea Cup": "🍵",
      Brush: "🖌️",
      "Ink Stone": "⚫",
      Jade: "💚",
      Gong: "🔔",
      Incense: "🕯️",

      // Indigenous/Aboriginal
      Boomerang: "🪃",
      Didgeridoo: "🎵",
      Ochre: "🟤",
      Coolamon: "🥥",
      Woomera: "🏹",
      Firestick: "🔥",
      "Grinding Stone": "🪨",
    };

    const symbols =
      culturalObjects.length >= gameData.difficulty
        ? culturalObjects.map((obj) => emojiMap[obj] || "⭐")
        : fallbackSymbols;

    // Generate randomized colors using the seed
    const colors = Array.from({ length: gameData.difficulty }, (_, i) =>
      gameUtils.generateColor(seed, i)
    );

    // Create cards with randomized selection of symbols
    const cards: Card[] = Array.from(
      { length: gameData.difficulty },
      (_, i) => {
        // Use seeded randomization to select different symbols each game
        const symbolIndex = Math.floor(random.next() * symbols.length);
        const objectIndex = Math.floor(random.next() * culturalObjects.length);

        return {
          id: `card-${seed}-${i}`, // Include seed in ID to ensure uniqueness
          emoji: symbols[symbolIndex],
          name: culturalObjects[objectIndex] || `${theme.name} Symbol ${i + 1}`,
          color: colors[i],
          culturalContext: gameInfo.description,
        };
      }
    );

    const shuffledCards = gameUtils.shuffleArray(cards, seed);
    const culturalStory = gameUtils.createCulturalStory(
      gameData.memoryTechnique,
      theme.name
    );

    return {
      cards,
      shuffledCards,
      culturalStory,
      userSequence: [],
      currentGuess: 0,
    };
  };

  // Using shared progressive difficulty calculation

  // Calculate memorization time based on difficulty
  const calculateMemorizationTime = (difficulty: number) => {
    // Start at 20s for 5 cards, reduce by 2.5s per difficulty level above 5, min 10s
    return Math.max(20 - (difficulty - 5) * 2.5, 10);
  };

  // Enhanced score calculation
  const calculateScore = (gameData: ChaosCardsGameData, timeSpent: number) => {
    const correctGuesses = gameData.userSequence.filter(
      (guess, index) => guess === gameData.cards[index]?.id
    ).length;
    const accuracy = gameUtils.calculateAccuracy(
      correctGuesses,
      gameData.cards.length
    );
    const timeBonus = Math.max(0, (60 - timeSpent) / 60);
    const difficultyMultiplier = 1 + (gameData.difficulty - 5) * 0.2; // 20% bonus per level above 5
    const isProgression = gameData.difficulty > gameData.baselineDifficulty;
    const progressionBonus = isProgression ? 1.5 : 1; // 50% bonus for progression levels

    const baseScore = (accuracy / 100) * 800;
    const score = Math.round(
      baseScore * difficultyMultiplier * progressionBonus + timeBonus * 200
    );

    const breakdown = [
      `Accuracy: ${Math.round(accuracy)}% (${correctGuesses}/${
        gameData.cards.length
      })`,
      `Difficulty Level: ${
        gameData.difficulty
      } (×${difficultyMultiplier.toFixed(1)})`,
      isProgression ? `Progression Bonus: ×${progressionBonus}` : "",
      `Time Bonus: ${Math.round(timeBonus * 100)}%`,
      `Total Score: ${score}`,
    ].filter(Boolean);

    return { score, breakdown };
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
    nextPhase,
    completeGame,
    handleReset,
    updateGameData,
  } = useGameCore({
    gameType: "chaos_cards",
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

  // Handle card selection during recall
  const handleCardSelect = (cardId: string) => {
    if (gameState.phase !== "recall") return;

    const newUserSequence = [...gameState.gameData.userSequence, cardId];
    const isComplete =
      newUserSequence.length >= gameState.gameData.cards.length;

    updateGameData({
      userSequence: newUserSequence,
      currentGuess: gameState.gameData.currentGuess + 1,
    });

    if (isComplete) {
      timer.stop();
      // Calculate if this was a perfect round
      const correctAnswers = newUserSequence.filter(
        (answer, index) => answer === gameState.gameData.cards[index]?.id
      ).length;
      const isPerfectRound = correctAnswers === gameState.gameData.cards.length;

      // Update perfect rounds and calculate new difficulty using shared utilities
      const newPerfectRounds = calculatePerfectRounds(
        gameState.gameData.perfectRounds,
        isPerfectRound
      );
      const newDifficulty = calculateProgressiveDifficulty(
        gameState.gameData.baselineDifficulty,
        newPerfectRounds
      );

      // Create updated game data with the user sequence
      const updatedGameData = {
        ...gameState.gameData,
        userSequence: newUserSequence,
        perfectRounds: newPerfectRounds,
        difficulty: newDifficulty,
        totalRounds: gameState.gameData.totalRounds + 1,
        currentGuess: newUserSequence.length,
      };

      // Update game data
      updateGameData(updatedGameData);

      // Calculate score with the updated data
      const timeSpent = 60 - timer.timeLeft;

      // Calculate score using the local scoring function
      const scoreResult = calculateScore(
        {
          ...gameState.gameData,
          userSequence: newUserSequence,
          difficulty: newDifficulty,
        },
        timeSpent
      );

      // Calculate accuracy for the game result
      const accuracy = (correctAnswers / gameState.gameData.cards.length) * 100;

      // Enhanced score result using shared utility
      const enhancedScoreResult = createEnhancedScoreResult(
        scoreResult,
        accuracy,
        newPerfectRounds
      );

      completeGame(timeSpent, enhancedScoreResult);
    }
  };

  // Start memorize phase
  const startMemorizePhase = () => {
    const memorizationTime = calculateMemorizationTime(
      gameState.gameData.difficulty
    );
    setShowCards(true); // Show cards when memorization starts
    nextPhase("memorize", memorizationTime);
    timer.reset(memorizationTime);
    timer.start();
  };

  // Reset card visibility when starting a new game
  useEffect(() => {
    if (gameState.phase === "setup" || gameState.phase === "learn") {
      setShowCards(false);
    }
  }, [gameState.phase]);

  // Note: Removed auto-start to allow users to configure difficulty and see progress
  // The setup phase now provides a proper game configuration experience

  const renderGamePhase = () => {
    switch (gameState.phase) {
      case "setup":
        return (
          <ChaosCardsSetup
            theme={theme}
            gameInfo={gameInfo}
            difficulty={gameState.gameData.difficulty}
            baselineDifficulty={gameState.gameData.baselineDifficulty}
            onDifficultyChange={handleDifficultyChange}
            onStartGame={startGame}
            isLoading={isLoading}
            perfectRounds={gameState.gameData.perfectRounds}
            totalRounds={gameState.gameData.totalRounds}
          />
        );

      case "learn":
        return (
          <ChaosCardsLearn
            theme={theme}
            cards={gameState.gameData.cards}
            showCards={showCards}
            onStartMemorizing={startMemorizePhase}
          />
        );

      case "memorize":
        const memorizationTime = calculateMemorizationTime(
          gameState.gameData.difficulty
        );

        return (
          <div className="p-8 space-y-6">
            <ChaosCardsMemorize
              theme={theme}
              timeLeft={timer.timeLeft}
              memoryTechnique={gameState.gameData.memoryTechnique}
              culturalStory={gameState.gameData.culturalStory}
              difficulty={gameState.gameData.difficulty}
              perfectRounds={gameState.gameData.perfectRounds}
              formatTime={timer.formatTime}
              memorizationTime={memorizationTime}
            />

            {/* Cards display */}
            <ChaosCardsDisplay
              theme={theme}
              cards={gameState.gameData.cards}
              phase="memorize"
              userSequence={gameState.gameData.userSequence}
            />
          </div>
        );

      case "recall":
        return (
          <ChaosCardsRecall
            theme={theme}
            cards={gameState.gameData.cards}
            shuffledCards={gameState.gameData.shuffledCards}
            userSequence={gameState.gameData.userSequence}
            onCardSelect={handleCardSelect}
            timeLeft={timer.timeLeft}
            formatTime={timer.formatTime}
          />
        );

      case "results":
        return (
          <ChaosCardsResults
            theme={theme}
            gameInfo={gameInfo}
            score={gameState.score}
            cards={gameState.gameData.cards}
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
            userSequence={gameState.gameData.userSequence}
            scoreBreakdown={gameState.gameData.scoreBreakdown}
          />
        );

      case "loading":
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Preparing your game...</p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <h3 className="text-lg font-semibold mb-2">Game Error</h3>
              <p className="text-sm">{error || "Something went wrong"}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    <div className="max-w-6xl mx-auto p-6">
      <GameHeader
        theme={theme}
        gameInfo={gameInfo}
        gameIcon="🎴"
        gameMode={gameMode}
        lastVerification={lastVerification}
        showModeSelector={showModeSelector}
        onToggleModeSelector={() => setShowModeSelector(true)}
        onCloseModeSelector={() => setShowModeSelector(false)}
        gameType="chaos_cards"
      />

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {renderGamePhase()}
      </div>

      {/* Mode Selector Modal */}
      {showModeSelector && (
        <div className="mb-6">
          <ModeSelector
            currentMode={gameMode}
            onModeChange={() => {
              setShowModeSelector(false);
              handleReset();
            }}
          />
        </div>
      )}
    </div>
  );
}

// Custom hook for Chaos Cards game logic
// Encapsulates all game state and business logic

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../../providers/AuthProvider";
import { useGame } from "../../../../providers/GameProvider";
import { useGameState } from "../../../../hooks/useGameState";
import { getCulturalEmoji, getCulturalContext } from "../../../../utils/culturalMapping";
import { getThemeItems } from "../../../../config/culturalThemes";
import { createGameError } from "../../../../utils/errorHandling";

interface Card {
  id: string;
  symbol: string;
  name: string;
  color: string;
  culturalContext?: string;
}

interface ChaosCardsGameData {
  cards: Card[];
  userSequence: string[];
  currentGuess: number;
  difficulty: number;
}

export function useChaosCardsGame(culturalCategory: string, theme: any) {
  const { user } = useAuth();
  const {
    gameMode,
    gameService,
    currentGame,
    lastVerification,
    isLoading,
    error,
    startGame: startGameSession,
    endGame: endGameSession,
    resetGame,
  } = useGame();

  // Initialize game state
  const [gameState, gameActions] = useGameState<ChaosCardsGameData>({
    initialGameData: {
      cards: [],
      userSequence: [],
      currentGuess: 0,
      difficulty: 4,
    },
    initialPhase: "setup",
    initialTimeLeft: 15,
    onPhaseChange: (newPhase, prevPhase) => {
      if (newPhase === "recall" && prevPhase === "memorize") {
        // Start recall phase
        console.log("Starting recall phase");
      }
    },
    onGameEnd: (finalState) => {
      // Handle game completion
      saveGameResult(finalState.score);
    }
  });

  // Simple timer that works with hot reload
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    let currentTime = 15;
    gameActions.setTimeLeft(currentTime);

    timerRef.current = setInterval(() => {
      currentTime -= 1;
      gameActions.setTimeLeft(currentTime);

      if (currentTime <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        gameActions.setPhase("recall");
      }
    }, 1000);
  }, [gameActions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Generate culturally appropriate cards
  const generateCards = useCallback((count: number): Card[] => {
    const culturalObjects = getThemeItems(culturalCategory, "objects");
    const culturalConcepts = getThemeItems(culturalCategory, "concepts");

    const allItems = [...culturalObjects, ...culturalConcepts];
    const selectedItems = allItems.slice(0, Math.min(count, allItems.length));

    return selectedItems.map((item, index) => ({
      id: `card-${index}`,
      symbol: getCulturalEmoji(item),
      name: item,
      color: index % 2 === 0 ? theme.colors.primary : theme.colors.secondary,
      culturalContext: getCulturalContext(culturalCategory, item),
    }));
  }, [culturalCategory, theme.colors.primary, theme.colors.secondary]);

  // Start new game
  const startGame = useCallback(async () => {
    try {
      gameActions.setLoading(true);
      gameActions.setError(null);

      // Generate cards immediately for anonymous users
      const cards = generateCards(gameState.gameData.difficulty);

      // Update game state
      gameActions.setGameData({
        cards,
        userSequence: [],
        currentGuess: 0,
        difficulty: gameState.gameData.difficulty,
      });

      gameActions.setPhase("memorize");
      gameActions.setScore(0);
      startTimer();

      // Only try game service if user is authenticated
      if (user?.id) {
        // Create game configuration
        const gameConfig = {
          gameType: "chaos_cards" as const,
          difficulty:
            gameState.gameData.difficulty <= 3
              ? ("easy" as const)
              : gameState.gameData.difficulty <= 4
              ? ("medium" as const)
              : ("hard" as const),
          culture: culturalCategory,
          itemCount: gameState.gameData.difficulty,
          studyTime: 15,
          chaosTime: 2,
        };

        // Start game session using the game service
        await startGameSession(gameConfig);
      }

      // Update cards if we got a sequence from the game service
      if (currentGame?.sequence) {
        const vrfCards = currentGame.sequence.items.map((item: any, index: number) => ({
          id: `card-${index}`,
          symbol: getCulturalEmoji(item.name),
          name: item.name,
          color:
            index % 2 === 0 ? theme.colors.primary : theme.colors.secondary,
          culturalContext: item.culturalContext,
        }));

        gameActions.setGameData({
          cards: vrfCards,
          userSequence: [],
          currentGuess: 0,
          difficulty: gameState.gameData.difficulty,
        });
      }

    } catch (error) {
      console.error("Failed to start game:", error);
      gameActions.setError("Failed to start game. Please try again.");
    } finally {
      gameActions.setLoading(false);
    }
  }, [
    user?.id,
    gameState.gameData.difficulty,
    culturalCategory,
    theme.colors,
    startGameSession,
    currentGame,
    generateCards,
    gameActions,
    startTimer
  ]);

  // Handle card selection during recall
  const handleCardSelect = useCallback((cardId: string) => {
    const { cards, userSequence, currentGuess } = gameState.gameData;
    const newSequence = [...userSequence, cardId];
    const isCorrect = cards[currentGuess]?.id === cardId;
    const newScore = isCorrect ? gameState.score + 10 : gameState.score;

    if (currentGuess >= cards.length - 1) {
      // Game finished
      gameActions.setGameData(prev => ({
        ...prev,
        userSequence: newSequence,
      }));
      gameActions.setScore(newScore);
      gameActions.setPhase("results");
    } else {
      gameActions.setGameData(prev => ({
        ...prev,
        userSequence: newSequence,
        currentGuess: prev.currentGuess + 1,
      }));
      gameActions.setScore(newScore);
    }
  }, [gameState.gameData, gameState.score, gameActions]);

  // Save game result
  const saveGameResult = useCallback(async (finalScore: number) => {
    if (!user?.id || !currentGame) return;

    try {
      const { cards, userSequence } = gameState.gameData;
      const maxPossibleScore = cards.length * 10;
      const accuracy = finalScore / maxPossibleScore;
      const duration = 15; // Study time + recall time
      const perfect = finalScore === maxPossibleScore;

      const gameResult = {
        score: finalScore,
        accuracy,
        duration,
        perfect,
        items: cards.map((card, index) => ({
          id: card.id,
          name: card.name,
          userAnswer: userSequence[index] || null,
          correctAnswer: card.id,
          isCorrect: userSequence[index] === card.id,
        })),
      };

      // Submit result using the game service
      await endGameSession(gameResult);

    } catch (error) {
      console.error("Error saving game result:", error);
      gameActions.setError("Failed to save game result");
    }
  }, [user?.id, currentGame, gameState.gameData, endGameSession, gameActions]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((difficulty: number) => {
    gameActions.setGameData(prev => ({
      ...prev,
      difficulty
    }));
  }, [gameActions]);

  // Reset game
  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    gameActions.resetGame();
    resetGame();
  }, [gameActions, resetGame]);

  return {
    // Game state
    gameState,
    isLoading,
    error,
    lastVerification,
    gameMode,

    // Game actions
    startGame,
    handleCardSelect,
    handleDifficultyChange,
    handleReset,

    // Timer
    timeLeft: gameState.timeLeft,
  };
}

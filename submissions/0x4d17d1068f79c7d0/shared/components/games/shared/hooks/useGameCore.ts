"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../providers/AuthProvider";
import { useGame } from "../../../../providers/GameProvider";
import { FlowVRFService } from "../../../../services/FlowVRFService";
import { 
  BaseGameState, 
  BaseGameData, 
  GameResult, 
  VRFVerification,
  MemoryTechnique 
} from "../types";

interface UseGameCoreProps<T extends BaseGameData> {
  gameType: string;
  culturalCategory: string;
  initialGameData: T;
  generateGameContent: (seed: number, gameData: T) => Promise<Partial<T>>;
  calculateScore: (gameData: T, timeSpent: number) => { score: number; breakdown: string[] };
}

export function useGameCore<T extends BaseGameData>({
  gameType,
  culturalCategory,
  initialGameData,
  generateGameContent,
  calculateScore,
}: UseGameCoreProps<T>) {
  const { user } = useAuth();
  const { endGame, gameMode, startGame: gameProviderStartGame } = useGame();



  const [gameState, setGameState] = useState<BaseGameState<T>>({
    phase: "setup",
    gameData: initialGameData,
    score: 0,
    timeLeft: 30,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVerification, setLastVerification] = useState<VRFVerification | null>(null);

  // Start new game with debouncing to prevent multiple clicks
  const startGame = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isLoading) {
      console.log("🚫 Game start already in progress, ignoring duplicate click");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Start game session with GameProvider to ensure currentGame is set
      const gameConfig = {
        gameType,
        culturalCategory,
        itemCount: gameState.gameData.difficulty,
        theme: null, // Will be set by GameProvider
        gameInfo: null, // Will be set by GameProvider
        showModeSelector: false
      };

      await gameProviderStartGame(gameConfig);

      // Generate VRF seed for provably fair randomness
      const vrfService = new FlowVRFService();
      const vrfSeed = await vrfService.getInstantRandomness();
      setLastVerification(vrfSeed);

      const seed = vrfSeed?.seed || Math.floor(Math.random() * 10000);
      const newContent = await generateGameContent(seed, gameState.gameData);

      setGameState(prev => ({
        ...prev,
        phase: "learn",
        gameData: {
          ...prev.gameData,
          ...newContent,
          totalRounds: prev.gameData.totalRounds + 1,
        },
        score: 0,
      }));
    } catch (err) {
      console.error('🔍 useGameCore.startGame error:', err);
      setError(err instanceof Error ? err.message : "Failed to start game");
      setGameState(prev => ({ ...prev, phase: "error" }));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, gameState.gameData, generateGameContent, gameProviderStartGame, gameType, culturalCategory]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDifficulty: number) => {
    setGameState(prev => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        difficulty: newDifficulty,
        baselineDifficulty: newDifficulty,
      },
    }));
  }, []);

  // Handle technique change
  const handleTechniqueChange = useCallback((technique: MemoryTechnique) => {
    setGameState(prev => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        memoryTechnique: technique,
      },
    }));
  }, []);

  // Move to next phase
  const nextPhase = useCallback((phase: BaseGameState<T>["phase"], timeLeft?: number) => {
    setGameState(prev => ({
      ...prev,
      phase,
      timeLeft: timeLeft ?? prev.timeLeft,
    }));
  }, []);

  // Complete game and calculate results
  const completeGame = useCallback((timeSpent: number, preCalculatedScore?: { score: number; breakdown: string[]; accuracy?: number; perfectRounds?: number }) => {
    // Use pre-calculated score if provided, otherwise calculate it
    const { score, breakdown } = preCalculatedScore || calculateScore(gameState.gameData, timeSpent);

    // Use perfect rounds from pre-calculated score if provided, otherwise use current gameData value
    const currentPerfectRounds = preCalculatedScore?.perfectRounds ?? gameState.gameData.perfectRounds;

    // Use pre-calculated accuracy if provided, otherwise calculate it
    let accuracy: number;
    if (preCalculatedScore?.accuracy !== undefined) {
      // Use the accuracy provided by the game component (most accurate)
      accuracy = preCalculatedScore.accuracy;
    } else if (gameType === "chaos_cards") {
      // For Chaos Cards: calculate based on correct guesses vs total cards
      const correctGuesses = (gameState.gameData as any).userSequence?.filter(
        (guess: string, index: number) => guess === (gameState.gameData as any).cards?.[index]?.id
      ).length || 0;
      const totalCards = (gameState.gameData as any).cards?.length || 1;
      accuracy = (correctGuesses / totalCards) * 100;
    } else if (gameType === "memory_palace") {
      // For Memory Palace: calculate based on correct guesses vs total items
      const correctGuesses = (gameState.gameData as any).userGuesses?.filter(
        (guess: string, index: number) => guess === (gameState.gameData as any).items?.[index]?.name
      ).length || 0;
      const totalItems = (gameState.gameData as any).items?.length || 1;
      accuracy = (correctGuesses / totalItems) * 100;
    } else if (gameType === "speed_challenge") {
      // For Speed Challenge: calculate based on correct answers vs total sequence
      const correctAnswers = (gameState.gameData as any).userAnswers?.filter(
        (answer: string, index: number) => answer.toLowerCase() === (gameState.gameData as any).currentSequence?.[index]?.value.toLowerCase()
      ).length || 0;
      const totalItems = (gameState.gameData as any).currentSequence?.length || 1;
      accuracy = (correctAnswers / totalItems) * 100;
    } else {
      // Fallback: estimate accuracy from score (assuming max score of 1000)
      accuracy = Math.min((score / 1000) * 100, 100);
    }

    setGameState(prev => ({
      ...prev,
      phase: "results",
      score,
      gameData: {
        ...prev.gameData,
        perfectRounds: currentPerfectRounds, // Use current value instead of recalculating
        scoreBreakdown: breakdown,
      },
    }));

    // Submit game result with proper accuracy calculation (already calculated above)

    const gameResult: GameResult = {
      gameType,
      score,
      culturalCategory,
      difficulty: gameState.gameData.difficulty,
      technique: gameState.gameData.memoryTechnique,
      accuracy: Math.round(accuracy), // Store as 0-100 percentage
      timeSpent,
      vrfSeed: lastVerification?.seed,
    };

    endGame(gameResult);
  }, [gameState.gameData, calculateScore, gameType, culturalCategory, lastVerification, endGame]);

  // Reset game
  const handleReset = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: "setup",
      score: 0,
      timeLeft: 30,
      gameData: {
        ...initialGameData,
        perfectRounds: prev.gameData.perfectRounds,
        totalRounds: prev.gameData.totalRounds,
        baselineDifficulty: prev.gameData.baselineDifficulty,
        memoryTechnique: prev.gameData.memoryTechnique,
      },
    }));
    setError(null);
  }, [initialGameData]);

  // Update game data
  const updateGameData = useCallback((updates: Partial<T>) => {
    setGameState(prev => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        ...updates,
      },
    }));
  }, []);

  return {
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
    setGameState,
  };
}

"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import { progressService } from "../services/progressService";
import { BaseGameState, GameResult, GameType, DifficultyLevel, GameHookReturn } from "../types/game";

interface UseBaseGameOptions {
  gameType: GameType;
  initialDifficulty?: DifficultyLevel;
  onGameEnd?: (result: GameResult) => void;
}

export function useBaseGame<T extends BaseGameState>(
  initialState: T,
  options: UseBaseGameOptions
): GameHookReturn<T> {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<T>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const gameStartTime = useRef<number | null>(null);

  const updateGameState = useCallback((updates: Partial<T>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const startGame = useCallback(() => {
    gameStartTime.current = Date.now();
    updateGameState({
      phase: "setup",
      score: 0,
      timeLeft: 0,
      isLoading: false,
      startTime: gameStartTime.current,
    } as Partial<T>);
  }, [updateGameState]);

  const resetGame = useCallback(() => {
    gameStartTime.current = null;
    setGameState(initialState);
  }, [initialState]);

  const saveResult = useCallback(async (result: GameResult) => {
    if (!user || !gameStartTime.current) return;

    setIsLoading(true);
    try {
      const duration = Math.floor((Date.now() - gameStartTime.current) / 1000);
      const difficultyLevel = gameState.difficulty === "easy" ? 1 : 
                             gameState.difficulty === "medium" ? 2 : 3;

      await progressService.saveGameSession({
        user_id: user.id,
        game_type: options.gameType,
        score: result.score,
        max_possible_score: gameState.maxPossibleScore,
        accuracy: result.accuracy,
        items_count: 0, // Will be overridden by specific games
        duration_seconds: duration,
        difficulty_level: difficultyLevel,
        session_data: {
          difficulty: gameState.difficulty,
          perfect: result.perfect,
          newRecord: result.newRecord,
        },
      });

      await progressService.updateLeaderboards();
      
      if (options.onGameEnd) {
        options.onGameEnd(result);
      }
    } catch (error) {
      console.error("Error saving game result:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, gameState, options]);

  return {
    gameState,
    startGame,
    resetGame,
    updateGameState,
    saveResult,
    isLoading,
  };
}

// Specialized hooks for different game types
export function useCardGame(initialState: any) {
  return useBaseGame(initialState, { gameType: "chaos_cards" });
}

export function usePalaceGame(initialState: any) {
  return useBaseGame(initialState, { gameType: "random_palace" });
}

export function useSpeedGame(initialState: any) {
  return useBaseGame(initialState, { gameType: "memory_speed" });
}

export function useLinkingGame(initialState: any) {
  return useBaseGame(initialState, { gameType: "linking_method" });
}

export function useLociGame(initialState: any) {
  return useBaseGame(initialState, { gameType: "method_of_loci" });
}

// Reusable Game State Management Hook
// Provides consistent game state patterns across different game types

import { useState, useCallback, useRef, useEffect } from 'react';

export type GamePhase = 'setup' | 'memorize' | 'recall' | 'results' | 'loading' | 'error';

export interface BaseGameState<T = any> {
  phase: GamePhase;
  score: number;
  timeLeft: number;
  isLoading: boolean;
  error: string | null;
  gameData: T;
}

export interface GameStateActions<T = any> {
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGameData: (data: T | ((prev: T) => T)) => void;
  resetGame: () => void;
  updateState: (updates: Partial<BaseGameState<T>>) => void;
}

export interface UseGameStateOptions<T> {
  initialGameData: T;
  initialPhase?: GamePhase;
  initialScore?: number;
  initialTimeLeft?: number;
  onPhaseChange?: (phase: GamePhase, prevPhase: GamePhase) => void;
  onScoreChange?: (score: number, prevScore: number) => void;
  onGameEnd?: (finalState: BaseGameState<T>) => void;
}

/**
 * Reusable game state hook with consistent patterns
 */
export function useGameState<T = any>(
  options: UseGameStateOptions<T>
): [BaseGameState<T>, GameStateActions<T>] {
  const {
    initialGameData,
    initialPhase = 'setup',
    initialScore = 0,
    initialTimeLeft = 0,
    onPhaseChange,
    onScoreChange,
    onGameEnd
  } = options;

  const [state, setState] = useState<BaseGameState<T>>({
    phase: initialPhase,
    score: initialScore,
    timeLeft: initialTimeLeft,
    isLoading: false,
    error: null,
    gameData: initialGameData
  });

  // Keep refs for callbacks to avoid stale closures
  const callbacksRef = useRef({ onPhaseChange, onScoreChange, onGameEnd });
  callbacksRef.current = { onPhaseChange, onScoreChange, onGameEnd };

  const setPhase = useCallback((phase: GamePhase) => {
    setState(prev => {
      if (prev.phase !== phase) {
        callbacksRef.current.onPhaseChange?.(phase, prev.phase);

        // Auto-trigger onGameEnd when phase changes to results
        if (phase === 'results') {
          const finalState = { ...prev, phase };
          setTimeout(() => callbacksRef.current.onGameEnd?.(finalState), 0);
        }
      }
      return { ...prev, phase };
    });
  }, []);

  const setScore = useCallback((score: number | ((prev: number) => number)) => {
    setState(prev => {
      const newScore = typeof score === 'function' ? score(prev.score) : score;
      if (prev.score !== newScore) {
        callbacksRef.current.onScoreChange?.(newScore, prev.score);
      }
      return { ...prev, score: newScore };
    });
  }, []);

  const setTimeLeft = useCallback((time: number | ((prev: number) => number)) => {
    setState(prev => ({
      ...prev,
      timeLeft: typeof time === 'function' ? time(prev.timeLeft) : time
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      phase: error ? 'error' : prev.phase
    }));
  }, []);

  const setGameData = useCallback((data: T | ((prev: T) => T)) => {
    setState(prev => ({
      ...prev,
      gameData: typeof data === 'function' ? (data as (prev: T) => T)(prev.gameData) : data
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState({
      phase: initialPhase,
      score: initialScore,
      timeLeft: initialTimeLeft,
      isLoading: false,
      error: null,
      gameData: initialGameData
    });
  }, [initialPhase, initialScore, initialTimeLeft, initialGameData]);

  const updateState = useCallback((updates: Partial<BaseGameState<T>>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const actions: GameStateActions<T> = {
    setPhase,
    setScore,
    setTimeLeft,
    setLoading,
    setError,
    setGameData,
    resetGame,
    updateState
  };

  return [state, actions];
}

/**
 * Timer hook that integrates with game state
 */
export function useGameTimer(
  initialTime: number,
  onTimeUp?: () => void,
  onTick?: (timeLeft: number) => void
) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onTimeUp, onTick });
  callbacksRef.current = { onTimeUp, onTick };

  const start = useCallback(() => {
    if (intervalRef.current) {
      return; // Already running
    }

    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        callbacksRef.current.onTick?.(newTime);

        if (newTime <= 0) {
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          callbacksRef.current.onTimeUp?.();
          return 0;
        }

        return newTime;
      });
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    stop();
    setTimeLeft(newTime ?? initialTime);
  }, [initialTime, stop]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Cleanup on unmount and hot reload
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Auto-restart timer if it was running but interval got cleared (hot reload)
  useEffect(() => {
    if (isRunning && !intervalRef.current && timeLeft > 0) {
      start();
    }
  }, [isRunning, timeLeft, start]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  return {
    timeLeft,
    isRunning,
    start,
    stop,
    pause,
    reset,
    cleanup
  };
}

/**
 * Score calculation utilities
 */
export const ScoreUtils = {
  /**
   * Calculate score based on accuracy and time
   */
  calculateScore(
    correctAnswers: number,
    totalQuestions: number,
    timeSpent: number,
    maxTime: number,
    basePoints: number = 100
  ): number {
    const accuracy = correctAnswers / totalQuestions;
    const timeBonus = Math.max(0, (maxTime - timeSpent) / maxTime);
    return Math.floor(basePoints * accuracy * (1 + timeBonus * 0.5));
  },

  /**
   * Calculate accuracy percentage
   */
  calculateAccuracy(correct: number, total: number): number {
    return total > 0 ? correct / total : 0;
  },

  /**
   * Determine if score qualifies as "perfect"
   */
  isPerfectScore(correct: number, total: number, timeSpent: number, maxTime: number): boolean {
    return correct === total && timeSpent <= maxTime;
  },

  /**
   * Get performance rating based on accuracy
   */
  getPerformanceRating(accuracy: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (accuracy >= 0.9) return 'excellent';
    if (accuracy >= 0.7) return 'good';
    if (accuracy >= 0.5) return 'fair';
    return 'poor';
  }
};

/**
 * Common game state patterns
 */
export const GameStatePatterns = {
  /**
   * Standard memory game phases
   */
  memoryGamePhases: ['setup', 'memorize', 'recall', 'results'] as const,

  /**
   * Standard card game phases
   */
  cardGamePhases: ['setup', 'dealing', 'playing', 'results'] as const,

  /**
   * Standard speed challenge phases
   */
  speedChallengePhases: ['setup', 'countdown', 'playing', 'results'] as const
};

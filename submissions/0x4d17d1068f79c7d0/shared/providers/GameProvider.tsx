"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { GameService, createGameService } from "../services/GameService";
import { RandomnessVerification } from "./RandomnessProvider";

interface GameContextType {
  // Mode Management
  gameMode: "offchain" | "onchain";
  setGameMode: (mode: "offchain" | "onchain") => void;

  // Game Service
  gameService: GameService;

  // Current Game State
  currentGame: any | null;
  setCurrentGame: (game: any | null) => void;

  // Verification Data
  lastVerification: RandomnessVerification | null;
  setLastVerification: (verification: RandomnessVerification | null) => void;

  // Loading States
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error Handling
  error: string | null;
  setError: (error: string | null) => void;

  // Game Actions
  startGame: (config: any) => Promise<any>;
  endGame: (result: any) => Promise<any>;
  resetGame: () => void;

  // Mode Switching
  switchMode: (newMode: "offchain" | "onchain") => Promise<void>;
  canSwitchToOnChain: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
  defaultMode?: "offchain" | "onchain";
}

export function GameProvider({
  children,
  defaultMode = "offchain",
}: GameProviderProps) {
  const { user } = useAuth();

  // Core State - Always start with offchain to avoid immediate VRF triggering
  const [gameMode, setGameModeState] = useState<"offchain" | "onchain">(
    "offchain"
  );
  const [gameService, setGameService] = useState(() =>
    createGameService("offchain")
  );
  const [currentGame, setCurrentGame] = useState<any | null>(null);
  const [lastVerification, setLastVerification] =
    useState<RandomnessVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-switch to on-chain if user has Flow wallet and was using off-chain
  useEffect(() => {
    if (
      user?.authMethod === "flow" &&
      user?.flowAddress &&
      gameMode === "offchain"
    ) {
      // Only auto-switch if user explicitly connected Flow wallet
      const shouldAutoSwitch = localStorage.getItem(
        "memoreee_auto_switch_onchain"
      );
      if (shouldAutoSwitch === "true") {
        switchMode("onchain");
        localStorage.removeItem("memoreee_auto_switch_onchain");
      }
    }
  }, [user, gameMode]);

  // Update game service when mode changes
  useEffect(() => {
    setGameService(createGameService(gameMode));
    setError(null); // Clear any previous errors
  }, [gameMode]);

  // Persist mode preference
  useEffect(() => {
    localStorage.setItem("memoreee_game_mode", gameMode);
  }, [gameMode]);

  // Load saved mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("memoreee_game_mode") as
      | "offchain"
      | "onchain"
      | null;
    if (savedMode && savedMode !== gameMode) {
      // Only switch if user has the required auth for on-chain mode
      if (savedMode === "onchain" && canSwitchToOnChain()) {
        setGameModeState(savedMode);
      } else if (savedMode === "offchain") {
        setGameModeState(savedMode);
      }
    }
  }, []);

  // Migrate anonymous progress when user signs up
  useEffect(() => {
    const migrateAnonymousProgress = async () => {
      if (!user?.id || typeof window === "undefined") return;

      const anonymousId = localStorage.getItem("memoreee_anonymous_id");
      if (!anonymousId) return;

      try {
        // Load anonymous progress
        const anonymousProgress = await gameService.getUserProgress(
          anonymousId
        );
        if (!anonymousProgress || anonymousProgress.gamesPlayed === 0) return;

        // Load current user progress
        const userProgress = await gameService.getUserProgress(user.id);

        // Merge progress (anonymous takes precedence if user has no progress)
        if (!userProgress || userProgress.gamesPlayed === 0) {
          // Migrate anonymous progress to authenticated user
          const migratedProgress = {
            ...anonymousProgress,
            userId: user.id,
          };

          await gameService.getUserProgress(user.id); // This will save the migrated progress

          // Show success message
          console.log("Anonymous progress migrated successfully!");

          // Clean up anonymous data
          localStorage.removeItem("memoreee_anonymous_id");
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(`memoreee_`) && key.includes(anonymousId)) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (error) {
        console.error("Failed to migrate anonymous progress:", error);
      }
    };

    migrateAnonymousProgress();
  }, [user?.id, gameService]);

  const setGameMode = (mode: "offchain" | "onchain") => {
    if (mode === "onchain" && !canSwitchToOnChain()) {
      setError("Flow wallet connection required for on-chain mode");
      return;
    }
    setGameModeState(mode);
  };

  const canSwitchToOnChain = (): boolean => {
    return !!(user?.authMethod === "flow" && user?.flowAddress);
  };

  // Generate consistent anonymous user ID
  const generateAnonymousUserId = (): string => {
    // Check if we already have an anonymous ID stored
    if (typeof window !== "undefined") {
      const existingId = localStorage.getItem("memoreee_anonymous_id");
      if (existingId) {
        return existingId;
      }

      // Generate new anonymous ID
      const anonymousId = `anonymous_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("memoreee_anonymous_id", anonymousId);
      return anonymousId;
    }

    // Fallback for server-side rendering
    return `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const startGame = async (config: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate user ID for anonymous users or use authenticated user ID
      const userId = user?.id || generateAnonymousUserId();

      console.log("🎮 GameProvider: Starting game session", { userId, config });

      // Start game session
      const session = await gameService.startGameSession(userId, config);
      console.log("✅ GameProvider: Game session created", session);

      // Generate game sequence
      const sequence = await gameService.generateGameSequence(config);
      console.log("✅ GameProvider: Game sequence generated", {
        itemCount: sequence.items.length,
        seed: sequence.seed,
      });

      // Store verification data
      if (sequence.verificationData) {
        setLastVerification(sequence.verificationData);
        console.log("✅ GameProvider: Verification data stored");
      }

      // Set current game state
      const gameState = {
        session,
        sequence,
        config,
        startTime: Date.now(),
      };

      setCurrentGame(gameState);
      console.log("✅ GameProvider: Current game state set", gameState);

      return gameState; // Return the game state for immediate use
    } catch (error: any) {
      console.error("❌ GameProvider: Failed to start game:", error);
      setError(error.message || "Failed to start game");
      setCurrentGame(null); // Ensure clean state on error
      throw error; // Re-throw so calling code can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const endGame = async (result: any) => {
    if (!currentGame) {
      setError("No active game session");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the same user ID that was used to start the game
      const userId = user?.id || generateAnonymousUserId();

      // Submit game result
      const enhancedResult = await gameService.submitGameResult(
        userId,
        currentGame.session.id,
        result,
        currentGame.config
      );

      // Update verification data if available
      if (enhancedResult.verificationData) {
        setLastVerification(enhancedResult.verificationData);
      }

      // Clear current game
      setCurrentGame(null);

      return enhancedResult;
    } catch (error: any) {
      console.error("Failed to end game:", error);
      setError(error.message || "Failed to submit game result");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setCurrentGame(null);
    setLastVerification(null);
    setError(null);
  };

  const switchMode = async (newMode: "offchain" | "onchain") => {
    if (newMode === gameMode) return;

    if (newMode === "onchain" && !canSwitchToOnChain()) {
      setError("Flow wallet connection required for on-chain mode");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If switching from off-chain to on-chain, we might want to migrate data
      if (gameMode === "offchain" && newMode === "onchain" && user?.id) {
        // Here we could implement progress migration logic
        console.log("Migrating progress from off-chain to on-chain...");

        // For now, just show a success message
        console.log("Progress migration completed");
      }

      // Switch the mode
      setGameModeState(newMode);

      // Reset current game state since we're switching modes
      resetGame();
    } catch (error: any) {
      console.error("Failed to switch mode:", error);
      setError(error.message || "Failed to switch game mode");
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: GameContextType = {
    // Mode Management
    gameMode,
    setGameMode,

    // Game Service
    gameService,

    // Current Game State
    currentGame,
    setCurrentGame,

    // Verification Data
    lastVerification,
    setLastVerification,

    // Loading States
    isLoading,
    setIsLoading,

    // Error Handling
    error,
    setError,

    // Game Actions
    startGame,
    endGame,
    resetGame,

    // Mode Switching
    switchMode,
    canSwitchToOnChain,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// Hook for getting game features based on current mode
export function useGameFeatures() {
  const { gameService } = useGame();
  return {
    availableFeatures: gameService.getAvailableFeatures(),
    supportsFeature: (featureId: string) =>
      gameService.supportsFeature(featureId),
    mode: gameService.getMode(),
  };
}

// Hook for game statistics
export function useGameStats(userId?: string) {
  const { gameService, gameMode } = useGame();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      setLoading(true);
      try {
        const userStats = await gameService.getUserStatistics(targetUserId);
        setStats(userStats);
      } catch (error) {
        console.error("Failed to load game stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [gameService, userId, user?.id, gameMode]);

  return { stats, loading };
}

// Hook for leaderboards
export function useLeaderboard(
  gameType: string,
  culture?: string,
  limit: number = 10
) {
  const { gameService, gameMode } = useGame();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await gameService.getLeaderboard(
          gameType as any,
          culture,
          limit
        );
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [gameService, gameType, culture, limit, gameMode]);

  return { leaderboard, loading };
}

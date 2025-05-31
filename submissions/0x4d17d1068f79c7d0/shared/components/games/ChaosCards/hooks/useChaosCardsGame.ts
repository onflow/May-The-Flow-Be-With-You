// Custom hook for Chaos Cards game logic
// Encapsulates all game state and business logic

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../../providers/AuthProvider";
import { useGame } from "../../../../providers/GameProvider";
import { useGameState } from "../../../../hooks/useGameState";
import { getCulturalEmoji, getCulturalContext } from "../../../../utils/culturalMapping";
import { getThemeItems, getThemeByCategory } from "../../../../config/culturalThemes";
import { ScoringRules } from "../../../../config/gameRules";
import { createGameError } from "../../../../utils/errorHandling";
import { createSeededRandom } from "../../../../utils/gameUtils";

import { progressService } from "../../../../services/progressService";

interface Card {
  id: string;
  symbol: string;
  name: string;
  color: string;
  culturalContext?: string;
}

interface ChaosCardsGameData {
  cards: Card[];
  shuffledCards: Card[]; // Cards in randomized order for recall phase
  userSequence: string[];
  currentGuess: number;
  difficulty: number; // Current active difficulty (can be higher than baseline)
  baselineDifficulty: number; // User's chosen starting difficulty
  perfectRounds: number;
  totalRounds: number;
  memoryTechnique: "observation" | "loci" | "linking" | "story" | "cultural";
  culturalStory: string;
  scoreBreakdown?: string[]; // Detailed score breakdown for results display
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

  // Local session tracking as fallback
  const [localSession, setLocalSession] = useState<any>(null);

  // Enhanced game state with progressive difficulty and memory techniques
  const [gameState, gameActions] = useGameState<ChaosCardsGameData>({
    initialGameData: {
      cards: [],
      shuffledCards: [], // Cards in randomized order for recall
      userSequence: [],
      currentGuess: 0,
      difficulty: 5, // Current active difficulty
      baselineDifficulty: 5, // User's chosen starting difficulty (5 = easy)
      perfectRounds: 0, // Track consecutive perfect rounds
      totalRounds: 0, // Track total rounds played
      memoryTechnique: "observation", // Current suggested technique
      culturalStory: "", // Cultural narrative for current sequence
    },
    initialPhase: "setup",
    initialTimeLeft: 15,
    onPhaseChange: (newPhase, prevPhase) => {
      if (newPhase === "recall" && prevPhase === "memorize") {
        // Shuffle cards for recall phase using the same randomness source as initial generation
        let shuffledCards;

        if (currentGame?.sequence?.seed) {
          // Use VRF seed for consistent randomization
          const seededRandom = createSeededRandom(currentGame.sequence.seed + 1000); // +1000 for different shuffle
          shuffledCards = [...gameState.gameData.cards].sort(() => seededRandom.next() - 0.5);
          console.log("🎲 Starting recall phase with VRF-shuffled cards, seed:", currentGame.sequence.seed);
        } else {
          // Fallback to Math.random for local mode
          shuffledCards = [...gameState.gameData.cards].sort(() => Math.random() - 0.5);
          console.log("⚡ Starting recall phase with locally-shuffled cards");
        }

        gameActions.setGameData(prev => ({
          ...prev,
          shuffledCards
        }));
      }
    },
    onGameEnd: (finalState) => {
      // Handle game completion with enhanced scoring
      saveGameResult(finalState.score);
    }
  });

  // Simple timer that works with hot reload
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef<boolean>(false);
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

  // Progressive difficulty calculation from user's chosen baseline
  const calculateProgressiveDifficulty = useCallback((
    baselineDifficulty: number,
    perfectRounds: number
  ) => {
    // Increase difficulty by 1 card every 2 perfect rounds, max 10 cards
    const difficultyIncrease = Math.floor(perfectRounds / 2);
    return Math.min(baselineDifficulty + difficultyIncrease, 10);
  }, []);

  // Calculate memorization time based on difficulty
  const calculateMemorizationTime = useCallback((difficulty: number) => {
    // Start at 20s for 5 cards, reduce by 2.5s per difficulty level above 5, min 10s
    return Math.max(20 - (difficulty - 5) * 2.5, 10);
  }, []);

  // Determine memory technique based on difficulty and cultural context
  const selectMemoryTechnique = useCallback((difficulty: number, culturalCategory: string) => {
    if (difficulty <= 5) return "observation";
    if (difficulty <= 6) return culturalCategory === "randomness-revolution" ? "loci" : "cultural";
    if (difficulty <= 7) return "linking";
    return "story";
  }, []);

  // Generate cultural story for memory aid
  const generateCulturalStory = useCallback((cards: Card[], culturalCategory: string) => {
    const theme = getThemeByCategory(culturalCategory);
    const storyTemplates = {
      "randomness-revolution": "In the ancient agora, a philosopher encounters",
      "actually-fun-games": "The griot tells of a journey where",
      "ai-and-llms": "In the temple garden, a sage contemplates",
      "generative-art-worlds": "Along the songline, the ancestors placed"
    };

    const template = storyTemplates[culturalCategory as keyof typeof storyTemplates] || storyTemplates["randomness-revolution"];
    const cardNames = cards.map(card => card.name).join(", then ");
    return `${template} ${cardNames}. Each symbol holds ancient wisdom.`;
  }, []);

  // Generate culturally appropriate cards with enhanced randomization
  const generateCards = useCallback((count: number): Card[] => {
    const culturalObjects = getThemeItems(culturalCategory, "objects");
    const culturalConcepts = getThemeItems(culturalCategory, "concepts");
    const culturalPlaces = getThemeItems(culturalCategory, "places");

    // Combine all items for more variety
    const allItems = [...culturalObjects, ...culturalConcepts, ...culturalPlaces];

    // Shuffle the array for true randomization
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, Math.min(count, allItems.length));

    const cards = selectedItems.map((item, index) => ({
      id: `card-${index}`,
      symbol: getCulturalEmoji(item),
      name: item,
      color: index % 2 === 0 ? theme.colors.primary : theme.colors.secondary,
      culturalContext: getCulturalContext(culturalCategory, item),
    }));

    return cards;
  }, [culturalCategory, theme.colors.primary, theme.colors.secondary]);

  // Start new game
  const startGame = useCallback(async () => {
    try {
      gameActions.setLoading(true);
      gameActions.setError(null);

      // Calculate progressive difficulty from user's baseline
      const currentDifficulty = calculateProgressiveDifficulty(
        gameState.gameData.baselineDifficulty,
        gameState.gameData.perfectRounds
      );

      // Calculate memorization time based on current difficulty
      const memorizationTime = calculateMemorizationTime(currentDifficulty);

      // Select appropriate memory technique
      const memoryTechnique = selectMemoryTechnique(currentDifficulty, culturalCategory);

      // Generate cards for current difficulty with true randomization
      const cards = generateCards(currentDifficulty);

      // Generate cultural story for memory aid
      const culturalStory = generateCulturalStory(cards, culturalCategory);

      // Update game state with enhanced data
      gameActions.setGameData({
        cards,
        shuffledCards: [], // Will be populated when entering recall phase
        userSequence: [],
        currentGuess: 0,
        difficulty: currentDifficulty, // Use calculated progressive difficulty
        baselineDifficulty: gameState.gameData.baselineDifficulty, // Keep user's baseline
        perfectRounds: gameState.gameData.perfectRounds,
        totalRounds: gameState.gameData.totalRounds + 1,
        memoryTechnique,
        culturalStory,
      });

      // Set dynamic memorization time and start game
      gameActions.setTimeLeft(memorizationTime);
      gameActions.setPhase("memorize");
      gameActions.setScore(0);
      startTimer();

      // Only try game service if user is authenticated
      if (user?.id) {
        // Create game configuration with dynamic values
        const gameConfig = {
          gameType: "chaos_cards" as const,
          difficulty:
            currentDifficulty <= 5
              ? ("easy" as const)
              : currentDifficulty <= 6
              ? ("medium" as const)
              : currentDifficulty <= 7
              ? ("hard" as const)
              : ("expert" as const),
          culture: culturalCategory,
          itemCount: currentDifficulty,
          studyTime: memorizationTime,
          chaosTime: 2,
        };

        try {
          // Start game session using the game service
          console.log("🎮 ChaosCards: Starting game session with config:", gameConfig);
          const sessionState = await startGameSession(gameConfig);
          console.log("✅ ChaosCards: Game session started successfully", sessionState);

          // Update cards if we got a sequence from the game service
          if (sessionState?.sequence) {
            const vrfCards = sessionState.sequence.items.map((item: any, index: number) => ({
              id: `card-${index}`,
              symbol: getCulturalEmoji(item.name),
              name: item.name,
              color:
                index % 2 === 0 ? theme.colors.primary : theme.colors.secondary,
              culturalContext: item.culturalContext,
            }));

            gameActions.setGameData(prev => ({
              ...prev,
              cards: vrfCards,
              shuffledCards: [], // Will be populated when entering recall phase
              userSequence: [],
              currentGuess: 0,
            }));

            console.log("✅ ChaosCards: VRF cards updated", vrfCards.length);
          }
        } catch (sessionError) {
          console.error("❌ ChaosCards: Game session failed:", sessionError);
          // Continue with local cards if session fails
          console.log("🔄 ChaosCards: Continuing with local cards");

          // Create local session as fallback
          const fallbackSession = {
            session: {
              id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              user_id: user.id,
              game_type: "chaos_cards",
              created_at: new Date().toISOString(),
            },
            config: gameConfig,
            startTime: Date.now(),
          };
          setLocalSession(fallbackSession);
          console.log("✅ ChaosCards: Local session created", fallbackSession);
        }
      }

    } catch (error) {
      console.error("Failed to start game:", error);
      gameActions.setError("Failed to start game. Please try again.");
    } finally {
      gameActions.setLoading(false);
    }
  }, [
    user?.id,
    gameState.gameData.baselineDifficulty,
    gameState.gameData.perfectRounds,
    culturalCategory,
    theme.colors,
    startGameSession,
    currentGame,
    generateCards,
    calculateProgressiveDifficulty,
    calculateMemorizationTime,
    selectMemoryTechnique,
    generateCulturalStory,
    gameActions,
    startTimer
  ]);

  // Optimized scoring calculation (memoized)
  const calculateFinalScore = useCallback((
    correctAnswers: number,
    totalCards: number,
    difficulty: number,
    memoryTechnique: string,
    isProgression: boolean
  ) => {
    const memorizationTime = calculateMemorizationTime(difficulty);
    const timeUsed = memorizationTime; // For now, assume full time used

    return ScoringRules.calculateChaosCardsScore(
      correctAnswers,
      totalCards,
      difficulty,
      memorizationTime,
      timeUsed,
      memoryTechnique,
      isProgression,
      culturalCategory
    );
  }, [calculateMemorizationTime, culturalCategory]);

  // Handle card selection during recall with optimized scoring
  const handleCardSelect = useCallback((cardId: string) => {
    const { cards, userSequence, currentGuess, perfectRounds, baselineDifficulty, difficulty, memoryTechnique } = gameState.gameData;
    const newSequence = [...userSequence, cardId];

    if (currentGuess >= cards.length - 1) {
      // Game finished - calculate score only once at the end
      const correctAnswers = newSequence.filter((answer, index) => answer === cards[index]?.id).length;
      const isProgression = difficulty > baselineDifficulty;

      const scoreResult = calculateFinalScore(
        correctAnswers,
        cards.length,
        difficulty,
        memoryTechnique,
        isProgression
      );

      const isPerfectRound = correctAnswers === cards.length;
      const newPerfectRounds = isPerfectRound ? perfectRounds + 1 : 0;
      const newDifficulty = calculateProgressiveDifficulty(baselineDifficulty, newPerfectRounds);

      gameActions.setGameData(prev => ({
        ...prev,
        userSequence: newSequence,
        perfectRounds: newPerfectRounds,
        difficulty: newDifficulty,
        scoreBreakdown: scoreResult.breakdown,
      }));
      gameActions.setScore(scoreResult.totalScore);
      gameActions.setPhase("results");
    } else {
      // Just update sequence and guess - no heavy calculations
      gameActions.setGameData(prev => ({
        ...prev,
        userSequence: newSequence,
        currentGuess: prev.currentGuess + 1,
      }));
    }
  }, [gameState.gameData, gameActions, calculateProgressiveDifficulty, calculateFinalScore]);

  // Save game result
  const saveGameResult = useCallback(async (finalScore: number) => {
    if (!user?.id) {
      console.log("⚠️ Cannot save game result: missing user", {
        hasUser: !!user?.id
      });
      return;
    }

    // Prevent multiple simultaneous save operations
    if (saveInProgressRef.current) {
      console.log("⚠️ Save already in progress, skipping duplicate call");
      return;
    }

    // Get the active session (either from GameProvider or local fallback)
    const activeSession = currentGame || localSession;

    if (!activeSession) {
      console.log("⚠️ No active session found (neither currentGame nor localSession)");
      // Create emergency fallback session
      const emergencySession = {
        session: {
          id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          game_type: "chaos_cards",
          created_at: new Date().toISOString(),
        },
        config: {
          gameType: "chaos_cards",
          culture: culturalCategory,
          itemCount: gameState.gameData.cards.length,
        },
        startTime: Date.now(),
      };
      setLocalSession(emergencySession);
      console.log("🆘 Emergency session created for save operation", emergencySession);
    }

    // Use the active session for save operation
    const sessionToUse = activeSession || localSession;

    console.log("💾 Starting to save game result...", {
      finalScore,
      userId: user.id,
      gameSessionId: sessionToUse?.session?.id,
      sessionType: currentGame ? 'GameProvider' : localSession ? 'Local' : 'Emergency'
    });

    // Set loading state during save operation
    saveInProgressRef.current = true;
    gameActions.setLoading(true);

    // Safety timeout to reset loading state if something goes wrong
    const timeoutId = setTimeout(() => {
      console.log("⏰ Safety timeout: Resetting loading state");
      saveInProgressRef.current = false;
      gameActions.setLoading(false);
    }, 10000); // 10 second timeout

    try {
      const { cards, userSequence } = gameState.gameData;
      const maxPossibleScore = cards.length * 10;
      const accuracy = (finalScore / maxPossibleScore) * 100; // Convert to percentage (0-100)
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

      // Submit result using the game service (if available)
      if (currentGame) {
        console.log("🎮 Submitting game result to GameProvider...", gameResult);

        // Add timeout to prevent hanging
        const endGamePromise = endGameSession(gameResult);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('endGameSession timeout')), 5000)
        );

        try {
          const enhancedResult = await Promise.race([endGamePromise, timeoutPromise]);
          console.log("✅ Game result submitted successfully", enhancedResult);
        } catch (endGameError) {
          console.warn("⚠️ endGameSession failed or timed out:", endGameError);
          // Continue with the rest of the save process even if endGameSession fails
        }
      } else {
        console.log("⚠️ Skipping GameProvider submission due to missing currentGame");

        // Fallback: Save directly using progress service
        console.log("💾 Using fallback progress service save...");
        await progressService.saveGameSession({
          user_id: user.id,
          game_type: "chaos_cards",
          score: finalScore,
          max_possible_score: maxPossibleScore,
          accuracy: accuracy,
          items_count: cards.length,
          duration_seconds: duration,
          difficulty_level: gameState.gameData.difficulty,
          session_data: {
            cultural_category: culturalCategory,
            memory_technique: gameState.gameData.memoryTechnique,
            cards: cards,
            user_sequence: userSequence,
            perfect_round: perfect,
            baseline_difficulty: gameState.gameData.baselineDifficulty,
            progressive_difficulty: gameState.gameData.difficulty,
            perfect_rounds: gameState.gameData.perfectRounds,
          },
        });
        console.log("✅ Fallback save completed");
      }

      // Submit to leaderboard based on user tier
      const userTier = user.tier || (user.authMethod === 'flow' ? 'flow' :
                      user.authMethod === 'supabase' ? 'supabase' : 'anonymous');

      // The GameProvider.endGameSession already handles score submission via GameService
      // This provides a cleaner hybrid approach with automatic verification for high scores
      console.log(`✅ Game result submitted via GameProvider with hybrid approach`);
      console.log("🔄 About to exit saveGameResult try block...");

    } catch (error) {
      console.error("❌ Error saving game result:", error);
      gameActions.setError("Failed to save game result");
    } finally {
      // Clear the safety timeout
      clearTimeout(timeoutId);
      // Always reset loading state
      saveInProgressRef.current = false;
      gameActions.setLoading(false);
      console.log("🏁 Game result saving process completed", {
        gameStateLoading: gameState.isLoading,
        gameProviderLoading: isLoading,
        saveInProgress: saveInProgressRef.current
      });
    }
  }, [user, currentGame, localSession, gameState.gameData, endGameSession, gameActions]);

  // Handle difficulty change (updates baseline difficulty)
  const handleDifficultyChange = useCallback((newBaselineDifficulty: number) => {
    // Calculate what the current difficulty should be with the new baseline
    const newCurrentDifficulty = calculateProgressiveDifficulty(
      newBaselineDifficulty,
      gameState.gameData.perfectRounds
    );

    gameActions.setGameData(prev => ({
      ...prev,
      baselineDifficulty: newBaselineDifficulty,
      difficulty: newCurrentDifficulty
    }));
  }, [gameActions, gameState.gameData.perfectRounds, calculateProgressiveDifficulty]);

  // Reset game
  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear local session
    setLocalSession(null);
    console.log("🧹 Local session cleared");

    gameActions.resetGame();
    resetGame();
  }, [gameActions, resetGame]);

  // Debug logging for loading states
  const combinedLoading = gameState.isLoading || isLoading;
  console.log("🔍 Loading states:", {
    gameStateLoading: gameState.isLoading,
    gameProviderLoading: isLoading,
    combinedLoading,
    saveInProgress: saveInProgressRef.current
  });

  return {
    // Game state
    gameState,
    isLoading: combinedLoading,
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

    // Enhanced game info
    memoryTechnique: gameState.gameData.memoryTechnique,
    culturalStory: gameState.gameData.culturalStory,
    perfectRounds: gameState.gameData.perfectRounds,
    totalRounds: gameState.gameData.totalRounds,

    // Card arrays for different phases
    cards: gameState.gameData.cards, // Original sequence for memorization
    shuffledCards: gameState.gameData.shuffledCards, // Shuffled for recall
  };
}

/**
 * Shared game progression utilities
 * Handles difficulty progression, perfect rounds calculation, and progression context
 */

// Progressive difficulty calculation (Miller's Rule: 7±2)
// Used across all games for consistent progression
export function calculateProgressiveDifficulty(
  baselineDifficulty: number,
  perfectRounds: number,
  maxDifficulty: number = 12
): number {
  // Increase difficulty by 1 item every 2 perfect rounds
  const difficultyIncrease = Math.floor(perfectRounds / 2);
  return Math.min(baselineDifficulty + difficultyIncrease, maxDifficulty);
}

// Calculate perfect rounds update
export function calculatePerfectRounds(
  currentPerfectRounds: number,
  isPerfectRound: boolean
): number {
  return isPerfectRound ? currentPerfectRounds + 1 : currentPerfectRounds;
}

// Get progression context message for UI display
export function getProgressionContext(perfectRounds: number): string {
  const roundsNeededForNext = 2 - (perfectRounds % 2);
  const isAtProgression = perfectRounds % 2 === 0 && perfectRounds > 0;
  
  if (isAtProgression) {
    return "🎯 Ready for next difficulty!";
  } else if (roundsNeededForNext === 1) {
    return "1 more perfect round to advance";
  } else {
    return `${roundsNeededForNext} perfect rounds to advance`;
  }
}

// Enhanced score result with progression data
export interface EnhancedScoreResult {
  score: number;
  breakdown: string[];
  accuracy: number;
  perfectRounds: number;
}

// Create enhanced score result for consistent game completion
export function createEnhancedScoreResult(
  scoreResult: { score: number; breakdown: string[] },
  accuracy: number,
  perfectRounds: number
): EnhancedScoreResult {
  return {
    ...scoreResult,
    accuracy: Math.round(accuracy),
    perfectRounds,
  };
}

// Get contextual button text based on performance and progression
export function getContextualButtonText(
  isPerfect: boolean,
  hasProgressed: boolean,
  difficulty: number,
  gameType: "chaos_cards" | "memory_palace" | "speed_challenge"
): string {
  if (isPerfect && hasProgressed) {
    switch (gameType) {
      case "chaos_cards":
        return `🚀 Continue at ${difficulty} Cards`;
      case "memory_palace":
        return `🏛️ Build ${difficulty}-Item Palace`;
      case "speed_challenge":
        return `⚡ Continue at ${difficulty} Items`;
    }
  } else if (isPerfect) {
    switch (gameType) {
      case "chaos_cards":
        return "🎯 Continue Journey";
      case "memory_palace":
        return "🏛️ Build Next Palace";
      case "speed_challenge":
        return "⚡ Next Challenge";
    }
  } else {
    return "🔄 Try Again";
  }
}

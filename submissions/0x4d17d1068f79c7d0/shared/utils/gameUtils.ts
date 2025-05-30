import { DifficultyLevel, DifficultyConfig, RandomSeed, GameType } from "../types/game";

// Seeded random number generator for consistent randomness
export function createSeededRandom(seed: number): RandomSeed {
  let value = seed;

  const next = () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };

  return { value, next };
}

// Shuffle array using seeded random
export function shuffleArray<T>(array: T[], seed: number): T[] {
  const random = createSeededRandom(seed);
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// Generate random items with seed
export function generateRandomItems<T>(
  generator: (seed: number, index: number) => T,
  count: number,
  seed: number
): T[] {
  const items: T[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generator(seed, i));
  }
  return items;
}

// Score calculation utilities
export function calculateScore(
  correct: number,
  total: number,
  difficulty: DifficultyLevel,
  timeBonus: number = 0
): number {
  const baseScore = (correct / total) * 100;
  const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
  return Math.round(baseScore * difficultyMultiplier + timeBonus);
}

export function calculateAccuracy(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// Difficulty configurations for different games
export const GAME_DIFFICULTY_CONFIGS: Record<GameType, Record<DifficultyLevel, DifficultyConfig>> = {
  chaos_cards: {
    easy: { itemCount: 6, studyTime: 20, chaosTime: 3, multiplier: 1 },
    medium: { itemCount: 8, studyTime: 15, chaosTime: 2, multiplier: 1.5 },
    hard: { itemCount: 10, studyTime: 10, chaosTime: 1, multiplier: 2 },
  },
  random_palace: {
    easy: { itemCount: 6, studyTime: 30, multiplier: 1 },
    medium: { itemCount: 8, studyTime: 25, multiplier: 1.5 },
    hard: { itemCount: 10, studyTime: 20, multiplier: 2 },
  },
  memory_speed: {
    easy: { itemCount: 10, timeLimit: 60, multiplier: 1 },
    medium: { itemCount: 15, timeLimit: 45, multiplier: 1.5 },
    hard: { itemCount: 20, timeLimit: 30, multiplier: 2 },
  },
  linking_method: {
    easy: { itemCount: 8, studyTime: 25, multiplier: 1 },
    medium: { itemCount: 12, studyTime: 20, multiplier: 1.5 },
    hard: { itemCount: 16, studyTime: 15, multiplier: 2 },
  },
  method_of_loci: {
    easy: { itemCount: 10, studyTime: 30, multiplier: 1 },
    medium: { itemCount: 15, studyTime: 25, multiplier: 1.5 },
    hard: { itemCount: 20, studyTime: 20, multiplier: 2 },
  },
};

// Get difficulty config for a game
export function getGameDifficultyConfig(gameType: GameType, difficulty: DifficultyLevel): DifficultyConfig {
  return GAME_DIFFICULTY_CONFIGS[gameType][difficulty];
}

// Format time display
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Progress bar calculation
export function calculateProgress(current: number, total: number): number {
  return total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
}

// Generate consistent colors from seed
export function generateColor(seed: number, index: number): string {
  const random = createSeededRandom(seed + index);
  const hue = Math.floor(random.next() * 360);
  const saturation = 60 + Math.floor(random.next() * 30); // 60-90%
  const lightness = 45 + Math.floor(random.next() * 20); // 45-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Validate game session data
export function validateGameSession(data: any): boolean {
  return (
    data &&
    typeof data.score === "number" &&
    typeof data.accuracy === "number" &&
    data.score >= 0 &&
    data.accuracy >= 0 &&
    data.accuracy <= 100
  );
}

// Performance tracking
export function trackPerformance(gameType: GameType, score: number, accuracy: number) {
  // This could be extended to send analytics data
  console.log(`Game Performance - ${gameType}: Score ${score}, Accuracy ${accuracy}%`);
}

// Achievement checking utilities
export function checkScoreAchievement(score: number, threshold: number): boolean {
  return score >= threshold;
}

export function checkAccuracyAchievement(accuracy: number, threshold: number): boolean {
  return accuracy >= threshold;
}

export function checkStreakAchievement(streak: number, threshold: number): boolean {
  return streak >= threshold;
}

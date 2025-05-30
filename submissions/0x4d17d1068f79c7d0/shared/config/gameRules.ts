// Game Rules and Configuration
// Centralizes game-specific rules, scoring, and difficulty settings

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type GameType = 'chaos_cards' | 'memory_palace' | 'speed_challenge' | 'pattern_match';

export interface DifficultyConfig {
  level: DifficultyLevel;
  itemCount: number;
  studyTime: number; // seconds
  timeLimit?: number; // seconds for timed games
  scoreMultiplier: number;
  description: string;
}

export interface GameTypeConfig {
  id: GameType;
  name: string;
  description: string;
  basePoints: number;
  maxScore: number;
  difficulties: Record<DifficultyLevel, DifficultyConfig>;
  phases: string[];
  rules: string[];
}

// Difficulty configurations for different game types
const CHAOS_CARDS_DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    itemCount: 3,
    studyTime: 20,
    scoreMultiplier: 1.0,
    description: '3 cards, 20 seconds to memorize'
  },
  medium: {
    level: 'medium',
    itemCount: 4,
    studyTime: 15,
    scoreMultiplier: 1.5,
    description: '4 cards, 15 seconds to memorize'
  },
  hard: {
    level: 'hard',
    itemCount: 5,
    studyTime: 12,
    scoreMultiplier: 2.0,
    description: '5 cards, 12 seconds to memorize'
  },
  expert: {
    level: 'expert',
    itemCount: 6,
    studyTime: 10,
    scoreMultiplier: 2.5,
    description: '6 cards, 10 seconds to memorize'
  }
};

const MEMORY_PALACE_DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    itemCount: 5,
    studyTime: 30,
    scoreMultiplier: 1.0,
    description: '5 items in 3 rooms, 30 seconds to explore'
  },
  medium: {
    level: 'medium',
    itemCount: 8,
    studyTime: 25,
    scoreMultiplier: 1.5,
    description: '8 items in 4 rooms, 25 seconds to explore'
  },
  hard: {
    level: 'hard',
    itemCount: 12,
    studyTime: 20,
    scoreMultiplier: 2.0,
    description: '12 items in 6 rooms, 20 seconds to explore'
  },
  expert: {
    level: 'expert',
    itemCount: 16,
    studyTime: 15,
    scoreMultiplier: 2.5,
    description: '16 items in 8 rooms, 15 seconds to explore'
  }
};

const SPEED_CHALLENGE_DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    itemCount: 10,
    studyTime: 0,
    timeLimit: 60,
    scoreMultiplier: 1.0,
    description: '10 items, 60 seconds'
  },
  medium: {
    level: 'medium',
    itemCount: 15,
    studyTime: 0,
    timeLimit: 45,
    scoreMultiplier: 1.5,
    description: '15 items, 45 seconds'
  },
  hard: {
    level: 'hard',
    itemCount: 20,
    studyTime: 0,
    timeLimit: 30,
    scoreMultiplier: 2.0,
    description: '20 items, 30 seconds'
  },
  expert: {
    level: 'expert',
    itemCount: 25,
    studyTime: 0,
    timeLimit: 20,
    scoreMultiplier: 2.5,
    description: '25 items, 20 seconds'
  }
};

// Game type configurations
export const GAME_CONFIGS: Record<GameType, GameTypeConfig> = {
  chaos_cards: {
    id: 'chaos_cards',
    name: 'Cultural Chaos Cards',
    description: 'Memorize the sequence of cultural symbols and recall them in order',
    basePoints: 100,
    maxScore: 1000,
    difficulties: CHAOS_CARDS_DIFFICULTIES,
    phases: ['setup', 'memorize', 'recall', 'results'],
    rules: [
      'Study the cultural symbols and their sequence',
      'Remember the order during the memorization phase',
      'Click the symbols in the correct order during recall',
      'Earn points for each correct selection'
    ]
  },
  memory_palace: {
    id: 'memory_palace',
    name: 'Cultural Memory Palace',
    description: 'Navigate through cultural spaces and remember item locations',
    basePoints: 150,
    maxScore: 1500,
    difficulties: MEMORY_PALACE_DIFFICULTIES,
    phases: ['setup', 'explore', 'navigate', 'results'],
    rules: [
      'Explore the cultural spaces and observe item locations',
      'Remember where each cultural item is placed',
      'Navigate to the correct locations when prompted',
      'Earn points for accurate navigation and memory'
    ]
  },
  speed_challenge: {
    id: 'speed_challenge',
    name: 'Cultural Speed Challenge',
    description: 'Quickly identify and categorize cultural items under time pressure',
    basePoints: 50,
    maxScore: 2000,
    difficulties: SPEED_CHALLENGE_DIFFICULTIES,
    phases: ['setup', 'countdown', 'challenge', 'results'],
    rules: [
      'Categorize cultural items as quickly as possible',
      'Beat the clock while maintaining accuracy',
      'Earn bonus points for speed and streaks',
      'Higher difficulty means more items and less time'
    ]
  },
  pattern_match: {
    id: 'pattern_match',
    name: 'Cultural Pattern Matching',
    description: 'Match cultural symbols and concepts in meaningful patterns',
    basePoints: 75,
    maxScore: 1200,
    difficulties: {
      easy: {
        level: 'easy',
        itemCount: 6,
        studyTime: 15,
        scoreMultiplier: 1.0,
        description: '6 pairs, 15 seconds to study'
      },
      medium: {
        level: 'medium',
        itemCount: 8,
        studyTime: 12,
        scoreMultiplier: 1.5,
        description: '8 pairs, 12 seconds to study'
      },
      hard: {
        level: 'hard',
        itemCount: 10,
        studyTime: 10,
        scoreMultiplier: 2.0,
        description: '10 pairs, 10 seconds to study'
      },
      expert: {
        level: 'expert',
        itemCount: 12,
        studyTime: 8,
        scoreMultiplier: 2.5,
        description: '12 pairs, 8 seconds to study'
      }
    },
    phases: ['setup', 'study', 'match', 'results'],
    rules: [
      'Study the cultural symbol pairs',
      'Find matching pairs by clicking cards',
      'Match symbols with their cultural meanings',
      'Complete all pairs to finish the game'
    ]
  }
};

// Scoring utilities
export const ScoringRules = {
  /**
   * Calculate base score for a game
   */
  calculateBaseScore(
    gameType: GameType,
    difficulty: DifficultyLevel,
    correctAnswers: number,
    totalQuestions: number
  ): number {
    const config = GAME_CONFIGS[gameType];
    const difficultyConfig = config.difficulties[difficulty];
    const accuracy = correctAnswers / totalQuestions;
    
    return Math.floor(
      config.basePoints * 
      accuracy * 
      difficultyConfig.scoreMultiplier
    );
  },

  /**
   * Calculate time bonus
   */
  calculateTimeBonus(
    timeSpent: number,
    maxTime: number,
    bonusMultiplier: number = 0.5
  ): number {
    if (timeSpent >= maxTime) return 0;
    const timeRatio = (maxTime - timeSpent) / maxTime;
    return Math.floor(timeRatio * bonusMultiplier * 100);
  },

  /**
   * Calculate streak bonus
   */
  calculateStreakBonus(streakLength: number, baseBonus: number = 10): number {
    return Math.floor(streakLength * baseBonus * Math.log(streakLength + 1));
  },

  /**
   * Calculate perfect game bonus
   */
  calculatePerfectBonus(
    gameType: GameType,
    difficulty: DifficultyLevel
  ): number {
    const config = GAME_CONFIGS[gameType];
    const difficultyConfig = config.difficulties[difficulty];
    return Math.floor(config.basePoints * difficultyConfig.scoreMultiplier * 0.5);
  }
};

// Achievement thresholds
export const AchievementThresholds = {
  PERFECT_GAME: 1.0, // 100% accuracy
  HIGH_ACCURACY: 0.9, // 90% accuracy
  GOOD_ACCURACY: 0.7, // 70% accuracy
  SPEED_DEMON_TIME: 0.5, // Complete in 50% of allowed time
  STREAK_MASTER: 10, // 10 correct in a row
  CULTURE_EXPLORER: 5, // Play 5 different cultures
  DEDICATION: 50, // Play 50 games
  MASTERY: 1000, // Score 1000+ points in a single game
};

// Utility functions
export function getGameConfig(gameType: GameType): GameTypeConfig {
  return GAME_CONFIGS[gameType];
}

export function getDifficultyConfig(
  gameType: GameType, 
  difficulty: DifficultyLevel
): DifficultyConfig {
  return GAME_CONFIGS[gameType].difficulties[difficulty];
}

export function getAllDifficulties(): DifficultyLevel[] {
  return ['easy', 'medium', 'hard', 'expert'];
}

export function getAllGameTypes(): GameType[] {
  return Object.keys(GAME_CONFIGS) as GameType[];
}

export function getMaxScore(gameType: GameType): number {
  return GAME_CONFIGS[gameType].maxScore;
}

export function getGameRules(gameType: GameType): string[] {
  return GAME_CONFIGS[gameType].rules;
}

export function getGamePhases(gameType: GameType): string[] {
  return GAME_CONFIGS[gameType].phases;
}

export function validateGameConfig(
  gameType: GameType,
  difficulty: DifficultyLevel
): boolean {
  return gameType in GAME_CONFIGS && 
         difficulty in GAME_CONFIGS[gameType].difficulties;
}

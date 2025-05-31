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
    itemCount: 5,
    studyTime: 20,
    scoreMultiplier: 1.0,
    description: '5 cards, 20 seconds to memorize'
  },
  medium: {
    level: 'medium',
    itemCount: 6,
    studyTime: 15,
    scoreMultiplier: 1.5,
    description: '6 cards, 15 seconds to memorize'
  },
  hard: {
    level: 'hard',
    itemCount: 7,
    studyTime: 12,
    scoreMultiplier: 2.0,
    description: '7 cards, 12 seconds to memorize'
  },
  expert: {
    level: 'expert',
    itemCount: 8,
    studyTime: 10,
    scoreMultiplier: 2.5,
    description: '8 cards, 10 seconds to memorize'
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

// Enhanced Scoring System
export const ScoringRules = {
  /**
   * Calculate enhanced Chaos Cards score with multiple bonuses
   */
  calculateChaosCardsScore(
    correctCards: number,
    totalCards: number,
    difficulty: number,
    memorizationTime: number,
    timeUsed: number,
    memoryTechnique: string,
    isProgression: boolean = false,
    culturalCategory: string = ''
  ): {
    baseScore: number;
    difficultyBonus: number;
    timeBonus: number;
    techniqueBonus: number;
    progressionBonus: number;
    culturalBonus: number;
    totalScore: number;
    breakdown: string[];
  } {
    // Base points per card (scales with difficulty)
    const basePointsPerCard = 5 + Math.max(0, (difficulty - 5) * 2); // 5-11 points per card

    // Accuracy score
    const baseScore = correctCards * basePointsPerCard;

    // Difficulty multiplier (exponential growth for higher difficulties)
    const difficultyMultiplier = Math.pow(1.15, Math.max(0, difficulty - 5)); // 1.0x to 2.0x
    const difficultyBonus = Math.floor(baseScore * (difficultyMultiplier - 1));

    // Time bonus (faster memorization = bonus, max 20 points)
    const timeEfficiency = Math.max(0, (memorizationTime - timeUsed) / memorizationTime);
    const timeBonus = Math.floor(timeEfficiency * 20);

    // Memory technique bonus
    const techniqueMultipliers = {
      'observation': 0,
      'loci': 10,
      'linking': 15,
      'story': 20,
      'cultural': 25
    };
    const techniqueBonus = techniqueMultipliers[memoryTechnique as keyof typeof techniqueMultipliers] || 0;

    // Progression bonus (advancing difficulty)
    const progressionBonus = isProgression ? 25 : 0;

    // Cultural exploration bonus (first time playing a culture)
    const culturalBonus = culturalCategory && culturalCategory !== 'randomness-revolution' ? 10 : 0;

    const totalScore = baseScore + difficultyBonus + timeBonus + techniqueBonus + progressionBonus + culturalBonus;

    // Create breakdown for display (optimized)
    const breakdown: string[] = [
      `Base: ${baseScore} pts (${correctCards}/${totalCards} × ${basePointsPerCard} pts)`,
      ...(difficultyBonus > 0 ? [`Difficulty: +${difficultyBonus} pts (Level ${difficulty})`] : []),
      ...(timeBonus > 0 ? [`Speed: +${timeBonus} pts (Quick memorization)`] : []),
      ...(techniqueBonus > 0 ? [`Technique: +${techniqueBonus} pts (${memoryTechnique})`] : []),
      ...(progressionBonus > 0 ? [`Progression: +${progressionBonus} pts (Level up!)`] : []),
      ...(culturalBonus > 0 ? [`Cultural: +${culturalBonus} pts (New culture)`] : [])
    ];

    return {
      baseScore,
      difficultyBonus,
      timeBonus,
      techniqueBonus,
      progressionBonus,
      culturalBonus,
      totalScore,
      breakdown
    };
  },

  /**
   * Calculate base score for other game types (legacy support)
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
   * Calculate time bonus (legacy)
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

// Milestone rewards for reaching difficulty levels
export const MILESTONE_REWARDS = {
  7: { points: 50, title: "Miller's Number Reached!", description: "Reached the magical number seven!" },
  8: { points: 75, title: "Beyond Human Limits!", description: "Exceeded normal memory capacity!" },
  9: { points: 100, title: "Memory Superhuman!", description: "Achieved superhuman memory performance!" },
  10: { points: 150, title: "Legendary Memory Master!", description: "Reached legendary memory mastery!" }
};

// Cultural exploration bonuses
export const CULTURAL_BONUSES = {
  'first_culture': 10,      // First game in any culture
  'culture_explorer': 25,   // Play 3 different cultures
  'culture_master': 50,     // Perfect game in 5 cultures
  'global_memory': 100,     // Master all available cultures
};

// Balanced achievement point values
export const ACHIEVEMENT_POINTS = {
  // Tier 1: Basic achievements (1-2 good games worth)
  'first_perfect': 25,
  'challenger': 30,

  // Tier 2: Skill achievements (3-5 good games worth)
  'memory_champion': 75,
  'progression_master': 60,
  'sequence_master': 90,

  // Tier 3: Mastery achievements (10+ good games worth)
  'memory_athlete': 150,
  'speed_demon': 120,
  'lightning_reflexes': 100,
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
  MASTERY: 150, // Score 150+ points in a single game (updated for new scoring)
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

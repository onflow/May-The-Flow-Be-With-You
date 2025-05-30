// Achievement System Configuration
// Defines all achievements, their requirements, and unlock conditions

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  culture?: string;
  rarity: AchievementRarity;
  requirements: AchievementRequirement[];
  rewards?: AchievementReward;
  unlockedAt?: number;
  nftId?: string;
  transactionId?: string;
}

export type AchievementCategory = 
  | 'performance' 
  | 'mastery' 
  | 'speed' 
  | 'cultural' 
  | 'social' 
  | 'dedication' 
  | 'exploration';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementRequirement {
  type: 'score' | 'accuracy' | 'time' | 'streak' | 'games_played' | 'culture_count' | 'perfect_games';
  value: number;
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  gameType?: string;
  culture?: string;
}

export interface AchievementReward {
  points: number;
  title?: string;
  badge?: string;
  unlocks?: string[]; // Unlocks other content
}

// Achievement definitions organized by category
export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Performance Achievements
  'perfect_grecian': {
    id: 'perfect_grecian',
    name: 'Grecian Perfection',
    description: 'Achieve perfect accuracy in a Grecian Roman game',
    icon: '🏛️',
    category: 'performance',
    culture: 'randomness-revolution',
    rarity: 'rare',
    requirements: [
      { type: 'accuracy', value: 1.0, operator: 'eq', culture: 'randomness-revolution' }
    ],
    rewards: { points: 100, title: 'Grecian Scholar' }
  },

  'perfect_griot': {
    id: 'perfect_griot',
    name: 'Griot Master',
    description: 'Achieve perfect accuracy in an African Oral Tradition game',
    icon: '🥁',
    category: 'performance',
    culture: 'actually-fun-games',
    rarity: 'rare',
    requirements: [
      { type: 'accuracy', value: 1.0, operator: 'eq', culture: 'actually-fun-games' }
    ],
    rewards: { points: 100, title: 'Griot Storyteller' }
  },

  'perfect_sage': {
    id: 'perfect_sage',
    name: 'Eastern Sage',
    description: 'Achieve perfect accuracy in an Eastern Philosophy game',
    icon: '🧘',
    category: 'performance',
    culture: 'ai-and-llms',
    rarity: 'rare',
    requirements: [
      { type: 'accuracy', value: 1.0, operator: 'eq', culture: 'ai-and-llms' }
    ],
    rewards: { points: 100, title: 'Wise Sage' }
  },

  'perfect_dreamtime': {
    id: 'perfect_dreamtime',
    name: 'Dreamtime Navigator',
    description: 'Achieve perfect accuracy in a Dreamtime Tradition game',
    icon: '🎨',
    category: 'performance',
    culture: 'generative-art-worlds',
    rarity: 'rare',
    requirements: [
      { type: 'accuracy', value: 1.0, operator: 'eq', culture: 'generative-art-worlds' }
    ],
    rewards: { points: 100, title: 'Dreamtime Walker' }
  },

  // Mastery Achievements
  'high_scorer': {
    id: 'high_scorer',
    name: 'Memory Master',
    description: 'Score over 1000 points in a single game',
    icon: '🏆',
    category: 'mastery',
    rarity: 'epic',
    requirements: [
      { type: 'score', value: 1000, operator: 'gte' }
    ],
    rewards: { points: 200, title: 'Memory Master' }
  },

  'legendary_scorer': {
    id: 'legendary_scorer',
    name: 'Legendary Memory',
    description: 'Score over 2000 points in a single game',
    icon: '👑',
    category: 'mastery',
    rarity: 'legendary',
    requirements: [
      { type: 'score', value: 2000, operator: 'gte' }
    ],
    rewards: { points: 500, title: 'Memory Legend' }
  },

  // Speed Achievements
  'speed_demon': {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a game in under 30 seconds with 80%+ accuracy',
    icon: '⚡',
    category: 'speed',
    rarity: 'rare',
    requirements: [
      { type: 'time', value: 30, operator: 'lte' },
      { type: 'accuracy', value: 0.8, operator: 'gte' }
    ],
    rewards: { points: 150, title: 'Speed Demon' }
  },

  'lightning_fast': {
    id: 'lightning_fast',
    name: 'Lightning Fast',
    description: 'Complete a game in under 15 seconds with 90%+ accuracy',
    icon: '⚡⚡',
    category: 'speed',
    rarity: 'epic',
    requirements: [
      { type: 'time', value: 15, operator: 'lte' },
      { type: 'accuracy', value: 0.9, operator: 'gte' }
    ],
    rewards: { points: 300, title: 'Lightning Master' }
  },

  // Cultural Achievements
  'culture_explorer': {
    id: 'culture_explorer',
    name: 'Cultural Explorer',
    description: 'Play games from all 4 cultural traditions',
    icon: '🌍',
    category: 'cultural',
    rarity: 'epic',
    requirements: [
      { type: 'culture_count', value: 4, operator: 'gte' }
    ],
    rewards: { points: 250, title: 'Cultural Explorer' }
  },

  'grecian_specialist': {
    id: 'grecian_specialist',
    name: 'Grecian Specialist',
    description: 'Play 10 Grecian Roman tradition games',
    icon: '🏛️',
    category: 'cultural',
    culture: 'randomness-revolution',
    rarity: 'common',
    requirements: [
      { type: 'games_played', value: 10, operator: 'gte', culture: 'randomness-revolution' }
    ],
    rewards: { points: 50 }
  },

  'griot_specialist': {
    id: 'griot_specialist',
    name: 'Griot Specialist',
    description: 'Play 10 African Oral Tradition games',
    icon: '🥁',
    category: 'cultural',
    culture: 'actually-fun-games',
    rarity: 'common',
    requirements: [
      { type: 'games_played', value: 10, operator: 'gte', culture: 'actually-fun-games' }
    ],
    rewards: { points: 50 }
  },

  // Dedication Achievements
  'dedicated_player': {
    id: 'dedicated_player',
    name: 'Dedicated Player',
    description: 'Play 50 games total',
    icon: '🎯',
    category: 'dedication',
    rarity: 'rare',
    requirements: [
      { type: 'games_played', value: 50, operator: 'gte' }
    ],
    rewards: { points: 100, title: 'Dedicated Player' }
  },

  'memory_champion': {
    id: 'memory_champion',
    name: 'Memory Champion',
    description: 'Play 100 games total',
    icon: '🏅',
    category: 'dedication',
    rarity: 'epic',
    requirements: [
      { type: 'games_played', value: 100, operator: 'gte' }
    ],
    rewards: { points: 300, title: 'Memory Champion' }
  },

  'perfectionist': {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Achieve 10 perfect games',
    icon: '💎',
    category: 'dedication',
    rarity: 'legendary',
    requirements: [
      { type: 'perfect_games', value: 10, operator: 'gte' }
    ],
    rewards: { points: 500, title: 'Perfectionist' }
  },

  // Streak Achievements
  'streak_starter': {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Get a 5-answer streak',
    icon: '🔥',
    category: 'performance',
    rarity: 'common',
    requirements: [
      { type: 'streak', value: 5, operator: 'gte' }
    ],
    rewards: { points: 25 }
  },

  'streak_master': {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Get a 10-answer streak',
    icon: '🔥🔥',
    category: 'performance',
    rarity: 'rare',
    requirements: [
      { type: 'streak', value: 10, operator: 'gte' }
    ],
    rewards: { points: 100, title: 'Streak Master' }
  },

  'unstoppable': {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Get a 20-answer streak',
    icon: '🔥🔥🔥',
    category: 'performance',
    rarity: 'legendary',
    requirements: [
      { type: 'streak', value: 20, operator: 'gte' }
    ],
    rewards: { points: 400, title: 'Unstoppable Force' }
  }
};

// Achievement checking utilities
export class AchievementChecker {
  /**
   * Check if requirements are met for an achievement
   */
  static checkRequirements(
    achievement: Achievement,
    gameResult: any,
    userProgress: any
  ): boolean {
    return achievement.requirements.every(req => 
      this.checkSingleRequirement(req, gameResult, userProgress)
    );
  }

  /**
   * Check a single requirement
   */
  private static checkSingleRequirement(
    requirement: AchievementRequirement,
    gameResult: any,
    userProgress: any
  ): boolean {
    let value: number;

    switch (requirement.type) {
      case 'score':
        value = gameResult.score || 0;
        break;
      case 'accuracy':
        value = gameResult.accuracy || 0;
        break;
      case 'time':
        value = gameResult.duration || 0;
        break;
      case 'streak':
        value = gameResult.maxStreak || 0;
        break;
      case 'games_played':
        if (requirement.culture) {
          value = userProgress.culturalMastery?.[requirement.culture] || 0;
        } else {
          value = userProgress.gamesPlayed || 0;
        }
        break;
      case 'culture_count':
        value = Object.keys(userProgress.culturalMastery || {}).length;
        break;
      case 'perfect_games':
        value = userProgress.statistics?.perfectGames || 0;
        break;
      default:
        return false;
    }

    return this.compareValues(value, requirement.value, requirement.operator);
  }

  /**
   * Compare values based on operator
   */
  private static compareValues(
    actual: number, 
    required: number, 
    operator: AchievementRequirement['operator']
  ): boolean {
    switch (operator) {
      case 'eq': return actual === required;
      case 'gte': return actual >= required;
      case 'lte': return actual <= required;
      case 'gt': return actual > required;
      case 'lt': return actual < required;
      default: return false;
    }
  }

  /**
   * Get newly unlocked achievements
   */
  static getNewlyUnlocked(
    gameResult: any,
    userProgress: any,
    existingAchievements: string[] = []
  ): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const achievement of Object.values(ACHIEVEMENTS)) {
      // Skip if already unlocked
      if (existingAchievements.includes(achievement.id)) {
        continue;
      }

      // Check if requirements are met
      if (this.checkRequirements(achievement, gameResult, userProgress)) {
        newAchievements.push({
          ...achievement,
          unlockedAt: Date.now()
        });
      }
    }

    return newAchievements;
  }
}

// Utility functions
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
}

export function getAchievementsByCulture(culture: string): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.culture === culture);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.rarity === rarity);
}

export function getAllAchievements(): Achievement[] {
  return Object.values(ACHIEVEMENTS);
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS[id];
}

export function getTotalAchievementPoints(): number {
  return Object.values(ACHIEVEMENTS).reduce((total, achievement) => {
    return total + (achievement.rewards?.points || 0);
  }, 0);
}

// Game Adapter Interface for Dual-Mode Architecture
// Enables seamless switching between off-chain and on-chain game modes

import { RandomnessProvider } from "../providers/RandomnessProvider";
import { GameSession, GameResult } from "../types/game";

export interface GameProgress {
  userId: string;
  level: number;
  totalScore: number;
  gamesPlayed: number;
  bestStreak: number;
  culturalMastery: Record<string, number>; // culture -> mastery level
  lastPlayed: number;
  achievements: Achievement[];
  statistics: GameStatistics;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  culture?: string;
  unlockedAt: number;
  nftId?: string; // Only for on-chain achievements
  transactionId?: string; // Only for on-chain achievements
}

export interface GameStatistics {
  totalGamesPlayed: number;
  totalTimeSpent: number; // in seconds
  averageAccuracy: number;
  favoriteGame: string;
  favoriteCulture: string;
  perfectGames: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  culture?: string;
  gameType?: string;
  avatar?: string;
  isVerified?: boolean; // Only for on-chain entries
}

export interface GameFeature {
  id: string;
  name: string;
  description: string;
  requiresOnChain: boolean;
}

// Available game features
export const GAME_FEATURES: GameFeature[] = [
  {
    id: 'local_progress',
    name: 'Progress Tracking',
    description: 'Save your game progress locally',
    requiresOnChain: false
  },
  {
    id: 'achievements',
    name: 'Achievements',
    description: 'Unlock achievements for your accomplishments',
    requiresOnChain: false
  },
  {
    id: 'leaderboards',
    name: 'Leaderboards',
    description: 'Compete with other players',
    requiresOnChain: false
  },
  {
    id: 'nft_achievements',
    name: 'NFT Achievements',
    description: 'Permanent, tradeable proof of your memory mastery',
    requiresOnChain: true
  },
  {
    id: 'verifiable_randomness',
    name: 'Verifiable Randomness',
    description: 'Provably fair random generation using Flow VRF',
    requiresOnChain: true
  },
  {
    id: 'tournaments',
    name: 'Tournaments',
    description: 'Participate in competitive tournaments with prizes',
    requiresOnChain: true
  },
  {
    id: 'global_verification',
    name: 'Global Verification',
    description: 'Verify your scores on the blockchain',
    requiresOnChain: true
  }
];

/**
 * Game Adapter Interface
 * Provides a unified interface for both off-chain and on-chain game modes
 */
export interface GameAdapter {
  // Mode identification
  getMode(): 'offchain' | 'onchain';
  supportsFeature(featureId: string): boolean;
  getAvailableFeatures(): GameFeature[];

  // Randomness
  getRandomnessProvider(): RandomnessProvider;

  // Progress & Persistence
  saveProgress(userId: string, progress: GameProgress): Promise<void>;
  loadProgress(userId: string): Promise<GameProgress | null>;
  
  // Achievements
  unlockAchievement(userId: string, achievement: Achievement): Promise<void>;
  getAchievements(userId: string): Promise<Achievement[]>;
  
  // Leaderboards
  submitScore(userId: string, gameType: string, score: number, metadata?: any): Promise<{ success: boolean; transactionId?: string; error?: string; isVerified?: boolean; isEligible?: boolean }>;
  getLeaderboard(gameType: string, culture?: string, limit?: number): Promise<LeaderboardEntry[]>;
  
  // Game Sessions
  startGameSession(userId: string, gameType: string, config: any): Promise<GameSession>;
  endGameSession(sessionId: string, result: GameResult): Promise<void>;
  
  // Statistics
  updateStatistics(userId: string, gameResult: GameResult): Promise<void>;
  getStatistics(userId: string): Promise<GameStatistics>;
}

/**
 * Base Game Adapter
 * Provides common functionality for both adapter implementations
 */
export abstract class BaseGameAdapter implements GameAdapter {
  protected features: GameFeature[];

  constructor(features: GameFeature[]) {
    this.features = features;
  }

  abstract getMode(): 'offchain' | 'onchain';
  abstract getRandomnessProvider(): RandomnessProvider;
  abstract saveProgress(userId: string, progress: GameProgress): Promise<void>;
  abstract loadProgress(userId: string): Promise<GameProgress | null>;
  abstract unlockAchievement(userId: string, achievement: Achievement): Promise<void>;
  abstract getAchievements(userId: string): Promise<Achievement[]>;
  abstract submitScore(userId: string, gameType: string, score: number, metadata?: any): Promise<{ success: boolean; transactionId?: string; error?: string; isVerified?: boolean; isEligible?: boolean }>;
  abstract getLeaderboard(gameType: string, culture?: string, limit?: number): Promise<LeaderboardEntry[]>;

  supportsFeature(featureId: string): boolean {
    const feature = GAME_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;
    
    if (feature.requiresOnChain && this.getMode() === 'offchain') {
      return false;
    }
    
    return this.features.some(f => f.id === featureId);
  }

  getAvailableFeatures(): GameFeature[] {
    return this.features.filter(feature => this.supportsFeature(feature.id));
  }

  async startGameSession(userId: string, gameType: string, config: any): Promise<GameSession> {
    const sessionId = this.generateSessionId();
    const session: GameSession = {
      id: sessionId,
      user_id: userId,
      game_type: gameType as any,
      score: 0,
      max_possible_score: config.maxScore || 1000,
      accuracy: 0,
      items_count: config.itemCount || 8,
      duration_seconds: 0,
      difficulty_level: this.getDifficultyLevel(config.difficulty),
      session_data: config,
      created_at: new Date().toISOString()
    };

    return session;
  }

  async endGameSession(sessionId: string, result: GameResult): Promise<void> {
    // Base implementation - can be overridden by specific adapters
    console.log(`Game session ${sessionId} ended with result:`, result);
  }

  async updateStatistics(userId: string, gameResult: GameResult): Promise<void> {
    const currentStats = await this.getStatistics(userId);
    
    const updatedStats: GameStatistics = {
      totalGamesPlayed: currentStats.totalGamesPlayed + 1,
      totalTimeSpent: currentStats.totalTimeSpent + gameResult.duration,
      averageAccuracy: (currentStats.averageAccuracy * currentStats.totalGamesPlayed + gameResult.accuracy) / (currentStats.totalGamesPlayed + 1),
      favoriteGame: currentStats.favoriteGame, // Would need more logic to determine
      favoriteCulture: currentStats.favoriteCulture, // Would need more logic to determine
      perfectGames: currentStats.perfectGames + (gameResult.perfect ? 1 : 0),
      longestStreak: Math.max(currentStats.longestStreak, gameResult.score)
    };

    // Save updated statistics (implementation depends on adapter)
    await this.saveStatistics(userId, updatedStats);
  }

  async getStatistics(userId: string): Promise<GameStatistics> {
    // Default statistics - should be overridden by specific adapters
    return {
      totalGamesPlayed: 0,
      totalTimeSpent: 0,
      averageAccuracy: 0,
      favoriteGame: '',
      favoriteCulture: '',
      perfectGames: 0,
      longestStreak: 0
    };
  }

  protected abstract saveStatistics(userId: string, stats: GameStatistics): Promise<void>;

  protected generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected getDifficultyLevel(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
    }
  }

  protected createDefaultProgress(userId: string): GameProgress {
    return {
      userId,
      level: 1,
      totalScore: 0,
      gamesPlayed: 0,
      bestStreak: 0,
      culturalMastery: {},
      lastPlayed: Date.now(),
      achievements: [],
      statistics: {
        totalGamesPlayed: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        favoriteGame: '',
        favoriteCulture: '',
        perfectGames: 0,
        longestStreak: 0
      }
    };
  }
}

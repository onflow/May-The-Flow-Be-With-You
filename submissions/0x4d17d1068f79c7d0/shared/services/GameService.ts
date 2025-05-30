// Unified Game Service
// Provides a single interface for both off-chain and on-chain game modes

import { GameAdapter } from "../adapters/GameAdapter";
import { OffChainAdapter } from "../adapters/OffChainAdapter";
import { OnChainAdapter } from "../adapters/OnChainAdapter";
import { RandomnessProvider, createSeededRandomFromProvider } from "../providers/RandomnessProvider";
import { GameSession, GameResult, GameType, DifficultyLevel } from "../types/game";
import { getThemeByCategory, getThemeItems } from "../config/culturalThemes";
import { getCulturalEmoji, getCulturalContext } from "../utils/culturalMapping";
import { createGameError, withErrorHandling } from "../utils/errorHandling";

export interface GameConfig {
  gameType: GameType;
  difficulty: DifficultyLevel;
  culture: string;
  itemCount: number;
  studyTime?: number;
  chaosTime?: number;
  timeLimit?: number;
  customSeed?: number;
}

export interface GameSequence {
  items: GameItem[];
  seed: number;
  config: GameConfig;
  verificationData?: any;
}

export interface GameItem {
  id: string;
  symbol: string;
  name: string;
  category: string;
  culturalContext?: string;
  position: number;
}

export interface EnhancedGameResult extends GameResult {
  achievements: any[];
  newRecord: boolean;
  verificationData?: any;
  culturalMastery?: Record<string, number>;
}

export class GameService {
  private adapter: GameAdapter;
  private randomnessProvider: RandomnessProvider;

  constructor(adapter: GameAdapter) {
    this.adapter = adapter;
    this.randomnessProvider = adapter.getRandomnessProvider();
  }

  /**
   * Get the current game mode
   */
  getMode(): 'offchain' | 'onchain' {
    return this.adapter.getMode();
  }

  /**
   * Get available features for current mode
   */
  getAvailableFeatures() {
    return this.adapter.getAvailableFeatures();
  }

  /**
   * Check if a feature is supported
   */
  supportsFeature(featureId: string): boolean {
    return this.adapter.supportsFeature(featureId);
  }

  /**
   * Generate a new game sequence
   */
  async generateGameSequence(config: GameConfig): Promise<GameSequence> {
    try {
      // Get randomness seed
      const seed = config.customSeed || await this.randomnessProvider.generateSeed();

      // Get cultural theme and items
      const theme = getThemeByCategory(config.culture);
      const culturalObjects = getThemeItems(config.culture, "objects");
      const culturalPlaces = getThemeItems(config.culture, "places");
      const culturalConcepts = getThemeItems(config.culture, "concepts");

      // Combine all cultural items
      const allItems = [
        ...culturalObjects.map(item => ({ name: item, category: 'objects' })),
        ...culturalPlaces.map(item => ({ name: item, category: 'places' })),
        ...culturalConcepts.map(item => ({ name: item, category: 'concepts' }))
      ];

      // Create seeded random generator
      const seededRandom = createSeededRandomFromProvider(this.randomnessProvider, seed);

      // Shuffle and select items
      const shuffledItems = await seededRandom.shuffle(allItems);
      const selectedItems = shuffledItems.slice(0, config.itemCount);

      // Create game items with positions
      const gameItems: GameItem[] = selectedItems.map((item, index) => ({
        id: `${config.culture}_${item.category}_${index}`,
        symbol: getCulturalEmoji(item.name),
        name: item.name,
        category: item.category,
        culturalContext: getCulturalContext(config.culture, item.name),
        position: index
      }));

      // Get verification data if available
      const verificationData = await this.randomnessProvider.getVerificationData();

      return {
        items: gameItems,
        seed,
        config,
        verificationData
      };
    } catch (error) {
      throw createGameError('Game sequence generation failed', error);
    }
  }

  /**
   * Start a new game session
   */
  async startGameSession(userId: string, config: GameConfig): Promise<GameSession> {
    try {
      const session = await this.adapter.startGameSession(userId, config.gameType, {
        ...config,
        maxScore: this.calculateMaxScore(config),
        mode: this.getMode()
      });

      return session;
    } catch (error) {
      console.error('Failed to start game session:', error);
      throw error;
    }
  }

  /**
   * Submit game result and handle all side effects
   */
  async submitGameResult(
    userId: string,
    sessionId: string,
    result: GameResult,
    config: GameConfig
  ): Promise<EnhancedGameResult> {
    try {
      // Load current progress
      const currentProgress = await this.adapter.loadProgress(userId);

      // Calculate achievements
      const newAchievements = this.checkAchievements(currentProgress, result, config);

      // Update progress
      const updatedProgress = this.updateProgress(currentProgress, result, config);
      await this.adapter.saveProgress(userId, updatedProgress);

      // Submit score to leaderboard
      await this.adapter.submitScore(userId, config.gameType, result.score, {
        accuracy: result.accuracy,
        duration: result.duration,
        difficultyLevel: this.getDifficultyLevel(config.difficulty),
        culture: config.culture,
        maxPossibleScore: this.calculateMaxScore(config),
        itemsCount: config.itemCount
      });

      // Unlock new achievements
      for (const achievement of newAchievements) {
        await this.adapter.unlockAchievement(userId, achievement);
      }

      // Update statistics
      await this.adapter.updateStatistics(userId, result);

      // End game session
      await this.adapter.endGameSession(sessionId, result);

      // Check for new records
      const isNewRecord = await this.checkForNewRecord(userId, config.gameType, result.score);

      // Get verification data
      const verificationData = await this.randomnessProvider.getVerificationData();

      return {
        ...result,
        achievements: newAchievements,
        newRecord: isNewRecord,
        verificationData,
        culturalMastery: updatedProgress.culturalMastery
      };
    } catch (error) {
      console.error('Failed to submit game result:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard for a specific game type
   */
  async getLeaderboard(gameType: GameType, culture?: string, limit: number = 10) {
    return this.adapter.getLeaderboard(gameType, culture, limit);
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string) {
    return this.adapter.loadProgress(userId);
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string) {
    return this.adapter.getAchievements(userId);
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string) {
    return this.adapter.getStatistics(userId);
  }

  // Private helper methods

  private calculateMaxScore(config: GameConfig): number {
    const baseScore = config.itemCount * 100;
    const difficultyMultiplier = this.getDifficultyMultiplier(config.difficulty);
    return Math.floor(baseScore * difficultyMultiplier);
  }

  private getDifficultyLevel(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
    }
  }

  private getDifficultyMultiplier(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'easy': return 1.0;
      case 'medium': return 1.5;
      case 'hard': return 2.0;
      default: return 1.5;
    }
  }

  private checkAchievements(currentProgress: any, result: GameResult, config: GameConfig): any[] {
    const achievements: any[] = [];

    // Perfect game achievement
    if (result.perfect && result.accuracy === 1.0) {
      achievements.push({
        id: `perfect_${config.culture}_${config.gameType}`,
        name: `Perfect ${config.culture} Memory`,
        description: `Achieved perfect accuracy in ${config.gameType}`,
        icon: '🎯',
        category: 'performance',
        culture: config.culture,
        unlockedAt: Date.now()
      });
    }

    // High score achievement
    if (result.score > 1000) {
      achievements.push({
        id: `high_score_${config.culture}`,
        name: `${config.culture} Master`,
        description: `Scored over 1000 points in ${config.culture} games`,
        icon: '🏆',
        category: 'mastery',
        culture: config.culture,
        unlockedAt: Date.now()
      });
    }

    // Speed achievement
    if (result.duration < 30 && result.accuracy > 0.8) {
      achievements.push({
        id: `speed_demon_${config.culture}`,
        name: `${config.culture} Speed Demon`,
        description: `Completed game in under 30 seconds with 80%+ accuracy`,
        icon: '⚡',
        category: 'speed',
        culture: config.culture,
        unlockedAt: Date.now()
      });
    }

    return achievements;
  }

  private updateProgress(currentProgress: any, result: GameResult, config: GameConfig): any {
    if (!currentProgress) {
      currentProgress = {
        userId: '',
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

    // Update basic progress
    currentProgress.totalScore += result.score;
    currentProgress.gamesPlayed += 1;
    currentProgress.lastPlayed = Date.now();

    // Update cultural mastery
    if (!currentProgress.culturalMastery[config.culture]) {
      currentProgress.culturalMastery[config.culture] = 0;
    }
    currentProgress.culturalMastery[config.culture] += Math.floor(result.score / 100);

    // Update level based on total score
    currentProgress.level = Math.floor(currentProgress.totalScore / 1000) + 1;

    return currentProgress;
  }

  private async checkForNewRecord(userId: string, gameType: GameType, score: number): Promise<boolean> {
    try {
      const leaderboard = await this.adapter.getLeaderboard(gameType, undefined, 1);
      if (leaderboard.length === 0) return true;

      const topScore = leaderboard[0];
      return topScore.userId === userId && score > topScore.score;
    } catch (error) {
      console.error('Failed to check for new record:', error);
      return false;
    }
  }
}

// Factory function to create GameService with appropriate adapter
export function createGameService(mode: 'offchain' | 'onchain', contractAddress?: string): GameService {
  const adapter = mode === 'onchain'
    ? new OnChainAdapter(contractAddress)
    : new OffChainAdapter();

  return new GameService(adapter);
}

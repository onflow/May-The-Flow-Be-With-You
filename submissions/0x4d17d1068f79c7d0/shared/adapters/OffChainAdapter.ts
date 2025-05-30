// Off-Chain Game Adapter
// Provides fast, local game experience with Supabase backend

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BaseGameAdapter, GameProgress, Achievement, LeaderboardEntry, GameStatistics, GAME_FEATURES } from "./GameAdapter";
import { RandomnessProvider, OffChainRandomnessProvider } from "../providers/RandomnessProvider";

export class OffChainAdapter extends BaseGameAdapter {
  private supabase: any;
  private localStorage: Storage | null;
  private randomnessProvider: RandomnessProvider;

  constructor() {
    // Filter features to only include those that don't require on-chain
    const offChainFeatures = GAME_FEATURES.filter(f => !f.requiresOnChain);
    super(offChainFeatures);

    // Initialize Supabase client (only on client side)
    if (typeof window !== 'undefined') {
      this.supabase = createClientComponentClient();
      this.localStorage = window.localStorage;
    } else {
      this.supabase = null;
      this.localStorage = null;
    }

    this.randomnessProvider = new OffChainRandomnessProvider();
  }

  getMode(): 'offchain' | 'onchain' {
    return 'offchain';
  }

  getRandomnessProvider(): RandomnessProvider {
    return this.randomnessProvider;
  }

  async saveProgress(userId: string, progress: GameProgress): Promise<void> {
    try {
      // Check if this is an anonymous user
      const isAnonymous = userId.startsWith('anonymous_');

      if (isAnonymous) {
        // For anonymous users, only save to localStorage
        if (this.localStorage) {
          this.localStorage.setItem(
            `memoreee_progress_${userId}`,
            JSON.stringify(progress)
          );
        }
        return;
      }

      // For authenticated users, save to Supabase if available
      if (this.supabase) {
        const { error } = await this.supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            game_type: 'general', // Default game type for overall progress
            level: progress.level,
            experience_points: progress.totalScore || 0,
            total_sessions: progress.gamesPlayed,
            streak_best: progress.bestStreak,
            streak_current: progress.bestStreak, // Assuming current streak matches best for now
            last_played_at: new Date(progress.lastPlayed).toISOString(),
            statistics: progress.statistics,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to save progress to Supabase:', error);
        }
      }

      // Always save to localStorage as backup
      if (this.localStorage) {
        this.localStorage.setItem(
          `memoreee_progress_${userId}`,
          JSON.stringify(progress)
        );
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      throw error;
    }
  }

  async loadProgress(userId: string): Promise<GameProgress | null> {
    try {
      const isAnonymous = userId.startsWith('anonymous_');

      if (isAnonymous) {
        // For anonymous users, only check localStorage
        if (this.localStorage) {
          const stored = this.localStorage.getItem(`memoreee_progress_${userId}`);
          if (stored) {
            return JSON.parse(stored);
          }
        }
        return this.createDefaultProgress(userId);
      }

      // For authenticated users, try Supabase first
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          return {
            userId: data.user_id,
            level: data.level,
            totalScore: data.experience_points || 0,
            gamesPlayed: data.total_sessions,
            bestStreak: data.streak_best,
            culturalMastery: data.cultural_mastery || {},
            lastPlayed: new Date(data.last_played_at).getTime(),
            achievements: await this.getAchievements(userId),
            statistics: data.statistics || this.createDefaultStatistics()
          };
        }
      }

      // Fallback to localStorage
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`memoreee_progress_${userId}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }

      // Return default progress if nothing found
      return this.createDefaultProgress(userId);
    } catch (error) {
      console.error('Failed to load progress:', error);
      return this.createDefaultProgress(userId);
    }
  }

  async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      const isAnonymous = userId.startsWith('anonymous_');

      if (isAnonymous) {
        // For anonymous users, only save to localStorage
        if (this.localStorage) {
          const existingAchievements = await this.getAchievements(userId);
          const updatedAchievements = [...existingAchievements, achievement];
          this.localStorage.setItem(
            `memoreee_achievements_${userId}`,
            JSON.stringify(updatedAchievements)
          );
        }
        return;
      }

      // For authenticated users, save to Supabase
      if (this.supabase) {
        const { error } = await this.supabase
          .from('achievements')
          .insert({
            user_id: userId,
            achievement_type: achievement.category || 'general',
            achievement_name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            points: 10, // Default points value since Achievement interface doesn't have points
            metadata: {
              category: achievement.category,
              culture: achievement.culture,
              originalId: achievement.id
            },
            unlocked_at: new Date(achievement.unlockedAt).toISOString()
          });

        if (error && error.code !== '23505') { // Ignore duplicate key errors
          console.error('Failed to save achievement to Supabase:', error);
        }
      }

      // Save to localStorage as backup
      if (this.localStorage) {
        const existingAchievements = await this.getAchievements(userId);
        const updatedAchievements = [...existingAchievements, achievement];
        this.localStorage.setItem(
          `memoreee_achievements_${userId}`,
          JSON.stringify(updatedAchievements)
        );
      }
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      throw error;
    }
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Try Supabase first
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .order('unlocked_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.achievement_id,
            name: item.name,
            description: item.description,
            icon: item.icon,
            category: item.category,
            culture: item.culture,
            unlockedAt: new Date(item.unlocked_at).getTime()
          }));
        }
      }

      // Fallback to localStorage
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`memoreee_achievements_${userId}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }

      return [];
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  async submitScore(userId: string, gameType: string, score: number, metadata?: any): Promise<void> {
    try {
      const isAnonymous = userId.startsWith('anonymous_');

      if (!isAnonymous && this.supabase) {
        // Generate a unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // For authenticated users, save to Supabase
        const { error } = await this.supabase
          .from('game_sessions')
          .insert({
            user_id: userId,
            game_type: gameType,
            session_id: sessionId,
            score: score,
            max_possible_score: metadata?.maxPossibleScore || 1000,
            accuracy: metadata?.accuracy || 0,
            items_count: metadata?.itemsCount || 8,
            duration_seconds: metadata?.duration || 0,
            difficulty_level: metadata?.difficultyLevel || 2,
            session_data: metadata || {},
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to submit score to Supabase:', error);
        }
      }

      // Update local leaderboard cache (for both anonymous and authenticated users)
      if (this.localStorage) {
        const cacheKey = isAnonymous
          ? `memoreee_leaderboard_local_${gameType}`
          : `memoreee_leaderboard_${gameType}`;
        const cached = this.localStorage.getItem(cacheKey);
        const leaderboard: LeaderboardEntry[] = cached ? JSON.parse(cached) : [];

        // Add new entry (simplified - real implementation would handle ranking)
        leaderboard.push({
          userId,
          username: isAnonymous ? 'Anonymous Player' : `User ${userId.slice(0, 8)}`,
          score,
          rank: leaderboard.length + 1
        });

        // Sort and limit to top 100
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(100);

        // Update ranks
        leaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        this.localStorage.setItem(cacheKey, JSON.stringify(leaderboard));
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      throw error;
    }
  }

  async getLeaderboard(gameType: string, culture?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      // Try Supabase first
      if (this.supabase) {
        let query = this.supabase
          .from('game_sessions')
          .select(`
            user_id,
            score,
            created_at,
            session_data
          `)
          .eq('game_type', gameType)
          .order('score', { ascending: false })
          .limit(limit);

        if (culture) {
          query = query.eq('session_data->culture', culture);
        }

        const { data, error } = await query;

        if (!error && data) {
          return data.map((item: any, index: number) => ({
            userId: item.user_id,
            username: `User ${item.user_id.slice(0, 8)}`,
            score: item.score,
            rank: index + 1,
            culture: item.session_data?.culture
          }));
        }
      }

      // Fallback to localStorage
      if (this.localStorage) {
        const cacheKey = `memoreee_leaderboard_${gameType}`;
        const cached = this.localStorage.getItem(cacheKey);
        if (cached) {
          const leaderboard: LeaderboardEntry[] = JSON.parse(cached);
          return leaderboard.slice(0, limit);
        }
      }

      return [];
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  async getStatistics(userId: string): Promise<GameStatistics> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('user_progress')
          .select('statistics')
          .eq('user_id', userId)
          .single();

        if (!error && data?.statistics) {
          return data.statistics;
        }
      }

      // Fallback to localStorage
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`memoreee_stats_${userId}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }

      return this.createDefaultStatistics();
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return this.createDefaultStatistics();
    }
  }

  protected async saveStatistics(userId: string, stats: GameStatistics): Promise<void> {
    try {
      // Save to Supabase as part of progress update
      if (this.supabase) {
        const { error } = await this.supabase
          .from('user_progress')
          .update({ statistics: stats })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to save statistics to Supabase:', error);
        }
      }

      // Save to localStorage
      if (this.localStorage) {
        this.localStorage.setItem(
          `memoreee_stats_${userId}`,
          JSON.stringify(stats)
        );
      }
    } catch (error) {
      console.error('Failed to save statistics:', error);
    }
  }

  private createDefaultStatistics(): GameStatistics {
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
}

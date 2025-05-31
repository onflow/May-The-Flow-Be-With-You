// On-Chain Game Adapter
// Provides blockchain-native game experience with Flow integration

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BaseGameAdapter, GameProgress, Achievement, LeaderboardEntry, GameStatistics, GAME_FEATURES } from "./GameAdapter";
import { RandomnessProvider, FlowVRFRandomnessProvider } from "../providers/RandomnessProvider";
import { FlowVRFService } from "../services/FlowVRFService";
import * as fcl from "@onflow/fcl";

export class OnChainAdapter extends BaseGameAdapter {
  private supabase: any;
  private flowVRFService: FlowVRFService;
  private randomnessProvider: RandomnessProvider;
  private contractAddress: string;

  constructor(contractAddress?: string) {
    // Include all features since on-chain supports everything
    super(GAME_FEATURES);

    // Initialize services
    if (typeof window !== 'undefined') {
      this.supabase = createClientComponentClient();
    } else {
      this.supabase = null;
    }

    this.contractAddress = contractAddress || "0x8c5303eaa26202d6"; // Default testnet address
    this.flowVRFService = new FlowVRFService(this.contractAddress);
    this.randomnessProvider = new FlowVRFRandomnessProvider(this.flowVRFService);
  }

  getMode(): 'offchain' | 'onchain' {
    return 'onchain';
  }

  getRandomnessProvider(): RandomnessProvider {
    return this.randomnessProvider;
  }

  async saveProgress(userId: string, progress: GameProgress): Promise<void> {
    try {
      // Save to blockchain for permanent record
      await this.saveProgressOnChain(userId, progress);

      // Also save to Supabase for quick access
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
          }, {
            onConflict: 'user_id,game_type'
          });

        if (error) {
          console.error('Failed to save progress to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to save progress on-chain:', error);
      throw error;
    }
  }

  async loadProgress(userId: string): Promise<GameProgress | null> {
    try {
      // Try to load from blockchain first
      const onChainProgress = await this.loadProgressFromChain(userId);
      if (onChainProgress) {
        return onChainProgress;
      }

      // Fallback to Supabase
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('game_type', 'general')
          .maybeSingle();

        if (!error && data) {
          return {
            userId: data.user_id,
            level: data.level,
            totalScore: data.experience_points || 0,
            gamesPlayed: data.total_sessions,
            bestStreak: data.streak_best,
            culturalMastery: {}, // Not stored in database yet, use empty object
            lastPlayed: data.last_played_at ? new Date(data.last_played_at).getTime() : Date.now(),
            achievements: await this.getAchievements(userId),
            statistics: data.statistics || this.createDefaultStatistics()
          };
        }
      }

      return this.createDefaultProgress(userId);
    } catch (error) {
      console.error('Failed to load progress:', error);
      return this.createDefaultProgress(userId);
    }
  }

  async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      // Mint NFT achievement on Flow
      const nftResult = await this.mintAchievementNFT(userId, achievement);

      // Update achievement with NFT data
      const nftAchievement: Achievement = {
        ...achievement,
        nftId: nftResult.nftId,
        transactionId: nftResult.transactionId
      };

      // Save to Supabase for quick access
      if (this.supabase) {
        const { error } = await this.supabase
          .from('achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            culture: achievement.culture,
            unlocked_at: new Date(achievement.unlockedAt).toISOString(),
            nft_id: nftResult.nftId,
            transaction_id: nftResult.transactionId,
            is_onchain: true
          });

        if (error && error.code !== '23505') {
          console.error('Failed to save achievement to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to unlock achievement on-chain:', error);
      throw error;
    }
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Get achievements from blockchain
      const onChainAchievements = await this.getAchievementsFromChain(userId);

      // Merge with Supabase data for metadata
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
            unlockedAt: new Date(item.unlocked_at).getTime(),
            nftId: item.nft_id,
            transactionId: item.transaction_id
          }));
        }
      }

      return onChainAchievements;
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  async submitScore(userId: string, gameType: string, score: number, metadata?: any): Promise<void> {
    try {
      // Submit score to blockchain for verification
      const txId = await this.submitScoreOnChain(userId, gameType, score, metadata);

      // Save to Supabase with verification data
      if (this.supabase) {
        // Generate a unique session ID
        const sessionId = `onchain_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
            flow_transaction_id: txId,
            verification_status: 'verified',
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to submit score to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to submit score on-chain:', error);
      throw error;
    }
  }

  async getLeaderboard(gameType: string, culture?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      // Get verified scores from blockchain
      const onChainLeaderboard = await this.getLeaderboardFromChain(gameType, culture, limit);

      // Enhance with Supabase metadata
      if (this.supabase) {
        let query = this.supabase
          .from('game_sessions')
          .select(`
            user_id,
            score,
            created_at,
            session_data,
            transaction_id,
            is_verified
          `)
          .eq('game_type', gameType)
          .eq('is_verified', true)
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
            culture: item.session_data?.culture,
            isVerified: item.is_verified
          }));
        }
      }

      return onChainLeaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  // Blockchain interaction methods

  private async saveProgressOnChain(userId: string, progress: GameProgress): Promise<string> {
    // Convert culturalMastery Record to array format for Flow Dictionary
    const culturalMasteryArray = Object.entries(progress.culturalMastery).map(([key, value]) => ({
      key,
      value: value.toString()
    }));

    const transactionId = await fcl.mutate({
      cadence: `
        import MemoryProgress from ${this.contractAddress}

        transaction(
          level: UInt32,
          totalScore: UInt64,
          gamesPlayed: UInt32,
          bestStreak: UInt32,
          culturalMastery: {String: UInt32}
        ) {
          prepare(signer: AuthAccount) {
            let progressResource = signer.borrow<&MemoryProgress.UserProgress>(from: /storage/memoryProgress)
              ?? panic("No progress resource found")

            progressResource.updateProgress(
              level: level,
              totalScore: totalScore,
              gamesPlayed: gamesPlayed,
              bestStreak: bestStreak,
              culturalMastery: culturalMastery
            )
          }
        }
      `,
      args: (arg, t) => [
        arg(progress.level.toString(), t.UInt32),
        arg(progress.totalScore.toString(), t.UInt64),
        arg(progress.gamesPlayed.toString(), t.UInt32),
        arg(progress.bestStreak.toString(), t.UInt32),
        arg(culturalMasteryArray, t.Dictionary({ key: t.String, value: t.UInt32 }))
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    return transactionId;
  }

  private async loadProgressFromChain(userId: string): Promise<GameProgress | null> {
    try {
      const result = await fcl.query({
        cadence: `
          import MemoryProgress from ${this.contractAddress}

          pub fun main(address: Address): MemoryProgress.ProgressData? {
            return MemoryProgress.getProgress(address: address)
          }
        `,
        args: (arg, t) => [arg(userId, t.Address)]
      });

      if (result) {
        return {
          userId,
          level: parseInt(result.level),
          totalScore: parseInt(result.totalScore),
          gamesPlayed: parseInt(result.gamesPlayed),
          bestStreak: parseInt(result.bestStreak),
          culturalMastery: result.culturalMastery || {},
          lastPlayed: Date.now(),
          achievements: await this.getAchievements(userId),
          statistics: this.createDefaultStatistics()
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to load progress from chain:', error);
      return null;
    }
  }

  private async mintAchievementNFT(userId: string, achievement: Achievement): Promise<{ nftId: string; transactionId: string }> {
    const transactionId = await fcl.mutate({
      cadence: `
        import MemoryAchievements from ${this.contractAddress}

        transaction(
          achievementId: String,
          name: String,
          description: String,
          category: String,
          culture: String?
        ) {
          prepare(signer: AuthAccount) {
            let collection = signer.borrow<&MemoryAchievements.Collection>(from: /storage/achievementCollection)
              ?? panic("No achievement collection found")

            let nft <- MemoryAchievements.mintAchievement(
              achievementId: achievementId,
              name: name,
              description: description,
              category: category,
              culture: culture
            )

            collection.deposit(token: <-nft)
          }
        }
      `,
      args: (arg, t) => [
        arg(achievement.id, t.String),
        arg(achievement.name, t.String),
        arg(achievement.description, t.String),
        arg(achievement.category, t.String),
        arg(achievement.culture || null, t.Optional(t.String))
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    // In a real implementation, we'd extract the NFT ID from the transaction result
    const nftId = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return { nftId, transactionId };
  }

  private async getAchievementsFromChain(userId: string): Promise<Achievement[]> {
    try {
      const result = await fcl.query({
        cadence: `
          import MemoryAchievements from ${this.contractAddress}

          pub fun main(address: Address): [MemoryAchievements.AchievementData] {
            return MemoryAchievements.getAchievements(address: address)
          }
        `,
        args: (arg, t) => [arg(userId, t.Address)]
      });

      return result.map((item: any) => ({
        id: item.achievementId,
        name: item.name,
        description: item.description,
        icon: item.icon || '🏆',
        category: item.category,
        culture: item.culture,
        unlockedAt: parseInt(item.timestamp) * 1000,
        nftId: item.nftId
      }));
    } catch (error) {
      console.error('Failed to get achievements from chain:', error);
      return [];
    }
  }

  private async submitScoreOnChain(userId: string, gameType: string, score: number, metadata?: any): Promise<string> {
    const transactionId = await fcl.mutate({
      cadence: `
        import MemoryLeaderboard from ${this.contractAddress}

        transaction(
          gameType: String,
          score: UInt64,
          accuracy: UFix64,
          duration: UInt32
        ) {
          prepare(signer: AuthAccount) {
            MemoryLeaderboard.submitScore(
              player: signer.address,
              gameType: gameType,
              score: score,
              accuracy: accuracy,
              duration: duration
            )
          }
        }
      `,
      args: (arg, t) => [
        arg(gameType, t.String),
        arg(score.toString(), t.UInt64),
        arg((metadata?.accuracy || 0).toString(), t.UFix64),
        arg((metadata?.duration || 0).toString(), t.UInt32)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    return transactionId;
  }

  private async getLeaderboardFromChain(gameType: string, culture?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const result = await fcl.query({
        cadence: `
          import MemoryLeaderboard from ${this.contractAddress}

          pub fun main(gameType: String, limit: Int): [MemoryLeaderboard.LeaderboardEntry] {
            return MemoryLeaderboard.getTopScores(gameType: gameType, limit: limit)
          }
        `,
        args: (arg, t) => [
          arg(gameType, t.String),
          arg(limit.toString(), t.Int)
        ]
      });

      return result.map((item: any, index: number) => ({
        userId: item.player,
        username: `User ${item.player.slice(0, 8)}`,
        score: parseInt(item.score),
        rank: index + 1,
        isVerified: true
      }));
    } catch (error) {
      console.error('Failed to get leaderboard from chain:', error);
      return [];
    }
  }

  protected async saveStatistics(userId: string, stats: GameStatistics): Promise<void> {
    // Statistics are saved as part of progress updates
    // This could be enhanced to have separate on-chain statistics storage
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

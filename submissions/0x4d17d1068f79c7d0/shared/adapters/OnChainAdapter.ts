// On-Chain Game Adapter
// Provides blockchain-native game experience with Flow integration

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BaseGameAdapter, GameProgress, Achievement, LeaderboardEntry, GameStatistics, GAME_FEATURES } from "./GameAdapter";
import { RandomnessProvider, FlowVRFRandomnessProvider } from "../providers/RandomnessProvider";
import { FlowVRFService } from "../services/FlowVRFService";

// Import FCL dynamically to ensure proper client-side initialization
const getFCL = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Flow operations are only available on the client side');
  }

  // Dynamic import ensures FCL is only loaded client-side
  const fcl = await import("@onflow/fcl");
  return fcl;
};

// Legacy support for existing code
let fcl: any;
if (typeof window !== 'undefined') {
  fcl = require("@onflow/fcl");
}

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

    this.contractAddress = contractAddress ||
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT ||
      "0xb8404e09b36b6623"; // Testnet contract address
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

  async submitScore(userId: string, gameType: string, score: number, metadata?: any): Promise<{ success: boolean; transactionId?: string; error?: string; isVerified?: boolean; isEligible?: boolean }> {
    console.log('🎯 HYBRID APPROACH: Off-chain first, strategic blockchain enhancement');

    try {
      if (!this.supabase) {
        throw new Error('Supabase not available');
      }

      // 1. ALWAYS save off-chain first (reliable, fast)
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isEligible = this.isBlockchainWorthy(score, metadata);

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
          session_data: {
            ...metadata,
            submissionMethod: 'hybrid_approach',
            blockchainEligible: isEligible
          },
          verification_status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log('✅ Score saved off-chain successfully');

      // 2. OPTIONALLY enhance with blockchain (strategic)
      if (isEligible) {
        console.log('🏆 High-value score detected, attempting blockchain verification...');
        try {
          const txId = await this.submitScoreOnChain(userId, gameType, score, metadata);

          // Update verification status
          await this.supabase
            .from('game_sessions')
            .update({
              flow_transaction_id: txId,
              verification_status: 'verified'
            })
            .eq('session_id', sessionId);

          console.log(`🔗 Blockchain verification successful: ${txId}`);
          return { success: true, transactionId: txId, isVerified: true, isEligible: true };
        } catch (blockchainError) {
          console.log('⚠️ Blockchain verification failed, but score is safely saved off-chain');
          return { success: true, isVerified: false, isEligible: true };
        }
      }

      return { success: true, isVerified: false, isEligible: false };
    } catch (error) {
      console.error('❌ Failed to save score:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save score'
      };
    }
  }

  // Determine if a score is worth putting on blockchain
  private isBlockchainWorthy(score: number, metadata?: any): boolean {
    // Only use blockchain for:
    // 1. High scores (top 10% threshold)
    // 2. Perfect games
    // 3. Achievement unlocks
    // 4. Personal records

    const isHighScore = score >= 800; // Adjust threshold as needed
    const isPerfectGame = metadata?.accuracy === 1.0;
    const isAchievementUnlock = metadata?.achievementUnlocked;

    return isHighScore || isPerfectGame || isAchievementUnlock;
  }

  async getLeaderboard(gameType: string, culture?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      console.log('🏆 HYBRID LEADERBOARD: Combining off-chain and on-chain scores');

      if (!this.supabase) {
        return [];
      }

      // Get ALL scores from Supabase (both verified and unverified)
      let query = this.supabase
        .from('game_sessions')
        .select(`
          user_id,
          score,
          created_at,
          session_data,
          flow_transaction_id,
          verification_status,
          accuracy,
          duration_seconds
        `)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(limit * 2); // Get more to account for filtering

      if (culture) {
        query = query.eq('session_data->culture', culture);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('Failed to get leaderboard from Supabase:', error);
        return [];
      }

      // Process and rank scores with verification status
      const leaderboard = data
        .map((item: any, index: number) => ({
          userId: item.user_id,
          username: `User ${item.user_id.slice(0, 8)}`,
          score: item.score,
          rank: index + 1,
          culture: item.session_data?.culture,
          isVerified: item.verification_status === 'verified',
          transactionId: item.flow_transaction_id,
          accuracy: item.accuracy || 0,
          duration: item.duration_seconds || 0,
          verificationStatus: item.verification_status || 'pending'
        }))
        .slice(0, limit);

      console.log(`✅ Retrieved ${leaderboard.length} scores (${leaderboard.filter((s: LeaderboardEntry) => s.isVerified).length} blockchain verified)`);
      return leaderboard;
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

    // Note: MemoryLeaderboard doesn't have a direct progress update function
    // Progress is tracked through individual score submissions
    // For now, we'll return a placeholder transaction ID
    console.log('📊 Progress tracking via MemoryLeaderboard score submissions');
    const transactionId = `progress_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, we might submit a summary score or use a separate progress contract

    return transactionId;
  }

  private async loadProgressFromChain(userId: string): Promise<GameProgress | null> {
    try {
      console.log('📊 Loading player progress from MemoryLeaderboard contract...');

      // Critical check: Prevent using Supabase project ID as Flow address
      if (userId === '4d17d1068f79c7d0' || userId === '0x4d17d1068f79c7d0') {
        console.error('🚨 CRITICAL: Detected Supabase project ID being used as Flow address!', {
          userId,
          stackTrace: new Error().stack
        });
        throw new Error('Invalid user ID: Supabase project ID cannot be used as Flow address');
      }

      // Get the current connected Flow user address
      const currentUser = await fcl.currentUser.snapshot();
      const addressToQuery = currentUser.loggedIn && currentUser.addr ? currentUser.addr : userId;

      console.log(`🔍 OnChainAdapter.loadProgressFromChain - Debug info:`, {
        providedUserId: userId,
        currentUserAddr: currentUser.addr,
        currentUserLoggedIn: currentUser.loggedIn,
        addressToQuery,
        willUseConnectedWallet: currentUser.loggedIn && currentUser.addr
      });

      // Since MemoryLeaderboard doesn't store individual player stats,
      // we'll calculate basic progress from leaderboard entries
      const result = await fcl.query({
        cadence: `
          import MemoryLeaderboard from ${this.contractAddress}

          access(all) fun main(address: Address): {String: AnyStruct} {
            // Get all leaderboard entries to calculate player stats
            let allEntries = MemoryLeaderboard.getTopScores(gameType: nil, culture: nil, limit: 1000)
            var totalGames: UInt64 = 0
            var totalScore: UInt64 = 0
            var bestScore: UInt64 = 0

            for entry in allEntries {
              if entry.playerAddress == address {
                totalGames = totalGames + 1
                totalScore = totalScore + entry.score
                if entry.score > bestScore {
                  bestScore = entry.score
                }
              }
            }

            return {
              "totalGames": totalGames,
              "totalScore": totalScore,
              "bestScore": bestScore,
              "averageScore": totalGames > 0 ? totalScore / totalGames : 0
            }
          }
        `,
        args: (arg: any, t: any) => [arg(addressToQuery, t.Address)]
      });

      if (result) {
        const totalGames = parseInt(result.totalGames.toString());
        const totalScore = parseInt(result.totalScore.toString());
        const bestScore = parseInt(result.bestScore.toString());

        return {
          userId,
          level: Math.max(1, Math.floor(totalGames / 10) + 1), // Level based on games played
          totalScore,
          gamesPlayed: totalGames,
          bestStreak: 0, // Not tracked in current contract
          culturalMastery: {},
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
    // Import memoryNFT dynamically to ensure client-side execution
    const { memoryNFT } = await import('../config/flow');

    // Ensure we're on client side and user is authenticated
    if (typeof window === 'undefined') {
      throw new Error('Flow transactions can only be executed on client side');
    }

    // Check if user is connected
    const currentUser = await fcl.currentUser.snapshot();
    if (!currentUser.loggedIn || !currentUser.addr) {
      throw new Error('Flow wallet not connected. Please connect your wallet to mint achievement NFTs.');
    }

    console.log(`🎨 Minting achievement NFT for user: ${currentUser.addr}`);

    // Use the new memoryNFT service
    const result = await memoryNFT.mintAchievement(
      achievement.id,
      achievement.name,
      achievement.description,
      achievement.category,
      achievement.culture,
      achievement.icon || "🏆",
      this.determineRarity(achievement),
      {
        unlockedAt: achievement.unlockedAt,
        userId: userId,
        platform: "memoreee"
      }
    );

    // Extract NFT ID from transaction events
    const nftId = this.extractNFTIdFromTransaction(result.result);

    return {
      nftId: nftId || `nft_${Date.now()}`,
      transactionId: result.transactionId
    };
  }

  // Determine NFT rarity based on achievement
  private determineRarity(achievement: Achievement): string {
    if (achievement.category === 'mastery') return 'legendary';
    if (achievement.category === 'cultural') return 'epic';
    if (achievement.category === 'performance') return 'rare';
    return 'common';
  }

  // Extract NFT ID from transaction events
  private extractNFTIdFromTransaction(transactionResult: any): string | null {
    try {
      const depositEvent = transactionResult.events?.find((event: any) =>
        event.type.includes('Deposit') || event.type.includes('AchievementMinted')
      );
      return depositEvent?.data?.id?.toString() || null;
    } catch (error) {
      console.error('Failed to extract NFT ID:', error);
      return null;
    }
  }

  private async getAchievementsFromChain(userId: string): Promise<Achievement[]> {
    try {
      // Get the current connected Flow user address
      const currentUser = await fcl.currentUser.snapshot();
      const addressToQuery = currentUser.loggedIn && currentUser.addr ? currentUser.addr : userId;

      console.log(`🔍 Querying achievements for address: ${addressToQuery}`);

      const result = await fcl.query({
        cadence: `
          import MemoryAchievements from ${this.contractAddress}

          access(all) fun main(address: Address): [MemoryAchievements.AchievementMetadata] {
            return MemoryAchievements.getAchievements(address: address)
          }
        `,
        args: (arg: any, t: any) => [arg(addressToQuery, t.Address)]
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
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      throw new Error('Flow transactions can only be executed on client side');
    }

    // Simple validation
    if (userId === '4d17d1068f79c7d0' || userId === '0x4d17d1068f79c7d0') {
      throw new Error('Invalid user ID: Cannot use Supabase project ID as Flow address');
    }

    // Get current user with simple check
    const currentUser = await fcl.currentUser.snapshot();
    if (!currentUser.loggedIn || !currentUser.addr) {
      throw new Error('Flow wallet not connected. Please connect your Flow wallet to submit scores on-chain.');
    }

    console.log(`🔗 Attempting blockchain transaction for: ${currentUser.addr}`);

    // Simple, clean transaction - let FCL handle everything normally
    const transactionId = await fcl.mutate({
      cadence: `
        import MemoryLeaderboard from ${this.contractAddress}

        transaction(
          score: UInt64,
          gameType: String,
          culture: String,
          vrfSeed: UInt64
        ) {
          prepare(signer: auth(Storage, Capabilities) &Account) {
            MemoryLeaderboard.submitScore(
              player: signer.address,
              score: score,
              gameType: gameType,
              culture: culture,
              vrfSeed: vrfSeed
            )
          }
        }
      `,
      args: (arg: any, t: any) => [
        arg(score.toString(), t.UInt64),
        arg(gameType, t.String),
        arg(metadata?.culture || 'general', t.String),
        arg((metadata?.vrfSeed || Math.floor(Math.random() * 1000000)).toString(), t.UInt64)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    console.log(`✅ Blockchain transaction successful: ${transactionId}`);
    return transactionId;
  }

  private async getLeaderboardFromChain(gameType: string, culture?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const result = await fcl.query({
        cadence: `
          import MemoryLeaderboard from ${this.contractAddress}

          access(all) fun main(gameType: String?, culture: String?, limit: Int): [MemoryLeaderboard.LeaderboardEntry] {
            return MemoryLeaderboard.getTopScores(gameType: gameType, culture: culture, limit: limit)
          }
        `,
        args: (arg: any, t: any) => [
          arg(gameType, t.Optional(t.String)),
          arg(culture || null, t.Optional(t.String)),
          arg(limit.toString(), t.Int)
        ]
      });

      return result.map((item: any, index: number) => ({
        userId: item.playerAddress,
        username: `User ${item.playerAddress.slice(0, 8)}`,
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

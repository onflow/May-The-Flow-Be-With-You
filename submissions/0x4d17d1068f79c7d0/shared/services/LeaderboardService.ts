// Multi-Tier Leaderboard Service
// Handles both off-chain (Supabase) and on-chain (Flow) leaderboards

import * as fcl from '@onflow/fcl';
import { supabase, ensureSupabase } from '../config/supabase';
import { createGameError } from '../utils/errorHandling';
import { detectNetworkMismatch } from '../config/flow';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  adjustedScore: number;
  gameType: string;
  culture: string;
  userTier: 'anonymous' | 'supabase' | 'flow';
  verified: boolean;
  rank?: number;
  transactionId?: string;
  blockHeight?: number;
  vrfSeed?: number;
  sessionData?: any;
  timestamp: Date;
}

export interface OnChainLeaderboardEntry {
  playerAddress: string;
  score: number;
  gameType: string;
  culture: string;
  blockHeight: number;
  transactionId: string;
  vrfSeed: number;
  timestamp: number;
}

export class LeaderboardService {
  private contractAddress: string;
  private supabase: any;

  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress ||
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT ||
      "0xb8404e09b36b6623";
  }

  /**
   * Get Supabase client with retry logic for better reliability across all games
   */
  private getSupabaseClient(): any {
    if (!this.supabase) {
      this.supabase = ensureSupabase();
    }

    if (!this.supabase) {
      console.warn('Supabase client unavailable - scores will not be saved');
    }

    return this.supabase;
  }

  /**
   * Calculate adjusted score based on user tier
   */
  calculateAdjustedScore(score: number, userTier: 'anonymous' | 'supabase' | 'flow'): number {
    switch (userTier) {
      case 'anonymous':
        return 0; // Not included in leaderboards
      case 'supabase':
        return Math.floor(score * 0.8); // 80% of full score
      case 'flow':
        return score; // 100% + potential bonuses
      default:
        return 0;
    }
  }

  /**
   * Get current period dates for auto-managed periods
   */
  private async getCurrentPeriods(): Promise<{[key: string]: {start: Date, end: Date}}> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate week start (Monday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Calculate month start/end
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      daily: { start: today, end: today },
      weekly: { start: weekStart, end: weekEnd },
      monthly: { start: monthStart, end: monthEnd },
      all_time: { start: new Date('2024-01-01'), end: new Date('2099-12-31') }
    };
  }

  /**
   * Submit score to off-chain leaderboard (Supabase) - Unified approach
   */
  async submitOffChainScore(entry: Omit<LeaderboardEntry, 'id' | 'adjustedScore' | 'timestamp'>): Promise<void> {
    try {
      const adjustedScore = this.calculateAdjustedScore(entry.score, entry.userTier);

      if (adjustedScore === 0) {
        console.log('Anonymous users not added to leaderboard');
        return;
      }

      const supabase = this.getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase not available, skipping off-chain score submission');
        return;
      }

      // Get current periods for auto-management
      const periods = await this.getCurrentPeriods();

      // Submit to all relevant periods - SIMPLIFIED to match actual leaderboards table schema
      const submissions = [];
      for (const [periodType, dates] of Object.entries(periods)) {
        submissions.push({
          user_id: entry.userId,
          game_type: entry.gameType,
          period: periodType,
          score: adjustedScore, // Use adjusted score as the main score
          rank: null, // Will be calculated later
          total_sessions: 1, // Default for new entries
          average_accuracy: 0, // Will be calculated from game_sessions
          period_start: dates.start.toISOString().split('T')[0],
          period_end: dates.end.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        });
      }

      // First, ensure user profile exists for this user (before any database operations)
      await this.ensureUserProfileExists(entry.userId, entry.username, entry.userTier);

      // Handle upsert manually since ON CONFLICT might not work if constraint is missing
      for (const submission of submissions) {
        // Try to find existing leaderboard entry - use maybeSingle() to avoid 406 errors
        const { data: existing, error: selectError } = await supabase
          .from('leaderboards')
          .select('id, score')
          .eq('user_id', submission.user_id)
          .eq('game_type', submission.game_type)
          .eq('period', submission.period)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle empty results

        if (selectError) {
          console.warn(`Error checking existing leaderboard entry: ${selectError.message}`);
          // Continue with insert attempt
        }

        if (existing) {
          // Update if new score is better
          if (submission.score > existing.score) {
            const { error: updateError } = await supabase
              .from('leaderboards')
              .update(submission)
              .eq('id', existing.id);

            if (updateError) {
              throw new Error(`Failed to update leaderboard entry: ${updateError.message}`);
            }
          }
        } else {
          // Insert new entry (exclude id field if it exists to let database auto-generate)
          const { id, ...insertData } = submission as any;
          const { error: insertError } = await supabase
            .from('leaderboards')
            .insert(insertData);

          if (insertError) {
            console.warn(`Failed to insert leaderboard entry: ${insertError.message}`);
            // Don't throw error - continue with other submissions
          }
        }
      }

      console.log(`✅ Off-chain score submitted: ${adjustedScore} points (${entry.userTier} tier) across all periods`);

      // Trigger ranking calculation after score submission
      await this.calculateAndUpdateRankings(entry.gameType);
    } catch (error) {
      console.error('Failed to submit off-chain score:', error);
      throw createGameError('Off-chain leaderboard submission failed', error);
    }
  }

  /**
   * Calculate rankings from game_sessions and update leaderboards table
   * This is the unified ranking logic that replaces the old progressService.updateLeaderboards()
   */
  async calculateAndUpdateRankings(gameType: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase not available, skipping ranking calculation');
        return;
      }

      // Get all game sessions for this game type
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('user_id, score, accuracy')
        .eq('game_type', gameType)
        .order('score', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Calculate user stats from sessions
      const userStats = sessions?.reduce((acc: Record<string, any>, session: any) => {
        if (!acc[session.user_id]) {
          acc[session.user_id] = {
            total_score: 0,
            total_sessions: 0,
            total_accuracy: 0,
            best_score: 0,
          };
        }

        acc[session.user_id].total_score += session.score;
        acc[session.user_id].total_sessions += 1;
        acc[session.user_id].total_accuracy += session.accuracy;
        acc[session.user_id].best_score = Math.max(acc[session.user_id].best_score, session.score);

        return acc;
      }, {} as Record<string, any>) || {};

      // Create leaderboard entries with proper rankings
      const leaderboardEntries = Object.entries(userStats)
        .map(([userId, stats]: [string, any]) => ({
          user_id: userId,
          game_type: gameType,
          period: 'all_time' as const,
          score: stats.best_score,
          total_sessions: stats.total_sessions,
          average_accuracy: stats.total_accuracy / stats.total_sessions,
          period_start: '2024-01-01',
          period_end: '2099-12-31',
          updated_at: new Date().toISOString()
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // Update leaderboards table with calculated rankings
      if (leaderboardEntries.length > 0) {
        // Update rankings manually to avoid ON CONFLICT issues
        for (const entry of leaderboardEntries) {
          const { error: updateError } = await supabase
            .from('leaderboards')
            .update({ rank: entry.rank })
            .eq('user_id', entry.user_id)
            .eq('game_type', entry.game_type)
            .eq('period', entry.period);

          if (updateError) {
            console.warn(`Failed to update rank for ${entry.user_id}:`, updateError.message);
          }
        }
        console.log(`✅ Rankings updated for ${gameType}: ${leaderboardEntries.length} entries`);
      }
    } catch (error) {
      console.error('Failed to calculate rankings:', error);
      // Don't throw - ranking calculation failure shouldn't break score submission
    }
  }

  /**
   * Submit score to on-chain leaderboard (Flow)
   */
  async submitOnChainScore(
    score: number,
    gameType: string,
    culture: string,
    vrfSeed: number
  ): Promise<string> {
    try {
      // Verify Flow wallet is connected before submitting
      const currentUser = await fcl.currentUser.snapshot();
      if (!currentUser.loggedIn || !currentUser.addr) {
        throw new Error('Flow wallet not connected. Please connect your Flow wallet to submit scores on-chain.');
      }

      // Check for network mismatch
      const expectedNetwork = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';
      const networkMismatch = detectNetworkMismatch(expectedNetwork, currentUser.addr);

      if (networkMismatch.hasMismatch) {
        throw new Error(`Network mismatch detected: ${networkMismatch.message} Cannot submit score to ${expectedNetwork} while connected to ${networkMismatch.userNetwork}.`);
      }

      console.log(`🔍 Submitting on-chain score for address: ${currentUser.addr} on ${expectedNetwork}`);

      const transactionId = await fcl.mutate({
        cadence: `
          import MemoryLeaderboard from ${this.contractAddress}

          transaction(score: UInt64, gameType: String, culture: String, vrfSeed: UInt64) {
            prepare(signer: auth(Storage, Capabilities) &Account) {
              // Create leaderboard resource if it doesn't exist
              if signer.storage.borrow<&MemoryLeaderboard.PlayerStats>(from: MemoryLeaderboard.PlayerStatsStoragePath) == nil {
                let playerStats <- MemoryLeaderboard.createPlayerStats()
                signer.storage.save(<-playerStats, to: MemoryLeaderboard.PlayerStatsStoragePath)

                let playerStatsCap = signer.capabilities.storage.issue<&MemoryLeaderboard.PlayerStats>(MemoryLeaderboard.PlayerStatsStoragePath)
                signer.capabilities.publish(playerStatsCap, at: MemoryLeaderboard.PlayerStatsPublicPath)
              }

              let playerStats = signer.storage.borrow<&MemoryLeaderboard.PlayerStats>(from: MemoryLeaderboard.PlayerStatsStoragePath)!
              
              // Submit score with VRF verification
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
        args: (arg, t) => [
          arg(score.toString(), t.UInt64),
          arg(gameType, t.String),
          arg(culture, t.String),
          arg(vrfSeed.toString(), t.UInt64)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });

      console.log(`🔗 On-chain score submitted: ${score} points, TX: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('Failed to submit on-chain score:', error);
      throw createGameError('On-chain leaderboard submission failed', error);
    }
  }

  /**
   * Get off-chain leaderboard
   */
  async getOffChainLeaderboard(
    gameType?: string,
    culture?: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const supabase = this.getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase not available, returning empty leaderboard');
        return [];
      }

      let query = supabase
        .from('leaderboards')
        .select('*')
        .eq('period', 'all_time') // Default to all_time, can be parameterized later
        .order('score', { ascending: false })
        .limit(limit);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      // Note: Culture filtering removed since leaderboards table doesn't have culture column
      // This simplifies the schema and reduces complexity

      const { data, error } = await query;

      if (error) {
        console.warn(`Failed to fetch off-chain leaderboard: ${error.message}`);
        return []; // Return empty array instead of throwing
      }

      return data?.map((entry: any, index: number) => ({
        id: entry.id,
        userId: entry.user_id,
        username: entry.user_id.substring(0, 8) + '...', // Generate simple username
        score: entry.score, // Use actual score field from leaderboards table
        adjustedScore: entry.score, // Same as score for now
        gameType: entry.game_type,
        culture: 'general', // Default since not in leaderboards table
        userTier: 'flow', // Default to flow tier for now - TODO: get from user_profiles table
        verified: true, // Default verification for flow users
        transactionId: undefined,
        blockHeight: undefined,
        vrfSeed: undefined,
        rank: entry.rank || index + 1,
        timestamp: new Date(entry.updated_at || entry.created_at)
      })) || [];
    } catch (error) {
      console.error('Failed to fetch off-chain leaderboard:', error);
      throw createGameError('Off-chain leaderboard fetch failed', error);
    }
  }

  /**
   * Get on-chain leaderboard
   */
  async getOnChainLeaderboard(
    gameType?: string,
    culture?: string,
    limit: number = 10
  ): Promise<OnChainLeaderboardEntry[]> {
    try {
      const result = await fcl.query({
        cadence: `
          import MemoryLeaderboard from ${this.contractAddress}

          access(all) fun main(gameType: String?, culture: String?, limit: Int): [MemoryLeaderboard.LeaderboardEntry] {
            return MemoryLeaderboard.getTopScores(gameType: gameType, culture: culture, limit: limit)
          }
        `,
        args: (arg, t) => [
          arg(gameType || null, t.Optional(t.String)),
          arg(culture || null, t.Optional(t.String)),
          arg(limit.toString(), t.Int)
        ]
      });

      return result?.map((entry: any) => ({
        playerAddress: entry.playerAddress,
        score: parseInt(entry.score),
        gameType: entry.gameType,
        culture: entry.culture,
        blockHeight: parseInt(entry.blockHeight),
        transactionId: entry.transactionId,
        vrfSeed: parseInt(entry.vrfSeed),
        timestamp: parseFloat(entry.timestamp)
      })) || [];
    } catch (error) {
      console.error('Failed to fetch on-chain leaderboard:', error);
      throw createGameError('On-chain leaderboard fetch failed', error);
    }
  }

  /**
   * Submit score with automatic tier detection
   */
  async submitScore(
    userId: string,
    username: string,
    score: number,
    gameType: string,
    culture: string,
    userTier: 'anonymous' | 'supabase' | 'flow',
    vrfSeed?: number,
    flowAddress?: string
  ): Promise<{ offChain: boolean; onChain: boolean; transactionId?: string }> {
    const result = { offChain: false, onChain: false, transactionId: undefined as string | undefined };



    // Critical check: Prevent using Supabase project ID as user ID
    if (userId === '4d17d1068f79c7d0' || userId === '0x4d17d1068f79c7d0') {
      console.error('🚨 CRITICAL: Detected Supabase project ID being used as user ID!', {
        userId,
        username,
        userTier,
        stackTrace: new Error().stack
      });
      throw new Error('Invalid user ID: Supabase project ID cannot be used as user ID');
    }

    try {
      // Always submit to off-chain leaderboard (except anonymous)
      if (userTier !== 'anonymous') {
        await this.submitOffChainScore({
          userId,
          username,
          score,
          gameType,
          culture,
          userTier,
          verified: userTier === 'flow',
          vrfSeed
        });
        result.offChain = true;
      }

      // Submit to on-chain leaderboard for Flow users
      if (userTier === 'flow' && vrfSeed && flowAddress) {
        const transactionId = await this.submitOnChainScore(score, gameType, culture, vrfSeed);
        result.onChain = true;
        result.transactionId = transactionId;

        // Note: Transaction details not stored in simplified leaderboards table
        // This reduces complexity while maintaining core functionality
        console.log(`✅ Flow transaction recorded: ${transactionId}`);
      }

      return result;
    } catch (error) {
      console.error('Failed to submit score:', error);
      throw createGameError('Score submission failed', error);
    }
  }

  /**
   * Ensure user profile exists in database before creating leaderboard entries
   */
  private async ensureUserProfileExists(userId: string, username: string, userTier: string): Promise<void> {
    const supabase = this.getSupabaseClient();
    if (!supabase) {
      return;
    }

    try {
      // Check if user profile already exists - use maybeSingle() to avoid 406 errors
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle empty results

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn('Error checking user profile:', selectError.message);
      }

      if (existingProfile) {
        return; // Profile already exists
      }

      // Create user profile
      const profileData = {
        id: userId,
        username: username,
        display_name: username,
        user_tier: userTier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (insertError) {
        console.warn(`Failed to create user profile: ${insertError.message}`);
        // Don't throw error - continue with leaderboard submission
      }
    } catch (error) {
      console.warn('Error ensuring user profile exists:', error);
      // Don't throw error - continue with leaderboard submission
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();

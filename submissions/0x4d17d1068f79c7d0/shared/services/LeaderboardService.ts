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

  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress || 
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT || 
      "0xb8404e09b36b6623";
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

      if (!supabase) {
        console.warn('Supabase not available, skipping off-chain score submission');
        return;
      }

      // Get current periods for auto-management
      const periods = await this.getCurrentPeriods();

      // Submit to all relevant periods
      const submissions = [];
      for (const [periodType, dates] of Object.entries(periods)) {
        submissions.push({
          user_id: entry.userId,
          username: entry.username,
          user_tier: entry.userTier,
          game_type: entry.gameType,
          culture: entry.culture,
          raw_score: entry.score,
          adjusted_score: adjustedScore,
          period: periodType,
          period_start: dates.start.toISOString().split('T')[0],
          period_end: dates.end.toISOString().split('T')[0],
          verified: entry.verified,
          transaction_id: entry.transactionId,
          block_height: entry.blockHeight,
          vrf_seed: entry.vrfSeed,
          session_data: entry.sessionData || {}
        });
      }

      // Use upsert to handle duplicate entries (better scores)
      const { error } = await supabase
        .from('leaderboard_entries')
        .upsert(submissions, {
          onConflict: 'user_id,game_type,culture,period,period_start',
          ignoreDuplicates: false // Update if new score is better
        });

      if (error) {
        throw new Error(`Failed to submit off-chain score: ${error.message}`);
      }

      console.log(`✅ Off-chain score submitted: ${adjustedScore} points (${entry.userTier} tier) across all periods`);
    } catch (error) {
      console.error('Failed to submit off-chain score:', error);
      throw createGameError('Off-chain leaderboard submission failed', error);
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
      if (!supabase) {
        console.warn('Supabase not available, returning empty leaderboard');
        return [];
      }

      let query = supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('period', 'all_time') // Default to all_time, can be parameterized later
        .order('adjusted_score', { ascending: false })
        .limit(limit);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      if (culture) {
        query = query.eq('culture', culture);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch off-chain leaderboard: ${error.message}`);
      }

      return data?.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        username: entry.username,
        score: entry.raw_score, // Use raw_score for original score
        adjustedScore: entry.adjusted_score,
        gameType: entry.game_type,
        culture: entry.culture,
        userTier: entry.user_tier,
        verified: entry.verified,
        transactionId: entry.transaction_id,
        blockHeight: entry.block_height,
        vrfSeed: entry.vrf_seed,
        timestamp: new Date(entry.created_at)
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

    // Debug logging to track the userId being used
    console.log('🔍 LeaderboardService.submitScore called with:', {
      userId,
      username,
      userTier,
      flowAddress,
      vrfSeed
    });

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

        // Update off-chain entry with transaction details
        if (supabase) {
          await supabase
            .from('leaderboard_entries')
            .update({
              transaction_id: transactionId,
              verified: true
            })
            .eq('user_id', userId)
            .eq('raw_score', score)
            .order('created_at', { ascending: false })
            .limit(1);
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to submit score:', error);
      throw createGameError('Score submission failed', error);
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();

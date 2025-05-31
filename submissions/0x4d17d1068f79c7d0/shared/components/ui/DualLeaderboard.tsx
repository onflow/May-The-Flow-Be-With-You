"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { leaderboardService, LeaderboardEntry, OnChainLeaderboardEntry } from '../../services/LeaderboardService';

interface DualLeaderboardProps {
  gameType?: string;
  culture?: string;
  className?: string;
}

export default function DualLeaderboard({ gameType, culture, className = "" }: DualLeaderboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'combined' | 'onchain'>('combined');
  const [offChainEntries, setOffChainEntries] = useState<LeaderboardEntry[]>([]);
  const [onChainEntries, setOnChainEntries] = useState<OnChainLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboards();
  }, [gameType, culture]);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      setError(null);

      const [offChain, onChain] = await Promise.allSettled([
        leaderboardService.getOffChainLeaderboard(gameType, culture, 10),
        leaderboardService.getOnChainLeaderboard(gameType, culture, 10)
      ]);

      if (offChain.status === 'fulfilled') {
        setOffChainEntries(offChain.value);
      } else {
        console.error('Failed to load off-chain leaderboard:', offChain.reason);
      }

      if (onChain.status === 'fulfilled') {
        setOnChainEntries(onChain.value);
      } else {
        console.error('Failed to load on-chain leaderboard:', onChain.reason);
      }

    } catch (err) {
      setError('Failed to load leaderboards');
      console.error('Leaderboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserTier = () => {
    if (!user) return 'anonymous';
    return user.authMethod === 'flow' ? 'flow' : 
           user.authMethod === 'supabase' ? 'supabase' : 'anonymous';
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'flow':
        return <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-400/30">⛓️ Flow</span>;
      case 'supabase':
        return <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-400/30">📧 Email</span>;
      default:
        return null;
    }
  };

  const getScoreDisplay = (entry: LeaderboardEntry) => {
    const isReduced = entry.userTier === 'supabase' && entry.score !== entry.adjustedScore;
    return (
      <div className="text-right">
        <div className="font-bold text-white">{entry.adjustedScore}</div>
        {isReduced && (
          <div className="text-xs text-gray-400">
            ({entry.score} × 80%)
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-gray-900/90 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/90 rounded-xl p-6 border border-gray-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          🏆 Leaderboards
        </h3>
        <div className="text-sm text-gray-400">
          Your tier: {getTierBadge(getUserTier())}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('combined')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'combined'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📊 Combined ({offChainEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('onchain')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'onchain'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          ⛓️ On-Chain ({onChainEntries.length})
        </button>
      </div>

      {/* Leaderboard Content */}
      {activeTab === 'combined' && (
        <div className="space-y-3">
          {offChainEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏆</div>
              <div>No scores yet.</div>
              <div className="text-sm">Be the first!</div>
            </div>
          ) : (
            <>
              {/* Tier Explanation */}
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-300 space-y-1">
                  <div>💡 <strong>Scoring Tiers:</strong></div>
                  <div>• 📧 Email users: 80% of score (off-chain only)</div>
                  <div>• ⛓️ Flow users: 100% of score + blockchain verification</div>
                </div>
              </div>

              {offChainEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    entry.userId === user?.id
                      ? 'bg-blue-500/10 border-blue-400/30'
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {entry.username}
                        {getTierBadge(entry.userTier)}
                        {entry.verified && (
                          <span className="text-xs text-green-400">✅</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {entry.culture} • {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {getScoreDisplay(entry)}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'onchain' && (
        <div className="space-y-3">
          {onChainEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">⛓️</div>
              <div>No on-chain scores yet.</div>
              <div className="text-sm">Connect Flow wallet to submit verified scores!</div>
            </div>
          ) : (
            <>
              {/* Blockchain Info */}
              <div className="bg-purple-500/10 rounded-lg p-3 mb-4 border border-purple-400/20">
                <div className="text-xs text-purple-200 space-y-1">
                  <div>⛓️ <strong>Blockchain Verified Scores</strong></div>
                  <div>• Immutable and tamper-proof</div>
                  <div>• VRF randomness verification</div>
                  <div>• Full transparency on Flow testnet</div>
                </div>
              </div>

              {onChainEntries.map((entry, index) => (
                <div
                  key={`${entry.playerAddress}-${entry.blockHeight}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border border-purple-400/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {entry.playerAddress.slice(0, 8)}...
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                          ⛓️ Verified
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Block #{entry.blockHeight} • VRF: {entry.vrfSeed}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{entry.score}</div>
                    <a
                      href={`https://testnet.flowscan.org/transaction/${entry.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-300 hover:text-purple-100 underline"
                    >
                      View TX →
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* User Status */}
      {user && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {getUserTier() === 'anonymous' && (
              <div>🔒 Sign up to join the leaderboard!</div>
            )}
            {getUserTier() === 'supabase' && (
              <div>📧 Connect Flow wallet for 100% scoring and blockchain verification</div>
            )}
            {getUserTier() === 'flow' && (
              <div>⛓️ You're earning full points and blockchain verification!</div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { progressService, LeaderboardEntry } from "../services/progressService";
import { Trophy, Medal, Award, Crown } from "lucide-react";

interface LeaderboardProps {
  gameType: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  showUserRank?: boolean;
}

export function Leaderboard({ 
  gameType, 
  period = 'all_time', 
  limit = 10, 
  showUserRank = true 
}: LeaderboardProps) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    loadLeaderboard();
  }, [gameType, selectedPeriod]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await progressService.getLeaderboard(gameType, selectedPeriod, limit);
      setLeaderboard(data);
      
      // Find user's rank if they're not in top results
      if (showUserRank && user) {
        const userEntry = data.find(entry => entry.user_id === user.id);
        if (!userEntry) {
          // User is not in top results, fetch their rank separately
          // For now, we'll just show they're not ranked
          setUserRank(null);
        } else {
          setUserRank(userEntry);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <Trophy className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getGameTypeDisplay = (type: string): string => {
    const gameNames: Record<string, string> = {
      'random_palace': 'Random Palace',
      'chaos_cards': 'Chaos Cards',
      'entropy_storytelling': 'Entropy Stories',
      'memory_race': 'Memory Race',
      'digit_duel': 'Digit Duel',
      'story_chain': 'Story Chain'
    };
    return gameNames[type] || type;
  };

  const getPeriodDisplay = (period: string): string => {
    const periodNames: Record<string, string> = {
      'daily': 'Today',
      'weekly': 'This Week',
      'monthly': 'This Month',
      'all_time': 'All Time'
    };
    return periodNames[period] || period;
  };

  if (loading) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-600" />
            {getGameTypeDisplay(gameType)} Leaderboard
          </h3>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly', 'all_time'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p as any)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedPeriod === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {getPeriodDisplay(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="p-6">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No rankings available yet.</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to set a score!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  entry.user_id === user?.id
                    ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100'
                } ${index < 3 ? 'ring-2 ring-opacity-20 ' + (
                  index === 0 ? 'ring-yellow-400' :
                  index === 1 ? 'ring-gray-400' :
                  'ring-orange-400'
                ) : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(entry.rank)}`}>
                    {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      {entry.display_name || entry.username}
                      {entry.user_id === user?.id && (
                        <span className="text-blue-600 text-sm font-medium">(You)</span>
                      )}
                      {entry.rank === 1 && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.total_sessions} games • {entry.average_accuracy.toFixed(1)}% avg accuracy
                    </div>
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">{entry.score}</div>
                  <div className="text-xs text-gray-500">best score</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User's Rank (if not in top results) */}
        {showUserRank && user && !leaderboard.find(e => e.user_id === user.id) && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center text-gray-600">
              <p className="text-sm">You're not ranked yet in {getPeriodDisplay(selectedPeriod).toLowerCase()}.</p>
              <p className="text-xs text-gray-500 mt-1">Play more games to climb the leaderboard!</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Updated in real-time</span>
          <span>{getPeriodDisplay(selectedPeriod)} rankings</span>
        </div>
      </div>
    </div>
  );
}

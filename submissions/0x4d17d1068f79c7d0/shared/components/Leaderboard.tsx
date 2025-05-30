"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { progressService, LeaderboardEntry } from "../services/progressService";
import { Trophy, Medal, Award, Crown } from "lucide-react";

interface LeaderboardProps {
  gameType: string;
  period?: "daily" | "weekly" | "monthly" | "all_time";
  limit?: number;
  showUserRank?: boolean;
}

export function Leaderboard({
  gameType,
  period = "all_time",
  limit = 10,
  showUserRank = true,
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
      const data = await progressService.getLeaderboard(
        gameType,
        selectedPeriod,
        limit
      );
      setLeaderboard(data);

      // Find user's rank if they're not in top results
      if (showUserRank && user) {
        const userEntry = data.find((entry) => entry.user_id === user.id);
        if (!userEntry) {
          // User is not in top results, fetch their rank separately
          // For now, we'll just show they're not ranked
          setUserRank(null);
        } else {
          setUserRank(userEntry);
        }
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
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
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getGameTypeDisplay = (type: string): string => {
    const gameNames: Record<string, string> = {
      random_palace: "Random Palace",
      chaos_cards: "Chaos Cards",
      entropy_storytelling: "Entropy Stories",
      memory_race: "Memory Race",
      digit_duel: "Digit Duel",
      story_chain: "Story Chain",
    };
    return gameNames[type] || type;
  };

  const getPeriodDisplay = (period: string): string => {
    const periodNames: Record<string, string> = {
      daily: "Today",
      weekly: "This Week",
      monthly: "This Month",
      all_time: "All Time",
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
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            🏅 Rankings
          </h3>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1">
          {["daily", "weekly", "monthly", "all_time"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p as any)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPeriod === p
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {getPeriodDisplay(p)
                .replace("All Time", "All")
                .replace("This ", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="p-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-gray-600 text-sm">No rankings yet.</p>
            <p className="text-xs text-gray-500 mt-1">Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  entry.user_id === user?.id
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeColor(
                      entry.rank
                    )}`}
                  >
                    {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="font-medium text-sm text-gray-800 flex items-center gap-1">
                      {(entry.display_name || entry.username).slice(0, 12)}
                      {entry.user_id === user?.id && (
                        <span className="text-blue-600 text-xs">(You)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {entry.total_sessions} games •{" "}
                      {entry.average_accuracy.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User's Rank (if not in top results) */}
        {showUserRank &&
          user &&
          !leaderboard.find((e) => e.user_id === user.id) && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-center text-gray-600">
                <p className="text-xs">Not ranked yet. Play more to climb!</p>
              </div>
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          Updated in real-time
        </div>
      </div>
    </div>
  );
}

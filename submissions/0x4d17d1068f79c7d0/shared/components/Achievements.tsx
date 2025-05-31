"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { progressService } from "../services/progressService";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: any) => boolean;
  unlocked: boolean;
  unlockedAt?: Date;
}

const achievements: Achievement[] = [
  {
    id: "first_perfect",
    name: "Perfect Memory",
    description: "Score 100% accuracy on any game",
    icon: "🌟",
    condition: (stats) => stats.bestAccuracy >= 100,
    unlocked: false,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete 10 Memory Speed Challenges",
    icon: "⚡",
    condition: (stats) => stats.totalGames >= 10,
    unlocked: false,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Get 5 perfect rounds in a row",
    icon: "🔥",
    condition: (stats) => stats.maxStreak >= 5,
    unlocked: false,
  },
  {
    id: "memory_athlete",
    name: "Memory Athlete",
    description: "Score over 80% accuracy 20 times",
    icon: "🏆",
    condition: (stats) => stats.highAccuracyGames >= 20,
    unlocked: false,
  },
  {
    id: "challenger",
    name: "The Challenger",
    description: "Try all three difficulty levels",
    icon: "🎯",
    condition: (stats) => stats.difficultiesPlayed >= 3,
    unlocked: false,
  },
  {
    id: "versatile",
    name: "Versatile Mind",
    description: "Play all three game types (Numbers, Words, Colors)",
    icon: "🧠",
    condition: (stats) => stats.gameTypesPlayed >= 3,
    unlocked: false,
  },
];

export function Achievements({
  gameType = "memory_speed",
}: {
  gameType?: string;
}) {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user stats
      const stats = await progressService.getUserStats(user.id);
      if (!stats) return;

      // Calculate achievement stats
      const achievementStats = {
        bestAccuracy: stats.best_score || 0,
        totalGames: stats.total_sessions || 0,
        maxStreak: stats.current_streak || 0,
        highAccuracyGames:
          stats.recent_sessions.filter((s) => s.accuracy >= 90).length || 0,
        difficultiesPlayed:
          new Set(stats.recent_sessions.map((s) => s.difficulty_level)).size ||
          0,
        gameTypesPlayed:
          new Set(stats.recent_sessions.map((s) => s.game_type)).size || 0,
      };

      // Check which achievements are unlocked
      const updatedAchievements = achievements.map((achievement) => ({
        ...achievement,
        unlocked: achievement.condition(achievementStats),
      }));

      setUserAchievements(updatedAchievements);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    if (!user) return;

    try {
      const stats = await progressService.getUserStats(user.id);
      if (!stats) return;

      const achievementStats = {
        bestAccuracy: stats.best_score || 0,
        totalGames: stats.total_sessions || 0,
        maxStreak: stats.current_streak || 0,
        highAccuracyGames:
          stats.recent_sessions.filter((s) => s.accuracy >= 90).length || 0,
        difficultiesPlayed:
          new Set(stats.recent_sessions.map((s) => s.difficulty_level)).size ||
          0,
        gameTypesPlayed:
          new Set(stats.recent_sessions.map((s) => s.game_type)).size || 0,
      };

      const newUnlocked: Achievement[] = [];
      const updatedAchievements = userAchievements.map((achievement) => {
        const wasUnlocked = achievement.unlocked;
        const isNowUnlocked = achievement.condition(achievementStats);

        if (!wasUnlocked && isNowUnlocked) {
          newUnlocked.push({
            ...achievement,
            unlocked: true,
            unlockedAt: new Date(),
          });
        }

        return { ...achievement, unlocked: isNowUnlocked };
      });

      setUserAchievements(updatedAchievements);

      if (newUnlocked.length > 0) {
        setNewlyUnlocked(newUnlocked);
        // Clear notifications after 5 seconds
        setTimeout(() => setNewlyUnlocked([]), 5000);
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  // Expose function for parent components to trigger achievement checks
  // This would be used with forwardRef if needed
  // React.useImperativeHandle(ref, () => ({
  //   checkForNewAchievements,
  // }));

  // Anonymous user placeholder
  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🏆 Badges</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">0/6</span>
        </div>

        <div className="text-center py-6">
          <div className="text-4xl mb-4">🎖️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Unlock achievements
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Sign in to earn badges and track your memory training milestones.
          </p>

          {/* Preview of available achievements */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {achievements.slice(0, 6).map((achievement) => (
              <div
                key={achievement.id}
                className="flex flex-col items-center p-3 rounded-lg border bg-gray-50 border-gray-200 opacity-60 text-center"
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <h4 className="font-medium text-xs text-gray-600">
                  {achievement.name}
                </h4>
                <p className="text-xs mt-1 text-gray-500">
                  {achievement.description.split(" ").slice(0, 4).join(" ")}...
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = userAchievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-4">
      {/* Achievement Notifications */}
      {newlyUnlocked.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {newlyUnlocked.map((achievement) => (
            <div
              key={achievement.id}
              className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg animate-bounce"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h4 className="font-bold text-yellow-800">
                    Achievement Unlocked!
                  </h4>
                  <p className="text-sm text-yellow-700">{achievement.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements List */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🏆 Badges</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {unlockedCount}/{achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {userAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${
                achievement.unlocked
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <h4
                className={`font-medium text-xs ${
                  achievement.unlocked ? "text-green-800" : "text-gray-600"
                }`}
              >
                {achievement.name}
              </h4>
              <p
                className={`text-xs mt-1 ${
                  achievement.unlocked ? "text-green-600" : "text-gray-500"
                }`}
              >
                {achievement.description.split(" ").slice(0, 4).join(" ")}...
              </p>
              {achievement.unlocked && (
                <div className="text-green-500 mt-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {unlockedCount === achievements.length && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-yellow-800 font-medium">
              Congratulations! You've unlocked all achievements!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for triggering achievement checks from other components
export function useAchievements(gameType = "memory_speed") {
  const { user } = useAuth();

  const checkAchievements = async () => {
    if (!user) return;

    // This would trigger the achievement check
    // Implementation depends on how you want to structure the achievement system
    console.log("Checking achievements for", gameType);
  };

  return { checkAchievements };
}

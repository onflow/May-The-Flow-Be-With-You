"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { UserTierStatus } from "./UserTierStatus";
import { progressService } from "../services/progressService";
import { ACHIEVEMENT_POINTS } from "../config/gameRules";

// Optimized achievement stats calculation (memoized)
const calculateAchievementStats = (stats: any) => {
  // Pre-filter sessions once
  const chaosCardsSessions = stats.recent_sessions.filter(
    (s: any) => s.game_type === "chaos_cards"
  );
  const speedChallengeSessions = stats.recent_sessions.filter(
    (s: any) => s.game_type === "memory_speed"
  );
  const highAccuracySessions = stats.recent_sessions.filter(
    (s: any) => s.accuracy >= 90
  );

  // Pre-calculate sets
  const difficultyLevels = new Set(
    stats.recent_sessions.map((s: any) => s.difficulty_level)
  );
  const gameTypes = new Set(stats.recent_sessions.map((s: any) => s.game_type));

  return {
    bestAccuracy: stats.best_score || 0,
    totalGames: stats.total_sessions || 0,
    maxStreak: stats.current_streak || 0,
    highAccuracyGames: highAccuracySessions.length,
    difficultiesPlayed: difficultyLevels.size,
    gameTypesPlayed: gameTypes.size,

    // Chaos Cards specific stats (optimized)
    maxDifficulty:
      chaosCardsSessions.length > 0
        ? Math.max(
            ...chaosCardsSessions.map((s: any) => s.difficulty_level || 5)
          )
        : 5,
    maxProgression:
      chaosCardsSessions.length > 0
        ? Math.max(
            ...chaosCardsSessions.map((s: any) => (s.difficulty_level || 5) - 5)
          )
        : 0,
    chaosCardsPerfectRounds: chaosCardsSessions.filter(
      (s: any) => s.accuracy >= 100
    ).length,

    // Speed Challenge specific stats (optimized)
    speedChallengeHighScore:
      speedChallengeSessions.length > 0
        ? Math.max(...speedChallengeSessions.map((s: any) => s.score || 0))
        : 0,
    speedChallengeCorrectAnswers: speedChallengeSessions.reduce(
      (sum: number, s: any) => sum + (s.session_data?.correctAnswers || 0),
      0
    ),
  };
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: any) => boolean;
  unlocked: boolean;
  unlockedAt?: Date;
  points?: number;
}

const achievements: Achievement[] = [
  // Universal Achievements (All Games)
  {
    id: "first_perfect",
    name: "Perfect Memory",
    description: "Score 100% accuracy on any game",
    icon: "🌟",
    condition: (stats) => stats.bestAccuracy >= 100,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.first_perfect,
  },
  {
    id: "memory_athlete",
    name: "Memory Athlete",
    description: "Score over 90% accuracy 10 times",
    icon: "🏆",
    condition: (stats) => stats.highAccuracyGames >= 10,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.memory_athlete,
  },
  {
    id: "challenger",
    name: "The Challenger",
    description: "Try different difficulty levels",
    icon: "🎯",
    condition: (stats) => stats.difficultiesPlayed >= 3,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.challenger,
  },

  // Chaos Cards Specific (Memory & Progression)
  {
    id: "memory_champion",
    name: "Memory Champion",
    description: "Reach 7+ cards (Miller's magical number)",
    icon: "🧠",
    condition: (stats) => stats.maxDifficulty >= 7,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.memory_champion,
  },
  {
    id: "progression_master",
    name: "Progression Master",
    description: "Advance 3+ levels from starting difficulty",
    icon: "📈",
    condition: (stats) => stats.maxProgression >= 3,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.progression_master,
  },
  {
    id: "sequence_master",
    name: "Sequence Master",
    description: "Get 5 perfect rounds in Chaos Cards",
    icon: "🔗",
    condition: (stats) => stats.chaosCardsPerfectRounds >= 5,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.sequence_master,
  },

  // Speed Challenge Specific (Speed & Reactions)
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Score 50+ points in Speed Challenge",
    icon: "🚀",
    condition: (stats) => stats.speedChallengeHighScore >= 50,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.speed_demon,
  },
  {
    id: "lightning_reflexes",
    name: "Lightning Reflexes",
    description: "Answer 20 items correctly in Speed Challenge",
    icon: "⚡",
    condition: (stats) => stats.speedChallengeCorrectAnswers >= 20,
    unlocked: false,
    points: ACHIEVEMENT_POINTS.lightning_reflexes,
  },
];

export function Achievements({
  gameType = "memory_speed",
}: {
  gameType?: string;
}) {
  const { user, userTier, canAccessFeature } = useAuth();
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (canAccessFeature("canEarnAchievements")) {
      loadAchievements();
    } else {
      setIsLoading(false);
    }
  }, [user, canAccessFeature]);

  const loadAchievements = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user stats
      const stats = await progressService.getUserStats(user.id);
      if (!stats) return;

      // Optimized achievement stats calculation
      const achievementStats = calculateAchievementStats(stats);

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

      // Use optimized achievement stats calculation
      const achievementStats = calculateAchievementStats(stats);

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

  // Enhanced user experience based on tier
  if (!canAccessFeature("canEarnAchievements")) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🏆 Badges</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            0/{achievements.length}
          </span>
        </div>

        {/* Show preview of available achievements */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {achievements.slice(0, 6).map((achievement, index) => (
              <div
                key={achievement.id}
                className="flex flex-col items-center p-2 rounded-lg bg-gray-50 border border-gray-200 opacity-60"
              >
                <div className="text-lg mb-1">{achievement.icon}</div>
                <div className="text-xs text-gray-600 text-center font-medium">
                  {achievement.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User tier status with upgrade prompt */}
        <UserTierStatus showUpgradePrompt={true} />
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

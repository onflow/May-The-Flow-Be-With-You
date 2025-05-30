"use client";

import React, { useState, useEffect } from "react";
import { Achievement } from "../services/progressService";
import { X, Star, Trophy, Zap } from "lucide-react";

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function AchievementNotification({
  achievement,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setIsAnimating(true);

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [achievement, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!achievement || !isVisible) return null;

  const getAchievementColor = (type: string) => {
    const colors: Record<string, string> = {
      first_game: "from-blue-400 to-blue-600",
      perfect_score: "from-green-400 to-green-600",
      high_score: "from-purple-400 to-purple-600",
      session_milestone: "from-orange-400 to-orange-600",
      streak: "from-red-400 to-red-600",
      speed_demon: "from-yellow-400 to-yellow-600",
      memory_master: "from-indigo-400 to-indigo-600",
    };
    return colors[type] || "from-gray-400 to-gray-600";
  };

  const getAchievementIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      first_game: <Star className="w-6 h-6" />,
      perfect_score: <Trophy className="w-6 h-6" />,
      high_score: <Zap className="w-6 h-6" />,
      session_milestone: <Trophy className="w-6 h-6" />,
      streak: <Zap className="w-6 h-6" />,
      speed_demon: <Zap className="w-6 h-6" />,
      memory_master: <Trophy className="w-6 h-6" />,
    };
    return icons[type] || <Star className="w-6 h-6" />;
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`transform transition-all duration-300 ease-out ${
          isAnimating
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }`}
      >
        <div
          className={`bg-gradient-to-r ${getAchievementColor(
            achievement.achievement_type
          )} rounded-xl shadow-2xl border border-white/20 p-6 max-w-sm`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 text-white">
                {getAchievementIcon(achievement.achievement_type)}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Achievement Unlocked!
                </h3>
                <div className="text-white/80 text-sm">
                  +{achievement.points} points
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Achievement Details */}
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">{achievement.icon}</div>
              <div>
                <h4 className="text-white font-semibold text-lg">
                  {achievement.achievement_name}
                </h4>
                <p className="text-white/80 text-sm">
                  {achievement.description}
                </p>
              </div>
            </div>

            {/* Celebration Animation */}
            <div className="flex justify-center mt-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-white/20 rounded-full h-1 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-2000 ease-out"
                style={{ width: isAnimating ? "100%" : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AchievementManagerProps {
  children: React.ReactNode;
}

export function AchievementManager({ children }: AchievementManagerProps) {
  const [currentAchievement, setCurrentAchievement] =
    useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  // Function to show achievement (can be called from anywhere in the app)
  const showAchievement = (achievement: Achievement) => {
    if (currentAchievement) {
      // If there's already an achievement showing, queue this one
      setAchievementQueue((prev) => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
    }
  };

  const handleAchievementClose = () => {
    setCurrentAchievement(null);

    // Show next achievement in queue if any
    if (achievementQueue.length > 0) {
      const nextAchievement = achievementQueue[0];
      setAchievementQueue((prev) => prev.slice(1));
      setTimeout(() => {
        setCurrentAchievement(nextAchievement);
      }, 500);
    }
  };

  // Make showAchievement available globally (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).showAchievement = showAchievement;
      return () => {
        delete (window as any).showAchievement;
      };
    }
  }, [currentAchievement, achievementQueue]);

  return (
    <>
      {children}
      <AchievementNotification
        achievement={currentAchievement}
        onClose={handleAchievementClose}
      />
    </>
  );
}

// Utility function to trigger achievement notification
export function triggerAchievement(achievement: Achievement) {
  if (typeof window !== "undefined" && (window as any).showAchievement) {
    (window as any).showAchievement(achievement);
  }
}

// Hook for achievement notifications
export function useAchievements() {
  const showAchievement = (achievement: Achievement) => {
    triggerAchievement(achievement);
  };

  return { showAchievement };
}

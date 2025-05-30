"use client";

import React, { useState, useEffect } from "react";
import { Sheet } from "@silk-hq/components";
import steddieProfile from "../steddie/steddie";
import { useAuth } from "../providers/AuthProvider";
import { progressService, UserStats } from "../services/progressService";
import { SteddieChat } from "./SteddieChat";

const randomTagline = () => {
  const taglines = steddieProfile.taglines;
  return taglines[Math.floor(Math.random() * taglines.length)];
};

export const Steddie = () => {
  const { user } = useAuth();
  // Start with first tagline to avoid hydration mismatch
  const [tagline, setTagline] = useState(steddieProfile.taglines[0]);
  const [contextualWisdom, setContextualWisdom] = useState<string>("");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Set random tagline only on client side
  useEffect(() => {
    setIsClient(true);
    setTagline(randomTagline());
  }, []);

  // Load user stats for contextual wisdom
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    try {
      const stats = await progressService.getUserStats(user.id);
      setUserStats(stats);
      if (stats) {
        setContextualWisdom(generateContextualWisdom(stats));
      }
    } catch (error) {
      // Silently handle stats loading errors - Steddie will still work with default wisdom
      console.warn("Could not load user stats for Steddie:", error);
      setUserStats(null);
    }
  };

  const generateContextualWisdom = (stats: UserStats): string => {
    // Generate wisdom based on user's performance and progress
    if (stats.total_sessions === 0) {
      return "Welcome, young mind! Every master was once a beginner. Your first step into the memory palace awaits.";
    }

    if (stats.total_sessions === 1) {
      return "Excellent! You've taken your first step. Like a tortoise, we build strength through steady practice.";
    }

    if (stats.current_streak >= 7) {
      return `Remarkable! ${stats.current_streak} days of practice. Consistency is the tortoise's greatest strength.`;
    }

    if (stats.average_accuracy >= 90) {
      return "Your precision is impressive! Remember, accuracy and speed both matter, but accuracy comes first.";
    }

    if (stats.average_accuracy < 60) {
      return "Patience, young one. Even the wisest tortoise stumbles. Focus on understanding, not just speed.";
    }

    if (stats.best_score >= 50) {
      return "Your memory palace grows strong! High scores show your techniques are taking root.";
    }

    if (stats.total_sessions >= 10) {
      return "Ten sessions completed! You're building the habits that separate masters from beginners.";
    }

    if (stats.achievements_count >= 5) {
      return "Your collection of achievements grows! Each one represents a milestone on your memory journey.";
    }

    // Default contextual wisdom based on favorite game
    const gameWisdom: Record<string, string> = {
      random_palace:
        "The palace method serves you well. Each room you master strengthens your spatial memory.",
      chaos_cards:
        "Chaos teaches order. Your card memory skills will serve you in many areas of life.",
      entropy_storytelling:
        "Stories are the threads that weave memories together. Your narrative skills grow stronger.",
    };

    return (
      gameWisdom[stats.favorite_game] ||
      "Every practice session adds another stone to your memory palace. Keep building!"
    );
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* Steddie Avatar */}
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
        🐢
      </div>
      <div className="mt-3 text-xl font-bold text-green-800">Steddie</div>
      <div className="italic text-gray-600 text-center max-w-xs mt-2 text-sm leading-relaxed">
        “{contextualWisdom || tagline}”
      </div>

      {/* User Progress Indicator */}
      {userStats && (
        <div className="mt-3 flex gap-2 text-xs flex-wrap justify-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {userStats.total_sessions} games
          </span>
          {userStats.current_streak > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
              🔥 {userStats.current_streak} day streak
            </span>
          )}
          {userStats.achievements_count > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              🏆 {userStats.achievements_count} achievements
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => setIsChatOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          💬 Chat with Steddie
        </button>

        {/* Silk Sheet for Wisdom */}
        <Sheet.Root license="non-commercial">
          <Sheet.Trigger asChild>
            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
              💡 Get Wisdom
            </button>
          </Sheet.Trigger>
          <Sheet.Portal>
            <Sheet.View>
              <Sheet.Backdrop themeColorDimming="auto" />
              <Sheet.Content className="bg-white rounded-t-3xl p-6 max-w-md mx-auto">
                <Sheet.BleedingBackground />
                <div className="text-center">
                  <div className="text-4xl mb-4">🐢</div>
                  <h2 className="text-2xl font-bold text-green-800 mb-4">
                    Steddie's Wisdom
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="italic text-green-700">"{tagline}"</p>
                    </div>
                    <button
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      onClick={() => setTagline(randomTagline())}
                    >
                      🔄 New Wisdom
                    </button>
                    <div className="text-sm text-gray-500 mt-4">
                      <p>
                        Steddie has been sharing memory wisdom for centuries.
                      </p>
                      <p className="mt-2">
                        Ready to start your memory journey?
                      </p>
                    </div>
                  </div>
                </div>
              </Sheet.Content>
            </Sheet.View>
          </Sheet.Portal>
        </Sheet.Root>
      </div>

      {/* Chat Interface */}
      <SteddieChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

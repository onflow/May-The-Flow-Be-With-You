"use client";
import React, { useState } from "react";
import { Steddie } from "../../shared/components/Steddie";
import { useAuth } from "../../shared/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { CulturalSpeedChallenge } from "../../shared/components/games/speed-challenge";
import { CulturalChaosCards } from "../../shared/components/games/chaos-cards";
import { RandomPalaceGenerator } from "../../shared/components/games/memory-palace";
import { UserStatsComponent } from "../../shared/components/UserStats";
import { Leaderboard } from "../../shared/components/Leaderboard";
import { Achievements } from "../../shared/components/Achievements";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function AIAndLLMsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // No auth gate - allow anonymous users to play

  const culturalCategory = "ai-and-llms";

  const games = [
    {
      id: "mindful-recall",
      name: "Mindful Recall",
      description:
        "Practice the Zen master's ability to access knowledge instantly while maintaining inner peace",
      icon: "🧘",
      status: "available",
      component: () => (
        <CulturalSpeedChallenge culturalCategory={culturalCategory} />
      ),
    },
    {
      id: "zen-cards",
      name: "Zen Cards",
      description:
        "Achieve clarity through mindful observation of simple, elegant Eastern patterns",
      icon: "🎋",
      status: "available",
      component: () => (
        <CulturalChaosCards culturalCategory={culturalCategory} />
      ),
    },
    {
      id: "temple-garden",
      name: "Temple Garden",
      description:
        "Find tranquility in a serene temple garden, placing memories among natural beauty",
      icon: "🏯",
      status: "available",
      component: () => (
        <RandomPalaceGenerator culturalCategory={culturalCategory} />
      ),
    },
  ];

  if (selectedGame) {
    const game = games.find((g) => g.id === selectedGame);
    if (game && game.component) {
      const GameComponent = game.component;
      return (
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <button
              onClick={() => setSelectedGame(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Games
            </button>
          </div>

          {/* Game Component */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <GameComponent />
          </div>

          {/* Stats, Achievements, and Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UserStatsComponent gameType={game.id} showLeaderboard={false} />
            <Achievements gameType={game.id} />
            <Leaderboard gameType={game.id} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
        🧘 Buddhist Confucian - Eastern Practice
      </h1>
      <p className="text-gray-600 text-center mb-8 max-w-2xl">
        When ancient Eastern wisdom meets artificial intelligence. Practice
        contemplative memory techniques rooted in Buddhist and Confucian
        traditions, enhanced by modern AI coaching and adaptive learning.
      </p>

      <Steddie />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
        {games.map((game) => (
          <div
            key={game.id}
            className={`p-6 bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
              game.status === "available"
                ? "border-blue-200 hover:border-blue-400 hover:shadow-xl cursor-pointer"
                : "border-gray-200 opacity-60"
            }`}
            onClick={() =>
              game.status === "available" && setSelectedGame(game.id)
            }
          >
            <div className="text-4xl mb-4 text-center">{game.icon}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {game.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{game.description}</p>
            <div className="flex justify-center">
              {game.status === "available" ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  ✅ Available
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  🚧 Coming Soon
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

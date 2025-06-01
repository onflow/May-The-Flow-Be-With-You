"use client";
import React, { useState } from "react";
import { Steddie } from "../../shared/components/Steddie";
import { useAuth } from "../../shared/providers/AuthProvider";
import { GameProvider } from "../../shared/providers/GameProvider";
import { useRouter } from "next/navigation";
import { DynamicGameLoader } from "../../shared/components/DynamicGameLoader";
import { AnonymousUserBanner } from "../../shared/components/ProgressiveEnhancement";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function RandomnessRevolutionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // No auth gate - allow anonymous users to play

  const culturalCategory = "randomness-revolution";

  const games = [
    {
      id: "rhetorical-challenge",
      name: "Rhetorical Challenge",
      description:
        "Channel the orator's skill in rapidly accessing vast stores of memorized information",
      icon: "🏛️",
      status: "available",
      gameType: "speed_challenge", // Add separate gameType for leaderboard
      component: () => (
        <DynamicGameLoader
          gameType="speed-challenge"
          culturalCategory={culturalCategory}
        />
      ),
    },
    {
      id: "chaos-cards",
      name: "Chaos Cards",
      description:
        "Master randomized sequences through the discipline of classical order",
      icon: "🎲",
      status: "available",
      gameType: "chaos_cards", // Add separate gameType for leaderboard
      component: () => (
        <DynamicGameLoader
          gameType="chaos-cards"
          culturalCategory={culturalCategory}
        />
      ),
    },
    {
      id: "classical-palace",
      name: "Classical Palace",
      description:
        "Walk through a magnificent Greco-Roman palace, placing memories in architectural splendor",
      icon: "🏺",
      status: "available",
      gameType: "memory_palace", // Add separate gameType for leaderboard
      component: () => (
        <DynamicGameLoader
          gameType="memory-palace"
          culturalCategory={culturalCategory}
        />
      ),
    },
  ];

  // If a game is selected, show the game component
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
            <DynamicGameLoader
              gameType="stats"
              gameId={game.gameType || game.id} // Use gameType for leaderboard consistency
              showLeaderboard={false}
            />
            <DynamicGameLoader
              gameType="achievements"
              gameId={game.gameType || game.id}
            />
            <DynamicGameLoader
              gameType="leaderboard"
              gameId={game.gameType || game.id}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <GameProvider defaultMode="offchain">
      <AnonymousUserBanner />
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          🏛️ Grecian Roman - Classical Wisdom
        </h1>
        <p className="text-gray-600 text-center mb-4 max-w-2xl">
          Master the ancient Greek and Roman memory techniques that transformed
          ordinary minds into legendary ones. Learn the classical methods
          perfected by Simonides, Cicero, and the great orators of antiquity.
        </p>

        {/* Featured Classical Techniques Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border border-amber-300 max-w-3xl">
          <div className="text-center">
            <h2 className="text-lg font-bold text-amber-800 mb-2">
              🏛️ Classical Memory Techniques
            </h2>
            <p className="text-sm text-amber-700">
              Learn the actual techniques used by Simonides, Cicero, and memory
              champions throughout history. These aren't just games—they're
              training in the lost arts of superhuman memory.
            </p>
          </div>
        </div>

        <Steddie />

        {/* Cultural Games Grid */}
        <div className="mobile-grid mt-6 sm:mt-8 w-full max-w-4xl">
          {games.map((game) => (
            <div
              key={game.id}
              className={`p-4 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow-lg border-2 transition-all duration-300 touch-target ${
                game.status === "available"
                  ? "border-yellow-200 hover:border-yellow-400 hover:shadow-xl cursor-pointer active:scale-95"
                  : "border-gray-200 opacity-60"
              }`}
              style={{ minHeight: "160px" }}
              onClick={() =>
                game.status === "available" && setSelectedGame(game.id)
              }
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-center">
                {game.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                {game.name}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                {game.description}
              </p>
              <div className="flex justify-center">
                {game.status === "available" ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
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
    </GameProvider>
  );
}

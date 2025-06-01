"use client";
import React, { useState } from "react";
import { Steddie } from "../../shared/components/Steddie";
import { useAuth } from "../../shared/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { CulturalSpeedChallenge } from "../../shared/components/games/speed-challenge";
import { CulturalChaosCards } from "../../shared/components/games/chaos-cards";
import CulturalMemoryPalace from "../../shared/components/games/memory-palace/CulturalMemoryPalace";
import { UserStatsComponent } from "../../shared/components/UserStats";
import { Leaderboard } from "../../shared/components/Leaderboard";
import { Achievements } from "../../shared/components/Achievements";
import { UserTierBadge } from "../../shared/components/UserTierStatus";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function ActuallyFunGamesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // No auth gate - allow anonymous users to play

  const culturalCategory = "actually-fun-games";

  const games = [
    {
      id: "griot-tales",
      name: "Griot's Tale Challenge",
      description:
        "Rapid storytelling and genealogy recall in the West African tradition",
      icon: "🥁",
      status: "available",
      gameType: "speed_challenge", // Add separate gameType for leaderboard
      component: () => (
        <CulturalSpeedChallenge culturalCategory={culturalCategory} />
      ),
    },
    {
      id: "rhythm-cards",
      name: "Rhythm Cards",
      description:
        "Memorize card sequences using traditional African patterns and drumbeat rhythms",
      icon: "🎵",
      status: "available",
      gameType: "chaos_cards", // Add separate gameType for leaderboard
      component: () => (
        <CulturalChaosCards culturalCategory={culturalCategory} />
      ),
    },
    {
      id: "village-compound",
      name: "Village Compound",
      description:
        "Navigate a traditional West African village compound, placing memories in sacred spaces",
      icon: "🏘️",
      status: "available",
      gameType: "memory_palace", // Add separate gameType for leaderboard
      component: () => (
        <CulturalMemoryPalace culturalCategory={culturalCategory} />
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
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{game.name}</h1>
              <UserTierBadge />
            </div>
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
            <UserStatsComponent
              gameType={game.gameType || game.id}
              showLeaderboard={false}
            />
            <Achievements gameType={game.gameType || game.id} />
            <Leaderboard gameType={game.gameType || game.id} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
        🥁 African Oral Tradition - Griot Mastery
      </h1>
      <p className="text-gray-600 text-center mb-8 max-w-2xl">
        In the tradition of West African griots, master the art of memory
        through rhythm, storytelling, and community wisdom. These games honor
        the oral traditions that have preserved knowledge for millennia.
      </p>

      <Steddie />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
        {games.map((game) => (
          <div
            key={game.id}
            className={`p-6 bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
              game.status === "available"
                ? "border-green-200 hover:border-green-400 hover:shadow-xl cursor-pointer"
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
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
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

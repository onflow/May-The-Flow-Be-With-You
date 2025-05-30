"use client";
import React, { useState } from "react";
import { Steddie } from "../../shared/components/Steddie";
import { useAuth } from "../../shared/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { GameManager, GameSelector } from "../../shared/components/GameManager";
import { UserStatsComponent } from "../../shared/components/UserStats";
import { Leaderboard } from "../../shared/components/Leaderboard";
import { getGamesByCategory } from "../../shared/config/games";
import { GameType } from "../../shared/types/game";
import { SteddieStoryteller } from "../../shared/components/SteddieStoryteller";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function RandomnessRevolutionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  React.useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  // Get games for this category
  const randomnessGames = getGamesByCategory("randomness");

  // If a game is selected, show the game manager
  if (selectedGame) {
    return (
      <div className="w-full space-y-6">
        <GameManager
          gameType={selectedGame}
          onBack={() => setSelectedGame(null)}
          onGameComplete={(result) => {
            console.log("Game completed:", result);
            // Could show achievement notifications here
          }}
        />

        {/* Stats and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserStatsComponent gameType={selectedGame} showLeaderboard={false} />
          <Leaderboard gameType={selectedGame} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
        🎲 Randomness Revolution
      </h1>
      <p className="text-gray-600 text-center mb-4 max-w-2xl">
        Master the ancient memory techniques that transformed ordinary minds
        into legendary ones. Learn the classical methods perfected over
        millennia.
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

      <div className="mb-8">
        <Steddie />
      </div>

      {/* Use the new GameSelector component */}
      <div className="w-full max-w-4xl">
        <GameSelector
          games={randomnessGames.map((g) => g.type)}
          onSelectGame={setSelectedGame}
          title="Choose Your Memory Challenge"
          description="Embrace chaos to find the order within"
        />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { GameType } from "../types/game";
import { getGameConfig } from "../config/games";
import { MemoryLoadingSpinner } from "./LoadingSpinner";
import { usePerformance } from "../hooks/usePerformance";

// Import game components directly for now (can optimize later)
import { ChaosCards } from "./games/ChaosCards";
import { RandomPalaceGenerator } from "./games/RandomPalaceGenerator";
import { MemorySpeedChallenge } from "./games/MemorySpeedChallenge";
import { LinkingMethodTrainer } from "./games/LinkingMethodTrainer";
import { MethodOfLociTrainer } from "./games/MethodOfLociTrainer";

interface GameManagerProps {
  gameType: GameType;
  onGameComplete?: (result: any) => void;
  onBack?: () => void;
}

// Game component registry
const GAME_COMPONENTS: Record<GameType, React.ComponentType> = {
  chaos_cards: ChaosCards,
  random_palace: RandomPalaceGenerator,
  memory_speed: MemorySpeedChallenge,
  linking_method: LinkingMethodTrainer,
  method_of_loci: MethodOfLociTrainer,
};

export function GameManager({
  gameType,
  onGameComplete,
  onBack,
}: GameManagerProps) {
  const gameConfig = getGameConfig(gameType);
  const GameComponent = GAME_COMPONENTS[gameType];

  // Track performance for this game
  usePerformance({
    trackRender: true,
    trackMemory: true,
    onMetrics: (metrics) => {
      // Log performance metrics for debugging
      if (process.env.NODE_ENV === "development") {
        console.log(`Game Performance [${gameType}]:`, metrics);
      }
    },
  });

  if (!GameComponent) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Game Not Found</h3>
        <p className="text-gray-600 mb-4">
          The game "{gameType}" is not available yet.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Game Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl">{gameConfig.icon}</span>
          <h1 className="text-2xl font-bold text-gray-800">
            {gameConfig.name}
          </h1>
        </div>
        <p className="text-gray-600">{gameConfig.description}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Games
          </button>
        )}
      </div>

      {/* Game Component */}
      <GameComponent />
    </div>
  );
}

// Game selector component
interface GameSelectorProps {
  games: GameType[];
  onSelectGame: (gameType: GameType) => void;
  title?: string;
  description?: string;
}

export function GameSelector({
  games,
  onSelectGame,
  title,
  description,
}: GameSelectorProps) {
  return (
    <div className="w-full">
      {title && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((gameType) => {
          const config = getGameConfig(gameType);
          return (
            <GameCard
              key={gameType}
              config={config}
              onClick={() => onSelectGame(gameType)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Individual game card component
interface GameCardProps {
  config: ReturnType<typeof getGameConfig>;
  onClick: () => void;
}

function GameCard({ config, onClick }: GameCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300"
    >
      {/* Game Icon */}
      <div className="text-center mb-4">
        <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">
          {config.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
          {config.name}
        </h3>
      </div>

      {/* Game Description */}
      <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2">
        {config.description}
      </p>

      {/* Difficulty Indicators */}
      <div className="flex justify-center gap-1 mb-4">
        {Object.keys(config.difficultySettings).map((difficulty, index) => (
          <div
            key={difficulty}
            className={`w-2 h-2 rounded-full ${
              index === 0
                ? "bg-green-400"
                : index === 1
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
            title={`${difficulty} difficulty`}
          />
        ))}
      </div>

      {/* Play Button */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors text-sm font-medium">
          <span>Play Game</span>
          <span className="group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </div>
  );
}

// Game statistics component
interface GameStatsProps {
  gameType: GameType;
  stats?: {
    totalPlayed: number;
    bestScore: number;
    averageAccuracy: number;
    lastPlayed?: string;
  };
}

export function GameStats({ gameType, stats }: GameStatsProps) {
  const config = getGameConfig(gameType);

  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{config.icon}</span>
        <h4 className="font-semibold text-gray-800">{config.name}</h4>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Games Played</div>
          <div className="font-semibold text-gray-800">{stats.totalPlayed}</div>
        </div>
        <div>
          <div className="text-gray-500">Best Score</div>
          <div className="font-semibold text-gray-800">{stats.bestScore}</div>
        </div>
        <div>
          <div className="text-gray-500">Avg Accuracy</div>
          <div className="font-semibold text-gray-800">
            {stats.averageAccuracy}%
          </div>
        </div>
        <div>
          <div className="text-gray-500">Last Played</div>
          <div className="font-semibold text-gray-800">
            {stats.lastPlayed
              ? new Date(stats.lastPlayed).toLocaleDateString()
              : "Never"}
          </div>
        </div>
      </div>
    </div>
  );
}

// Components are already exported above

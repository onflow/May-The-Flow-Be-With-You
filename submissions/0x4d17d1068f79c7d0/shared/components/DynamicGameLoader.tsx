"use client";

import React, { Suspense, lazy, useState, useEffect } from "react";
import { LoadingSpinner, MemoryLoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";

// Dynamic imports for game components
const CulturalSpeedChallenge = lazy(() =>
  import("./games/speed-challenge").then((module) => ({
    default: module.CulturalSpeedChallenge,
  }))
);

const CulturalChaosCards = lazy(() =>
  import("./games/chaos-cards").then((module) => ({
    default: module.CulturalChaosCards,
  }))
);

const CulturalMemoryPalace = lazy(() =>
  import("./games/memory-palace/CulturalMemoryPalace").then((module) => ({
    default: module.default,
  }))
);

const UserStatsComponent = lazy(() =>
  import("./UserStats").then((module) => ({
    default: module.UserStatsComponent,
  }))
);

const Leaderboard = lazy(() =>
  import("./Leaderboard").then((module) => ({
    default: module.Leaderboard,
  }))
);

const Achievements = lazy(() =>
  import("./Achievements").then((module) => ({
    default: module.Achievements,
  }))
);

interface DynamicGameLoaderProps {
  gameType:
    | "speed-challenge"
    | "chaos-cards"
    | "memory-palace"
    | "stats"
    | "leaderboard"
    | "achievements";
  culturalCategory?: string;
  gameId?: string;
  showLeaderboard?: boolean;
  className?: string;
}

export function DynamicGameLoader({
  gameType,
  culturalCategory = "randomness-revolution",
  gameId,
  showLeaderboard = true,
  className = "",
}: DynamicGameLoaderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server to prevent hydration issues
  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <MemoryLoadingSpinner size="lg" />
      </div>
    );
  }

  const renderGameComponent = () => {
    switch (gameType) {
      case "speed-challenge":
        return <CulturalSpeedChallenge culturalCategory={culturalCategory} />;
      case "chaos-cards":
        return <CulturalChaosCards culturalCategory={culturalCategory} />;
      case "memory-palace":
        return <CulturalMemoryPalace culturalCategory={culturalCategory} />;
      case "stats":
        return (
          <UserStatsComponent
            gameType={gameId || "default"}
            showLeaderboard={showLeaderboard}
          />
        );
      case "leaderboard":
        return <Leaderboard gameType={gameId || "default"} />;
      case "achievements":
        return <Achievements gameType={gameId || "default"} />;
      default:
        return <div>Unknown game type: {gameType}</div>;
    }
  };

  return (
    <div className={className}>
      <ErrorBoundary
        fallback={
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">
              Something went wrong loading this game.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <MemoryLoadingSpinner size="lg" />
            </div>
          }
        >
          {renderGameComponent()}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Preload function for better UX
export function preloadGameComponent(
  gameType: DynamicGameLoaderProps["gameType"]
) {
  switch (gameType) {
    case "speed-challenge":
      import("./games/speed-challenge");
      break;
    case "chaos-cards":
      import("./games/chaos-cards");
      break;
    case "memory-palace":
      import("./games/memory-palace/CulturalMemoryPalace");
      break;
    case "stats":
      import("./UserStats");
      break;
    case "leaderboard":
      import("./Leaderboard");
      break;
    case "achievements":
      import("./Achievements");
      break;
  }
}

// Hook for preloading on hover
export function useGamePreloader() {
  const preloadOnHover = (gameType: DynamicGameLoaderProps["gameType"]) => {
    return {
      onMouseEnter: () => preloadGameComponent(gameType),
    };
  };

  return { preloadOnHover };
}

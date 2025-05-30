"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { progressService } from "../../services/progressService";
import { MemoryLoadingSpinner } from "../LoadingSpinner";
import { GameScoreShare } from "../SocialShare";

// Game state types
interface MemoryItem {
  id: string;
  position: { x: number; y: number };
  color: string;
  emoji: string;
  name: string;
  room: string;
}

interface GameState {
  phase: "setup" | "memorize" | "recall" | "results";
  timeLeft: number;
  score: number;
  items: MemoryItem[];
  userGuesses: string[];
  currentGuess: number;
}

// Palace room data
interface Room {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Generate palace layout
function generatePalaceLayout(seed: number): Room[] {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const roomNames = [
    "Entrance Hall",
    "Library",
    "Kitchen",
    "Garden",
    "Study",
    "Gallery",
  ];
  const roomColors = [
    "#e3f2fd",
    "#f3e5f5",
    "#e8f5e8",
    "#fff3e0",
    "#fce4ec",
    "#f1f8e9",
  ];

  const rooms: Room[] = [];
  const gridSize = 3; // 3x2 grid

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    rooms.push({
      id: `room-${i}`,
      name: roomNames[i],
      color: roomColors[i],
      position: {
        x: col * 200 + 50,
        y: row * 150 + 50,
      },
      size: {
        width: 180,
        height: 130,
      },
    });
  }

  return rooms;
}

// 2D Palace component
function PalaceView({
  rooms,
  items,
  gameState,
}: {
  rooms: Room[];
  items: MemoryItem[];
  gameState: GameState;
}) {
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border-2 border-amber-200 overflow-hidden">
      {/* Palace Title */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-10">
        🏛️ Memory Palace
      </div>

      {/* Rooms */}
      {rooms.map((room) => (
        <div
          key={room.id}
          className="absolute border-2 border-amber-300 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
          style={{
            left: `${room.position.x}px`,
            top: `${room.position.y}px`,
            width: `${room.size.width}px`,
            height: `${room.size.height}px`,
            backgroundColor: room.color,
          }}
        >
          {/* Room label */}
          <div className="absolute top-1 left-2 text-xs font-semibold text-gray-700">
            {room.name}
          </div>

          {/* Room items */}
          {items
            .filter((item) => item.room === room.id)
            .map((item) => (
              <div
                key={item.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                  gameState.phase === "memorize" || gameState.phase === "setup"
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-0"
                }`}
                style={{
                  left: `${item.position.x}%`,
                  top: `${item.position.y}%`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white animate-pulse"
                  style={{ backgroundColor: item.color }}
                >
                  {item.emoji}
                </div>
                <div className="text-xs font-medium text-center mt-1 bg-white/80 rounded px-1">
                  {item.name}
                </div>
              </div>
            ))}
        </div>
      ))}

      {/* Decorative elements */}
      <div className="absolute bottom-2 right-2 text-amber-600 opacity-50">
        <div className="text-xs">🌟 Procedurally Generated</div>
      </div>
    </div>
  );
}

// Main game component
export function RandomPalaceGenerator() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    phase: "setup",
    timeLeft: 30,
    score: 0,
    items: [],
    userGuesses: [],
    currentGuess: 0,
  });
  const [seed, setSeed] = useState(Math.floor(Math.random() * 10000));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate random memory items
  const generateItems = (
    seed: number,
    rooms: Room[],
    count: number = 6
  ): MemoryItem[] => {
    const emojis = ["🍎", "🌟", "🎯", "🔑", "💎", "🌸", "⚡", "🎨", "🎭", "🎪"];
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    const names = [
      "Apple",
      "Star",
      "Target",
      "Key",
      "Diamond",
      "Flower",
      "Lightning",
      "Palette",
      "Mask",
      "Circus",
    ];

    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const items: MemoryItem[] = [];
    for (let i = 0; i < count; i++) {
      const roomIndex = i % rooms.length;
      const room = rooms[roomIndex];

      items.push({
        id: `item-${i}`,
        position: {
          x: 20 + random(seed + i) * 60, // 20-80% within room
          y: 30 + random(seed + i + 100) * 40, // 30-70% within room
        },
        color: colors[Math.floor(random(seed + i + 50) * colors.length)],
        emoji: emojis[Math.floor(random(seed + i + 100) * emojis.length)],
        name: names[Math.floor(random(seed + i + 150) * names.length)],
        room: room.id,
      });
    }
    return items;
  };

  // Start new game
  const startGame = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    const newRooms = generatePalaceLayout(newSeed);
    const items = generateItems(newSeed, newRooms);
    setRooms(newRooms);
    setGameState({
      phase: "memorize",
      timeLeft: 30,
      score: 0,
      items,
      userGuesses: [],
      currentGuess: 0,
    });
  };

  // Timer effect
  useEffect(() => {
    if (gameState.phase === "memorize" && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.phase === "memorize" && gameState.timeLeft === 0) {
      setGameState((prev) => ({ ...prev, phase: "recall" }));
    }
  }, [gameState.phase, gameState.timeLeft]);

  // Handle item guess
  const handleGuess = (itemName: string) => {
    const newGuesses = [...gameState.userGuesses, itemName];
    const isCorrect =
      gameState.items[gameState.currentGuess]?.name === itemName;
    const newScore = isCorrect ? gameState.score + 10 : gameState.score;

    if (gameState.currentGuess >= gameState.items.length - 1) {
      // Game finished
      setGameState((prev) => ({
        ...prev,
        phase: "results",
        userGuesses: newGuesses,
        score: newScore,
      }));
      saveGameResult(newScore);
    } else {
      setGameState((prev) => ({
        ...prev,
        userGuesses: newGuesses,
        currentGuess: prev.currentGuess + 1,
        score: newScore,
      }));
    }
  };

  // Save game result using progress service
  const saveGameResult = async (finalScore: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const maxPossibleScore = gameState.items.length * 10;
      const accuracy = (finalScore / maxPossibleScore) * 100;

      await progressService.saveGameSession({
        user_id: user.id,
        game_type: "random_palace",
        score: finalScore,
        max_possible_score: maxPossibleScore,
        accuracy: accuracy,
        items_count: gameState.items.length,
        duration_seconds: 30,
        difficulty_level: 1,
        session_data: {
          seed,
          items: gameState.items,
          guesses: gameState.userGuesses,
          palace_layout: "2d_procedural",
        },
      });

      // Update leaderboards
      await progressService.updateLeaderboards();
    } catch (error) {
      console.error("Error saving game result:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Game UI */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="font-semibold">Phase:</span> {gameState.phase}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Score:</span> {gameState.score}
            </div>
            {gameState.phase === "memorize" && (
              <div className="text-sm">
                <span className="font-semibold">Time:</span>{" "}
                {gameState.timeLeft}s
              </div>
            )}
          </div>

          {gameState.phase === "setup" && (
            <button
              onClick={startGame}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              🏛️ Generate Palace
            </button>
          )}
        </div>

        {gameState.phase === "memorize" && (
          <div className="text-center">
            <p className="text-lg font-medium text-yellow-800">
              Memorize the locations and items in this palace!
            </p>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(gameState.timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>
        )}

        {gameState.phase === "recall" && (
          <div className="text-center">
            <p className="text-lg font-medium text-yellow-800 mb-4">
              What was item #{gameState.currentGuess + 1}?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from(
                new Set(gameState.items.map((item) => item.name))
              ).map((name) => (
                <button
                  key={name}
                  onClick={() => handleGuess(name)}
                  className="px-4 py-2 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
                  disabled={gameState.userGuesses.includes(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState.phase === "results" && (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-yellow-800 mb-2">
              Palace Mastered! 🏆
            </h3>
            <p className="text-lg mb-4">
              Final Score: {gameState.score} / {gameState.items.length * 10}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Accuracy:{" "}
              {Math.round(
                (gameState.score / (gameState.items.length * 10)) * 100
              )}
              %
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  "🔄 New Palace"
                )}
              </button>

              {/* Social Share for good scores */}
              {gameState.score >= 30 && (
                <GameScoreShare
                  gameType="random_palace"
                  score={gameState.score}
                  accuracy={Math.round(
                    (gameState.score / (gameState.items.length * 10)) * 100
                  )}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2D Palace View */}
      <PalaceView rooms={rooms} items={gameState.items} gameState={gameState} />

      {gameState.phase === "setup" && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">How to Play:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>
              1. Click "Generate Palace" to create a random 2D memory palace
            </li>
            <li>2. Study the items and their locations for 30 seconds</li>
            <li>3. Recall the items in the correct order</li>
            <li>4. Earn points for each correct answer!</li>
          </ol>
        </div>
      )}
    </div>
  );
}

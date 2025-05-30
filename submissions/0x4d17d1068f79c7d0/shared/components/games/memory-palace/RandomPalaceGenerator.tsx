"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../providers/AuthProvider";
import { progressService } from "../../../services/progressService";
import { MemoryLoadingSpinner } from "../../LoadingSpinner";
import { GameScoreShare } from "../../SocialShare";
import {
  getThemeByCategory,
  getThemeItems,
} from "../../../config/culturalThemes";

// Game state types
interface MemoryItem {
  id: string;
  coordinates: { x: number; y: number };
  position: number; // Sequential position for BaseGameItem compatibility
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
function generatePalaceLayout(seed: number, culturalCategory: string): Room[] {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  // Get cultural theme and places
  const theme = getThemeByCategory(culturalCategory);
  const culturalPlaces = getThemeItems(culturalCategory, "places");

  const roomNames = culturalPlaces.slice(0, 6);

  // Use cultural theme background with variations
  const baseColor = theme.colors.background;
  const roomColors = [
    baseColor,
    theme.colors.background,
    baseColor + "CC", // Add some transparency variations
    baseColor + "AA",
    theme.colors.background + "DD",
    baseColor + "BB",
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
  culturalCategory,
}: {
  rooms: Room[];
  items: MemoryItem[];
  gameState: GameState;
  culturalCategory: string;
}) {
  const theme = getThemeByCategory(culturalCategory);
  const palaceInfo = theme.gameAdaptations.memoryPalace;

  return (
    <div
      className="relative w-full h-96 rounded-lg border-2 overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${theme.colors.background}, ${theme.colors.background}DD)`,
        borderColor: theme.colors.primary + "40",
      }}
    >
      {/* Palace Title */}
      <div
        className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-10"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.id === "griot"
          ? "🥁"
          : theme.id === "sage"
          ? "🧘"
          : theme.id === "dreamtime"
          ? "🎨"
          : "🏛️"}{" "}
        {palaceInfo.name}
      </div>

      {/* Rooms */}
      {rooms.map((room) => (
        <div
          key={room.id}
          className="absolute border-2 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
          style={{
            left: `${room.position.x}px`,
            top: `${room.position.y}px`,
            width: `${room.size.width}px`,
            height: `${room.size.height}px`,
            backgroundColor: room.color,
            borderColor: theme.colors.primary + "60",
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
                  left: `${item.coordinates.x}%`,
                  top: `${item.coordinates.y}%`,
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

// Generate random memory items
const generateItems = (
  seed: number,
  rooms: Room[],
  culturalCategory: string,
  count: number = 6
): MemoryItem[] => {
  // Get cultural theme and items
  const theme = getThemeByCategory(culturalCategory);
  const culturalObjects = getThemeItems(culturalCategory, "objects");

  // Create culturally appropriate item pairs
  const itemPairs = culturalObjects.slice(0, 15).map((name) => {
    // Map cultural items to appropriate emojis
    const emojiMap: Record<string, string> = {
      // Greek/Classical items
      Scroll: "📜",
      Amphora: "🏺",
      Lyre: "🎵",
      "Olive Branch": "🫒",
      "Laurel Crown": "👑",
      Stylus: "✒️",
      "Wax Tablet": "📝",
      Chiton: "👘",
      Sandals: "👡",
      Coin: "🪙",
      Shield: "🛡️",
      Spear: "🗡️",
      "Wine Cup": "🍷",
      "Oil Lamp": "🪔",
      Marble: "🗿",
      Bronze: "🥉",

      // African/Griot items
      Djembe: "🥁",
      Kora: "🎵",
      "Talking Drum": "🥁",
      Calabash: "🥥",
      "Cowrie Shell": "🐚",
      "Baobab Seed": "🌰",
      "Gold Weight": "⚖️",
      "Adinkra Symbol": "🔣",
      "Shea Butter": "🧴",
      "Kente Cloth": "🧵",
      Mask: "🎭",
      "Clay Pot": "🏺",
      Millet: "🌾",
      Yam: "🍠",
      "Palm Oil": "🫒",
      Honey: "🍯",

      // Eastern/Asian items
      Bamboo: "🎋",
      Lotus: "🪷",
      "Tea Cup": "🍵",
      Brush: "🖌️",
      "Ink Stone": "⚫",
      Jade: "💚",
      Gong: "🔔",
      Incense: "🕯️",
      "Prayer Beads": "📿",
      Fan: "🪭",
      Silk: "🧵",
      Porcelain: "🏺",
      Calligraphy: "📝",
      Seal: "🔖",
      Compass: "🧭",
      Abacus: "🧮",

      // Indigenous/Aboriginal items
      Boomerang: "🪃",
      Didgeridoo: "🎵",
      Ochre: "🟤",
      Coolamon: "🥥",
      Woomera: "🏹",
      Firestick: "🔥",
      "Grinding Stone": "🪨",
      "Water Gourd": "🥥",
      "Spear Thrower": "🏹",
      "Message Stick": "📜",
      "Clap Sticks": "🥢",
      "Emu Feather": "🪶",
      "Kangaroo Skin": "🦘",
      "Bush Medicine": "🌿",
      "Sacred Stone": "🗿",
      "Honey Ant": "🐜",
      "Witchetty Grub": "🐛",
      "Bush Tucker": "🌰",

      // Fallback emojis
      Apple: "🍎",
      Star: "🌟",
      Target: "🎯",
      Key: "🔑",
      Diamond: "💎",
      Flower: "🌸",
      Lightning: "⚡",
      Palette: "🎨",
    };

    return {
      emoji: emojiMap[name] || "⭐", // fallback emoji
      name: name,
    };
  });

  // Use cultural theme colors
  const themeColors = theme.colors;
  const colors = [
    themeColors.primary,
    themeColors.secondary,
    themeColors.accent,
    themeColors.primary + "80", // Add transparency
    themeColors.secondary + "80",
    themeColors.accent + "80",
    "#ff6b6b", // Keep some variety
    "#4ecdc4",
  ];

  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const items: MemoryItem[] = [];
  for (let i = 0; i < count; i++) {
    const roomIndex = i % rooms.length;
    const room = rooms[roomIndex];

    // Use the same random index for both emoji and name to ensure they match
    const itemIndex = Math.floor(random(seed + i + 100) * itemPairs.length);
    const selectedPair = itemPairs[itemIndex];

    items.push({
      id: `item-${i}`,
      coordinates: {
        x: 20 + random(seed + i) * 60, // 20-80% within room
        y: 30 + random(seed + i + 100) * 40, // 30-70% within room
      },
      position: i, // Sequential position for BaseGameItem compatibility
      color: colors[Math.floor(random(seed + i + 50) * colors.length)],
      emoji: selectedPair.emoji,
      name: selectedPair.name,
      room: room.id,
    });
  }
  return items;
};

// Main game component
export default function RandomPalaceGenerator({
  culturalCategory = "randomness-revolution",
}: {
  culturalCategory?: string;
}) {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    phase: "setup",
    timeLeft: 30,
    score: 0,
    items: [],
    userGuesses: [],
    currentGuess: 0,
  });
  const [seed, setSeed] = useState(() => {
    // Use stable seed for SSR, random for client
    return typeof window !== "undefined"
      ? Math.floor(Math.random() * 10000)
      : 12345;
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Start new game
  const startGame = () => {
    const newSeed =
      typeof window !== "undefined"
        ? Math.floor(Math.random() * 10000)
        : Date.now() % 10000;
    setSeed(newSeed);
    const newRooms = generatePalaceLayout(newSeed, culturalCategory);
    const items = generateItems(newSeed, newRooms, culturalCategory);
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

  const theme = getThemeByCategory(culturalCategory);

  return (
    <div className="w-full h-full">
      {/* Game UI */}
      <div
        className="mb-6 p-4 rounded-lg border-2"
        style={{
          background: `linear-gradient(to right, ${theme.colors.background}, ${theme.colors.background}DD)`,
          borderColor: theme.colors.primary + "40",
        }}
      >
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
              className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {theme.id === "griot"
                ? "🥁"
                : theme.id === "sage"
                ? "🧘"
                : theme.id === "dreamtime"
                ? "🎨"
                : "🏛️"}{" "}
              Generate Palace
            </button>
          )}
        </div>

        {gameState.phase === "memorize" && (
          <div className="text-center">
            <p
              className="text-lg font-medium"
              style={{ color: theme.colors.text }}
            >
              Memorize the locations and items in this {theme.culture} palace!
            </p>
            <div
              className="w-full rounded-full h-2 mt-2"
              style={{ backgroundColor: theme.colors.primary + "30" }}
            >
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${(gameState.timeLeft / 30) * 100}%`,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </div>
          </div>
        )}

        {gameState.phase === "recall" && (
          <div className="text-center">
            <p
              className="text-lg font-medium mb-4"
              style={{ color: theme.colors.text }}
            >
              What was item #{gameState.currentGuess + 1}?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from(
                new Set(gameState.items.map((item) => item.name))
              ).map((name) => (
                <button
                  key={name}
                  onClick={() => handleGuess(name)}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-opacity-80 transition-colors"
                  style={{ borderColor: theme.colors.primary + "40" }}
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
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: theme.colors.text }}
            >
              Palace Memory Complete! 🏛️
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{gameState.score}</div>
                <div className="text-sm opacity-70">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {gameState.items.length}
                </div>
                <div className="text-sm opacity-70">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {
                    gameState.userGuesses.filter(
                      (guess, index) => guess === gameState.items[index]?.name
                    ).length
                  }
                </div>
                <div className="text-sm opacity-70">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(
                    (gameState.score / (gameState.items.length * 10)) * 100
                  )}
                  %
                </div>
                <div className="text-sm opacity-70">Accuracy</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: theme.colors.primary }}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "🔄 Generate New Palace"}
              </button>

              {gameState.score >= 50 && (
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

      {/* Palace Display */}
      {gameState.items.length > 0 && (
        <PalaceView
          rooms={rooms}
          items={gameState.items}
          gameState={gameState}
          culturalCategory={culturalCategory}
        />
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <MemoryLoadingSpinner />
        </div>
      )}
    </div>
  );
}

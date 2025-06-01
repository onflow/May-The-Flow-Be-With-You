"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { MemoryTechnique, MemoryItem, Room } from "../shared/types";

interface MemoryPalaceMemorizeProps {
  theme: CulturalTheme;
  rooms: Room[];
  items: MemoryItem[];
  timeLeft: number;
  memoryTechnique: MemoryTechnique;
  culturalStory: string;
  difficulty: number;
  perfectRounds: number;
  onStartRecall: () => void;
}

export function MemoryPalaceMemorize({
  theme,
  rooms,
  items,
  timeLeft,
  memoryTechnique,
  culturalStory,
  difficulty,
  perfectRounds,
  onStartRecall,
}: MemoryPalaceMemorizeProps) {
  // Get technique-specific guidance for memorization
  const getTechniqueGuidance = (technique: string) => {
    switch (technique) {
      case "observation":
        return "👁️ Study the layout carefully and memorize each item's position";
      case "loci":
        return "🏛️ Walk through each room mentally, placing items in their exact locations";
      case "linking":
        return "🔗 Create bizarre connections between consecutive items in sequence";
      case "story":
        return "📖 Weave all items into one memorable narrative through the palace";
      case "cultural":
        return "🌍 Connect each item to its cultural significance and historical context";
      case "journey":
        return "🚶 Follow your planned route, connecting each item to the next in sequence";
      case "spatial":
        return "🗺️ Focus on the spatial relationships and distances between items";
      default:
        return "👁️ Study the layout carefully and memorize each item's position";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 15) return "text-green-600";
    if (timeLeft > 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (timeLeft > 15) return "bg-green-500";
    if (timeLeft > 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header with Timer */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: theme.colors.primary }}
          >
            🧠
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: theme.colors.primary }}
            >
              Memorization Phase
            </h2>
            <p className="text-gray-600">
              Study the palace layout and memorize item positions
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="mb-6">
          <div className={`text-4xl font-bold mb-2 ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor()}`}
              style={{
                width: `${(timeLeft / (25 - (difficulty - 4) * 2)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Technique Reminder */}
      <div
        className="p-4 rounded-lg border-l-4 text-center"
        style={{
          backgroundColor: theme.colors.background,
          borderLeftColor: theme.colors.primary,
        }}
      >
        <p className="font-medium" style={{ color: theme.colors.primary }}>
          {getTechniqueGuidance(memoryTechnique)}
        </p>
      </div>

      {/* Palace Visualization */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border-2 border-amber-200 p-3 sm:p-4 lg:p-6">
        <div className="palace-container">
          {/* Palace background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${theme.colors.primary}22 0, ${theme.colors.primary}22 1px, transparent 1px, transparent 20px)`,
              }}
            ></div>
          </div>

          {/* Rooms */}
          {rooms.map((room, roomIndex) => (
            <div
              key={room.id}
              className="palace-room"
              style={{
                left: `${room.position.x}%`,
                top: `${room.position.y}%`,
                width: `${room.size.width}%`,
                height: `${room.size.height}%`,
                borderColor: room.color,
              }}
            >
              {/* Room label */}
              <div className="palace-room-label">
                <span>
                  {roomIndex + 1}. {room.name}
                </span>
              </div>

              {/* Room items with pulsing animation */}
              {items
                .filter((item) => item.room === room.id)
                .map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="palace-item animate-pulse"
                    style={{
                      left: `${item.coordinates.x}%`,
                      top: `${item.coordinates.y}%`,
                    }}
                  >
                    <div
                      className="palace-item-icon"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.emoji}
                    </div>
                    <div className="palace-item-name">{item.name}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Memory Aids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items Sequence */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-center">
            📝 Items Sequence
          </h3>
          <div className="space-y-2">
            {items.map((item, index) => {
              const room = rooms.find((r) => r.id === item.room);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-bold text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{room?.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Stats */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-center">
            📊 Your Progress
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: theme.colors.primary }}
              >
                {difficulty}
              </div>
              <div className="text-sm text-gray-600">Items to Remember</div>
            </div>

            {perfectRounds > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {perfectRounds}
                </div>
                <div className="text-sm text-gray-600">Perfect Rounds</div>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="text-xs text-blue-700 text-center">
                💡 <strong>Pro Tip:</strong> Create vivid, unusual mental
                images. The more absurd and memorable, the better!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Context */}
      {culturalStory && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            🌍 Cultural Context
          </h4>
          <p className="text-sm text-blue-700">{culturalStory}</p>
        </div>
      )}

      {/* Auto-advance notice */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-yellow-600">⏰</span>
          <span className="text-sm text-yellow-700">
            The recall phase will start automatically when time runs out
          </span>
        </div>
      </div>

      {/* Manual advance button (for when ready early) */}
      {timeLeft > 5 && (
        <div className="text-center">
          <button
            onClick={onStartRecall}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Ready? Start Recall Now
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { MemoryTechnique, MemoryItem, Room } from "../shared/types";

interface MemoryPalaceLearnProps {
  theme: CulturalTheme;
  rooms: Room[];
  items: MemoryItem[];
  memoryTechnique: MemoryTechnique;
  culturalStory: string;
  difficulty: number;
  showItems: boolean;
  onStartMemorize: () => void;
}

export function MemoryPalaceLearn({
  theme,
  rooms,
  items,
  memoryTechnique,
  culturalStory,
  difficulty,
  showItems,
  onStartMemorize,
}: MemoryPalaceLearnProps) {
  // Get technique-specific guidance
  const getTechniqueGuidance = (technique: string) => {
    switch (technique) {
      case "loci":
        return {
          icon: "🏛️",
          title: "Method of Loci",
          description:
            "Place each item in a specific location within your palace",
          tips: [
            "Visualize walking through each room in order",
            "Create vivid mental images of items in their locations",
            "Use the room's features to anchor your memories",
            "Practice the route: entrance → rooms → exit",
          ],
        };
      case "journey":
        return {
          icon: "🚶",
          title: "Memory Journey",
          description: "Create a path through your palace connecting all items",
          tips: [
            "Plan your route through the palace",
            "Connect each item to the next in your journey",
            "Use doorways and passages as transition points",
            "Tell yourself a story as you move through",
          ],
        };
      case "spatial":
        return {
          icon: "🗺️",
          title: "Spatial Memory",
          description: "Use the physical layout and spatial relationships",
          tips: [
            "Notice the relative positions of items",
            "Use room layouts and architectural features",
            "Remember distances and directions",
            "Create a mental map of the entire palace",
          ],
        };
      case "cultural":
        return {
          icon: "🌍",
          title: "Cultural Context",
          description: "Use cultural stories and meanings to enhance memory",
          tips: [
            "Connect items to cultural significance",
            "Use historical context and stories",
            "Relate items to cultural practices",
            "Imagine yourself in the cultural setting",
          ],
        };
      default:
        return {
          icon: "🧠",
          title: "Memory Technique",
          description: "Study the palace layout carefully",
          tips: ["Observe each item's location", "Create mental associations"],
        };
    }
  };

  const guidance = getTechniqueGuidance(memoryTechnique);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: theme.colors.primary }}
        >
          🏗️ Study Your Memory Palace
        </h2>
        <p className="text-gray-600">
          {showItems
            ? `Memorize the ${
                theme.culture
              } items and their positions using the ${memoryTechnique.replace(
                "_",
                " "
              )} technique.`
            : `Study the ${theme.culture} palace layout first. Items are hidden until you're ready to start the timed memorization phase.`}
        </p>
      </div>

      {/* Technique Guidance */}
      <div
        className="p-6 rounded-lg border-l-4"
        style={{
          backgroundColor: theme.colors.background,
          borderLeftColor: theme.colors.primary,
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">{guidance.icon}</span>
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ color: theme.colors.primary }}
            >
              {guidance.title}
            </h3>
            <p className="text-gray-700 text-sm">{guidance.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">💡 Technique Tips:</h4>
          <ul className="space-y-1">
            {guidance.tips.map((tip, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 flex items-start gap-2"
              >
                <span className="text-blue-500 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Palace Visualization */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border-2 border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-amber-800 mb-4 text-center">
          🏛️ Your Memory Palace Layout
        </h3>

        <div className="relative w-full h-96 bg-white rounded-lg shadow-inner overflow-hidden">
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
              className="absolute border-2 border-gray-300 bg-white/80 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              style={{
                left: `${room.position.x}%`,
                top: `${room.position.y}%`,
                width: `${room.size.width}%`,
                height: `${room.size.height}%`,
                borderColor: room.color,
              }}
            >
              {/* Room label */}
              <div className="absolute -top-5 left-0 right-0 text-center z-10">
                <span className="text-xs font-medium px-2 py-1 bg-white rounded shadow-sm border whitespace-nowrap">
                  {roomIndex + 1}. {room.name}
                </span>
              </div>

              {/* Room items */}
              {items
                .filter((item) => item.room === room.id)
                .map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${item.coordinates.x}%`,
                      top: `${item.coordinates.y}%`,
                    }}
                  >
                    {showItems ? (
                      <>
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white transition-transform group-hover:scale-110"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.emoji}
                        </div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center bg-white/90 rounded px-2 py-1 shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.name}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white bg-gray-300 text-gray-500">
                          ❓
                        </div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center bg-white/90 rounded px-2 py-1 shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Hidden
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          📝 Items to Remember ({items.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, index) => {
            const room = rooms.find((r) => r.id === item.room);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500">
                    #{index + 1}
                  </span>
                  {showItems ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.emoji}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-300 text-gray-500">
                      ❓
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {showItems ? (
                    <>
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {room?.name}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-gray-400 truncate">
                        Hidden Item
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {room?.name}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cultural Context */}
      {culturalStory && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            🌍 Cultural Context
          </h4>
          <p className="text-sm text-blue-700">{culturalStory}</p>
        </div>
      )}

      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={onStartMemorize}
          className="px-8 py-4 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <div className="flex items-center gap-2">
            <span>🧠</span>
            {showItems
              ? "Start Memorization Phase"
              : "Reveal Items & Start Memorizing"}
          </div>
        </button>
      </div>
    </div>
  );
}

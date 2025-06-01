"use client";

import React, { useState } from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { MemoryTechnique } from "../shared/types";
import { SteddieChat } from "../../SteddieChat";

interface MemoryPalaceSetupProps {
  theme: CulturalTheme;
  gameInfo: any;
  difficulty: number;
  baselineDifficulty: number;
  memoryTechnique: MemoryTechnique;
  onDifficultyChange: (difficulty: number) => void;
  onTechniqueChange: (technique: MemoryTechnique) => void;
  onStartGame: () => void;
  isLoading: boolean;
  perfectRounds: number;
  totalRounds: number;
}

export function MemoryPalaceSetup({
  theme,
  gameInfo,
  difficulty,
  baselineDifficulty,
  memoryTechnique,
  onDifficultyChange,
  onTechniqueChange,
  onStartGame,
  isLoading,
  perfectRounds,
  totalRounds,
}: MemoryPalaceSetupProps) {
  const [showSteddieChat, setShowSteddieChat] = useState(false);
  const [steddieContext, setSteddieContext] = useState<string>("");
  const difficultyLevels = [
    {
      value: 4,
      label: "Novice",
      description: "4 items - Perfect for beginners",
      icon: "🌱",
    },
    {
      value: 5,
      label: "Apprentice",
      description: "5 items - Building confidence",
      icon: "🌿",
    },
    {
      value: 6,
      label: "Adept",
      description: "6 items - Developing mastery",
      icon: "🌳",
    },
    {
      value: 8,
      label: "Expert",
      description: "8 items - Advanced challenge",
      icon: "🏛️",
    },
    {
      value: 10,
      label: "Master",
      description: "10 items - Elite level",
      icon: "👑",
    },
  ];

  const techniques = [
    {
      value: "observation" as const,
      label: "Observation",
      description: "Careful visual study and attention to detail",
      icon: "👁️",
      tip: "Focus intently on each element and its visual characteristics",
    },
    {
      value: "loci" as const,
      label: "Method of Loci",
      description: "Place items in specific locations within your palace",
      icon: "🏛️",
      tip: "Visualize walking through familiar rooms and placing each item in a memorable spot",
    },
    {
      value: "linking" as const,
      label: "Linking Method",
      description: "Connect items in a chain of memorable associations",
      icon: "🔗",
      tip: "Create bizarre, impossible connections between consecutive items",
    },
    {
      value: "story" as const,
      label: "Story Method",
      description: "Weave all items into one memorable narrative",
      icon: "📖",
      tip: "Create an absurd, vivid story that includes all items in sequence",
    },
    {
      value: "cultural" as const,
      label: "Cultural Context",
      description: "Use cultural stories and meanings to enhance memory",
      icon: "🌍",
      tip: "Connect each item to the cultural theme and historical context",
    },
    {
      value: "journey" as const,
      label: "Memory Journey",
      description: "Create a path through your palace connecting all items",
      icon: "🚶",
      tip: "Follow a logical route through your palace, linking items along the way",
    },
    {
      value: "spatial" as const,
      label: "Spatial Memory",
      description: "Use the physical layout and spatial relationships",
      icon: "🗺️",
      tip: "Focus on where items are positioned relative to each other and room features",
    },
  ];

  const selectedDifficulty =
    difficultyLevels.find((d) => d.value === difficulty) || difficultyLevels[1];
  const selectedTechnique =
    techniques.find((t) => t.value === memoryTechnique) || techniques[0];

  // Handle opening Steddie with specific technique context
  const openSteddieForTechnique = (technique: (typeof techniques)[0]) => {
    const contextMessage = `I'd like to learn more about the ${technique.label} technique for memory palaces. Can you teach me how to use this method effectively?`;
    setSteddieContext(contextMessage);
    setShowSteddieChat(true);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Progress Stats */}
      {totalRounds > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {perfectRounds}
              </div>
              <div className="text-xs text-gray-600">Perfect Rounds</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {totalRounds}
              </div>
              <div className="text-xs text-gray-600">Total Rounds</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {totalRounds > 0
                  ? Math.round((perfectRounds / totalRounds) * 100)
                  : 0}
                %
              </div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Selection */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
          🎯 Choose Your Challenge Level
        </h3>
        <div className="mobile-grid">
          {difficultyLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => onDifficultyChange(level.value)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                difficulty === level.value
                  ? `border-2 shadow-lg`
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
              style={{
                borderColor:
                  difficulty === level.value ? theme.colors.primary : undefined,
                backgroundColor:
                  difficulty === level.value
                    ? theme.colors.background
                    : undefined,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800">
                    {level.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {level.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Memory Technique Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 text-center">
          🧠 Select Your Memory Technique
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {techniques.map((technique) => (
            <div key={technique.value} className="space-y-2">
              <button
                onClick={() => onTechniqueChange(technique.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  memoryTechnique === technique.value
                    ? `border-2 shadow-lg`
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                style={{
                  borderColor:
                    memoryTechnique === technique.value
                      ? theme.colors.primary
                      : undefined,
                  backgroundColor:
                    memoryTechnique === technique.value
                      ? theme.colors.background
                      : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{technique.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      {technique.label}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {technique.description}
                    </div>
                    <div className="text-xs text-gray-500 italic">
                      💡 {technique.tip}
                    </div>
                  </div>
                </div>
              </button>

              {/* Learn with Steddie Button - Outside the technique button */}
              <button
                onClick={() => openSteddieForTechnique(technique)}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors duration-200"
              >
                <span>🐢</span>
                Learn with Steddie
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Configuration Summary */}
      <div
        className="p-6 rounded-lg border-l-4"
        style={{
          backgroundColor: theme.colors.background,
          borderLeftColor: theme.colors.primary,
        }}
      >
        <h4
          className="font-semibold mb-3"
          style={{ color: theme.colors.primary }}
        >
          🎮 Your Configuration
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-medium">Difficulty:</span>{" "}
            {selectedDifficulty.icon} {selectedDifficulty.label}
            <div className="text-gray-600 text-xs mt-1">
              {selectedDifficulty.description}
            </div>
          </div>
          <div>
            <span className="font-medium">Technique:</span>{" "}
            {selectedTechnique.icon} {selectedTechnique.label}
            <div className="text-gray-600 text-xs mt-1">
              {selectedTechnique.description}
            </div>
          </div>
        </div>
      </div>

      {/* Game Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">📋 How to Play</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>
              Study the palace layout and learn where each item is placed
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>
              Memorize the items using your chosen technique during the timed
              phase
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>
              Recall the items in the correct order by clicking on them
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Score points based on accuracy and speed</span>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={onStartGame}
          disabled={isLoading}
          className="px-8 py-4 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Building Palace...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>🏛️</span>
              Build Your Memory Palace
            </div>
          )}
        </button>
      </div>

      {/* Steddie Chat Modal */}
      {showSteddieChat && (
        <SteddieChat
          isOpen={showSteddieChat}
          onClose={() => setShowSteddieChat(false)}
          initialMessage={steddieContext}
        />
      )}
    </div>
  );
}

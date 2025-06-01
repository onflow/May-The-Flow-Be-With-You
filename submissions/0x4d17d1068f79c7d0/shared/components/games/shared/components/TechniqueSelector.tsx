"use client";

import React from "react";
import { CulturalTheme } from "../../../../config/culturalThemes";
import { MEMORY_TECHNIQUES, MemoryTechnique } from "../types";

interface TechniqueSelectorProps {
  theme: CulturalTheme;
  memoryTechnique: MemoryTechnique;
  onTechniqueChange: (technique: MemoryTechnique) => void;
  availableTechniques?: (keyof typeof MEMORY_TECHNIQUES)[];
  title?: string;
}

export function TechniqueSelector({
  theme,
  memoryTechnique,
  onTechniqueChange,
  availableTechniques,
  title = "🧠 Select Your Memory Technique",
}: TechniqueSelectorProps) {
  const techniques = availableTechniques
    ? availableTechniques.map((key) => ({ key, ...MEMORY_TECHNIQUES[key] }))
    : Object.entries(MEMORY_TECHNIQUES).map(([key, value]) => ({
        key: key as MemoryTechnique,
        ...value,
      }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
        {title}
      </h3>
      <div className="mobile-grid">
        {techniques.map((technique) => (
          <button
            key={technique.key}
            onClick={() => onTechniqueChange(technique.key)}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left touch-target ${
              memoryTechnique === technique.key
                ? `border-2 shadow-lg`
                : "border-gray-200 hover:border-gray-300 hover:shadow-md active:scale-95"
            }`}
            style={{
              borderColor:
                memoryTechnique === technique.key
                  ? theme.colors.primary
                  : undefined,
              backgroundColor:
                memoryTechnique === technique.key
                  ? theme.colors.background
                  : undefined,
              minHeight: "100px", // Ensure adequate touch target
            }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">{technique.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                  {technique.label}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mb-2">
                  {technique.description}
                </div>
                <div className="text-xs text-gray-500 italic hidden sm:block">
                  💡 {technique.tip}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

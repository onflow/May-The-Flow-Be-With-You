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
    ? availableTechniques.map(key => ({ key, ...MEMORY_TECHNIQUES[key] }))
    : Object.entries(MEMORY_TECHNIQUES).map(([key, value]) => ({ key: key as MemoryTechnique, ...value }));

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {techniques.map((technique) => (
          <button
            key={technique.key}
            onClick={() => onTechniqueChange(technique.key)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              memoryTechnique === technique.key
                ? `border-2 shadow-lg`
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
            style={{
              borderColor: memoryTechnique === technique.key ? theme.colors.primary : undefined,
              backgroundColor: memoryTechnique === technique.key ? theme.colors.background : undefined,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{technique.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 mb-1">{technique.label}</div>
                <div className="text-sm text-gray-600 mb-2">{technique.description}</div>
                <div className="text-xs text-gray-500 italic">💡 {technique.tip}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

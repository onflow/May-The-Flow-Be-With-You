"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";

interface Card {
  id: string;
  symbol: string;
  name: string;
  color: string;
  culturalContext?: string;
}

interface ChaosCardsRecallProps {
  theme: CulturalTheme;
  cards: Card[];
  currentGuess: number;
}

export function ChaosCardsRecall({
  theme,
  cards,
  currentGuess
}: ChaosCardsRecallProps) {
  return (
    <div className="text-center">
      <p
        className="text-lg font-medium mb-4"
        style={{ color: theme.colors.text }}
      >
        Select the symbols in the correct order
      </p>
      
      <p className="text-sm" style={{ color: theme.colors.text + "80" }}>
        Next: {cards[currentGuess]?.name} (
        {currentGuess + 1}/{cards.length})
      </p>
      
      {/* Progress indicator */}
      <div className="mt-2 flex justify-center gap-1">
        {cards.map((_, index) => (
          <div
            key={index}
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: index < currentGuess 
                ? theme.colors.primary 
                : index === currentGuess
                ? theme.colors.secondary
                : theme.colors.primary + "30"
            }}
          />
        ))}
      </div>
    </div>
  );
}

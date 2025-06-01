"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { Card } from "../shared";

interface ChaosCardsLearnProps {
  theme: CulturalTheme;
  cards: Card[];
  showCards: boolean;
  onStartMemorizing: () => void;
}

export function ChaosCardsLearn({
  theme,
  cards,
  showCards,
  onStartMemorizing,
}: ChaosCardsLearnProps) {
  // If no cards are generated yet, show loading or redirect to setup
  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 space-y-6 text-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Preparing Your Game</h2>
          <p className="text-gray-600 mb-6">Setting up your cards...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Study the Cards</h2>
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            🎯 Level {cards.length} - {cards.length} Cards
          </span>
        </div>
        <p className="text-gray-600 mb-6">
          Take your time to study the sequence. When ready, click "Start
          Memorizing" to begin the timed phase.
        </p>
      </div>

      {/* Cards display for learning - obfuscated until user starts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="relative p-6 rounded-xl border-2 transition-all duration-300"
            style={{
              backgroundColor: showCards ? card.color + "20" : "#f3f4f6",
              borderColor: showCards ? card.color : "#d1d5db",
            }}
          >
            {showCards ? (
              <>
                <div
                  className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: card.color }}
                >
                  {index + 1}
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">{card.emoji}</div>
                  <div className="text-sm font-medium">{card.name}</div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gray-400">
                  {index + 1}
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2 text-gray-400">❓</div>
                  <div className="text-sm font-medium text-gray-400">
                    Hidden
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onStartMemorizing}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Start Memorizing
        </button>
      </div>
    </div>
  );
}

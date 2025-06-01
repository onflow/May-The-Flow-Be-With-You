"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { Card } from "../shared";

interface ChaosCardsRecallProps {
  theme: CulturalTheme;
  cards: Card[];
  shuffledCards: Card[];
  userSequence: string[];
  onCardSelect: (cardId: string) => void;
  timeLeft: number;
  formatTime?: () => string;
}

export function ChaosCardsRecall({
  theme,
  cards,
  shuffledCards,
  userSequence,
  onCardSelect,
  timeLeft,
  formatTime,
}: ChaosCardsRecallProps) {
  return (
    <div className="p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Recall the Sequence</h2>
        <div className="text-3xl font-bold text-green-600 mb-4">
          {formatTime ? formatTime() : `${timeLeft}s`}
        </div>
        <p>Click the cards in the correct order</p>
      </div>

      {/* Shuffled cards for selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shuffledCards.map((card) => (
          <button
            key={card.id}
            onClick={() => onCardSelect(card.id)}
            disabled={userSequence.includes(card.id)}
            className="p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.colors.background,
              borderColor: card.color,
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{card.emoji}</div>
              <div className="text-sm font-medium">{card.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

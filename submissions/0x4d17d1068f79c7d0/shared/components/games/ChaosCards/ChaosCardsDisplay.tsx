"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";
import { Card } from "../shared";

interface ChaosCardsDisplayProps {
  theme: CulturalTheme;
  cards: Card[];
  phase: "setup" | "memorize" | "recall" | "results" | "loading" | "error";
  userSequence: string[];
  onCardSelect?: (cardId: string) => void;
}

export function ChaosCardsDisplay({
  theme,
  cards,
  phase,
  userSequence,
  onCardSelect,
}: ChaosCardsDisplayProps) {
  const handleCardClick = (cardId: string) => {
    if (phase === "recall" && !userSequence.includes(cardId) && onCardSelect) {
      onCardSelect(cardId);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
            phase === "recall" ? "hover:scale-105 hover:shadow-lg" : ""
          } ${userSequence.includes(card.id) ? "opacity-50" : ""}`}
          style={{
            backgroundColor:
              phase === "memorize" || phase === "setup"
                ? card.color + "20"
                : theme.colors.background,
            borderColor: card.color,
            opacity:
              phase === "memorize" || phase === "setup"
                ? 1
                : userSequence.includes(card.id)
                ? 0.5
                : 1,
          }}
          onClick={() => handleCardClick(card.id)}
        >
          {/* Sequence number for memorization */}
          {(phase === "memorize" || phase === "setup") && (
            <div
              className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: card.color }}
            >
              {index + 1}
            </div>
          )}

          {/* Card content */}
          <div className="text-center">
            <div className="text-4xl mb-2">{card.emoji}</div>
            <div className="font-semibold text-sm mb-1">{card.name}</div>
            {card.culturalContext &&
              (phase === "setup" || phase === "results") && (
                <div className="text-xs opacity-70 mt-2">
                  {card.culturalContext}
                </div>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}

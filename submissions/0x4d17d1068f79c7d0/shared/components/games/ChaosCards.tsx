"use client";

import React, { useState, useEffect } from "react";
import { useCardGame } from "../../hooks/useBaseGame";
import { useTimer } from "../../hooks/useTimer";
import { GameHeader } from "../ui/GameHeader";
import { GameResults } from "../ui/GameResults";
import {
  Card,
  BaseGameState,
  DifficultyLevel,
  GameResult,
} from "../../types/game";
import {
  getDifficultyConfig,
  createSeededRandom,
  calculateAccuracy,
} from "../../utils/gameUtils";

// Extended game state for Chaos Cards
interface ChaosCardsState extends BaseGameState {
  cards: Card[];
  sequence: Card[];
  userSequence: Card[];
  currentStep: number;
  seed: number;
}

// Generate card deck using seeded random
function generateDeck(seed: number, count: number = 8): Card[] {
  const suits = ["hearts", "diamonds", "clubs", "spades"] as const;
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const suitEmojis = {
    hearts: "♥️",
    diamonds: "♦️",
    clubs: "♣️",
    spades: "♠️",
  };

  const random = createSeededRandom(seed);

  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const suit = suits[Math.floor(random.next() * suits.length)];
    const rank = ranks[Math.floor(random.next() * ranks.length)];

    cards.push({
      id: `card-${i}`,
      suit,
      rank,
      color: suit === "hearts" || suit === "diamonds" ? "red" : "black",
      emoji: suitEmojis[suit],
      isFlipped: false,
      isMatched: false,
      position: i,
    });
  }

  return cards;
}

// Card component
function CardComponent({
  card,
  onClick,
  isClickable = false,
  showFront = false,
}: {
  card: Card;
  onClick?: () => void;
  isClickable?: boolean;
  showFront?: boolean;
}) {
  return (
    <div
      className={`relative w-20 h-28 rounded-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isClickable ? "hover:shadow-lg" : ""
      } ${card.isMatched ? "opacity-50" : ""}`}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Card Back */}
      <div
        className={`absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center transition-transform duration-500 ${
          showFront || card.isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className="text-white text-2xl">🎴</div>
      </div>

      {/* Card Front */}
      <div
        className={`absolute inset-0 rounded-lg bg-white border-2 border-gray-300 flex flex-col items-center justify-center transition-transform duration-500 ${
          showFront || card.isFlipped ? "" : "rotate-y-180"
        }`}
        style={{ backfaceVisibility: "hidden" }}
      >
        <div
          className={`text-2xl ${
            card.color === "red" ? "text-red-500" : "text-black"
          }`}
        >
          {card.rank}
        </div>
        <div className="text-xl">{card.emoji}</div>
      </div>
    </div>
  );
}

// Main game component
export function ChaosCards() {
  const initialState: ChaosCardsState = {
    phase: "setup",
    timeLeft: 0,
    score: 0,
    maxPossibleScore: 0,
    difficulty: "medium",
    isLoading: false,
    cards: [],
    sequence: [],
    userSequence: [],
    currentStep: 0,
    seed: Math.floor(Math.random() * 10000),
  };

  const { gameState, updateGameState, saveResult, isLoading } =
    useCardGame(initialState);

  const studyTimer = useTimer(() => {
    // Move to chaos phase
    const config = getDifficultyConfig("chaos_cards", gameState.difficulty);
    updateGameState({ phase: "chaos" });
    chaosTimer.start(config.chaosTime || 2);
  });

  const chaosTimer = useTimer(() => {
    // Move to recall phase
    updateGameState({ phase: "recall" });
  });

  // Start new game
  const startGame = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    const config = getDifficultyConfig("chaos_cards", gameState.difficulty);
    const cards = generateDeck(newSeed, config.itemCount);

    // Create a sequence of cards to remember
    const sequenceLength = Math.min(
      config.itemCount,
      4 + Math.floor(config.itemCount / 3)
    );
    const sequence = cards.slice(0, sequenceLength);
    const maxScore = sequenceLength * 10;

    updateGameState({
      phase: "study",
      cards,
      sequence,
      userSequence: [],
      currentStep: 0,
      score: 0,
      maxPossibleScore: maxScore,
      seed: newSeed,
    });

    studyTimer.start(config.studyTime || 15);
  };

  // Handle card selection during recall
  const handleCardSelect = (selectedCard: Card) => {
    if (gameState.phase !== "recall") return;

    const newUserSequence = [...gameState.userSequence, selectedCard];
    const isCorrect =
      selectedCard.id === gameState.sequence[gameState.currentStep]?.id;
    const newScore = isCorrect ? gameState.score + 10 : gameState.score;

    if (gameState.currentStep >= gameState.sequence.length - 1) {
      // Game finished
      const accuracy = calculateAccuracy(
        newScore / 10,
        gameState.sequence.length
      );
      const result: GameResult = {
        score: newScore,
        accuracy,
        duration: 60, // Will be calculated properly in the hook
        perfect: accuracy === 100,
        newRecord: false, // Will be determined by the service
      };

      updateGameState({
        phase: "results",
        userSequence: newUserSequence,
        score: newScore,
      });

      saveResult(result);
    } else {
      updateGameState({
        userSequence: newUserSequence,
        currentStep: gameState.currentStep + 1,
        score: newScore,
      });
    }
  };

  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    updateGameState({ difficulty });
  };

  return (
    <div className="w-full h-full">
      <GameHeader
        phase={gameState.phase}
        score={gameState.score}
        timeLeft={studyTimer.timeLeft || chaosTimer.timeLeft}
        maxTime={
          gameState.phase === "study"
            ? getDifficultyConfig("chaos_cards", gameState.difficulty)
                .studyTime || 15
            : gameState.phase === "chaos"
            ? getDifficultyConfig("chaos_cards", gameState.difficulty)
                .chaosTime || 2
            : undefined
        }
        difficulty={gameState.difficulty}
        onDifficultyChange={handleDifficultyChange}
        onStart={startGame}
        isLoading={isLoading}
        gameTitle="🃏 Chaos Cards"
        showTimer={gameState.phase === "study" || gameState.phase === "chaos"}
        timerColor={gameState.phase === "study" ? "blue" : "purple"}
      />

      {/* Game Area */}
      <div className="space-y-6">
        {/* Study Phase */}
        {gameState.phase === "study" && (
          <div>
            <h3 className="text-lg font-semibold text-center mb-4">
              📚 Study This Sequence
            </h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.sequence.map((card: Card, index: number) => (
                <div key={card.id} className="relative">
                  <CardComponent card={card} showFront={true} />
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chaos Phase */}
        {gameState.phase === "chaos" && (
          <div className="text-center">
            <div className="text-6xl animate-spin">🌪️</div>
            <p className="text-xl font-bold text-purple-600 mt-4">
              Shuffling cards...
            </p>
          </div>
        )}

        {/* Recall Phase */}
        {gameState.phase === "recall" && (
          <div>
            <h3 className="text-lg font-semibold text-center mb-4">
              🎯 Select Cards in Order (Step {gameState.currentStep + 1}/
              {gameState.sequence.length})
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 justify-items-center">
              {gameState.cards.map((card: Card) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  onClick={() => handleCardSelect(card)}
                  isClickable={
                    !gameState.userSequence.some(
                      (selected: Card) => selected.id === card.id
                    )
                  }
                  showFront={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results Phase */}
        {gameState.phase === "results" && (
          <GameResults
            result={{
              score: gameState.score,
              accuracy: calculateAccuracy(
                gameState.score / 10,
                gameState.sequence.length
              ),
              duration: 60,
              perfect: gameState.score === gameState.maxPossibleScore,
              newRecord: false,
            }}
            gameType="chaos_cards"
            onPlayAgain={startGame}
            isLoading={isLoading}
            customMessage="Master the chaos to unlock the order within!"
          />
        )}

        {/* Instructions */}
        {gameState.phase === "setup" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              How to Play Chaos Cards:
            </h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Choose your difficulty level (Easy/Medium/Hard)</li>
              <li>2. Study the sequence of cards shown</li>
              <li>3. Survive the chaos phase as cards shuffle</li>
              <li>4. Recall the sequence by clicking cards in order</li>
              <li>5. Score points for each correct card!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

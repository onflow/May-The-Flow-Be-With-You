"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../providers/AuthProvider";
import { progressService } from "../../../services/progressService";
import { getThemeByCategory, getThemeItems } from "../../../config/culturalThemes";
import { GameScoreShare } from "../../SocialShare";

interface SpeedItem {
  id: string;
  symbol: string;
  name: string;
  category: "objects" | "places" | "concepts";
  culturalSignificance?: string;
}

interface GameState {
  phase: "setup" | "playing" | "results";
  timeLeft: number;
  score: number;
  currentItem: SpeedItem | null;
  itemsShown: SpeedItem[];
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  bestStreak: number;
}

export default function CulturalSpeedChallenge({ 
  culturalCategory = "randomness-revolution" 
}: { 
  culturalCategory?: string 
}) {
  const { user } = useAuth();
  const theme = getThemeByCategory(culturalCategory);
  const gameInfo = theme.gameAdaptations.speedChallenge;
  
  const [gameState, setGameState] = useState<GameState>({
    phase: "setup",
    timeLeft: 60,
    score: 0,
    currentItem: null,
    itemsShown: [],
    correctAnswers: 0,
    totalAnswers: 0,
    streak: 0,
    bestStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [allItems, setAllItems] = useState<SpeedItem[]>([]);

  // Generate cultural items pool
  useEffect(() => {
    const objects = getThemeItems(culturalCategory, 'objects');
    const places = getThemeItems(culturalCategory, 'places');
    const concepts = getThemeItems(culturalCategory, 'concepts');
    
    const emojiMap: Record<string, string> = {
      // Greek/Classical
      "Scroll": "📜", "Amphora": "🏺", "Agora": "🏛️", "Wisdom": "🦉",
      "Temple": "🏛️", "Academy": "📚", "Justice": "⚖️", "Truth": "💎",
      
      // African/Griot
      "Djembe": "🥁", "Village Square": "🏘️", "Baobab Tree": "🌳", "Ubuntu": "🤝",
      "Chief's Compound": "🏘️", "Sacred Grove": "🌲", "Community": "👥", "Harmony": "🎶",
      
      // Eastern/Asian
      "Bamboo": "🎋", "Temple Garden": "🏯", "Tea House": "🏠", "Mindfulness": "🧘",
      "Meditation Hall": "🏯", "Rock Garden": "🪨", "Balance": "☯️", "Peace": "☮️",
      
      // Indigenous/Aboriginal
      "Boomerang": "🪃", "Sacred Waterhole": "💧", "Ancestor Cave": "🕳️", "Dreamtime": "🌙",
      "Ceremony Ground": "🏞️", "Star Map Rock": "⭐", "Songline": "🛤️", "Country": "🏞️",
    };

    const getCulturalSignificance = (item: string, category: string): string => {
      const significance: Record<string, Record<string, string>> = {
        "randomness-revolution": {
          "Agora": "Central public space where democracy was born",
          "Academy": "Plato's school where philosophy flourished",
          "Wisdom": "Sophia - the highest form of knowledge"
        },
        "actually-fun-games": {
          "Village Square": "Heart of community life and storytelling",
          "Baobab Tree": "Meeting place and symbol of wisdom",
          "Ubuntu": "Philosophy of interconnectedness"
        },
        "ai-and-llms": {
          "Temple Garden": "Space for contemplation and inner peace",
          "Tea House": "Place of mindful conversation",
          "Mindfulness": "Present-moment awareness practice"
        },
        "generative-art-worlds": {
          "Sacred Waterhole": "Life-giving source in the landscape",
          "Ancestor Cave": "Repository of ancient stories",
          "Dreamtime": "Creation period of ancestral beings"
        }
      };
      
      return significance[category]?.[item] || `Important ${theme.culture} element`;
    };

    const items: SpeedItem[] = [
      ...objects.map(name => ({
        id: `obj-${name}`,
        symbol: emojiMap[name] || "⭐",
        name,
        category: "objects" as const,
        culturalSignificance: getCulturalSignificance(name, culturalCategory)
      })),
      ...places.map(name => ({
        id: `place-${name}`,
        symbol: emojiMap[name] || "🏛️",
        name,
        category: "places" as const,
        culturalSignificance: getCulturalSignificance(name, culturalCategory)
      })),
      ...concepts.map(name => ({
        id: `concept-${name}`,
        symbol: emojiMap[name] || "💭",
        name,
        category: "concepts" as const,
        culturalSignificance: getCulturalSignificance(name, culturalCategory)
      }))
    ];

    setAllItems(items);
  }, [culturalCategory, theme.culture]);

  // Get next random item
  const getNextItem = (): SpeedItem => {
    const availableItems = allItems.filter(item => 
      !gameState.itemsShown.some(shown => shown.id === item.id)
    );
    
    if (availableItems.length === 0) {
      // Reset if we've shown all items
      return allItems[Math.floor(Math.random() * allItems.length)];
    }
    
    return availableItems[Math.floor(Math.random() * availableItems.length)];
  };

  // Start new game
  const startGame = () => {
    const firstItem = getNextItem();
    setGameState({
      phase: "playing",
      timeLeft: 60,
      score: 0,
      currentItem: firstItem,
      itemsShown: [firstItem],
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
      bestStreak: 0,
    });
  };

  // Timer effect
  useEffect(() => {
    if (gameState.phase === "playing" && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.phase === "playing" && gameState.timeLeft === 0) {
      setGameState(prev => ({ ...prev, phase: "results" }));
      saveGameResult();
    }
  }, [gameState.phase, gameState.timeLeft]);

  // Handle category selection
  const handleCategorySelect = (selectedCategory: "objects" | "places" | "concepts") => {
    if (!gameState.currentItem) return;

    const isCorrect = gameState.currentItem.category === selectedCategory;
    const points = isCorrect ? (10 + gameState.streak) : 0;
    const newStreak = isCorrect ? gameState.streak + 1 : 0;
    const newBestStreak = Math.max(gameState.bestStreak, newStreak);

    // Get next item
    const nextItem = getNextItem();
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswers: prev.totalAnswers + 1,
      streak: newStreak,
      bestStreak: newBestStreak,
      currentItem: nextItem,
      itemsShown: [...prev.itemsShown, nextItem],
    }));
  };

  // Save game result
  const saveGameResult = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const accuracy = gameState.totalAnswers > 0 ? (gameState.correctAnswers / gameState.totalAnswers) * 100 : 0;

      await progressService.saveGameSession({
        user_id: user.id,
        game_type: `cultural_speed_challenge_${culturalCategory}`,
        score: gameState.score,
        max_possible_score: gameState.totalAnswers * 10,
        accuracy: accuracy,
        items_count: gameState.totalAnswers,
        duration_seconds: 60,
        difficulty_level: 1,
        session_data: {
          cultural_theme: culturalCategory,
          correct_answers: gameState.correctAnswers,
          total_answers: gameState.totalAnswers,
          best_streak: gameState.bestStreak,
          items_shown: gameState.itemsShown.length,
        },
      });

      await progressService.updateLeaderboards();
    } catch (error) {
      console.error("Error saving game result:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Game Header */}
      <div 
        className="mb-6 p-4 rounded-lg border-2"
        style={{
          background: `linear-gradient(to right, ${theme.colors.background}, ${theme.colors.background}DD)`,
          borderColor: theme.colors.primary + "40"
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="font-semibold">Score:</span> {gameState.score}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Streak:</span> {gameState.streak}
            </div>
            {gameState.phase === "playing" && (
              <div className="text-sm">
                <span className="font-semibold">Time:</span> {gameState.timeLeft}s
              </div>
            )}
            {gameState.totalAnswers > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Accuracy:</span> {Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)}%
              </div>
            )}
          </div>

          {gameState.phase === "setup" && (
            <button
              onClick={startGame}
              className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {theme.id === "griot" ? "🥁" : 
               theme.id === "sage" ? "🧘" : 
               theme.id === "dreamtime" ? "🎨" : "🏛️"} Start {gameInfo.name}
            </button>
          )}
        </div>

        {gameState.phase === "playing" && (
          <div className="text-center">
            <p className="text-lg font-medium mb-2" style={{ color: theme.colors.text }}>
              Categorize {theme.culture} elements as quickly as possible!
            </p>
            <div 
              className="w-full rounded-full h-2 mt-2"
              style={{ backgroundColor: theme.colors.primary + "30" }}
            >
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${(gameState.timeLeft / 60) * 100}%`,
                  backgroundColor: theme.colors.primary
                }}
              />
            </div>
          </div>
        )}

        {gameState.phase === "results" && (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {gameInfo.name} Complete! 🎉
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{gameState.score}</div>
                <div className="text-sm opacity-70">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{gameState.bestStreak}</div>
                <div className="text-sm opacity-70">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{gameState.correctAnswers}</div>
                <div className="text-sm opacity-70">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)}%</div>
                <div className="text-sm opacity-70">Accuracy</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: theme.colors.primary }}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "🔄 Play Again"}
              </button>

              {gameState.score >= 50 && (
                <GameScoreShare
                  gameType={`cultural_speed_challenge_${culturalCategory}`}
                  score={gameState.score}
                  accuracy={Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Item Display */}
      {gameState.phase === "playing" && gameState.currentItem && (
        <div className="mb-8">
          <div 
            className="text-center p-8 rounded-xl border-2"
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.primary
            }}
          >
            <div className="text-6xl mb-4">{gameState.currentItem.symbol}</div>
            <div className="text-2xl font-bold mb-2">{gameState.currentItem.name}</div>
            <div className="text-sm opacity-70 max-w-md mx-auto">
              {gameState.currentItem.culturalSignificance}
            </div>
          </div>
        </div>
      )}

      {/* Category Buttons */}
      {gameState.phase === "playing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: "objects", label: "Objects", icon: "🏺", desc: "Physical items and tools" },
            { key: "places", label: "Places", icon: "🏛️", desc: "Locations and spaces" },
            { key: "concepts", label: "Concepts", icon: "💭", desc: "Ideas and values" }
          ].map(category => (
            <button
              key={category.key}
              onClick={() => handleCategorySelect(category.key as any)}
              className="p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.secondary,
                color: theme.colors.text
              }}
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <div className="text-xl font-bold mb-1">{category.label}</div>
              <div className="text-sm opacity-70">{category.desc}</div>
            </button>
          ))}
        </div>
      )}

      {gameState.phase === "setup" && (
        <div 
          className="mt-6 p-4 rounded-lg border"
          style={{ 
            backgroundColor: theme.colors.background + "80",
            borderColor: theme.colors.primary + "40"
          }}
        >
          <h4 className="font-semibold mb-2" style={{ color: theme.colors.text }}>
            {gameInfo.description}
          </h4>
          <ol className="text-sm space-y-1" style={{ color: theme.colors.text + "80" }}>
            <li>1. You have 60 seconds to categorize as many {theme.culture} elements as possible</li>
            <li>2. Each item belongs to Objects, Places, or Concepts</li>
            <li>3. Correct answers earn points + streak bonus</li>
            <li>4. Build streaks for maximum points!</li>
          </ol>
        </div>
      )}
    </div>
  );
}

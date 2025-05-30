"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../providers/AuthProvider";
import { progressService } from "../../../services/progressService";
import { GameScoreShare } from "../../SocialShare";
import { Steddie } from "../../Steddie";
import { ChallengeFriends } from "../../ChallengeFriends";

// Game state types
interface GameItem {
  id: string;
  type: "number" | "word" | "color";
  value: string;
  color?: string;
  position: number;
}

interface GameState {
  phase: "setup" | "study" | "recall" | "results";
  timeLeft: number;
  score: number;
  items: GameItem[];
  userAnswers: string[];
  currentStep: number;
  difficulty: "easy" | "medium" | "hard";
  gameType: "numbers" | "words" | "colors";
  streak: number;
  perfectRound: boolean;
  steddieMessage: string;
  showSteddieMessage: boolean;
}

// Steddie messages for different situations
const steddieMessages = {
  start: [
    "Ready to test that memory of yours? Let's see what you've got! 🧠",
    "Time to show me those memory muscles! I believe in you! 💪",
    "Another challenger approaches! This should be interesting... 🤔",
  ],
  perfect: [
    "PERFECT! You absolutely crushed that! I'm genuinely impressed! 🌟",
    "Flawless execution! Your memory is sharper than my shell! ✨",
    "Outstanding! That was a masterclass in memory work! 🏆",
  ],
  good: [
    "Nice work! You're getting the hang of this! 👏",
    "Solid performance! Your memory is definitely improving! 📈",
    "Well done! I can see you're putting in the effort! 💯",
  ],
  okay: [
    "Not bad, but I know you can do better! Keep practicing! 🎯",
    "Room for improvement, but you're on the right track! 📚",
    "Getting there! Remember, even I had to practice my shell-sorting! 🐚",
  ],
  poor: [
    "Tough round! Don't worry, even the best memory athletes have off days! 💪",
    "Hey, we all start somewhere! The important thing is to keep trying! 🌱",
    "That was challenging! Let's try again - I believe you can improve! 🎲",
  ],
  streak: [
    "You're on fire! That's a great streak going! 🔥",
    "Impressive consistency! Your memory is really clicking! ⚡",
    "Look at you go! This streak is no accident! 🚀",
  ],
};

function getRandomMessage(category: keyof typeof steddieMessages): string {
  const messages = steddieMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate game items
function generateItems(
  type: string,
  difficulty: string,
  seed: number
): GameItem[] {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const counts = {
    easy: 5,
    medium: 8,
    hard: 12,
  };

  const count = counts[difficulty as keyof typeof counts];
  const items: GameItem[] = [];

  for (let i = 0; i < count; i++) {
    let value = "";
    let color = undefined;

    switch (type) {
      case "numbers":
        value = Math.floor(random(seed + i) * 100)
          .toString()
          .padStart(2, "0");
        break;
      case "words":
        const words = [
          "APPLE",
          "HOUSE",
          "OCEAN",
          "MUSIC",
          "LIGHT",
          "DREAM",
          "STORM",
          "PEACE",
          "MAGIC",
          "BRAVE",
          "SWIFT",
          "QUIET",
        ];
        value = words[Math.floor(random(seed + i) * words.length)];
        break;
      case "colors":
        const colors = [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#96CEB4",
          "#FFEAA7",
          "#DDA0DD",
          "#98D8C8",
          "#F7DC6F",
        ];
        color = colors[Math.floor(random(seed + i) * colors.length)];
        value = color;
        break;
    }

    items.push({
      id: `item-${i}`,
      type: type as any,
      value,
      color,
      position: i,
    });
  }

  return items;
}

// Item display component
function ItemDisplay({
  item,
  showAnswer = false,
}: {
  item: GameItem;
  showAnswer?: boolean;
}) {
  if (item.type === "color") {
    return (
      <div
        className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
        style={{ backgroundColor: item.color }}
        title={showAnswer ? item.value : undefined}
      />
    );
  }

  return (
    <div className="px-4 py-3 bg-white rounded-lg border-2 border-gray-300 shadow-sm font-mono text-lg font-bold text-gray-800">
      {item.value}
    </div>
  );
}

// Main game component
export default function MemorySpeedChallenge() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    phase: "setup",
    timeLeft: 10,
    score: 0,
    items: [],
    userAnswers: [],
    currentStep: 0,
    difficulty: "medium",
    gameType: "numbers",
    streak: 0,
    perfectRound: false,
    steddieMessage: getRandomMessage("start"),
    showSteddieMessage: false,
  });
  const [seed, setSeed] = useState(Math.floor(Math.random() * 10000));
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState("");

  // Difficulty settings
  const difficultySettings = {
    easy: { studyTime: 15, itemCount: 5 },
    medium: { studyTime: 10, itemCount: 8 },
    hard: { studyTime: 7, itemCount: 12 },
  };

  // Start new game
  const startGame = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    const settings = difficultySettings[gameState.difficulty];
    const items = generateItems(
      gameState.gameType,
      gameState.difficulty,
      newSeed
    );

    setGameState({
      ...gameState,
      phase: "study",
      timeLeft: settings.studyTime,
      items,
      userAnswers: [],
      currentStep: 0,
      score: 0,
      perfectRound: false,
      steddieMessage: getRandomMessage("start"),
      showSteddieMessage: true,
    });

    // Hide Steddie message after 3 seconds
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, showSteddieMessage: false }));
    }, 3000);
  };

  // Timer effect
  useEffect(() => {
    if (gameState.phase === "study" && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.phase === "study" && gameState.timeLeft === 0) {
      // Move to recall phase
      setGameState((prev) => ({ ...prev, phase: "recall" }));
    }
  }, [gameState.phase, gameState.timeLeft]);

  // Handle answer submission
  const submitAnswer = () => {
    if (!currentInput.trim()) return;

    const correctAnswer = gameState.items[gameState.currentStep]?.value;
    const isCorrect =
      currentInput.trim().toUpperCase() === correctAnswer.toUpperCase();
    const newScore = isCorrect ? gameState.score + 10 : gameState.score;
    const newAnswers = [...gameState.userAnswers, currentInput.trim()];

    if (gameState.currentStep >= gameState.items.length - 1) {
      // Game finished - calculate final stats and Steddie message
      const maxPossibleScore = gameState.items.length * 10;
      const accuracy = (newScore / maxPossibleScore) * 100;
      const isPerfect = accuracy === 100;
      const newStreak = isPerfect ? gameState.streak + 1 : 0;

      let steddieCategory: keyof typeof steddieMessages;
      if (accuracy === 100) {
        steddieCategory = newStreak >= 3 ? "streak" : "perfect";
      } else if (accuracy >= 80) {
        steddieCategory = "good";
      } else if (accuracy >= 60) {
        steddieCategory = "okay";
      } else {
        steddieCategory = "poor";
      }

      setGameState((prev) => ({
        ...prev,
        phase: "results",
        userAnswers: newAnswers,
        score: newScore,
        perfectRound: isPerfect,
        streak: newStreak,
        steddieMessage: getRandomMessage(steddieCategory),
        showSteddieMessage: true,
      }));
      saveGameResult(newScore);
    } else {
      setGameState((prev) => ({
        ...prev,
        userAnswers: newAnswers,
        currentStep: prev.currentStep + 1,
        score: newScore,
      }));
    }
    setCurrentInput("");
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitAnswer();
    }
  };

  // Save game result
  const saveGameResult = async (finalScore: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const maxPossibleScore = gameState.items.length * 10;
      const accuracy = (finalScore / maxPossibleScore) * 100;

      await progressService.saveGameSession({
        user_id: user.id,
        game_type: "memory_speed",
        score: finalScore,
        max_possible_score: maxPossibleScore,
        accuracy: accuracy,
        items_count: gameState.items.length,
        duration_seconds: difficultySettings[gameState.difficulty].studyTime,
        difficulty_level:
          gameState.difficulty === "easy"
            ? 1
            : gameState.difficulty === "medium"
            ? 2
            : 3,
        session_data: {
          seed,
          difficulty: gameState.difficulty,
          gameType: gameState.gameType,
          items: gameState.items,
          userAnswers: gameState.userAnswers,
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
      {/* Game UI */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="font-semibold">Phase:</span> {gameState.phase}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Score:</span> {gameState.score}
            </div>
            {gameState.phase === "study" && (
              <div className="text-sm">
                <span className="font-semibold">Time:</span>{" "}
                {gameState.timeLeft}s
              </div>
            )}
            {gameState.phase === "recall" && (
              <div className="text-sm">
                <span className="font-semibold">Progress:</span>{" "}
                {gameState.currentStep + 1}/{gameState.items.length}
              </div>
            )}
          </div>

          {gameState.phase === "setup" && (
            <div className="flex gap-2">
              <select
                value={gameState.gameType}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    gameType: e.target.value as any,
                  }))
                }
                className="px-3 py-1 border border-green-300 rounded text-sm"
              >
                <option value="numbers">Numbers</option>
                <option value="words">Words</option>
                <option value="colors">Colors</option>
              </select>
              <select
                value={gameState.difficulty}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    difficulty: e.target.value as any,
                  }))
                }
                className="px-3 py-1 border border-green-300 rounded text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                🚀 Start Challenge
              </button>
            </div>
          )}
        </div>

        {gameState.phase === "study" && (
          <div className="text-center">
            <p className="text-lg font-medium text-green-800">
              Memorize these {gameState.gameType} in order!
            </p>

            {/* Steddie Encouragement */}
            {gameState.showSteddieMessage && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg max-w-md mx-auto">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-8 h-8">
                    <Steddie />
                  </div>
                  <p className="text-green-800 font-medium text-sm">
                    {gameState.steddieMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    (gameState.timeLeft /
                      difficultySettings[gameState.difficulty].studyTime) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {gameState.phase === "recall" && (
          <div className="text-center">
            <p className="text-lg font-medium text-blue-800 mb-4">
              Enter the {gameState.gameType} in the correct order!
            </p>
          </div>
        )}

        {gameState.phase === "results" && (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Speed Challenge Complete! ⚡
            </h3>

            {/* Streak Display */}
            {gameState.streak > 0 && (
              <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg inline-block">
                <span className="text-yellow-800 font-bold">
                  🔥 {gameState.streak} Perfect Round
                  {gameState.streak > 1 ? "s" : ""} in a Row!
                </span>
              </div>
            )}

            <p className="text-lg mb-2">
              Final Score: {gameState.score} / {gameState.items.length * 10}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Accuracy:{" "}
              {Math.round(
                (gameState.score / (gameState.items.length * 10)) * 100
              )}
              %
            </p>

            {/* Steddie Feedback */}
            {gameState.showSteddieMessage && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Steddie />
                  </div>
                  <div className="text-left">
                    <p className="text-blue-800 font-medium text-sm">
                      {gameState.steddieMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  "🔄 Play Again"
                )}
              </button>

              {gameState.score >= 50 && (
                <GameScoreShare
                  gameType="memory_speed"
                  score={gameState.score}
                  accuracy={Math.round(
                    (gameState.score / (gameState.items.length * 10)) * 100
                  )}
                />
              )}

              {gameState.score >= 80 && (
                <ChallengeFriends
                  gameType="memory_speed"
                  score={gameState.score}
                  accuracy={Math.round(
                    (gameState.score / (gameState.items.length * 10)) * 100
                  )}
                  difficulty={gameState.difficulty}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items Display */}
      {gameState.phase === "study" && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-center">
            {gameState.items.map((item, index) => (
              <div key={item.id} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{index + 1}</div>
                <ItemDisplay item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recall Input */}
      {gameState.phase === "recall" && (
        <div className="mb-6">
          <div className="max-w-md mx-auto">
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Item {gameState.currentStep + 1} of {gameState.items.length}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((gameState.currentStep + 1) / gameState.items.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  gameState.gameType === "colors"
                    ? "Enter color hex code (e.g., #FF6B6B)"
                    : `Enter ${gameState.gameType.slice(0, -1)}`
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={submitAnswer}
                disabled={!currentInput.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Review */}
      {gameState.phase === "results" && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 text-center">
            Review Your Answers
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {gameState.items.map((item, index) => {
              const userAnswer = gameState.userAnswers[index] || "";
              const isCorrect =
                userAnswer.toUpperCase() === item.value.toUpperCase();

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border-2 ${
                    isCorrect
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">
                        #{index + 1}
                      </span>
                      <ItemDisplay item={item} showAnswer />
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="font-medium">Your answer:</span>{" "}
                        <span
                          className={
                            isCorrect ? "text-green-600" : "text-red-600"
                          }
                        >
                          {userAnswer || "No answer"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="text-xs text-gray-500">
                          Correct: {item.value}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

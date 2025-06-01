"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../providers/AuthProvider";
import { progressService } from "../../../services/progressService";

import { SteddieWisdom } from "../../SteddieShellPalace";

// Story-based memory items that connect to classical techniques
interface MemoryLocation {
  id: string;
  name: string;
  description: string;
  historicalContext: string;
  visualCue: string;
  position: { x: number; y: number };
}

interface MemoryStory {
  id: string;
  title: string;
  items: string[];
  narrative: string;
  technique: "loci" | "linking" | "peg";
  difficulty: "beginner" | "intermediate" | "advanced";
  historicalExample: string;
}

const classicalStories: MemoryStory[] = [
  {
    id: "simonides_banquet",
    title: "Simonides' Banquet Hall (with Steddie)",
    items: ["Poet", "Nobleman", "Merchant", "Soldier", "Priest", "Scholar"],
    narrative:
      "In ancient Greece, a poet named Simonides attended a grand banquet. I, Steddie, was sunning myself on the marble steps outside when I saw him carefully observing where each guest was seated. When tragedy struck and the hall collapsed, Simonides emerged shell-shocked but brilliant. As he identified each victim by their remembered positions, I realized humans had discovered something profound about spatial memory. That day, the Method of Loci was born, and I became its first witness.",
    technique: "loci",
    difficulty: "beginner",
    historicalExample:
      "This is the actual origin story of the Method of Loci, as recorded by Cicero in 'De Oratore' (55 BCE). Steddie has been carrying this memory on his shell ever since.",
  },
  {
    id: "cicero_speech",
    title: "Cicero's Forum Walk (with Steddie)",
    items: [
      "Justice",
      "Courage",
      "Wisdom",
      "Temperance",
      "Honor",
      "Duty",
      "Truth",
      "Virtue",
    ],
    narrative:
      "The great Roman orator Cicero prepares for his most important speech. I, Steddie, slowly walked beside him through the Roman Forum as he placed each key argument at a specific location. 'Steddie,' he said, 'your steady pace reminds me to move deliberately through my memory palace.' At the Temple of Jupiter, he placed 'Justice.' By the Senate steps, 'Courage.' I watched him build rhetorical masterpieces, one careful step at a time.",
    technique: "loci",
    difficulty: "intermediate",
    historicalExample:
      "Cicero used this exact technique to memorize his speeches, as described in 'Rhetorica ad Herennium' (90 BCE). Steddie's patient pace became his model for memory palace navigation.",
  },
  {
    id: "aquinas_library",
    title: "Aquinas' Sacred Library (with Steddie)",
    items: [
      "Faith",
      "Reason",
      "Scripture",
      "Tradition",
      "Prayer",
      "Study",
      "Contemplation",
      "Action",
    ],
    narrative:
      "In the monastery library, Thomas Aquinas would feed me lettuce while organizing his theological concepts. 'Each segment of your shell holds wisdom,' he'd whisper, 'just like each location in my memory palace.' He created a sacred memory palace where Faith rested beside illuminated manuscripts, Reason stood with Aristotle's works, and Scripture glowed at the altar of knowledge. I became his model for how knowledge could be carried safely across time.",
    technique: "loci",
    difficulty: "advanced",
    historicalExample:
      "Medieval scholars like Aquinas used memory palaces to organize vast theological knowledge, as detailed in 'The Art of Memory' by Frances Yates. Steddie's shell inspired the hexagonal organization of medieval memory systems.",
  },
];

const locations: MemoryLocation[] = [
  {
    id: "entrance",
    name: "Grand Entrance",
    description: "Marble columns frame the doorway",
    historicalContext: "Where Simonides first entered the banquet hall",
    visualCue: "🏛️",
    position: { x: 10, y: 50 },
  },
  {
    id: "altar",
    name: "Sacred Altar",
    description: "Incense burns before golden statues",
    historicalContext: "Where guests made offerings to the gods",
    visualCue: "🔥",
    position: { x: 30, y: 30 },
  },
  {
    id: "throne",
    name: "Host's Throne",
    description: "Ornate chair overlooking the feast",
    historicalContext: "Where the wealthy host held court",
    visualCue: "👑",
    position: { x: 50, y: 20 },
  },
  {
    id: "fountain",
    name: "Central Fountain",
    description: "Water flows from marble dolphins",
    historicalContext: "The gathering place for conversation",
    visualCue: "⛲",
    position: { x: 50, y: 60 },
  },
  {
    id: "garden",
    name: "Hanging Garden",
    description: "Vines cascade from stone terraces",
    historicalContext: "Where philosophers debated under stars",
    visualCue: "🌿",
    position: { x: 70, y: 40 },
  },
  {
    id: "exit",
    name: "Escape Route",
    description: "The door through which Simonides fled",
    historicalContext: "The path to safety when disaster struck",
    visualCue: "🚪",
    position: { x: 90, y: 50 },
  },
];

interface GameState {
  phase: "story" | "learn" | "practice" | "test" | "results";
  currentStory: MemoryStory | null;
  currentLocation: number;
  placedItems: { [locationId: string]: string };
  userPath: string[];
  score: number;
  timeLeft: number;
  showHint: boolean;
}

export default function MethodOfLociTrainer() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    phase: "story",
    currentStory: null,
    currentLocation: 0,
    placedItems: {},
    userPath: [],
    score: 0,
    timeLeft: 60,
    showHint: false,
  });

  const [selectedStory, setSelectedStory] = useState<MemoryStory>(
    classicalStories[0]
  );

  const startTraining = (story: MemoryStory) => {
    setGameState({
      ...gameState,
      phase: "learn",
      currentStory: story,
      currentLocation: 0,
      placedItems: {},
      userPath: [],
      score: 0,
      timeLeft: 60,
    });
  };

  const placeItem = (locationId: string, item: string) => {
    setGameState((prev) => ({
      ...prev,
      placedItems: { ...prev.placedItems, [locationId]: item },
      currentLocation: prev.currentLocation + 1,
    }));
  };

  const startTest = () => {
    setGameState((prev) => ({ ...prev, phase: "test", timeLeft: 60 }));
  };

  // Timer effect
  useEffect(() => {
    if (gameState.phase === "test" && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.phase === "test" && gameState.timeLeft === 0) {
      setGameState((prev) => ({ ...prev, phase: "results" }));
    }
  }, [gameState.phase, gameState.timeLeft]);

  const recallItem = (item: string) => {
    if (!gameState.currentStory) return;

    const correctItem = gameState.currentStory.items[gameState.userPath.length];
    const isCorrect = item === correctItem;
    const newScore = isCorrect ? gameState.score + 10 : gameState.score;
    const newPath = [...gameState.userPath, item];

    if (newPath.length >= gameState.currentStory.items.length) {
      setGameState((prev) => ({
        ...prev,
        userPath: newPath,
        score: newScore,
        phase: "results",
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        userPath: newPath,
        score: newScore,
      }));
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Story Selection Phase */}
      {gameState.phase === "story" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-800 mb-2">
              🏛️ The Method of Loci
            </h2>
            <p className="text-amber-700 max-w-2xl mx-auto">
              Learn the ancient memory technique that transformed ordinary minds
              into legendary ones. Choose a classical story to begin your
              journey through time.
            </p>
          </div>

          <div className="grid gap-4">
            {classicalStories.map((story) => (
              <div
                key={story.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedStory.id === story.id
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-amber-300"
                }`}
                onClick={() => setSelectedStory(story)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-amber-800">
                    {story.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      story.difficulty === "beginner"
                        ? "bg-green-100 text-green-800"
                        : story.difficulty === "intermediate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {story.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{story.narrative}</p>
                <p className="text-xs text-amber-600 italic">
                  {story.historicalExample}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => startTraining(selectedStory)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              🎭 Begin Classical Training
            </button>
          </div>
        </div>
      )}

      {/* Learning Phase */}
      {gameState.phase === "learn" && gameState.currentStory && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-800 mb-2">
              📚 Learning: {gameState.currentStory.title}
            </h2>
            <p className="text-amber-700">
              Place each item in a memorable location. Create vivid, absurd
              connections.
            </p>
          </div>

          {/* Memory Palace Visualization */}
          <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg border-2 border-amber-300 overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-amber-200 bg-opacity-20"></div>

            {locations.map((location) => (
              <div
                key={location.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${location.position.x}%`,
                  top: `${location.position.y}%`,
                }}
                onClick={() => {
                  if (
                    gameState.currentLocation <
                    gameState.currentStory!.items.length
                  ) {
                    placeItem(
                      location.id,
                      gameState.currentStory!.items[gameState.currentLocation]
                    );
                  }
                }}
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {location.visualCue}
                </div>
                <div className="bg-white bg-opacity-90 rounded-lg p-2 shadow-lg min-w-[8rem] text-center">
                  <div className="font-semibold text-amber-800 text-sm">
                    {location.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {location.description}
                  </div>
                  {gameState.placedItems[location.id] && (
                    <div className="mt-1 px-2 py-1 bg-amber-100 rounded text-xs font-bold text-amber-800">
                      {gameState.placedItems[location.id]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current Item to Place */}
          {gameState.currentLocation < gameState.currentStory.items.length && (
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Place Item {gameState.currentLocation + 1}: "
                {gameState.currentStory.items[gameState.currentLocation]}"
              </h3>
              <p className="text-sm text-amber-700">
                Click on a location above to place this item. Imagine a vivid,
                memorable scene.
              </p>
            </div>
          )}

          {/* All Items Placed */}
          {gameState.currentLocation >= gameState.currentStory.items.length && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 Memory Palace Complete!
              </h3>
              <p className="text-sm text-green-700 mb-4">
                You've placed all items. Now walk through your palace mentally
                and test your memory.
              </p>
              <button
                onClick={startTest}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🧠 Test Your Memory
              </button>
            </div>
          )}

          {/* Steddie's Historical Wisdom */}
          <SteddieWisdom
            era={
              gameState.currentStory.title.includes("Simonides")
                ? "Ancient Greece"
                : gameState.currentStory.title.includes("Cicero")
                ? "Roman Empire"
                : "Medieval"
            }
          />

          {/* Historical Context */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">
                Historical Context
              </h4>
              <p className="text-sm text-blue-700">
                {gameState.currentStory.historicalExample}
              </p>
              <p className="text-xs text-blue-600 mt-2 italic">
                "This memory technique has been used for{" "}
                {gameState.currentStory.title.includes("Simonides")
                  ? "2,500"
                  : gameState.currentStory.title.includes("Cicero")
                  ? "2,000"
                  : "800"}{" "}
                years. Slow and steady builds the strongest memories."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Phase */}
      {gameState.phase === "test" && gameState.currentStory && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-blue-800 mb-2">
              🧠 Memory Test: Walk Your Palace
            </h2>
            <p className="text-blue-700">
              Recall the items in order by walking through your memory palace.
            </p>
            <div className="mt-2 text-sm text-gray-600">
              Time remaining: {gameState.timeLeft}s | Progress:{" "}
              {gameState.userPath.length}/{gameState.currentStory.items.length}
            </div>
          </div>

          {/* Available Items */}
          <div className="grid grid-cols-3 gap-3">
            {gameState.currentStory.items.map((item) => (
              <button
                key={item}
                onClick={() => recallItem(item)}
                disabled={gameState.userPath.includes(item)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  gameState.userPath.includes(item)
                    ? "bg-gray-100 border-gray-300 text-gray-500"
                    : "bg-white border-blue-300 hover:border-blue-500 text-blue-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Progress Visualization */}
          <div className="flex justify-center space-x-2">
            {gameState.currentStory.items.map((item, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index < gameState.userPath.length
                    ? gameState.userPath[index] === item
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Phase */}
      {gameState.phase === "results" && gameState.currentStory && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-amber-800">
            🏆 Classical Memory Training Complete!
          </h2>

          <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-3xl mb-2">
              {gameState.score >= gameState.currentStory.items.length * 8
                ? "🌟"
                : gameState.score >= gameState.currentStory.items.length * 6
                ? "⭐"
                : "📚"}
            </div>
            <div className="text-xl font-bold text-amber-800 mb-2">
              Score: {gameState.score} /{" "}
              {gameState.currentStory.items.length * 10}
            </div>
            <div className="text-sm text-amber-700">
              Accuracy:{" "}
              {Math.round(
                (gameState.score / (gameState.currentStory.items.length * 10)) *
                  100
              )}
              %
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-left">
              <h4 className="font-semibold text-blue-800 mb-1">
                Classical Wisdom
              </h4>
              <p className="text-sm text-blue-700">
                {gameState.score >= gameState.currentStory.items.length * 8
                  ? "Magnificent! You've mastered the technique that made Simonides legendary. The ancient masters would be proud!"
                  : gameState.score >= gameState.currentStory.items.length * 6
                  ? "Well done! You're walking in the footsteps of Cicero and Aquinas. Keep practicing this sacred art!"
                  : "A noble beginning! Even the greatest memory masters started with simple steps. The palace awaits your return!"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setGameState({ ...gameState, phase: "story" })}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              🔄 Try Another Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

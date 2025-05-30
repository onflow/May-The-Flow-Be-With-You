"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { progressService } from "../../services/progressService";
import { Steddie } from "../Steddie";

interface StoryChain {
  id: string;
  title: string;
  items: string[];
  masterStory: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  historicalContext: string;
  absurdityLevel: number;
}

const classicalChains: StoryChain[] = [
  {
    id: "foer_journey",
    title: "Josh Foer's Unforgettable Journey (with Steddie)",
    items: ["Teacup", "Monkey", "Car", "Fire", "Church", "Priest", "Spaghetti"],
    masterStory:
      "A TEACUP-wearing MONKEY drives a CAR that catches FIRE and crashes into a CHURCH where a burning PRIEST dives into a pool of SPAGHETTI while I, Steddie, slowly crawl away thinking 'Humans have the strangest ways of remembering things!'",
    difficulty: "beginner",
    historicalContext:
      "From 'Moonwalking with Einstein' - Josh Foer used this exact chain to demonstrate the linking method's power. Steddie witnessed this absurd breakthrough in modern memory training.",
    absurdityLevel: 9,
  },
  {
    id: "brown_mentalism",
    title: "Derren Brown's Mind Palace",
    items: [
      "Playing Card",
      "Elephant",
      "Bicycle",
      "Lightning",
      "Castle",
      "Dragon",
      "Ice Cream",
      "Telephone",
    ],
    masterStory:
      "A giant PLAYING CARD rides an ELEPHANT on a BICYCLE struck by LIGHTNING at a CASTLE where a DRAGON eats ICE CREAM while talking on a TELEPHONE.",
    difficulty: "intermediate",
    historicalContext:
      "Derren Brown popularized absurd linking in modern mentalism, proving that ridiculous = memorable.",
    absurdityLevel: 10,
  },
  {
    id: "ancient_rhetoric",
    title: "Classical Rhetorical Chain",
    items: [
      "Sword",
      "Eagle",
      "Mountain",
      "River",
      "Crown",
      "Scroll",
      "Thunder",
      "Rose",
      "Mirror",
    ],
    masterStory:
      "A golden SWORD carried by an EAGLE over a MOUNTAIN falls into a RIVER, creating a CROWN of water that writes on a SCROLL with THUNDER while a ROSE blooms in a MIRROR.",
    difficulty: "advanced",
    historicalContext:
      "Ancient Greek and Roman orators used elaborate story chains to memorize hours-long speeches.",
    absurdityLevel: 8,
  },
];

interface GameState {
  phase: "learn" | "create" | "practice" | "results";
  currentChain: StoryChain | null;
  userStory: string;
  currentItem: number;
  userItems: string[];
  score: number;
  timeLeft: number;
  storyQuality: number;
  absurdityScore: number;
}

const absurdityTips = [
  "Make it HUGE or tiny - extremes stick in memory! (Like a giant turtle or a microscopic elephant)",
  "Add impossible physics - things that defy reality are unforgettable! (I once saw a flying tortoise in Josh Foer's story)",
  "Use shocking combinations - the more ridiculous, the better! (Turtles eating lightning, priests dancing with spaghetti)",
  "Engage all senses - what does it smell, sound, feel like? (The crunch of my shell, the smell of ancient libraries)",
  "Add emotion - funny, scary, or surprising moments last forever! (Even I was shocked by that teacup-wearing monkey)",
  "Break the rules - let objects do things they never could! (I've seen cars swim and fish drive - memory has no limits)",
  "Think like a turtle - slow connections are stronger than fast ones! (Take time to build vivid, impossible scenes)",
  "Use my shell wisdom - each segment of a story should connect like the patterns on my back!",
];

export function LinkingMethodTrainer() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    phase: "learn",
    currentChain: classicalChains[0],
    userStory: "",
    currentItem: 0,
    userItems: [],
    score: 0,
    timeLeft: 120,
    storyQuality: 0,
    absurdityScore: 0,
  });

  const [selectedChain, setSelectedChain] = useState<StoryChain>(
    classicalChains[0]
  );

  const startTraining = (chain: StoryChain) => {
    setGameState({
      ...gameState,
      phase: "create",
      currentChain: chain,
      currentItem: 0,
      userStory: "",
      userItems: [],
      score: 0,
      timeLeft: 120,
    });
  };

  const analyzeStoryQuality = (
    story: string,
    items: string[]
  ): { quality: number; absurdity: number } => {
    const words = story.toLowerCase().split(/\s+/);

    // Check if all items are included
    const itemsIncluded = items.filter((item) =>
      story.toLowerCase().includes(item.toLowerCase())
    ).length;

    // Absurdity indicators
    const absurdityWords = [
      "giant",
      "tiny",
      "flying",
      "exploding",
      "dancing",
      "singing",
      "glowing",
      "invisible",
      "magical",
      "burning",
      "frozen",
      "melting",
      "screaming",
      "laughing",
      "crying",
      "impossible",
      "ridiculous",
      "bizarre",
      "weird",
      "strange",
      "crazy",
    ];

    const absurdityCount = absurdityWords.filter((word) =>
      words.some((w) => w.includes(word))
    ).length;

    // Sensory words
    const sensoryWords = [
      "bright",
      "loud",
      "smelly",
      "rough",
      "smooth",
      "hot",
      "cold",
      "sweet",
      "sour",
      "colorful",
      "shiny",
      "dark",
      "soft",
      "hard",
      "wet",
      "dry",
    ];

    const sensoryCount = sensoryWords.filter((word) =>
      words.some((w) => w.includes(word))
    ).length;

    // Action words
    const actionWords = [
      "jumps",
      "runs",
      "flies",
      "crashes",
      "explodes",
      "transforms",
      "appears",
      "disappears",
      "grows",
      "shrinks",
      "spins",
      "bounces",
      "melts",
      "freezes",
    ];

    const actionCount = actionWords.filter((word) =>
      words.some((w) => w.includes(word))
    ).length;

    const quality = Math.min(
      100,
      (itemsIncluded / items.length) * 60 + sensoryCount * 5 + actionCount * 5
    );

    const absurdity = Math.min(
      100,
      absurdityCount * 15 + actionCount * 10 + sensoryCount * 5
    );

    return { quality, absurdity };
  };

  const submitStory = () => {
    if (!gameState.currentChain) return;

    const analysis = analyzeStoryQuality(
      gameState.userStory,
      gameState.currentChain.items
    );
    const finalScore = Math.round((analysis.quality + analysis.absurdity) / 2);

    setGameState((prev) => ({
      ...prev,
      phase: "practice",
      score: finalScore,
      storyQuality: analysis.quality,
      absurdityScore: analysis.absurdity,
      timeLeft: 60,
    }));
  };

  const recallItem = (item: string) => {
    if (!gameState.currentChain) return;

    const correctItem =
      gameState.currentChain.items[gameState.userItems.length];
    const isCorrect = item.toLowerCase() === correctItem.toLowerCase();
    const newItems = [...gameState.userItems, item];

    if (newItems.length >= gameState.currentChain.items.length) {
      const correctCount = newItems.filter(
        (item, index) =>
          item.toLowerCase() ===
          gameState.currentChain!.items[index].toLowerCase()
      ).length;

      const memoryScore =
        (correctCount / gameState.currentChain.items.length) * 100;
      const finalScore = Math.round((gameState.score + memoryScore) / 2);

      setGameState((prev) => ({
        ...prev,
        phase: "results",
        userItems: newItems,
        score: finalScore,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        userItems: newItems,
      }));
    }
  };

  // Timer effect
  useEffect(() => {
    if (
      (gameState.phase === "create" || gameState.phase === "practice") &&
      gameState.timeLeft > 0
    ) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0 && gameState.phase === "practice") {
      setGameState((prev) => ({ ...prev, phase: "results" }));
    }
  }, [gameState.phase, gameState.timeLeft]);

  return (
    <div className="w-full space-y-6">
      {/* Learning Phase */}
      {gameState.phase === "learn" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-800 mb-2">
              🔗 The Linking Method
            </h2>
            <p className="text-purple-700 max-w-2xl mx-auto">
              "When logic fails, absurdity triumphs." Learn the ancient art of
              creating unforgettable story chains that transform boring lists
              into vivid adventures.
            </p>
          </div>

          <div className="grid gap-4">
            {classicalChains.map((chain) => (
              <div
                key={chain.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedChain.id === chain.id
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
                onClick={() => setSelectedChain(chain)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-purple-800">
                    {chain.title}
                  </h3>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        chain.difficulty === "beginner"
                          ? "bg-green-100 text-green-800"
                          : chain.difficulty === "intermediate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {chain.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                      Absurdity: {chain.absurdityLevel}/10
                    </span>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Items to memorize:
                  </div>
                  <div className="text-sm text-gray-600">
                    {chain.items.join(" → ")}
                  </div>
                </div>

                <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 mb-1">
                    Master's Story:
                  </div>
                  <div className="text-sm text-purple-600 italic">
                    "{chain.masterStory}"
                  </div>
                </div>

                <p className="text-xs text-purple-600 italic">
                  {chain.historicalContext}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => startTraining(selectedChain)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              🎭 Create Your Story Chain
            </button>
          </div>
        </div>
      )}

      {/* Story Creation Phase */}
      {gameState.phase === "create" && gameState.currentChain && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-purple-800 mb-2">
              ✍️ Create Your Absurd Story
            </h2>
            <p className="text-purple-700">
              Link these items with the most ridiculous, impossible story you
              can imagine!
            </p>
            <div className="mt-2 text-sm text-gray-600">
              Time remaining: {gameState.timeLeft}s
            </div>
          </div>

          {/* Items to Link */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">
              Items to Link:
            </h3>
            <div className="flex flex-wrap gap-2">
              {gameState.currentChain.items.map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium"
                >
                  {index + 1}. {item}
                </span>
              ))}
            </div>
          </div>

          {/* Absurdity Tips */}
          <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
            <h3 className="font-semibold text-pink-800 mb-2">
              💡 Absurdity Tips:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-pink-700">
              {absurdityTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-pink-500">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Story Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-purple-700">
              Your Absurd Story Chain:
            </label>
            <textarea
              value={gameState.userStory}
              onChange={(e) =>
                setGameState((prev) => ({ ...prev, userStory: e.target.value }))
              }
              placeholder="Write your ridiculous story here... The more absurd, the more memorable!"
              className="w-full h-32 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {gameState.userStory.length}/500 characters
            </div>
          </div>

          {/* Master's Example */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Steddie />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">
                  Master's Example:
                </h4>
                <p className="text-sm text-blue-700 italic">
                  "{gameState.currentChain.masterStory}"
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Notice how each item flows naturally into the next through
                  impossible, memorable connections!
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={submitStory}
              disabled={gameState.userStory.length < 20}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🧠 Test Your Memory
            </button>
          </div>
        </div>
      )}

      {/* Practice Phase */}
      {gameState.phase === "practice" && gameState.currentChain && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-blue-800 mb-2">
              🧠 Memory Test: Follow Your Story
            </h2>
            <p className="text-blue-700">
              Now recall the items in order by following your absurd story
              chain!
            </p>
            <div className="mt-2 text-sm text-gray-600">
              Time remaining: {gameState.timeLeft}s | Progress:{" "}
              {gameState.userItems.length}/{gameState.currentChain.items.length}
            </div>
          </div>

          {/* Story Quality Feedback */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-800">
                Story Quality
              </div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(gameState.storyQuality)}%
              </div>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
              <div className="text-sm font-medium text-pink-800">
                Absurdity Score
              </div>
              <div className="text-2xl font-bold text-pink-600">
                {Math.round(gameState.absurdityScore)}%
              </div>
            </div>
          </div>

          {/* Your Story Reminder */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">Your Story:</h3>
            <p className="text-sm text-purple-700 italic">
              "{gameState.userStory}"
            </p>
          </div>

          {/* Item Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gameState.currentChain.items.map((item) => (
              <button
                key={item}
                onClick={() => recallItem(item)}
                disabled={gameState.userItems.includes(item)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  gameState.userItems.includes(item)
                    ? "bg-gray-100 border-gray-300 text-gray-500"
                    : "bg-white border-purple-300 hover:border-purple-500 text-purple-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Progress Visualization */}
          <div className="flex justify-center space-x-2">
            {gameState.currentChain.items.map((item, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index < gameState.userItems.length
                    ? gameState.userItems[index].toLowerCase() ===
                      item.toLowerCase()
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
      {gameState.phase === "results" && gameState.currentChain && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-purple-800">
            🎭 Story Chain Complete!
          </h2>

          <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-3xl mb-2">
              {gameState.score >= 80
                ? "🌟"
                : gameState.score >= 60
                ? "⭐"
                : "📚"}
            </div>
            <div className="text-xl font-bold text-purple-800 mb-2">
              Final Score: {gameState.score}%
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <div className="font-medium text-purple-700">Story Quality</div>
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(gameState.storyQuality)}%
                </div>
              </div>
              <div>
                <div className="font-medium text-purple-700">
                  Absurdity Score
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(gameState.absurdityScore)}%
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Steddie />
              <div className="text-left">
                <h4 className="font-semibold text-blue-800 mb-1">
                  Steddie's Linking Wisdom
                </h4>
                <p className="text-sm text-blue-700">
                  {gameState.score >= 80
                    ? "Extraordinary! Your absurd story rivals the masters. Josh Foer would be impressed by your linking prowess!"
                    : gameState.score >= 60
                    ? "Well done! You're mastering the art of memorable absurdity. Keep practicing those impossible connections!"
                    : "A solid start! Remember, the more ridiculous and impossible your story, the more unforgettable it becomes!"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setGameState({ ...gameState, phase: "learn" })}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            🔗 Try Another Story Chain
          </button>
        </div>
      )}
    </div>
  );
}

import { GameConfig, GameType } from "../types/game";

// Centralized game configuration
export const GAME_REGISTRY: Record<GameType, GameConfig> = {
  chaos_cards: {
    type: "chaos_cards",
    name: "Chaos Cards",
    description: "Master randomized card sequences through chaos and order",
    icon: "🃏",
    category: "randomness",
    difficultySettings: {
      easy: { itemCount: 6, studyTime: 20, chaosTime: 3, multiplier: 1 },
      medium: { itemCount: 8, studyTime: 15, chaosTime: 2, multiplier: 1.5 },
      hard: { itemCount: 10, studyTime: 10, chaosTime: 1, multiplier: 2 },
    },
  },
  random_palace: {
    type: "random_palace",
    name: "Random Palace Generator",
    description: "Navigate procedurally generated memory palaces",
    icon: "🏰",
    category: "randomness",
    difficultySettings: {
      easy: { itemCount: 6, studyTime: 30, multiplier: 1 },
      medium: { itemCount: 8, studyTime: 25, multiplier: 1.5 },
      hard: { itemCount: 10, studyTime: 20, multiplier: 2 },
    },
  },
  memory_speed: {
    type: "memory_speed",
    name: "Memory Speed Challenge",
    description: "Test your recall speed with rapid-fire challenges",
    icon: "⚡",
    category: "fun-games",
    difficultySettings: {
      easy: { itemCount: 10, timeLimit: 60, multiplier: 1 },
      medium: { itemCount: 15, timeLimit: 45, multiplier: 1.5 },
      hard: { itemCount: 20, timeLimit: 30, multiplier: 2 },
    },
  },
  linking_method: {
    type: "linking_method",
    name: "Linking Method Trainer",
    description: "Create absurd stories to link unrelated items",
    icon: "🔗",
    category: "randomness",
    difficultySettings: {
      easy: { itemCount: 8, studyTime: 25, multiplier: 1 },
      medium: { itemCount: 12, studyTime: 20, multiplier: 1.5 },
      hard: { itemCount: 16, studyTime: 15, multiplier: 2 },
    },
  },
  method_of_loci: {
    type: "method_of_loci",
    name: "Method of Loci",
    description: "Build and navigate your personal memory palace",
    icon: "🏛️",
    category: "art-worlds",
    difficultySettings: {
      easy: { itemCount: 10, studyTime: 30, multiplier: 1 },
      medium: { itemCount: 15, studyTime: 25, multiplier: 1.5 },
      hard: { itemCount: 20, studyTime: 20, multiplier: 2 },
    },
  },
};

// Get games by category
export function getGamesByCategory(category: string): GameConfig[] {
  return Object.values(GAME_REGISTRY).filter(game => game.category === category);
}

// Get game config by type
export function getGameConfig(gameType: GameType): GameConfig {
  return GAME_REGISTRY[gameType];
}

// Get all game types
export function getAllGameTypes(): GameType[] {
  return Object.keys(GAME_REGISTRY) as GameType[];
}

// Category configurations
export const CATEGORIES = {
  randomness: {
    name: "Randomness Revolution",
    description: "Embrace chaos to find order",
    icon: "🎲",
    color: "yellow",
    path: "/randomness-revolution",
  },
  "fun-games": {
    name: "Actually Fun Games",
    description: "Battle for memory supremacy",
    icon: "🎮",
    color: "green",
    path: "/actually-fun-games",
  },
  "art-worlds": {
    name: "Generative Art & Worlds",
    description: "Build visual memory palaces",
    icon: "🎨",
    color: "pink",
    path: "/generative-art-worlds",
  },
  "ai-llms": {
    name: "AI & LLMs",
    description: "Train with artificial wisdom",
    icon: "🤖",
    color: "blue",
    path: "/ai-and-llms",
  },
};

// Memory technique descriptions
export const MEMORY_TECHNIQUES = {
  method_of_loci: {
    name: "Method of Loci",
    description: "The Memory Palace technique - associate items with familiar locations",
    origin: "Ancient Greece (Simonides of Ceos)",
    difficulty: 3,
    instructions: [
      "Choose a familiar route or building",
      "Place each item at specific locations along the route",
      "Create vivid mental images of items in their locations",
      "Walk through the route mentally to recall items",
    ],
    tips: [
      "Use locations you know extremely well",
      "Make the mental images as bizarre as possible",
      "Always follow the same route direction",
      "Practice the empty route first",
    ],
  },
  linking_method: {
    name: "Linking Method",
    description: "Create absurd stories connecting unrelated items",
    origin: "Ancient mnemonic traditions",
    difficulty: 2,
    instructions: [
      "Take the first two items and create a vivid connection",
      "Link the second item to the third with another image",
      "Continue chaining items together",
      "Make connections as unusual and memorable as possible",
    ],
    tips: [
      "The more absurd, the more memorable",
      "Use action and movement in your stories",
      "Engage multiple senses in your imagery",
      "Practice with simple word lists first",
    ],
  },
  major_system: {
    name: "Major System",
    description: "Convert numbers into memorable words using phonetic codes",
    origin: "17th century cipher systems",
    difficulty: 4,
    instructions: [
      "Learn the number-to-consonant mappings",
      "Convert number sequences to consonant patterns",
      "Add vowels to create memorable words",
      "Link words together using other techniques",
    ],
    tips: [
      "Master the basic mappings first: 1=L, 2=N, 3=M, etc.",
      "Create a personal word list for common numbers",
      "Combine with Method of Loci for longer sequences",
      "Practice with phone numbers and dates",
    ],
  },
  peg_system: {
    name: "Peg System",
    description: "Use pre-memorized 'pegs' to hang new information",
    origin: "Medieval memory traditions",
    difficulty: 3,
    instructions: [
      "Memorize a set of 'peg' words (1=bun, 2=shoe, etc.)",
      "Associate each new item with its corresponding peg",
      "Create vivid mental images of the associations",
      "Recall by going through your peg sequence",
    ],
    tips: [
      "Start with a simple rhyming peg system",
      "Make peg words personally meaningful",
      "Use the same pegs consistently",
      "Expand your peg system gradually",
    ],
  },
  person_action_object: {
    name: "Person-Action-Object (PAO)",
    description: "Advanced system for memorizing long number sequences",
    origin: "Modern memory competitions",
    difficulty: 5,
    instructions: [
      "Assign a Person, Action, and Object to each 2-digit number",
      "Group numbers into sets of 6 digits (3 pairs)",
      "Create scenes using Person from first pair, Action from second, Object from third",
      "Link scenes together for longer sequences",
    ],
    tips: [
      "Use celebrities and familiar people",
      "Choose distinctive actions and objects",
      "Practice with shorter sequences first",
      "This system requires significant upfront investment",
    ],
  },
};

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: "first_game",
    name: "Memory Awakening",
    description: "Complete your first memory game",
    icon: "🌟",
    category: "milestone",
    condition: (stats: any) => stats.total_sessions >= 1,
  },
  {
    id: "perfect_score",
    name: "Flawless Recall",
    description: "Achieve 100% accuracy in any game",
    icon: "🎯",
    category: "performance",
    condition: (stats: any) => stats.recent_sessions.some((s: any) => s.accuracy === 100),
  },
  {
    id: "speed_demon",
    name: "Lightning Memory",
    description: "Complete a speed challenge in under 30 seconds",
    icon: "⚡",
    category: "speed",
    condition: (stats: any) => stats.recent_sessions.some((s: any) => 
      s.game_type === "memory_speed" && s.duration_seconds < 30
    ),
  },
  {
    id: "chaos_master",
    name: "Chaos Conqueror",
    description: "Master all difficulty levels in Chaos Cards",
    icon: "🌪️",
    category: "mastery",
    condition: (stats: any) => {
      const chaosGames = stats.recent_sessions.filter((s: any) => s.game_type === "chaos_cards");
      return [1, 2, 3].every(level => 
        chaosGames.some((g: any) => g.difficulty_level === level && g.accuracy >= 80)
      );
    },
  },
  {
    id: "palace_architect",
    name: "Palace Architect",
    description: "Complete 10 different memory palaces",
    icon: "🏰",
    category: "exploration",
    condition: (stats: any) => {
      const palaceGames = stats.recent_sessions.filter((s: any) => s.game_type === "random_palace");
      return palaceGames.length >= 10;
    },
  },
  {
    id: "streak_master",
    name: "Consistency Champion",
    description: "Maintain a 7-day practice streak",
    icon: "🔥",
    category: "consistency",
    condition: (stats: any) => stats.current_streak >= 7,
  },
];

// Get achievements by category
export function getAchievementsByCategory(category: string) {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

// Check if user has unlocked achievement
export function checkAchievement(achievementId: string, userStats: any): boolean {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  return achievement ? achievement.condition(userStats) : false;
}

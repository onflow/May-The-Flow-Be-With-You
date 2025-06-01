// Shared types for all memory games
export interface GameItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  culturalContext?: string;
}

export interface Card extends GameItem {
  // Chaos Cards specific
}

export interface MemoryItem extends GameItem {
  room: string;
  coordinates: { x: number; y: number };
}

export interface SpeedItem extends GameItem {
  value: string;
  type: "number" | "word" | "color" | "symbol";
  displayValue?: string;
  position: number;
  memoryHint?: string;
}

export interface Room {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  culturalContext?: string;
}

export type MemoryTechnique = "observation" | "loci" | "linking" | "story" | "cultural" | "journey" | "spatial" | "chunking" | "major_system" | "peg_system";

export type GamePhase = "setup" | "learn" | "memorize" | "recall" | "results" | "loading" | "error";

export interface BaseGameData {
  difficulty: number;
  baselineDifficulty: number;
  perfectRounds: number;
  totalRounds: number;
  memoryTechnique: MemoryTechnique;
  culturalStory: string;
  scoreBreakdown?: string[];
}

export interface ChaosCardsGameData extends BaseGameData {
  cards: Card[];
  shuffledCards: Card[];
  userSequence: string[];
  currentGuess: number;
}

export interface MemoryPalaceGameData extends BaseGameData {
  rooms: Room[];
  items: MemoryItem[];
  userPath: string[];
  userGuesses: string[];
  currentGuess: number;
}

export interface SpeedChallengeGameData extends BaseGameData {
  items: SpeedItem[];
  currentSequence: SpeedItem[];
  userAnswers: string[];
  currentStep: number;
  sequenceLength: number;
  challengeType: "encoding" | "recall" | "recognition";
  timePerItem: number;
}

export interface BaseGameState<T extends BaseGameData> {
  phase: GamePhase;
  gameData: T;
  score: number;
  timeLeft: number;
  error?: string;
}

export type ChaosCardsGameState = BaseGameState<ChaosCardsGameData>;
export type MemoryPalaceGameState = BaseGameState<MemoryPalaceGameData>;
export type SpeedChallengeGameState = BaseGameState<SpeedChallengeGameData>;

export interface GameResult {
  gameType: string;
  score: number;
  culturalCategory: string;
  difficulty: number;
  technique: MemoryTechnique;
  accuracy: number;
  timeSpent: number;
  vrfSeed?: number;
}

export interface VRFVerification {
  transactionId?: string;
  blockHeight?: number;
  seed: number;
  timestamp: number;
  verificationUrl?: string;
  isVerified: boolean;
  proof?: string;
}

// Common game configuration
export interface GameConfig {
  culturalCategory: string;
  theme: any; // CulturalTheme
  gameInfo: any;
  showModeSelector: boolean;
}

// Difficulty levels shared across games
export const DIFFICULTY_LEVELS = [
  { value: 3, label: "Novice", description: "3-4 items - Perfect for beginners", icon: "🌱" },
  { value: 5, label: "Apprentice", description: "5-6 items - Building confidence", icon: "🌿" },
  { value: 7, label: "Adept", description: "7-8 items - Developing mastery", icon: "🌳" },
  { value: 9, label: "Expert", description: "9-10 items - Advanced challenge", icon: "🏛️" },
  { value: 12, label: "Master", description: "12+ items - Elite level", icon: "👑" },
] as const;

// Memory techniques shared across games
export const MEMORY_TECHNIQUES = {
  observation: {
    label: "Observation",
    description: "Careful visual study and attention to detail",
    icon: "👁️",
    tip: "Focus intently on each element and its visual characteristics"
  },
  loci: {
    label: "Method of Loci",
    description: "Place items in specific locations within a mental space",
    icon: "🏛️",
    tip: "Visualize walking through familiar rooms and placing each item in a memorable spot"
  },
  linking: {
    label: "Linking Method",
    description: "Connect items in a chain of memorable associations",
    icon: "🔗",
    tip: "Create bizarre, impossible connections between consecutive items"
  },
  story: {
    label: "Story Method",
    description: "Weave all items into one memorable narrative",
    icon: "📖",
    tip: "Create an absurd, vivid story that includes all items in sequence"
  },
  cultural: {
    label: "Cultural Context",
    description: "Use cultural stories and meanings to enhance memory",
    icon: "🌍",
    tip: "Connect each item to the cultural theme and historical context"
  },
  journey: {
    label: "Memory Journey",
    description: "Create a path connecting all items in sequence",
    icon: "🚶",
    tip: "Follow a logical route, linking items along the way"
  },
  spatial: {
    label: "Spatial Memory",
    description: "Use physical layout and spatial relationships",
    icon: "🗺️",
    tip: "Focus on where items are positioned relative to each other"
  },
  chunking: {
    label: "Chunking",
    description: "Group items into meaningful clusters",
    icon: "📦",
    tip: "Break long sequences into smaller, manageable groups"
  },
  major_system: {
    label: "Major System",
    description: "Convert numbers to memorable words using phonetic codes",
    icon: "🔢",
    tip: "Use consonant sounds to encode numbers: 1=T/D, 2=N, 3=M, etc."
  },
  peg_system: {
    label: "Peg System",
    description: "Use fixed anchor points to remember sequences",
    icon: "📌",
    tip: "Associate each position with a permanent 'peg' word"
  }
} as const;

// Common game phases configuration
export const GAME_PHASES = {
  setup: { icon: "⚙️", title: "Setup", description: "Configure your game" },
  learn: { icon: "📚", title: "Learn", description: "Study the layout" },
  memorize: { icon: "🧠", title: "Memorize", description: "Commit to memory" },
  recall: { icon: "🎯", title: "Recall", description: "Test your memory" },
  results: { icon: "📊", title: "Results", description: "See your performance" },
  loading: { icon: "⏳", title: "Loading", description: "Preparing game" },
  error: { icon: "❌", title: "Error", description: "Something went wrong" }
} as const;

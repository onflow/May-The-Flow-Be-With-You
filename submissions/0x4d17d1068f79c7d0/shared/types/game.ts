// Core game types and interfaces
export type GamePhase = "setup" | "study" | "memorize" | "chaos" | "recall" | "results";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type GameType = "chaos_cards" | "random_palace" | "memory_speed" | "linking_method" | "method_of_loci";

export interface BaseGameState {
  phase: GamePhase;
  timeLeft: number;
  score: number;
  maxPossibleScore: number;
  difficulty: DifficultyLevel;
  isLoading: boolean;
  startTime?: number;
  endTime?: number;
}

export interface GameConfig {
  type: GameType;
  name: string;
  description: string;
  icon: string;
  category: "randomness" | "fun-games" | "art-worlds" | "ai-llms";
  difficultySettings: Record<DifficultyLevel, DifficultyConfig>;
}

export interface DifficultyConfig {
  itemCount: number;
  studyTime?: number;
  chaosTime?: number;
  timeLimit?: number;
  multiplier: number;
}

export interface GameSession {
  id?: string;
  user_id: string;
  game_type: GameType;
  score: number;
  max_possible_score: number;
  accuracy: number;
  items_count: number;
  duration_seconds: number;
  difficulty_level: number;
  session_data: any;
  created_at?: string;
}

export interface GameResult {
  score: number;
  accuracy: number;
  duration: number;
  perfect: boolean;
  newRecord: boolean;
}

// Game item interfaces
export interface BaseGameItem {
  id: string;
  position: number;
}

export interface Card extends BaseGameItem {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: string;
  color: "red" | "black";
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryItem extends BaseGameItem {
  coordinates: { x: number; y: number };
  color: string;
  emoji: string;
  name: string;
  room: string;
}

export interface SpeedItem extends BaseGameItem {
  type: "number" | "word" | "color";
  value: string;
  color?: string;
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: (stats: any) => boolean;
  unlocked: boolean;
  unlockedAt?: string;
}

// Game hook return type
export interface GameHookReturn<T extends BaseGameState> {
  gameState: T;
  startGame: () => void;
  resetGame: () => void;
  updateGameState: (updates: Partial<T>) => void;
  saveResult: (result: GameResult) => Promise<void>;
  isLoading: boolean;
}

// Timer hook return type
export interface TimerHookReturn {
  timeLeft: number;
  isRunning: boolean;
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

// Random generation utilities
export interface RandomSeed {
  value: number;
  next: () => number;
}

// Memory technique types
export type MemoryTechnique =
  | "method_of_loci"
  | "linking_method"
  | "major_system"
  | "peg_system"
  | "person_action_object";

export interface MemoryTechniqueConfig {
  name: string;
  description: string;
  difficulty: number;
  category: string;
  instructions: string[];
  examples: string[];
}

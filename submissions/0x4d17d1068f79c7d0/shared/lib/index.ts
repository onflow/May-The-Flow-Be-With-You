// Centralized exports for shared utilities and configurations

// Re-export configurations
export {
  ACHIEVEMENTS,
  AchievementChecker,
  getAchievementsByCategory,
  getAchievementsByCulture,
  getAchievementsByRarity,
  getAllAchievements,
  getAchievementById,
  getTotalAchievementPoints
} from '../config/achievements';

export type {
  AchievementCategory,
  AchievementRarity,
  Achievement as AchievementConfig
} from '../config/achievements';

export * from '../config/culturalThemes';
export * from '../config/flow';
export * from '../config/gameRules';

// Re-export utilities
export * from '../utils/culturalMapping';
export * from '../utils/errorHandling';
export {
  createSeededRandom,
  shuffleArray,
  generateRandomItems,
  calculateScore,
  calculateAccuracy,
  GAME_DIFFICULTY_CONFIGS,
  getGameDifficultyConfig,
  formatTime,
  calculateProgress,
  generateColor,
  validateGameSession,
  trackPerformance,
  checkScoreAchievement,
  checkAccuracyAchievement,
  checkStreakAchievement
} from '../utils/gameUtils';

// Re-export services
export * from '../services/FlowVRFService';
export * from '../services/GameService';
export {
  progressService
} from '../services/progressService';

export type {
  Achievement as ProgressAchievement,
  GameSession,
  UserStats,
  LeaderboardEntry
} from '../services/progressService';

// Re-export types (avoiding conflicts)
export type {
  GamePhase,
  BaseGameState,
  GameConfig,
  DifficultyConfig as GameDifficultyConfig,
  GameResult,
  BaseGameItem,
  Card,
  MemoryItem,
  SpeedItem,
  Achievement as GameAchievement,
  GameHookReturn,
  TimerHookReturn,
  RandomSeed,
  MemoryTechnique,
  MemoryTechniqueConfig
} from '../types/game';

// Re-export hooks
export * from '../hooks/useGameState';
export * from '../hooks/usePerformance';

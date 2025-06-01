// Shared types
export * from './types';

// Shared hooks
export { useGameTimer } from './hooks/useGameTimer';
export { useGameCore } from './hooks/useGameCore';

// Shared components
export { GameHeader } from './components/GameHeader';
export { GameTimer } from './components/GameTimer';
export { DifficultySelector } from './components/DifficultySelector';
export { TechniqueSelector } from './components/TechniqueSelector';
export { ProgressStats } from './components/ProgressStats';

// Shared utilities
export * from './utils/memoryPalaceUtils';
export * from './utils/speedChallengeUtils';
export * from '../../../utils/gameUtils';

// Export gameUtils as a named export for backward compatibility
import * as gameUtilsImport from '../../../utils/gameUtils';
export const gameUtils = gameUtilsImport;

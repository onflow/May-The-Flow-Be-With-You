// Re-export for clean imports
export { default as MethodOfLociTrainer } from "./MethodOfLociTrainer";
export { default as LinkingMethodTrainer } from "./LinkingMethodTrainer";
export { default as RandomPalaceGenerator } from "./RandomPalaceGenerator";

// Modern Memory Palace Games (using shared architecture)
export { MemoryPalaceGameRefactored } from "./MemoryPalaceGameRefactored";

// Legacy components (deprecated - use MemoryPalaceGameRefactored instead)
// export { MemoryPalaceGame } from "./MemoryPalaceGame";
// export { useMemoryPalaceGame } from "./hooks/useMemoryPalaceGame";

// Shared Components
export { MemoryPalaceSetup } from "./MemoryPalaceSetup";
export { MemoryPalaceLearn } from "./MemoryPalaceLearn";
export { MemoryPalaceMemorize } from "./MemoryPalaceMemorize";
export { MemoryPalaceRecall } from "./MemoryPalaceRecall";
export { MemoryPalaceResults } from "./MemoryPalaceResults";

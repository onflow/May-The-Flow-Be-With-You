// Organized game components with clean imports

// Shared game architecture
export * from "./shared";

// Speed Challenge Games
export * from "./speed-challenge";

// Chaos Cards Games
export * from "./chaos-cards";

// Memory Palace Games
export * from "./memory-palace";

// Legacy exports for backward compatibility
export { CulturalSpeedChallenge } from "./speed-challenge";
export { CulturalChaosCards } from "./chaos-cards";
export {
  MethodOfLociTrainer,
  LinkingMethodTrainer,
  RandomPalaceGenerator,
} from "./memory-palace";
export { MemorySpeedChallenge } from "./speed-challenge";

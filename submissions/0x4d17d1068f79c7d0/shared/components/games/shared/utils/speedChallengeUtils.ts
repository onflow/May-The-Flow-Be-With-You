import { SpeedItem, SpeedChallengeGameData, MemoryTechnique } from '../types';
import { getThemeByCategory, getThemeItems } from '../../../../config/culturalThemes';
import { createSeededRandom } from '../../../../utils/gameUtils';

// Generate speed challenge items based on technique and cultural context
export function generateSpeedItems(
  seed: number,
  culturalCategory: string,
  difficulty: number,
  technique: MemoryTechnique
): SpeedItem[] {
  const random = createSeededRandom(seed);
  const theme = getThemeByCategory(culturalCategory);
  const items: SpeedItem[] = [];

  // Determine item type based on technique
  const itemType = getItemTypeForTechnique(technique);

  // Generate items based on type and cultural context
  for (let i = 0; i < difficulty; i++) {
    const item = generateSingleItem(i, itemType, culturalCategory, random, technique, seed);
    items.push(item);
  }

  return items;
}

// Determine optimal item type for memory technique
function getItemTypeForTechnique(technique: MemoryTechnique): "number" | "word" | "color" | "symbol" {
  switch (technique) {
    case "major_system":
    case "chunking":
      return "number";
    case "peg_system":
    case "linking":
      return "word";
    case "cultural":
      return "symbol";
    default:
      return "word";
  }
}

// Generate a single speed item
function generateSingleItem(
  index: number,
  type: "number" | "word" | "color" | "symbol",
  culturalCategory: string,
  random: { next: () => number },
  technique: MemoryTechnique,
  seed: number
): SpeedItem {
  const theme = getThemeByCategory(culturalCategory);

  switch (type) {
    case "number":
      return generateNumberItem(index, random, technique, seed);
    case "word":
      return generateWordItem(index, culturalCategory, random, technique, seed);
    case "color":
      return generateColorItem(index, theme, random, seed);
    case "symbol":
      return generateSymbolItem(index, culturalCategory, random, seed);
    default:
      return generateWordItem(index, culturalCategory, random, technique, seed);
  }
}

// Generate number items with memory technique hints
function generateNumberItem(
  index: number,
  random: { next: () => number },
  technique: MemoryTechnique,
  seed: number
): SpeedItem {
  let value: string;
  let memoryHint: string;

  if (technique === "major_system") {
    // Generate 2-digit numbers optimized for Major System
    const num = Math.floor(random.next() * 90) + 10; // 10-99
    value = num.toString();
    memoryHint = getMajorSystemHint(num);
  } else if (technique === "chunking") {
    // Generate longer numbers for chunking practice
    const chunks = Math.floor(random.next() * 3) + 2; // 2-4 chunks
    const chunkValues = [];
    for (let i = 0; i < chunks; i++) {
      chunkValues.push(Math.floor(random.next() * 90) + 10);
    }
    value = chunkValues.join('');
    memoryHint = `Chunk as: ${chunkValues.join(' - ')}`;
  } else {
    // Simple 2-digit number
    value = (Math.floor(random.next() * 90) + 10).toString();
    memoryHint = "Visualize this number clearly";
  }

  return {
    id: `speed-${seed}-${index}`,
    name: value,
    emoji: "🔢",
    color: "#4A90E2",
    value,
    type: "number",
    position: index,
    memoryHint,
    culturalContext: "Numerical memory training"
  };
}

// Generate word items with cultural context
function generateWordItem(
  index: number,
  culturalCategory: string,
  random: { next: () => number },
  technique: MemoryTechnique,
  seed: number
): SpeedItem {
  const culturalObjects = getThemeItems(culturalCategory, "objects");
  const culturalPlaces = getThemeItems(culturalCategory, "places");
  const allWords = [...culturalObjects, ...culturalPlaces];

  // Shuffle the words array to get different selections each game
  const shuffledWords = [...allWords];
  for (let i = shuffledWords.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
  }

  const word = shuffledWords[Math.floor(random.next() * shuffledWords.length)];
  let memoryHint: string;

  switch (technique) {
    case "linking":
      memoryHint = index === 0 
        ? "Start your story with this item"
        : "Connect this to the previous item with a bizarre link";
      break;
    case "peg_system":
      memoryHint = `Peg ${index + 1}: Associate with your ${index + 1} peg word`;
      break;
    case "cultural":
      memoryHint = "Connect to the cultural significance and traditions";
      break;
    default:
      memoryHint = "Focus on the visual and emotional aspects";
  }

  return {
    id: `speed-${seed}-${index}`,
    name: word,
    emoji: getEmojiForWord(word),
    color: "#E74C3C",
    value: word,
    type: "word",
    position: index,
    memoryHint,
    culturalContext: `Part of ${culturalCategory} tradition`
  };
}

// Generate color items
function generateColorItem(
  index: number,
  theme: any,
  random: { next: () => number },
  seed: number
): SpeedItem {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3",
    "#FF6348", "#2ED573", "#FFA502", "#3742FA"
  ];

  // Shuffle colors array to get different selections each game
  const shuffledColors = [...colors];
  for (let i = shuffledColors.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j], shuffledColors[i]];
  }

  const color = shuffledColors[Math.floor(random.next() * shuffledColors.length)];
  
  return {
    id: `speed-${seed}-${index}`,
    name: color,
    emoji: "🎨",
    color: color,
    value: color,
    type: "color",
    position: index,
    memoryHint: "Associate this color with an object or emotion",
    culturalContext: "Color memory training"
  };
}

// Generate symbol items with cultural context
function generateSymbolItem(
  index: number,
  culturalCategory: string,
  random: { next: () => number },
  seed: number
): SpeedItem {
  const theme = getThemeByCategory(culturalCategory);
  const symbols = (theme as any).symbols || [
    "⭐", "🌟", "✨", "🔮", "🎭", "🏛️", "🌸", "🍃",
    "🔥", "⚡", "🌊", "🌙", "☀️", "🌈", "💎", "🎯"
  ];

  // Shuffle symbols array to get different selections each game
  const shuffledSymbols = [...symbols];
  for (let i = shuffledSymbols.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffledSymbols[i], shuffledSymbols[j]] = [shuffledSymbols[j], shuffledSymbols[i]];
  }

  const symbol = shuffledSymbols[Math.floor(random.next() * shuffledSymbols.length)];
  
  return {
    id: `speed-${seed}-${index}`,
    name: symbol,
    emoji: symbol,
    color: theme.colors.primary,
    value: symbol,
    type: "symbol",
    position: index,
    memoryHint: "Connect this symbol to its cultural meaning",
    culturalContext: `Sacred symbol in ${culturalCategory} tradition`
  };
}

// Major System phonetic encoding hints
function getMajorSystemHint(num: number): string {
  const majorSystemMap: { [key: string]: string } = {
    '0': 'S/Z', '1': 'T/D', '2': 'N', '3': 'M', '4': 'R',
    '5': 'L', '6': 'J/SH', '7': 'K/G', '8': 'F/V', '9': 'P/B'
  };
  
  const digits = num.toString().split('');
  const sounds = digits.map(d => majorSystemMap[d]).join(' + ');
  return `Major System: ${sounds} → Create a word`;
}

// Get emoji for cultural words
function getEmojiForWord(word: string): string {
  const emojiMap: { [key: string]: string } = {
    // Common cultural items
    "temple": "🏛️", "palace": "🏰", "garden": "🌸", "mountain": "⛰️",
    "river": "🌊", "forest": "🌲", "desert": "🏜️", "ocean": "🌊",
    "sword": "⚔️", "shield": "🛡️", "crown": "👑", "scroll": "📜",
    "book": "📚", "candle": "🕯️", "flower": "🌺", "tree": "🌳",
    "stone": "🪨", "crystal": "💎", "fire": "🔥", "water": "💧"
  };
  
  return emojiMap[word.toLowerCase()] || "⭐";
}

// Calculate Speed Challenge score with technique bonuses
export function calculateSpeedChallengeScore(
  userAnswers: string[],
  correctItems: SpeedItem[],
  timeSpent: number,
  technique: MemoryTechnique
): { score: number; breakdown: string[] } {
  const correctAnswers = userAnswers.filter(
    (answer, index) => answer.toLowerCase() === correctItems[index]?.value.toLowerCase()
  ).length;
  
  const accuracy = correctItems.length > 0 ? (correctAnswers / correctItems.length) * 100 : 0;
  const speedBonus = Math.max(0, (30 - timeSpent) / 30); // Bonus for speed
  const techniqueMultiplier = getTechniqueMultiplier(technique);
  
  const baseScore = (accuracy / 100) * 500;
  const speedBonusPoints = speedBonus * 200;
  const techniqueBonus = baseScore * techniqueMultiplier;
  
  const totalScore = Math.round(baseScore + speedBonusPoints + techniqueBonus);
  
  const breakdown = [
    `Accuracy: ${correctAnswers}/${correctItems.length} (${Math.round(accuracy)}%)`,
    `Base Score: ${Math.round(baseScore)}`,
    `Speed Bonus: ${Math.round(speedBonusPoints)}`,
    `Technique Bonus: ${Math.round(techniqueBonus)}`,
    `Total: ${totalScore}`
  ];
  
  return { score: totalScore, breakdown };
}

// Get technique difficulty multiplier
function getTechniqueMultiplier(technique: MemoryTechnique): number {
  const multipliers = {
    observation: 0.1,
    chunking: 0.2,
    linking: 0.3,
    cultural: 0.3,
    peg_system: 0.4,
    major_system: 0.5,
    loci: 0.4,
    story: 0.3,
    journey: 0.3,
    spatial: 0.3
  };
  
  return multipliers[technique] || 0.1;
}

// Create cultural story for Speed Challenge
export function createSpeedChallengeStory(
  technique: MemoryTechnique,
  culturalCategory: string,
  themeName: string
): string {
  const theme = getThemeByCategory(culturalCategory);
  const baseStory = `Welcome to the ${themeName} Speed Challenge.`;
  
  const techniqueStories: Record<string, string> = {
    major_system: "Ancient scholars used phonetic codes to remember vast numbers. Transform digits into sounds, sounds into words, words into vivid images.",
    peg_system: "Memory champions use permanent anchor points. Each position has its own 'peg' - a word that never changes, ready to hold new memories.",
    chunking: "The mind naturally groups information. Break long sequences into meaningful chunks, like a phone number or date.",
    linking: "Create impossible, bizarre connections between items. The more absurd the link, the more memorable it becomes.",
    cultural: `Immerse yourself in ${themeName} traditions. Each item carries the weight of history and cultural significance.`,
    observation: "Focus on visual details and patterns. Train your eye to capture and retain precise visual information.",
    loci: "Use familiar locations as memory anchors. Place each item in a specific spot along a well-known route.",
    story: "Weave items into a narrative. Stories create natural connections that make sequences memorable.",
    journey: "Follow a path through meaningful places. Each location holds a piece of your memory sequence.",
    spatial: "Use physical relationships and positioning. Where items are placed is as important as what they are."
  };

  return techniqueStories[technique] || baseStory;
}

import { MemoryItem, Room } from '../types';
import { getThemeByCategory, getThemeItems } from '../../../../config/culturalThemes';
import { createSeededRandom } from '../../../../utils/gameUtils';

// Generate palace layout based on cultural theme, seed, and difficulty
export function generatePalaceLayout(seed: number, culturalCategory: string, difficulty: number = 6): Room[] {
  const random = createSeededRandom(seed);
  const theme = getThemeByCategory(culturalCategory);
  const allCulturalPlaces = getThemeItems(culturalCategory, "places");

  // Calculate number of rooms based on difficulty (2-4 rooms for 4-12 items)
  const numRooms = Math.min(Math.max(2, Math.ceil(difficulty / 3)), 6);

  // Shuffle cultural places using the seed to get different rooms each game
  const shuffledPlaces = [...allCulturalPlaces];
  for (let i = shuffledPlaces.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffledPlaces[i], shuffledPlaces[j]] = [shuffledPlaces[j], shuffledPlaces[i]];
  }
  const roomNames = shuffledPlaces.slice(0, numRooms);

  const baseColor = theme.colors.background;
  const roomColors = [
    baseColor,
    theme.colors.background,
    baseColor + "CC",
    baseColor + "AA",
    theme.colors.background + "DD",
    baseColor + "BB",
  ];

  const rooms: Room[] = [];

  // Dynamic grid layout based on number of rooms
  let gridCols: number, gridRows: number;
  if (numRooms <= 2) {
    gridCols = 2;
    gridRows = 1;
  } else if (numRooms <= 4) {
    gridCols = 2;
    gridRows = 2;
  } else {
    gridCols = 3;
    gridRows = 2;
  }

  // Container dimensions for proper scaling
  const containerWidth = 100; // Use percentage-based positioning
  const containerHeight = 100;
  const padding = 8; // Padding percentage

  const roomWidth = (containerWidth - padding * (gridCols + 1)) / gridCols;
  const roomHeight = (containerHeight - padding * (gridRows + 1)) / gridRows;

  for (let i = 0; i < numRooms; i++) {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;

    rooms.push({
      id: `room-${i}`,
      name: roomNames[i],
      color: roomColors[i],
      position: {
        x: padding + col * (roomWidth + padding),
        y: padding + row * (roomHeight + padding),
      },
      size: {
        width: roomWidth,
        height: roomHeight,
      },
      culturalContext: theme.gameAdaptations.memoryPalace?.description,
    });
  }

  return rooms;
}

// Generate memory items with cultural context
export function generateMemoryItems(
  seed: number,
  rooms: Room[],
  culturalCategory: string,
  difficulty: number
): MemoryItem[] {
  const random = createSeededRandom(seed);
  const theme = getThemeByCategory(culturalCategory);
  const allCulturalObjects = getThemeItems(culturalCategory, "objects");

  // Shuffle cultural objects using the seed to get different objects each game
  const shuffledObjects = [...allCulturalObjects];
  for (let i = shuffledObjects.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [shuffledObjects[i], shuffledObjects[j]] = [shuffledObjects[j], shuffledObjects[i]];
  }
  const culturalObjects = shuffledObjects;
  
  // Enhanced emoji mapping for cultural items
  const emojiMap: Record<string, string> = {
    // Greek/Classical items
    "Scroll": "📜", "Amphora": "🏺", "Lyre": "🎵", "Olive Branch": "🫒",
    "Laurel Crown": "👑", "Stylus": "✒️", "Wax Tablet": "📝", "Chiton": "👘",
    "Sandals": "👡", "Coin": "🪙", "Shield": "🛡️", "Spear": "🗡️",
    "Wine Cup": "🍷", "Oil Lamp": "🪔", "Marble": "🗿", "Bronze": "🥉",
    
    // African/Griot items  
    "Djembe": "🥁", "Kora": "🎵", "Talking Drum": "🥁", "Calabash": "🥥",
    "Cowrie Shell": "🐚", "Baobab Seed": "🌰", "Gold Weight": "⚖️",
    "Adinkra Symbol": "🔣", "Shea Butter": "🧴", "Kente Cloth": "🧵",
    "Mask": "🎭", "Clay Pot": "🏺", "Millet": "🌾", "Yam": "🍠",
    
    // Eastern/Asian items
    "Bamboo": "🎋", "Lotus": "🪷", "Tea Cup": "🍵", "Brush": "🖌️",
    "Ink Stone": "⚫", "Jade": "💚", "Gong": "🔔", "Incense": "🕯️",
    "Prayer Beads": "📿", "Fan": "🪭", "Silk": "🧵", "Porcelain": "🏺",
    
    // Indigenous/Aboriginal items
    "Boomerang": "🪃", "Didgeridoo": "🎵", "Ochre": "🟤", "Coolamon": "🥥",
    "Woomera": "🏹", "Firestick": "🔥", "Grinding Stone": "🪨",
    "Water Gourd": "🥥", "Message Stick": "📜", "Clap Sticks": "🥢",
    
    // Fallback emojis
    "Apple": "🍎", "Star": "🌟", "Target": "🎯", "Key": "🔑",
    "Diamond": "💎", "Flower": "🌸", "Lightning": "⚡", "Palette": "🎨",
  };

  const items: MemoryItem[] = [];
  const colors = [
    theme.colors.primary,
    theme.colors.secondary, 
    theme.colors.accent,
    theme.colors.primary + "80",
    theme.colors.secondary + "80",
    theme.colors.accent + "80",
    "#ff6b6b",
    "#4ecdc4",
  ];

  for (let i = 0; i < difficulty; i++) {
    const roomIndex = i % rooms.length;
    const room = rooms[roomIndex];

    // Use seeded randomization to select different objects each game
    const objectIndex = Math.floor(random.next() * culturalObjects.length);
    const itemName = culturalObjects[objectIndex];

    items.push({
      id: `item-${seed}-${i}`, // Include seed in ID to ensure uniqueness
      name: itemName,
      emoji: emojiMap[itemName] || "⭐",
      color: colors[Math.floor(random.next() * colors.length)],
      room: room.id,
      coordinates: {
        x: 20 + random.next() * 60, // 20-80% within room
        y: 30 + random.next() * 40, // 30-70% within room
      },
      culturalContext: theme.gameAdaptations.memoryPalace?.description,
    });
  }

  return items;
}

// Enhanced Memory Palace score calculation (matching Chaos Cards sophistication)
export function calculateMemoryPalaceScore(
  userGuesses: string[],
  correctItems: MemoryItem[],
  timeSpent: number,
  difficulty: number,
  memoryTechnique: string = "loci",
  isProgression: boolean = false
): { score: number; breakdown: string[] } {
  const correctGuesses = userGuesses.filter(
    (guess, index) => guess === correctItems[index]?.name
  ).length;

  const accuracy = correctItems.length > 0 ? (correctGuesses / correctItems.length) * 100 : 0;

  // Enhanced scoring system similar to Chaos Cards
  const basePointsPerItem = 10 + Math.max(0, (difficulty - 6) * 2); // 10-18 points per item
  const baseScore = correctGuesses * basePointsPerItem;

  // Difficulty multiplier (20% bonus per level above 6)
  const difficultyMultiplier = 1 + Math.max(0, (difficulty - 6) * 0.2);
  const difficultyBonus = Math.round(baseScore * (difficultyMultiplier - 1));

  // Time bonus (faster completion = bonus, max 200 points)
  const timeBonus = Math.max(0, Math.round((60 - timeSpent) / 60 * 200));

  // Memory technique bonus
  const techniqueMultipliers = {
    observation: 0.1,
    loci: 0.3,
    journey: 0.25,
    spatial: 0.2,
    cultural: 0.35,
    linking: 0.15,
    story: 0.2
  };
  const techniqueMultiplier = techniqueMultipliers[memoryTechnique as keyof typeof techniqueMultipliers] || 0.1;
  const techniqueBonus = Math.round(baseScore * techniqueMultiplier);

  // Progression bonus (50% bonus for advancing difficulty)
  const progressionBonus = isProgression ? Math.round(baseScore * 0.5) : 0;

  const totalScore = baseScore + difficultyBonus + timeBonus + techniqueBonus + progressionBonus;

  const breakdown = [
    `Base: ${baseScore} pts (${correctGuesses}/${correctItems.length} × ${basePointsPerItem} pts)`,
    ...(difficultyBonus > 0 ? [`Difficulty: +${difficultyBonus} pts (Level ${difficulty})`] : []),
    ...(timeBonus > 0 ? [`Speed: +${timeBonus} pts (Quick completion)`] : []),
    ...(techniqueBonus > 0 ? [`Technique: +${techniqueBonus} pts (${memoryTechnique})`] : []),
    ...(progressionBonus > 0 ? [`Progression: +${progressionBonus} pts (Level up!)`] : []),
    `Total: ${totalScore} pts`
  ];

  return { score: totalScore, breakdown };
}

// Create cultural story for Memory Palace
export function createMemoryPalaceStory(
  technique: string,
  culturalCategory: string,
  themeName: string
): string {
  const theme = getThemeByCategory(culturalCategory);
  const palaceInfo = theme.gameAdaptations.memoryPalace;
  
  const baseStory = palaceInfo?.description || `Welcome to the ${themeName} Memory Palace.`;
  
  const techniqueGuidance = {
    loci: "Walk through each room mentally, placing items in their exact locations.",
    journey: "Follow your planned route, connecting each item to the next in sequence.",
    spatial: "Focus on the spatial relationships and distances between items.",
    cultural: "Connect each item to its cultural significance and historical context.",
  };
  
  const guidance = techniqueGuidance[technique as keyof typeof techniqueGuidance] || 
                  "Use your chosen memory technique to memorize the item locations.";
  
  return `${baseStory} ${guidance}`;
}

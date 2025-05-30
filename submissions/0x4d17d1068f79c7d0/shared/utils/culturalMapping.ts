// Unified Cultural Mapping Utilities
// Centralizes emoji mapping and cultural context logic

export interface CulturalItem {
  name: string;
  emoji: string;
  category: 'objects' | 'places' | 'concepts';
  culturalContext?: string;
}

// Comprehensive emoji mapping for all cultural items
const CULTURAL_EMOJI_MAP: Record<string, string> = {
  // Greek/Classical
  "Scroll": "📜",
  "Amphora": "🏺",
  "Lyre": "🎵",
  "Olive Branch": "🫒",
  "Laurel Crown": "👑",
  "Stylus": "✒️",
  "Wax Tablet": "📝",
  "Chiton": "👘",
  "Sandals": "👡",
  "Coin": "🪙",
  "Shield": "🛡️",
  "Spear": "🗡️",
  "Wine Cup": "🍷",
  "Oil Lamp": "🪔",
  "Marble": "🪨",
  "Bronze": "🥉",
  "Papyrus": "📜",
  "Ink": "🖋️",
  "Wisdom": "🦉",
  "Justice": "⚖️",
  "Courage": "🦁",
  "Truth": "💎",
  "Temperance": "🧘",
  "Beauty": "🌹",
  "Virtue": "✨",
  "Honor": "🏆",
  "Logic": "🧠",
  "Rhetoric": "🗣️",
  "Philosophy": "💭",
  "Democracy": "🗳️",
  "Harmony": "☯️",
  "Order": "📐",
  "Reason": "🤔",
  "Excellence": "⭐",
  "Glory": "👑",
  "Legacy": "📚",
  "Agora": "🏛️",
  "Temple": "🏛️",
  "Theater": "🎭",
  "Academy": "🏛️",
  "Gymnasium": "🏃",
  "Library": "📚",
  "Forum": "🏛️",
  "Basilica": "⛪",
  "Atrium": "🏠",
  "Peristyle": "🏛️",
  "Triclinium": "🍽️",
  "Tablinum": "📋",
  "Portico": "🏛️",
  "Stoa": "🏛️",
  "Odeon": "🎵",
  "Stadium": "🏟️",
  "Hippodrome": "🏇",
  "Acropolis": "🏛️",

  // African/Griot
  "Djembe": "🥁",
  "Kora": "🪕",
  "Talking Drum": "🥁",
  "Calabash": "🥥",
  "Cowrie Shell": "🐚",
  "Baobab Seed": "🌰",
  "Gold Weight": "⚖️",
  "Adinkra Symbol": "🔣",
  "Shea Butter": "🧴",
  "Kente Cloth": "🧵",
  "Mask": "🎭",
  "African Spear": "🗡️",
  "Clay Pot": "🏺",
  "Millet": "🌾",
  "Yam": "🍠",
  "Palm Oil": "🫒",
  "Honey": "🍯",
  "Ivory Tusk": "🦷",
  "Ubuntu": "🤝",
  "Sankofa": "🔄",
  "Asante": "👑",
  "Community": "👥",
  "Rhythm": "🎵",
  "Ancestry": "👴",
  "Respect": "🙏",
  "Unity": "🤝",
  "Heritage": "📿",
  "Village Square": "🏘️",
  "Baobab Tree": "🌳",
  "River Crossing": "🌊",
  "Chief's Compound": "🏠",
  "Market Place": "🏪",
  "Sacred Grove": "🌳",
  "Granary": "🏠",
  "Blacksmith's Forge": "🔥",
  "Weaving Hut": "🏠",
  "Storytelling Circle": "⭕",
  "Ancestral Shrine": "⛩️",
  "Water Well": "🪣",

  // Eastern/Asian
  "Bamboo": "🎋",
  "Lotus": "🪷",
  "Tea Cup": "🍵",
  "Eastern Scroll": "📜",
  "Brush": "🖌️",
  "Ink Stone": "🪨",
  "Jade": "💚",
  "Gong": "🔔",
  "Incense": "🕯️",
  "Prayer Beads": "📿",
  "Fan": "🪭",
  "Silk": "🧵",
  "Porcelain": "🏺",
  "Calligraphy": "✍️",
  "Seal": "🔖",
  "Compass": "🧭",
  "Abacus": "🧮",
  "Kite": "🪁",
  "Balance": "🧘‍♀️",
  "Mindfulness": "🧘",
  "Compassion": "❤️",
  "Peace": "☮️",
  "Flow": "🌊",
  "Emptiness": "⚪",
  "Enlightenment": "💡",
  "Patience": "⏳",
  "Simplicity": "🕊️",
  "Meditation": "🧘",
  "Reflection": "🪞",
  "Serenity": "😌",
  "Understanding": "🤝",
  "Clarity": "💎",
  "Presence": "🎯",
  "Temple Garden": "🏯",
  "Tea House": "🏯",
  "Bamboo Grove": "🎋",
  "Meditation Hall": "🏯",
  "Pagoda": "🏯",
  "Bridge": "🌉",
  "Koi Pond": "🐠",
  "Rock Garden": "🪨",
  "Pavilion": "🏯",
  "Courtyard": "🏠",
  "Study": "📚",
  "Mountain Path": "⛰️",
  "Waterfall": "💧",
  "Pine Forest": "🌲",
  "Monastery": "⛩️",

  // Indigenous/Aboriginal
  "Boomerang": "🪃",
  "Didgeridoo": "🎺",
  "Ochre": "🟤",
  "Coolamon": "🥣",
  "Woomera": "🏹",
  "Firestick": "🔥",
  "Grinding Stone": "🪨",
  "Water Gourd": "🥤",
  "Spear Thrower": "🏹",
  "Message Stick": "📝",
  "Clap Sticks": "🥢",
  "Emu Feather": "🪶",
  "Kangaroo Skin": "🦘",
  "Bush Medicine": "🌿",
  "Sacred Stone": "🗿",
  "Honey Ant": "🐜",
  "Witchetty Grub": "🐛",
  "Bush Tucker": "🍃",
  "Dreamtime": "🌙",
  "Songline": "🛤️",
  "Country": "🏞️",
  "Ancestor": "👴",
  "Waterhole": "💧",
  "Sacred Site": "🗿",
  "Dreaming Track": "🛤️",
  "Rock Shelter": "🏔️",
  "Billabong": "💧",
  "Desert Plain": "🏜️",
  "Ancestor Cave": "🕳️",
  "Ceremony Ground": "⭕",
  "Lookout Rock": "🪨",
  "Star Map": "⭐",
  "Story Circle": "⭕",
  "Honey Tree": "🌳",
  "Medicine Place": "🌿",
  "Wind Cave": "💨",
  "Sun Rock": "☀️",
  "Moon Pool": "🌙",
  "Spirit Tree": "🌳",
};

// Cultural context mapping by culture and item
const CULTURAL_CONTEXTS: Record<string, Record<string, string>> = {
  "randomness-revolution": {
    "Scroll": "Ancient Greek papyrus containing philosophical wisdom",
    "Amphora": "Clay vessel used for storing wine and olive oil",
    "Lyre": "Musical instrument sacred to Apollo, god of music",
    "Olive Branch": "Symbol of peace and wisdom from Athena's gift",
    "Agora": "Central marketplace where democracy was born",
    "Temple": "Sacred space dedicated to the gods",
    "Academy": "Plato's school where philosophy flourished",
    "Wisdom": "Sophia - the highest form of knowledge in Greek philosophy",
    "Justice": "One of the four cardinal virtues in Greek philosophy",
    "Courage": "Andreia - bravery in the face of adversity",
    "Truth": "Aletheia - the uncovering of what is hidden"
  },
  "actually-fun-games": {
    "Djembe": "Sacred drum that carries the heartbeat of the community",
    "Kora": "21-stringed harp that tells the stories of ancestors",
    "Baobab Seed": "From the tree of life that connects earth and sky",
    "Cowrie Shell": "Ancient currency representing prosperity and fertility",
    "Village Square": "Heart of the community where stories are shared",
    "Baobab Tree": "Meeting place of elders and keeper of wisdom",
    "Ubuntu": "Philosophy meaning 'I am because we are'",
    "Sankofa": "Symbol meaning 'go back and get it' - learning from the past",
    "Community": "The foundation of African social structure"
  },
  "ai-and-llms": {
    "Bamboo": "Symbol of flexibility and strength in adversity",
    "Lotus": "Flower of enlightenment rising from muddy waters",
    "Tea Cup": "Vessel for mindful contemplation and presence",
    "Jade": "Stone of harmony and balance in all things",
    "Temple Garden": "Space for meditation and inner reflection",
    "Tea House": "Place of quiet conversation and wisdom sharing",
    "Harmony": "The balance of opposing forces in nature",
    "Mindfulness": "Core practice of Buddhist meditation",
    "Balance": "The middle way between extremes"
  },
  "generative-art-worlds": {
    "Boomerang": "Traditional hunting tool that returns to thrower",
    "Didgeridoo": "Sacred instrument connecting to ancestral spirits",
    "Ochre": "Sacred earth pigment used in ceremony and art",
    "Sacred Stone": "Marker of ancestral presence in the landscape",
    "Sacred Waterhole": "Life-giving source in the vast desert",
    "Ancestor Cave": "Repository of ancient stories and wisdom",
    "Dreamtime": "Aboriginal creation period when ancestors shaped the land",
    "Songline": "Invisible pathways across the land marked by songs",
    "Country": "The land that holds all stories and law"
  }
};

/**
 * Get emoji symbol for a cultural item
 */
export function getCulturalEmoji(itemName: string): string {
  return CULTURAL_EMOJI_MAP[itemName] || "⭐";
}

/**
 * Get cultural context for an item within a specific culture
 */
export function getCulturalContext(culture: string, itemName: string): string {
  return CULTURAL_CONTEXTS[culture]?.[itemName] || `Traditional ${culture} element`;
}

/**
 * Create a cultural item with emoji and context
 */
export function createCulturalItem(
  name: string,
  category: 'objects' | 'places' | 'concepts',
  culture?: string
): CulturalItem {
  return {
    name,
    emoji: getCulturalEmoji(name),
    category,
    culturalContext: culture ? getCulturalContext(culture, name) : undefined
  };
}

/**
 * Get all available emojis for a category
 */
export function getEmojisForCategory(category: 'objects' | 'places' | 'concepts'): string[] {
  // This would need to be enhanced with category mapping if needed
  return Object.values(CULTURAL_EMOJI_MAP);
}

/**
 * Validate if an item has cultural mapping
 */
export function hasCulturalMapping(itemName: string): boolean {
  return itemName in CULTURAL_EMOJI_MAP;
}

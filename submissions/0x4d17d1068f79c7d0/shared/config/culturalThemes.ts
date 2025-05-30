// Cultural theming system for different hackathon categories

export interface CulturalTheme {
  id: string;
  name: string;
  culture: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  patterns: {
    primary: string;
    secondary: string;
  };
  items: {
    // Culture-specific items for memory games
    objects: string[];
    places: string[];
    concepts: string[];
  };
  wisdom: {
    greeting: string;
    encouragement: string[];
    techniques: string[];
  };
  gameAdaptations: {
    memoryPalace: {
      name: string;
      locations: string[];
      description: string;
    };
    cardGame: {
      name: string;
      theme: string;
      description: string;
    };
    speedChallenge: {
      name: string;
      focus: string;
      description: string;
    };
  };
}

export const CULTURAL_THEMES: Record<string, CulturalTheme> = {
  "actually-fun-games": {
    id: "griot",
    name: "Griot Tradition",
    culture: "West African",
    description: "Master of oral tradition, rhythm, and community memory",
    colors: {
      primary: "#D97706", // Amber-600
      secondary: "#92400E", // Amber-800
      accent: "#F59E0B", // Amber-500
      background: "#FEF3C7", // Amber-100
      text: "#451A03", // Amber-900
    },
    patterns: {
      primary: "geometric-african",
      secondary: "kente-inspired",
    },
    items: {
      objects: [
        "Djembe", "Kora", "Talking Drum", "Calabash", "Cowrie Shell", "Baobab Seed",
        "Gold Weight", "Adinkra Symbol", "Shea Butter", "Kente Cloth", "Mask", "Spear",
        "Clay Pot", "Millet", "Yam", "Palm Oil", "Honey", "Ivory Tusk"
      ],
      places: [
        "Village Square", "Baobab Tree", "River Crossing", "Chief's Compound",
        "Market Place", "Sacred Grove", "Granary", "Blacksmith's Forge",
        "Weaving Hut", "Storytelling Circle", "Ancestral Shrine", "Water Well"
      ],
      concepts: [
        "Ubuntu", "Sankofa", "Asante", "Wisdom", "Community", "Rhythm",
        "Ancestry", "Harmony", "Respect", "Courage", "Unity", "Heritage"
      ]
    },
    wisdom: {
      greeting: "Akwaaba! I am the Griot, keeper of stories and guardian of memory. Through rhythm and tale, we shall strengthen your mind.",
      encouragement: [
        "Like the baobab tree, memory grows strongest with deep roots in community.",
        "The drum beats the rhythm of remembrance - let your mind dance to its call.",
        "In our tradition, every story carries the wisdom of generations.",
        "The griot's memory spans centuries - yours can too, one tale at a time."
      ],
      techniques: [
        "Rhythm-based memorization using traditional drumbeats",
        "Genealogy chains linking family and community stories",
        "Proverb sequences for wisdom transmission",
        "Musical mnemonics with call-and-response patterns"
      ]
    },
    gameAdaptations: {
      memoryPalace: {
        name: "Village Compound",
        locations: [
          "Chief's Hut", "Storytelling Circle", "Sacred Baobab", "Market Square",
          "Ancestral Shrine", "Weaving Area", "Granary", "Water Well"
        ],
        description: "Navigate a traditional West African village compound, placing memories in sacred and communal spaces."
      },
      cardGame: {
        name: "Rhythm Cards",
        theme: "Traditional African patterns and symbols",
        description: "Memorize card sequences using drumbeat rhythms and Adinkra symbols."
      },
      speedChallenge: {
        name: "Griot's Tale",
        focus: "Rapid storytelling and genealogy recall",
        description: "Channel the griot's ability to rapidly recall names, places, and stories from oral tradition."
      }
    }
  },

  "randomness-revolution": {
    id: "classical",
    name: "Classical Scholar",
    culture: "Greek/Roman",
    description: "Philosopher and architect of memory palaces",
    colors: {
      primary: "#EAB308", // Yellow-500
      secondary: "#A16207", // Yellow-700
      accent: "#FDE047", // Yellow-300
      background: "#FEF9C3", // Yellow-100
      text: "#713F12", // Yellow-800
    },
    patterns: {
      primary: "greek-key",
      secondary: "ionic-columns",
    },
    items: {
      objects: [
        "Scroll", "Amphora", "Lyre", "Olive Branch", "Laurel Crown", "Stylus",
        "Wax Tablet", "Chiton", "Sandals", "Coin", "Shield", "Spear",
        "Wine Cup", "Oil Lamp", "Marble", "Bronze", "Papyrus", "Ink"
      ],
      places: [
        "Agora", "Temple", "Theater", "Academy", "Gymnasium", "Library",
        "Forum", "Basilica", "Atrium", "Peristyle", "Triclinium", "Tablinum",
        "Portico", "Stoa", "Odeon", "Stadium", "Hippodrome", "Acropolis"
      ],
      concepts: [
        "Wisdom", "Justice", "Courage", "Temperance", "Truth", "Beauty",
        "Virtue", "Honor", "Logic", "Rhetoric", "Philosophy", "Democracy",
        "Harmony", "Order", "Reason", "Excellence", "Glory", "Legacy"
      ]
    },
    wisdom: {
      greeting: "Greetings, seeker of wisdom! I am the Classical Scholar, inheritor of Simonides' gift. Let us build palaces of memory together.",
      encouragement: [
        "As Simonides discovered in tragedy, the greatest memories are born from careful observation.",
        "The philosophers taught that a trained memory is the foundation of all learning.",
        "Like the columns of the Parthenon, strong memories require solid foundations.",
        "In the footsteps of Cicero, we shall master the art of remembrance."
      ],
      techniques: [
        "Method of Loci using classical architecture",
        "Rhetorical memory for speeches and arguments",
        "Geometric visualization of abstract concepts",
        "Systematic categorization following Aristotelian principles"
      ]
    },
    gameAdaptations: {
      memoryPalace: {
        name: "Classical Palace",
        locations: [
          "Grand Entrance", "Atrium", "Peristyle Garden", "Library",
          "Triclinium", "Study", "Temple", "Portico"
        ],
        description: "Walk through a magnificent Greco-Roman palace, placing memories in architectural splendor."
      },
      cardGame: {
        name: "Chaos Cards",
        theme: "Classical geometric patterns and symbols",
        description: "Master randomized sequences through the discipline of classical order."
      },
      speedChallenge: {
        name: "Rhetorical Challenge",
        focus: "Rapid recall of classical knowledge",
        description: "Channel the orator's skill in rapidly accessing vast stores of memorized information."
      }
    }
  },

  "ai-and-llms": {
    id: "sage",
    name: "Eastern Sage",
    culture: "Chinese/Buddhist",
    description: "Contemplative master of mindful memory",
    colors: {
      primary: "#3B82F6", // Blue-500
      secondary: "#1E40AF", // Blue-800
      accent: "#60A5FA", // Blue-400
      background: "#DBEAFE", // Blue-100
      text: "#1E3A8A", // Blue-900
    },
    patterns: {
      primary: "chinese-clouds",
      secondary: "bamboo-leaves",
    },
    items: {
      objects: [
        "Bamboo", "Lotus", "Tea Cup", "Scroll", "Brush", "Ink Stone",
        "Jade", "Gong", "Incense", "Prayer Beads", "Fan", "Silk",
        "Porcelain", "Calligraphy", "Seal", "Compass", "Abacus", "Kite"
      ],
      places: [
        "Temple Garden", "Tea House", "Bamboo Grove", "Meditation Hall",
        "Pagoda", "Bridge", "Koi Pond", "Rock Garden", "Pavilion", "Courtyard",
        "Library", "Study", "Mountain Path", "Waterfall", "Pine Forest", "Monastery"
      ],
      concepts: [
        "Harmony", "Balance", "Mindfulness", "Compassion", "Wisdom", "Peace",
        "Flow", "Emptiness", "Enlightenment", "Patience", "Simplicity", "Unity",
        "Meditation", "Reflection", "Serenity", "Understanding", "Clarity", "Presence"
      ]
    },
    wisdom: {
      greeting: "Welcome, student of the Way. I am the Eastern Sage, walking the path of mindful memory. Let us cultivate awareness together.",
      encouragement: [
        "Like water flowing around stones, memory finds its way through patient practice.",
        "The Buddhist masters taught that mindful attention is the key to perfect recall.",
        "In stillness, the mind becomes clear; in clarity, memory becomes perfect.",
        "As bamboo bends without breaking, let your memory be flexible yet strong."
      ],
      techniques: [
        "Mindful memorization through meditation",
        "Visualization using traditional garden layouts",
        "Rhythmic chanting for sequence memory",
        "Symbolic association with Eastern philosophy"
      ]
    },
    gameAdaptations: {
      memoryPalace: {
        name: "Temple Garden",
        locations: [
          "Entrance Gate", "Koi Pond", "Tea House", "Bamboo Grove",
          "Meditation Hall", "Rock Garden", "Pagoda", "Moon Bridge"
        ],
        description: "Find tranquility in a serene temple garden, placing memories among natural beauty and architectural harmony."
      },
      cardGame: {
        name: "Zen Cards",
        theme: "Minimalist design with Eastern symbols",
        description: "Achieve clarity through mindful observation of simple, elegant patterns."
      },
      speedChallenge: {
        name: "Mindful Recall",
        focus: "Calm, centered rapid memory",
        description: "Practice the Zen master's ability to access knowledge instantly while maintaining inner peace."
      }
    }
  },

  "generative-art-worlds": {
    id: "dreamtime",
    name: "Dreamtime Keeper",
    culture: "Indigenous/Aboriginal",
    description: "Guardian of songlines and visual memory landscapes",
    colors: {
      primary: "#DC2626", // Red-600 (ochre red)
      secondary: "#92400E", // Amber-800 (earth brown)
      accent: "#F59E0B", // Amber-500 (golden yellow)
      background: "#FEF3C7", // Amber-100 (sand)
      text: "#451A03", // Amber-900 (deep earth)
    },
    patterns: {
      primary: "dot-painting",
      secondary: "songline-paths",
    },
    items: {
      objects: [
        "Boomerang", "Didgeridoo", "Ochre", "Coolamon", "Woomera", "Firestick",
        "Grinding Stone", "Water Gourd", "Spear Thrower", "Message Stick", "Clap Sticks", "Emu Feather",
        "Kangaroo Skin", "Bush Medicine", "Sacred Stone", "Honey Ant", "Witchetty Grub", "Bush Tucker"
      ],
      places: [
        "Waterhole", "Sacred Site", "Dreaming Track", "Rock Shelter", "Billabong", "Desert Plain",
        "Ancestor Cave", "Ceremony Ground", "Lookout Rock", "River Crossing", "Star Map", "Story Circle",
        "Honey Tree", "Medicine Place", "Wind Cave", "Sun Rock", "Moon Pool", "Spirit Tree"
      ],
      concepts: [
        "Dreamtime", "Songline", "Country", "Ancestor", "Spirit", "Journey",
        "Connection", "Story", "Land", "Sky", "Water", "Fire",
        "Wisdom", "Respect", "Sharing", "Belonging", "Ceremony", "Sacred"
      ]
    },
    wisdom: {
      greeting: "Welcome, young traveler. I am the Dreamtime Keeper, walking the songlines that connect all memory. Let us paint your mind with the colors of remembrance.",
      encouragement: [
        "Like the songlines that cross the continent, memory connects all knowledge.",
        "The ancestors painted their stories on rock and mind - yours will endure too.",
        "In the Dreamtime, all knowledge flows like water finding its path.",
        "Each memory is a dot in the great painting of your mind's landscape."
      ],
      techniques: [
        "Landscape-based memory using natural landmarks",
        "Visual storytelling through symbolic patterns",
        "Songline navigation connecting memory points",
        "Seasonal and cyclical memory organization"
      ]
    },
    gameAdaptations: {
      memoryPalace: {
        name: "Dreamtime Landscape",
        locations: [
          "Sacred Waterhole", "Ancestor Cave", "Star Map Rock", "Ceremony Ground",
          "Honey Tree", "Wind Cave", "Spirit Tree", "Story Circle"
        ],
        description: "Journey across the vast landscape of memory, following songlines that connect sacred sites and ancestral wisdom."
      },
      cardGame: {
        name: "Dot Painting Memory",
        theme: "Traditional dot patterns and Dreamtime symbols",
        description: "Create memory patterns using traditional Aboriginal dot painting techniques and symbolic storytelling."
      },
      speedChallenge: {
        name: "Songline Journey",
        focus: "Rapid navigation through connected memory landscapes",
        description: "Follow the songlines at speed, connecting memory points across vast mental territories like the ancestors navigated the continent."
      }
    }
  }
};

// Helper functions
export function getThemeByCategory(category: string): CulturalTheme {
  return CULTURAL_THEMES[category] || CULTURAL_THEMES["randomness-revolution"];
}

export function getAllThemes(): CulturalTheme[] {
  return Object.values(CULTURAL_THEMES);
}

export function getThemeColors(category: string) {
  return getThemeByCategory(category).colors;
}

export function getThemeItems(category: string, type: 'objects' | 'places' | 'concepts') {
  return getThemeByCategory(category).items[type];
}

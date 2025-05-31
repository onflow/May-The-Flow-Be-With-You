"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { SteddieAIService } from "../services/SteddieAIService";

interface ChatMessage {
  id: string;
  type: "user" | "steddie";
  content: string;
  timestamp: Date;
}

interface SteddieChatProps {
  isOpen: boolean;
  onClose: () => void;
}

// Steddie's knowledge base for memory techniques
const steddieKnowledge = {
  "method of loci": {
    description:
      "The ancient memory palace technique where you place items in familiar locations.",
    tips: [
      "Start with a place you know well - your home, school, or workplace",
      "Create a specific route through the space",
      "Place items in logical order along your path",
      "Make the images vivid and unusual - the stranger, the more memorable",
      "Practice walking through your palace regularly",
    ],
    history:
      "Born from tragedy in ancient Greece when Simonides identified victims by their remembered seating positions. This technique has been used by orators, scholars, and memory champions for over 2,500 years.",
  },
  "linking method": {
    description: "Connect items in a chain of absurd, memorable stories.",
    tips: [
      "Make connections bizarre and impossible to forget",
      "Use action and movement in your stories",
      "Engage multiple senses - sight, sound, touch, smell",
      "The more ridiculous, the more memorable",
      "Practice with simple lists first, then build complexity",
    ],
    history:
      "Popularized by memory masters like Dominic O'Brien and Josh Foer. The key insight: our brains remember stories and emotions far better than abstract lists.",
  },
  "major system": {
    description:
      "Convert numbers into words using consonant sounds, making them easier to remember.",
    tips: [
      "Learn the basic code: 1=L, 2=N, 3=M, 4=R, 5=L, 6=J/SH, 7=K/G, 8=F/V, 9=P/B, 0=S/Z",
      "Add vowels freely to create words",
      "Create vivid images for your number-words",
      "Practice with phone numbers and dates first",
      "Build a personal library of number-word images",
    ],
    history:
      "Evolved from 17th-century cipher systems. Modern memory champions use this to memorize thousands of digits of π.",
  },
  "peg system": {
    description:
      "Create a permanent set of memory 'pegs' to hang new information on.",
    tips: [
      "Start with a simple 1-10 peg system",
      "Use rhyming pegs: 1=sun, 2=shoe, 3=tree, etc.",
      "Or use shape pegs: 1=candle, 2=swan, 3=handcuffs",
      "Make your pegs vivid and personal",
      "Expand to 100+ pegs as you improve",
    ],
    history:
      "Allows infinite expansion beyond familiar spaces. Master 100 pegs, then multiply by adding modifiers like fire, ice, or gold.",
  },
};

const steddiePersonality = {
  greeting:
    "Hello, young memory seeker! I'm Steddie, and I've been carrying the wisdom of memory masters on my shell for millennia. What would you like to learn today?",
  encouragement: [
    "Slow and steady builds the strongest memories!",
    "Even the greatest masters started with simple steps.",
    "Your memory palace grows stronger with each practice session.",
    "Remember, I've seen civilizations rise and fall - your progress is remarkable!",
    "The ancient Greeks would be proud of your dedication!",
  ],
  transitions: [
    "Let me share what I've learned over the centuries...",
    "In my travels through time, I've observed...",
    "The memory masters taught me...",
    "From my shell's ancient wisdom...",
  ],
};

export function SteddieChat({ isOpen, onClose }: SteddieChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState(false); // Toggle between rule-based and AI
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Venice AI service
  const steddieAI = new SteddieAIService({
    provider: "venice",
    model: "llama-3.3-70b",
    fallbackToRules: true,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add greeting message when chat opens
      addSteddieMessage(steddiePersonality.greeting);
    }
  }, [isOpen]);

  const addSteddieMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: "steddie",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const generateSteddieResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Context-aware responses based on conversation history
    const recentMessages = messages
      .slice(-3)
      .map((m) => m.content.toLowerCase())
      .join(" ");
    const hasDiscussedTechnique = Object.keys(steddieKnowledge).some((tech) =>
      recentMessages.includes(tech.toLowerCase())
    );

    // Advanced pattern matching with context
    const patterns = {
      // Greetings and introductions
      greeting:
        /\b(hello|hi|hey|greetings|good\s+(morning|afternoon|evening))\b/,

      // Questions about Steddie himself
      aboutSteddie:
        /\b(who\s+are\s+you|tell\s+me\s+about\s+(yourself|you)|what\s+are\s+you)\b/,

      // Specific technique requests
      techniqueRequest:
        /\b(teach\s+me|show\s+me|explain|how\s+to|what\s+is)\b.*\b(method|technique|system|palace|linking|major|peg)\b/,

      // Performance and improvement
      performance:
        /\b(better|improve|faster|stronger|enhance|boost|increase)\b/,

      // Difficulty and frustration
      difficulty:
        /\b(difficult|hard|struggling|confused|stuck|frustrated|can't|cannot)\b/,

      // Cultural interest
      cultural:
        /\b(culture|cultural|tradition|ancient|history|greek|roman|african|asian|indigenous)\b/,

      // Games and practice
      games: /\b(game|play|practice|train|exercise|challenge)\b/,

      // Memory problems
      memoryProblems:
        /\b(forget|forgetting|memory\s+loss|can't\s+remember|bad\s+memory)\b/,

      // Motivation and encouragement
      motivation: /\b(motivation|encourage|inspire|give\s+up|quit|tired)\b/,
    };

    // Check for technique-specific questions first
    for (const [technique, knowledge] of Object.entries(steddieKnowledge)) {
      if (
        input.includes(technique.replace(" ", "").toLowerCase()) ||
        input.includes(technique.toLowerCase()) ||
        (patterns.techniqueRequest.test(input) &&
          input.includes(technique.split(" ")[0].toLowerCase()))
      ) {
        const transition =
          steddiePersonality.transitions[
            Math.floor(Math.random() * steddiePersonality.transitions.length)
          ];
        return `${transition}\n\n**${technique.toUpperCase()}**\n\n${
          knowledge.description
        }\n\n**Tips from my shell:**\n${knowledge.tips
          .map((tip) => `• ${tip}`)
          .join("\n")}\n\n**Historical wisdom:** ${
          knowledge.history
        }\n\n*Would you like me to suggest a specific exercise to practice this technique?*`;
      }
    }

    // Pattern-based responses
    if (patterns.greeting.test(input)) {
      const greetings = [
        "Greetings, young memory seeker! I am Steddie, and I've been carrying the wisdom of memory masters for over 2,500 years.",
        "Hello there! Welcome to my shell of ancient wisdom. I'm here to guide you through the timeless art of memory.",
        "Ah, a new student approaches! I am Steddie the Tortoise, keeper of memory secrets from across the ages.",
      ];
      return (
        greetings[Math.floor(Math.random() * greetings.length)] +
        "\n\nWhat aspect of memory training calls to you today?"
      );
    }

    if (patterns.aboutSteddie.test(input)) {
      return "I am Steddie, an ancient tortoise who has witnessed the birth and evolution of every major memory technique. From Simonides' first memory palace to modern championship methods, I carry these secrets in the patterns of my shell.\n\nI've observed students in Greek academies, Roman forums, medieval monasteries, and modern memory competitions. Each generation teaches me something new about the art of remembering.\n\nMy purpose? To share this accumulated wisdom with those ready to unlock their memory potential. What would you like to learn?";
    }

    if (patterns.cultural.test(input)) {
      return "Ah, the rich tapestry of cultural memory traditions! I've witnessed how different cultures developed unique approaches:\n\n🏛️ **Greeks & Romans**: Architectural memory palaces\n🥁 **West African Griots**: Rhythmic storytelling chains\n🧘 **Eastern Sages**: Mindful visualization techniques\n🎨 **Indigenous Peoples**: Songline navigation systems\n\nEach tradition offers unique insights. Which cultural approach resonates with your learning style?";
    }

    if (patterns.memoryProblems.test(input)) {
      return "Fear not! What you call 'bad memory' is simply an untrained memory. I've seen countless students transform from forgetful to phenomenal.\n\nThe truth: Your brain is already a magnificent memory machine - it just needs the right techniques to unlock its potential.\n\n**Quick confidence builder:**\nYou remember faces, songs, stories, and emotions perfectly. We're simply going to apply that natural ability to everything else!\n\nShall we start with a simple technique to prove your memory is already amazing?";
    }

    if (patterns.motivation.test(input)) {
      const motivational = [
        "Remember: Every memory master was once a beginner who refused to give up. Your persistence today becomes tomorrow's mastery.",
        "I've watched civilizations rise and fall, but the human capacity for growth never ceases to amaze me. You have that same infinite potential.",
        "In my 2,500 years, I've learned that the tortoise truly does win the race. Steady, consistent practice beats sporadic brilliance every time.",
      ];
      return (
        motivational[Math.floor(Math.random() * motivational.length)] +
        "\n\nWhat small step can we take together right now?"
      );
    }

    if (patterns.games.test(input)) {
      return "Excellent! Games make practice joyful and effective. I recommend:\n\n🎮 **Chaos Cards**: Perfect for building visual memory\n🏃 **Speed Challenges**: Develop quick recall under pressure\n🏰 **Memory Palaces**: Create lasting spatial memories\n\nEach game targets different memory skills. Which type of challenge excites you most?";
    }

    if (patterns.performance.test(input) && hasDiscussedTechnique) {
      return "To enhance your technique mastery:\n\n**Progressive Training:**\n• Start with 3-5 items, master completely\n• Add one item only when achieving 100% accuracy\n• Practice daily for 10-15 minutes\n• Use spaced repetition (review after 1 day, 3 days, 1 week)\n\n**Advanced Tips:**\n• Combine techniques (palace + linking)\n• Add emotional connections\n• Use all five senses\n• Create personal meaning\n\nWhich aspect would you like to focus on first?";
    }

    if (patterns.difficulty.test(input)) {
      const encouragement =
        steddiePersonality.encouragement[
          Math.floor(Math.random() * steddiePersonality.encouragement.length)
        ];
      return `${encouragement}\n\nDifficulty is the pathway to mastery! Every challenge you face is strengthening your memory muscles.\n\n**When stuck, try:**\n• Break the task into smaller pieces\n• Use more vivid, absurd imagery\n• Add movement or emotion\n• Practice with easier examples first\n\nWhat specific part is challenging you? Let's solve it together.`;
    }

    // Default response with context awareness
    if (hasDiscussedTechnique) {
      return "I sense you're ready to deepen your practice! Would you like:\n\n• Advanced exercises for your current technique\n• Ways to combine multiple methods\n• Cultural variations and applications\n• Troubleshooting specific challenges\n\nWhat direction calls to you?";
    }

    // First-time or general response
    const encouragement =
      steddiePersonality.encouragement[
        Math.floor(Math.random() * steddiePersonality.encouragement.length)
      ];
    return `${encouragement}\n\nI can guide you through:\n• **Method of Loci** (memory palaces)\n• **Linking Method** (story chains)\n• **Major System** (number memory)\n• **Peg System** (permanent anchors)\n• **Cultural Techniques** (global wisdom)\n\nWhat sparks your curiosity?`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addUserMessage(userMessage);
    setInputValue("");
    setIsTyping(true);

    try {
      let response: string;

      if (aiMode) {
        // Use Venice AI for enhanced responses
        response = await steddieAI.generateResponse(userMessage, {
          conversationHistory: messages.map((m) => m.content),
          userProgress: user ? { level: 1, gamesPlayed: 0 } : undefined,
          currentGame: undefined,
          culturalPreference: undefined,
        });
      } else {
        // Use rule-based system
        response = generateSteddieResponse(userMessage);
      }

      addSteddieMessage(response);
    } catch (error) {
      console.error("Error generating Steddie response:", error);
      // Fallback to rule-based response
      const fallbackResponse = generateSteddieResponse(userMessage);
      addSteddieMessage(fallbackResponse);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-xl">
              🐢
            </div>
            <div>
              <h3 className="font-bold">Chat with Steddie</h3>
              <p className="text-sm opacity-90">
                {aiMode ? "🧠 AI-Powered Wisdom" : "📚 Rule-Based Wisdom"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* AI Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-75">AI</span>
              <button
                onClick={() => setAiMode(!aiMode)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  aiMode ? "bg-blue-400" : "bg-green-700"
                } relative`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                    aiMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-xs opacity-75">⚡</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.type === "steddie" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🐢</span>
                    <span className="font-semibold text-green-700">
                      Steddie
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🐢</span>
                  <span className="font-semibold text-green-700">Steddie</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Steddie about memory techniques..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

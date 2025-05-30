"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";

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
    description: "The ancient memory palace technique where you place items in familiar locations.",
    tips: [
      "Start with a place you know well - your home, school, or workplace",
      "Create a specific route through the space",
      "Place items in logical order along your path",
      "Make the images vivid and unusual - the stranger, the more memorable",
      "Practice walking through your palace regularly"
    ],
    history: "Born from tragedy in ancient Greece when Simonides identified victims by their remembered seating positions. This technique has been used by orators, scholars, and memory champions for over 2,500 years."
  },
  "linking method": {
    description: "Connect items in a chain of absurd, memorable stories.",
    tips: [
      "Make connections bizarre and impossible to forget",
      "Use action and movement in your stories",
      "Engage multiple senses - sight, sound, touch, smell",
      "The more ridiculous, the more memorable",
      "Practice with simple lists first, then build complexity"
    ],
    history: "Popularized by memory masters like Dominic O'Brien and Josh Foer. The key insight: our brains remember stories and emotions far better than abstract lists."
  },
  "major system": {
    description: "Convert numbers into words using consonant sounds, making them easier to remember.",
    tips: [
      "Learn the basic code: 1=L, 2=N, 3=M, 4=R, 5=L, 6=J/SH, 7=K/G, 8=F/V, 9=P/B, 0=S/Z",
      "Add vowels freely to create words",
      "Create vivid images for your number-words",
      "Practice with phone numbers and dates first",
      "Build a personal library of number-word images"
    ],
    history: "Evolved from 17th-century cipher systems. Modern memory champions use this to memorize thousands of digits of π."
  },
  "peg system": {
    description: "Create a permanent set of memory 'pegs' to hang new information on.",
    tips: [
      "Start with a simple 1-10 peg system",
      "Use rhyming pegs: 1=sun, 2=shoe, 3=tree, etc.",
      "Or use shape pegs: 1=candle, 2=swan, 3=handcuffs",
      "Make your pegs vivid and personal",
      "Expand to 100+ pegs as you improve"
    ],
    history: "Allows infinite expansion beyond familiar spaces. Master 100 pegs, then multiply by adding modifiers like fire, ice, or gold."
  }
};

const steddiePersonality = {
  greeting: "Hello, young memory seeker! I'm Steddie, and I've been carrying the wisdom of memory masters on my shell for millennia. What would you like to learn today?",
  encouragement: [
    "Slow and steady builds the strongest memories!",
    "Even the greatest masters started with simple steps.",
    "Your memory palace grows stronger with each practice session.",
    "Remember, I've seen civilizations rise and fall - your progress is remarkable!",
    "The ancient Greeks would be proud of your dedication!"
  ],
  transitions: [
    "Let me share what I've learned over the centuries...",
    "In my travels through time, I've observed...",
    "The memory masters taught me...",
    "From my shell's ancient wisdom..."
  ]
};

export function SteddieChat({ isOpen, onClose }: SteddieChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const generateSteddieResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Check for technique-specific questions
    for (const [technique, knowledge] of Object.entries(steddieKnowledge)) {
      if (input.includes(technique.replace(" ", "")) || input.includes(technique)) {
        const transition = steddiePersonality.transitions[Math.floor(Math.random() * steddiePersonality.transitions.length)];
        return `${transition}\n\n**${technique.toUpperCase()}**\n\n${knowledge.description}\n\n**Tips from my shell:**\n${knowledge.tips.map(tip => `• ${tip}`).join('\n')}\n\n**Historical wisdom:** ${knowledge.history}`;
      }
    }

    // General encouragement and guidance
    if (input.includes("help") || input.includes("start") || input.includes("begin")) {
      return "I recommend starting with the Method of Loci - it's the foundation of all memory techniques! Try creating a simple memory palace using your home. Ask me about 'method of loci' for detailed guidance.";
    }

    if (input.includes("difficult") || input.includes("hard") || input.includes("struggling")) {
      const encouragement = steddiePersonality.encouragement[Math.floor(Math.random() * steddiePersonality.encouragement.length)];
      return `${encouragement}\n\nRemember, every master struggled at first. Which specific technique are you finding challenging? I can share targeted wisdom from my centuries of observation.`;
    }

    if (input.includes("practice") || input.includes("improve")) {
      return "Consistent practice is key! I suggest:\n\n• Start with 5-10 minutes daily\n• Begin with simple lists (groceries, to-dos)\n• Gradually increase complexity\n• Use the games here to make practice fun\n\nWhich technique would you like to focus on?";
    }

    if (input.includes("history") || input.includes("ancient") || input.includes("origin")) {
      return "Ah, the ancient origins! I witnessed Simonides discover the Method of Loci in that tragic banquet hall collapse. I've carried these techniques through Greek academies, Roman forums, medieval monasteries, and modern memory championships. Each era added new insights to the shell of wisdom!";
    }

    // Default response
    const encouragement = steddiePersonality.encouragement[Math.floor(Math.random() * steddiePersonality.encouragement.length)];
    return `${encouragement}\n\nI can help you with:\n• Method of Loci (memory palaces)\n• Linking Method (story chains)\n• Major System (number memory)\n• Peg System (permanent anchors)\n\nWhat interests you most?`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addUserMessage(userMessage);
    setInputValue("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = generateSteddieResponse(userMessage);
      addSteddieMessage(response);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
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
              <p className="text-sm opacity-90">Ancient Memory Wisdom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
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
                    <span className="font-semibold text-green-700">Steddie</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
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
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
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

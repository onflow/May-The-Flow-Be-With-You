"use client";

import React, { useState, useEffect } from "react";
import { Steddie } from "./Steddie";

interface SteddieStory {
  id: string;
  title: string;
  story: string;
  era: string;
  technique: string;
  mood: "wise" | "excited" | "nostalgic" | "encouraging";
}

const steddieStories: SteddieStory[] = [
  {
    id: "introduction",
    title: "Welcome, Memory Seeker",
    story: "Greetings! I'm Steddie, and I've been carrying the secrets of memory masters on my shell for over 2,500 years. From ancient Greek banquet halls to modern memory championships, I've witnessed every breakthrough in the art of remembering. Ready to learn what I've seen?",
    era: "All Time",
    technique: "Introduction",
    mood: "wise"
  },
  {
    id: "simonides_witness",
    title: "The Day Memory Was Born",
    story: "I was sunning myself on marble steps when I heard the crash. Simonides emerged from that collapsed banquet hall, shell-shocked but brilliant. As he identified victims by remembering their seating positions, I realized humans had discovered something profound. That day, spatial memory became an art form.",
    era: "Ancient Greece",
    technique: "Method of Loci",
    mood: "nostalgic"
  },
  {
    id: "cicero_walks",
    title: "Walking with the Great Orator",
    story: "Cicero used to practice his speeches while I slowly walked the Roman Forum. 'Steddie,' he'd say, 'your steady pace reminds me to move deliberately through my memory palace.' His greatest orations were built one careful step at a time, just like how I cross a garden.",
    era: "Roman Empire",
    technique: "Rhetorical Memory",
    mood: "encouraging"
  },
  {
    id: "aquinas_lettuce",
    title: "Lettuce and Theology",
    story: "Thomas Aquinas would feed me lettuce while organizing his theological concepts. 'Each segment of your shell holds wisdom,' he'd whisper, 'just like each location in my memory palace.' I became his model for how knowledge could be carried safely across centuries.",
    era: "Medieval Period",
    technique: "Scholastic Memory",
    mood: "wise"
  },
  {
    id: "modern_absurdity",
    title: "The Age of Absurd Stories",
    story: "When Josh Foer told me about the teacup-wearing monkey driving a car into a church, I thought humans had finally lost their minds! But then I watched him memorize a deck of cards in under two minutes. Sometimes the most ridiculous paths lead to the most remarkable destinations.",
    era: "Modern Era",
    technique: "Linking Method",
    mood: "excited"
  },
  {
    id: "digital_future",
    title: "Your Memory Journey Begins",
    story: "And now, dear student, you join this ancient lineage. I've carried these secrets for millennia, waiting for someone ready to learn. Your smartphone may hold infinite information, but your mind can hold infinite wisdom. Let's begin where Simonides left off.",
    era: "Digital Age",
    technique: "All Techniques",
    mood: "encouraging"
  }
];

export function SteddieStoryteller({ 
  autoPlay = true, 
  showControls = true,
  selectedStory = null 
}: { 
  autoPlay?: boolean; 
  showControls?: boolean;
  selectedStory?: string | null;
}) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const currentStory = selectedStory 
    ? steddieStories.find(s => s.id === selectedStory) || steddieStories[0]
    : steddieStories[currentStoryIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentStory) return;
    
    setIsTyping(true);
    setDisplayedText("");
    
    let index = 0;
    const text = currentStory.story;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 30); // Adjust speed here

    return () => clearInterval(typeInterval);
  }, [currentStory]);

  // Auto-advance stories
  useEffect(() => {
    if (!isPlaying || selectedStory || isTyping) return;

    const advanceTimer = setTimeout(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % steddieStories.length);
    }, 8000); // 8 seconds per story

    return () => clearTimeout(advanceTimer);
  }, [isPlaying, currentStoryIndex, selectedStory, isTyping]);

  const nextStory = () => {
    if (selectedStory) return;
    setCurrentStoryIndex((prev) => (prev + 1) % steddieStories.length);
  };

  const prevStory = () => {
    if (selectedStory) return;
    setCurrentStoryIndex((prev) => (prev - 1 + steddieStories.length) % steddieStories.length);
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "wise": return "🧙‍♂️";
      case "excited": return "🤩";
      case "nostalgic": return "📚";
      case "encouraging": return "💪";
      default: return "🐢";
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "wise": return "from-purple-100 to-blue-100 border-purple-300";
      case "excited": return "from-yellow-100 to-orange-100 border-orange-300";
      case "nostalgic": return "from-amber-100 to-brown-100 border-amber-300";
      case "encouraging": return "from-green-100 to-emerald-100 border-green-300";
      default: return "from-gray-100 to-slate-100 border-gray-300";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={`p-6 bg-gradient-to-br ${getMoodColor(currentStory.mood)} rounded-xl border-2 shadow-lg`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12">
              <Steddie />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {getMoodEmoji(currentStory.mood)} {currentStory.title}
              </h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-white/60 rounded-full font-medium">
                  {currentStory.era}
                </span>
                <span className="px-2 py-1 bg-white/60 rounded-full font-medium">
                  {currentStory.technique}
                </span>
              </div>
            </div>
          </div>
          
          {showControls && !selectedStory && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 bg-white/80 hover:bg-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPlaying ? "⏸️ Pause" : "▶️ Play"}
            </button>
          )}
        </div>

        {/* Story Content */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed italic">
            "{displayedText}"
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
        </div>

        {/* Controls */}
        {showControls && !selectedStory && (
          <div className="flex items-center justify-between">
            <button
              onClick={prevStory}
              className="px-3 py-1 bg-white/80 hover:bg-white rounded-lg text-sm font-medium transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-1">
              {steddieStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStoryIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStoryIndex ? "bg-gray-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextStory}
              className="px-3 py-1 bg-white/80 hover:bg-white rounded-lg text-sm font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Story Selection for Manual Mode */}
        {selectedStory && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <p className="text-xs text-gray-600 text-center">
              🐢 From Steddie's Shell Palace - {currentStory.era} Memory
            </p>
          </div>
        )}
      </div>

      {/* Quick Story Selector */}
      {!selectedStory && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {steddieStories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => setCurrentStoryIndex(index)}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                index === currentStoryIndex
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getMoodEmoji(story.mood)} {story.era}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for use in game components
export function SteddieQuote({ 
  technique, 
  mood = "wise" 
}: { 
  technique: string; 
  mood?: "wise" | "excited" | "nostalgic" | "encouraging";
}) {
  const relevantStory = steddieStories.find(s => 
    s.technique.toLowerCase().includes(technique.toLowerCase()) ||
    s.title.toLowerCase().includes(technique.toLowerCase())
  ) || steddieStories[0];

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "wise": return "🧙‍♂️";
      case "excited": return "🤩";
      case "nostalgic": return "📚";
      case "encouraging": return "💪";
      default: return "🐢";
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="w-8 h-8 flex-shrink-0">
        <Steddie />
      </div>
      <div>
        <div className="text-sm font-medium text-blue-800 mb-1">
          {getMoodEmoji(mood)} Steddie's Memory
        </div>
        <p className="text-xs text-blue-700 italic">
          "{relevantStory.story.substring(0, 120)}..."
        </p>
      </div>
    </div>
  );
}

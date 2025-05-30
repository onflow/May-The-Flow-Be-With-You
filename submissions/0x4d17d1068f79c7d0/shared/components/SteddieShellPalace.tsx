"use client";

import React, { useState } from "react";
import { Steddie } from "./Steddie";

interface ShellSegment {
  id: string;
  era: string;
  master: string;
  technique: string;
  story: string;
  position: { x: number; y: number };
  color: string;
}

const shellSegments: ShellSegment[] = [
  {
    id: "ancient_greece",
    era: "Ancient Greece (500 BCE)",
    master: "Simonides of Ceos",
    technique: "Method of Loci",
    story: "I was sunning myself on a marble step when the banquet hall collapsed. Simonides emerged, realizing he could identify victims by their seating positions. That's when I knew humans had discovered something profound about spatial memory.",
    position: { x: 50, y: 20 },
    color: "#e3f2fd"
  },
  {
    id: "roman_empire",
    era: "Roman Empire (50 BCE)",
    master: "Marcus Tullius Cicero",
    technique: "Rhetorical Memory",
    story: "Cicero would practice his speeches while I slowly walked the Forum. 'Steddie,' he'd say, 'your steady pace reminds me to move deliberately through my memory palace.' His orations became legendary.",
    position: { x: 30, y: 40 },
    color: "#f3e5f5"
  },
  {
    id: "medieval",
    era: "Medieval Period (1250 CE)",
    master: "Thomas Aquinas",
    technique: "Scholastic Memory",
    story: "In the monastery library, Aquinas would organize theological concepts like the hexagonal patterns on my shell. 'Each segment holds a truth,' he'd whisper, 'just like your shell holds the wisdom of ages.'",
    position: { x: 70, y: 40 },
    color: "#e8f5e8"
  },
  {
    id: "renaissance",
    era: "Renaissance (1500 CE)",
    master: "Giulio Camillo",
    technique: "Theatre of Memory",
    story: "Camillo built his wooden memory theatre, but I showed him that the most perfect memory palace was already designed by nature - the spiral chambers of my shell, each holding infinite knowledge.",
    position: { x: 50, y: 60 },
    color: "#fff3e0"
  },
  {
    id: "modern",
    era: "Modern Era (2000 CE)",
    master: "Josh Foer & Dominic O'Brien",
    technique: "Memory Sports",
    story: "When Josh Foer trained for the memory championships, I was his patient practice partner. 'Slow and steady,' I reminded him. 'Memory mastery isn't about speed - it's about creating unbreakable connections.'",
    position: { x: 20, y: 65 },
    color: "#fce4ec"
  },
  {
    id: "digital_age",
    era: "Digital Age (2024 CE)",
    master: "You, the Memory Athlete",
    technique: "Hybrid Classical-Digital",
    story: "And now, dear student, you join this ancient lineage. I've carried these secrets for millennia, waiting for someone ready to learn. Your journey begins where theirs left off.",
    position: { x: 80, y: 65 },
    color: "#f1f8e9"
  }
];

export function SteddieShellPalace({ onSegmentSelect }: { onSegmentSelect?: (segment: ShellSegment) => void }) {
  const [selectedSegment, setSelectedSegment] = useState<ShellSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const handleSegmentClick = (segment: ShellSegment) => {
    setSelectedSegment(segment);
    onSegmentSelect?.(segment);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Steddie's Shell Palace */}
      <div className="relative w-full h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-full border-4 border-green-300 overflow-hidden">
        {/* Shell Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern id="shell-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <polygon points="10,0 20,10 10,20 0,10" fill="#4a5568" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#shell-pattern)"/>
          </svg>
        </div>

        {/* Steddie in the center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-16 h-16 scale-150">
            <Steddie />
          </div>
        </div>

        {/* Shell Segments */}
        {shellSegments.map((segment) => (
          <div
            key={segment.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
              hoveredSegment === segment.id ? "scale-110 z-20" : "z-10"
            }`}
            style={{ 
              left: `${segment.position.x}%`, 
              top: `${segment.position.y}%`,
            }}
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => handleSegmentClick(segment)}
          >
            <div 
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-gray-800 hover:shadow-xl transition-all"
              style={{ backgroundColor: segment.color }}
            >
              {segment.era.split(' ')[0]}
            </div>
            
            {/* Hover tooltip */}
            {hoveredSegment === segment.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg p-2 min-w-48 z-30">
                <div className="text-xs font-bold text-gray-800">{segment.master}</div>
                <div className="text-xs text-gray-600">{segment.technique}</div>
              </div>
            )}
          </div>
        ))}

        {/* Shell rim decoration */}
        <div className="absolute inset-2 rounded-full border-2 border-green-200 opacity-50"></div>
        <div className="absolute inset-4 rounded-full border border-green-100 opacity-30"></div>
      </div>

      {/* Selected Segment Story */}
      {selectedSegment && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div 
                className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-gray-800"
                style={{ backgroundColor: selectedSegment.color }}
              >
                📚
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-green-800">{selectedSegment.era}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {selectedSegment.technique}
                </span>
              </div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">{selectedSegment.master}</h4>
              <p className="text-sm text-gray-700 italic leading-relaxed">
                "{selectedSegment.story}"
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>🐢</span>
              <span>From Steddie's Shell Palace - Segment {shellSegments.indexOf(selectedSegment) + 1} of {shellSegments.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Introduction */}
      {!selectedSegment && (
        <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-2">🐢 Steddie's Shell Palace</h3>
          <p className="text-sm text-green-700 mb-4">
            "I've carried the secrets of memory masters on my shell for over 2,500 years. 
            Each segment holds the wisdom of a different era. Click on any segment to hear my stories."
          </p>
          <p className="text-xs text-green-600 italic">
            "Slow and steady wins the race - and builds the strongest memories."
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for use in other components
export function SteddieWisdom({ era, compact = false }: { era: string; compact?: boolean }) {
  const segment = shellSegments.find(s => s.era.includes(era));
  
  if (!segment) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
        <div className="w-8 h-8">
          <Steddie />
        </div>
        <div className="text-xs text-green-700 italic">
          "{segment.story.substring(0, 100)}..."
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12">
          <Steddie />
        </div>
        <div>
          <h4 className="font-semibold text-green-800 mb-1">
            Steddie's Memory: {segment.era}
          </h4>
          <p className="text-sm text-green-700 italic">
            "{segment.story}"
          </p>
          <div className="mt-2 text-xs text-green-600">
            — Witnessed with {segment.master}
          </div>
        </div>
      </div>
    </div>
  );
}

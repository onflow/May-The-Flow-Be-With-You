"use client";

import React from "react";
import { useRouter } from "next/navigation";

const weeks = [
  { name: "Randomness Revolution", path: "/randomness-revolution" },
  { name: "Actually Fun Games", path: "/actually-fun-games" },
  { name: "Generative Art & Worlds", path: "/generative-art-worlds" },
  { name: "AI & LLMs", path: "/ai-and-llms" },
];

export const Nav = () => {
  const router = useRouter();
  return (
    <nav className="flex items-center justify-between p-4">
      <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        🧠 Memoreee
      </div>
      <div className="flex gap-2">
        {weeks.map((w, index) => (
          <button
            key={w.path}
            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-gray-700 font-medium transition-all duration-200 text-sm"
            onClick={() => router.push(w.path)}
          >
            {index === 0
              ? "🎲"
              : index === 1
              ? "🎮"
              : index === 2
              ? "🎨"
              : "🤖"}
          </button>
        ))}
      </div>
    </nav>
  );
};

"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../shared/providers/AuthProvider";
import { Steddie } from "../../shared/components/Steddie";

const games = [
  {
    name: "Grecian Roman",
    path: "/randomness-revolution",
    description: "Classical wisdom and ancient memory techniques",
    icon: "🏛️",
  },
  {
    name: "African Oral Tradition",
    path: "/actually-fun-games",
    description: "Griot rhythm techniques and storytelling mastery",
    icon: "🥁",
  },
  {
    name: "Aboriginal Dreamtime",
    path: "/generative-art-worlds",
    description: "Indigenous memory landscapes and visual storytelling",
    icon: "🎨",
  },
  {
    name: "Buddhist Confucian",
    path: "/ai-and-llms",
    description: "Eastern contemplative practices and mindful memory",
    icon: "🧘",
  },
];

export default function GamesHub() {
  const { user } = useAuth();
  const router = useRouter();

  // No auth gate - allow anonymous users to access games

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Choose Your Path
      </h1>
      <p className="mb-6 text-gray-600 text-center max-w-2xl">
        Explore memory traditions from around the world. Each culture offers
        unique wisdom and techniques perfected over millennia.
      </p>
      <Steddie />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-3xl">
        {games.map((game) => (
          <Link key={game.path} href={game.path}>
            <div className="cursor-pointer p-6 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-200 hover:border-indigo-300">
              <div className="text-4xl mb-3 text-center">{game.icon}</div>
              <div className="text-xl font-semibold text-gray-800 mb-2 text-center">
                {game.name}
              </div>
              <div className="text-gray-600 text-sm text-center">
                {game.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

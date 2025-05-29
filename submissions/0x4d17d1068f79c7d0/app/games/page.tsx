"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Steddie } from "../../shared/components/Steddie";

const games = [
  {
    name: "Randomness Revolution",
    path: "/randomness-revolution",
    description: "Unpredictable memory challenges using on-chain randomness."
  },
  {
    name: "Actually Fun Games",
    path: "/actually-fun-games",
    description: "Competitive and cooperative memory games."
  },
  {
    name: "Generative Art & Worlds",
    path: "/generative-art-worlds",
    description: "Build and explore generative 3D memory palaces."
  },
  {
    name: "AI & LLMs",
    path: "/ai-and-llms",
    description: "AI-generated memory stories and adaptive training."
  }
];

export default function GamesHub() {
  const session = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  if (!session) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2">Games Hub</h1>
      <p className="mb-6 text-gray-600">Choose a memory challenge to begin your training with Steddie.</p>
      <Steddie />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-2xl">
        {games.map((game) => (
          <Link key={game.path} href={game.path}>
            <div className="cursor-pointer p-6 bg-white rounded-xl shadow hover:shadow-lg transition border border-green-100">
              <div className="text-xl font-semibold text-green-800 mb-1">{game.name}</div>
              <div className="text-gray-500 text-sm">{game.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

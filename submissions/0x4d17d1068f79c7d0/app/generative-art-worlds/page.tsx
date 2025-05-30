"use client";
import React from "react";
import { Steddie } from "../../shared/components/Steddie";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function GenerativeArtWorldsPage() {
  const session = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        🎨 Generative Art & Worlds
      </h1>
      <p className="text-gray-600 text-center mb-8 max-w-2xl">
        What the mind conceives, technology can render. Transform abstract
        memory techniques into visual, interactive experiences.
      </p>

      <Steddie />

      <div className="mt-8 p-6 bg-purple-50 rounded-xl border border-purple-200 max-w-md text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <h3 className="text-xl font-bold text-purple-800 mb-2">
          Coming in Week 3!
        </h3>
        <p className="text-purple-700 text-sm">
          Visual Memory Palace Builder - Create and explore beautiful 2D memory
          environments with procedural generation and artistic flair.
        </p>
      </div>
    </div>
  );
}

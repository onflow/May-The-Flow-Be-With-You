"use client";
import React from "react";
import { Steddie } from "../../shared/components/Steddie";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function AIAndLLMsPage() {
  const session = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
        🤖 AI & LLMs
      </h1>
      <p className="text-gray-600 text-center mb-8 max-w-2xl">
        When ancient wisdom meets artificial intelligence. Personalized AI
        coaching that adapts to your learning patterns and provides infinite
        practice content.
      </p>

      <Steddie />

      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 max-w-md text-center">
        <div className="text-4xl mb-4">🧠</div>
        <h3 className="text-xl font-bold text-blue-800 mb-2">
          Coming in Week 4!
        </h3>
        <p className="text-blue-700 text-sm">
          AI Memory Coach - Get personalized training recommendations, adaptive
          exercises, and conversational practice with Steddie as your AI guide.
        </p>
      </div>
    </div>
  );
}

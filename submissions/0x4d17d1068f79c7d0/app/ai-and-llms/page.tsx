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
      <h1 className="text-2xl font-bold mb-2">AI & LLMs</h1>
      <Steddie />
      <p className="mt-4 text-gray-600">
        AI-generated memory stories and adaptive training.
        <br />
        [Mini-app coming soon!]
      </p>
    </div>
  );
}

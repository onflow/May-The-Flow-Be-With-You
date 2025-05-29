"use client";
import React, { useEffect } from "react";
import { useAuth } from "../../shared/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Sheet } from "@silk-hq/components";

// Force dynamic rendering (no prerendering)
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { user, loading, signInWithFlow, signInWithSupabase } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to Memoreee
        </h1>
        <p className="text-gray-600 max-w-md">
          Choose your preferred way to sign in and start your memory training
          journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Flow Wallet Auth */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center space-y-4">
            <div className="text-4xl">🌊</div>
            <h3 className="text-xl font-bold text-gray-800">Flow Wallet</h3>
            <p className="text-sm text-gray-600">
              Connect your Flow wallet for Web3 features, NFT achievements, and
              on-chain progress
            </p>
            <button
              onClick={signInWithFlow}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
            >
              Connect Flow Wallet
            </button>
            <div className="text-xs text-gray-500">
              ✨ Earn NFT achievements • 🏆 On-chain leaderboards
            </div>
          </div>
        </div>

        {/* Traditional Auth */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <h3 className="text-xl font-bold text-gray-800">Email / Google</h3>
            <p className="text-sm text-gray-600">
              Sign in with email or Google for quick access to all memory
              training features
            </p>
            <button
              onClick={signInWithSupabase}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
            >
              Continue with Google
            </button>
            <div className="text-xs text-gray-500">
              🚀 Quick setup • 💾 Cloud sync • 📊 Progress tracking
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 max-w-md">
        <p>
          Both options give you full access to Memoreee's memory training
          features. Flow wallet users get additional Web3 benefits like NFT
          achievements.
        </p>
      </div>
    </div>
  );
}

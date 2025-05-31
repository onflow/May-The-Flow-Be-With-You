"use client";

import React from "react";
import { useAuth, UserTier } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";

interface UserTierStatusProps {
  showUpgradePrompt?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserTierStatus({ 
  showUpgradePrompt = true, 
  compact = false,
  className = "" 
}: UserTierStatusProps) {
  const { user, userTier, getUserCapabilities, getUserExperience } = useAuth();
  const router = useRouter();
  const capabilities = getUserCapabilities();
  const experience = getUserExperience();

  const getTierInfo = (tier: UserTier) => {
    switch (tier) {
      case "anonymous":
        return {
          name: "Anonymous Player",
          icon: "👤",
          color: "gray",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700",
          description: "Playing without an account",
          benefits: ["✅ Play all games", "❌ No progress tracking", "❌ No leaderboards", "❌ No achievements"],
          limitations: ["Limited to 7 cards difficulty", "No score tracking", "No NFT rewards"],
        };
      case "supabase":
        return {
          name: "Email Player",
          icon: "📧",
          color: "blue",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
          description: "Signed in with email",
          benefits: ["✅ Progress tracking", "✅ Leaderboards (80% scoring)", "✅ Achievements", "❌ No blockchain features"],
          limitations: ["80% score multiplier", "No VRF verification", "No NFT rewards"],
        };
      case "flow":
        return {
          name: "Flow Wallet Player",
          icon: "⛓️",
          color: "purple",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          textColor: "text-purple-700",
          description: "Connected with Flow wallet",
          benefits: ["✅ Full scoring (100%)", "✅ VRF verification", "✅ NFT achievements", "✅ On-chain leaderboards"],
          limitations: [],
        };
    }
  };

  const tierInfo = getTierInfo(userTier);

  const handleUpgrade = () => {
    if (userTier === "anonymous") {
      router.push("/login");
    } else if (userTier === "supabase") {
      // Show Flow wallet connection option
      router.push("/login?upgrade=flow");
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${tierInfo.bgColor} ${tierInfo.borderColor} border ${className}`}>
        <span className="text-lg">{tierInfo.icon}</span>
        <span className={`font-medium ${tierInfo.textColor}`}>
          {tierInfo.name}
        </span>
        {capabilities.scoreMultiplier > 0 && (
          <span className={`text-xs ${tierInfo.textColor} opacity-75`}>
            {Math.round(capabilities.scoreMultiplier * 100)}% scoring
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 ${tierInfo.borderColor} ${tierInfo.bgColor} p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{tierInfo.icon}</div>
          <div>
            <h3 className={`font-bold text-lg ${tierInfo.textColor}`}>
              {tierInfo.name}
            </h3>
            <p className={`text-sm ${tierInfo.textColor} opacity-75`}>
              {tierInfo.description}
            </p>
          </div>
        </div>
        
        {user && (
          <div className={`text-xs ${tierInfo.textColor} opacity-60`}>
            {user.profile?.name || user.email || `${user.id.slice(0, 8)}...`}
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="space-y-3">
        {/* Current Benefits */}
        <div>
          <h4 className={`text-sm font-medium ${tierInfo.textColor} mb-2`}>
            Current Features
          </h4>
          <div className="space-y-1">
            {tierInfo.benefits.map((benefit, index) => (
              <div key={index} className={`text-xs ${tierInfo.textColor} opacity-80`}>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Info */}
        {capabilities.scoreMultiplier > 0 && (
          <div className={`p-2 rounded ${tierInfo.bgColor} border ${tierInfo.borderColor}`}>
            <div className={`text-xs font-medium ${tierInfo.textColor}`}>
              Score Multiplier: {Math.round(capabilities.scoreMultiplier * 100)}%
            </div>
            {capabilities.maxDifficulty && (
              <div className={`text-xs ${tierInfo.textColor} opacity-75`}>
                Max Difficulty: {capabilities.maxDifficulty} cards
              </div>
            )}
          </div>
        )}

        {/* Limitations */}
        {tierInfo.limitations.length > 0 && (
          <div>
            <h4 className={`text-sm font-medium ${tierInfo.textColor} mb-2`}>
              Limitations
            </h4>
            <div className="space-y-1">
              {tierInfo.limitations.map((limitation, index) => (
                <div key={index} className={`text-xs ${tierInfo.textColor} opacity-60`}>
                  • {limitation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {showUpgradePrompt && experience.showUpgradePrompts && (
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={handleUpgrade}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                userTier === "anonymous"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              }`}
            >
              {userTier === "anonymous" 
                ? "🚀 Sign Up for Progress Tracking" 
                : "⛓️ Connect Flow Wallet for Full Features"
              }
            </button>
            
            {userTier === "anonymous" && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                Track your progress, earn achievements, and join leaderboards
              </div>
            )}
            
            {userTier === "supabase" && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                Unlock 100% scoring, VRF verification, and NFT rewards
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick tier badge component for use in headers/navbars
export function UserTierBadge({ className = "" }: { className?: string }) {
  return <UserTierStatus compact showUpgradePrompt={false} className={className} />;
}

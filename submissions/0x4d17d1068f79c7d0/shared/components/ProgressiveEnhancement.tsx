"use client";

import React, { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useGame } from "../providers/GameProvider";
import { useRouter } from "next/navigation";

interface ProgressiveEnhancementProps {
  gameResult?: {
    score: number;
    accuracy: number;
    perfect: boolean;
  };
  achievements?: any[];
  showInline?: boolean;
  className?: string;
}

export function ProgressiveEnhancement({ 
  gameResult, 
  achievements = [], 
  showInline = false,
  className = "" 
}: ProgressiveEnhancementProps) {
  const { user } = useAuth();
  const { gameMode } = useGame();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is already authenticated or if dismissed
  if (user || dismissed) return null;

  // Don't show for on-chain mode (shouldn't happen without auth anyway)
  if (gameMode === 'onchain') return null;

  const handleSignUp = () => {
    router.push('/login?signup=true');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Inline version for showing during gameplay
  if (showInline) {
    return (
      <div className={`progressive-enhancement-inline ${className}`}>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 dark:text-blue-400">💡</span>
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Sign up to save your progress and compete!
              </span>
            </div>
            <button
              onClick={handleSignUp}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Post-game enhancement prompts
  return (
    <div className={`progressive-enhancement ${className}`}>
      {/* Anonymous User Post-Game Prompt */}
      {gameResult && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-4">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Great Score! Don't Lose Your Progress
            </h3>
            <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              Score: <span className="font-bold text-green-600">{gameResult.score}</span>
              {gameResult.perfect && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  🏆 Perfect!
                </span>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Email Signup Benefits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">📧</span>
                  Save Your Progress
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Progress saved across devices
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Community leaderboards
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Achievement tracking
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Social features
                  </li>
                </ul>
              </div>

              {/* Web3 Benefits Preview */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">🏆</span>
                  Competitive Mode
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-center">
                    <span className="text-purple-500 mr-2">⭐</span>
                    Verifiable randomness
                  </li>
                  <li className="flex items-center">
                    <span className="text-purple-500 mr-2">⭐</span>
                    NFT achievements
                  </li>
                  <li className="flex items-center">
                    <span className="text-purple-500 mr-2">⭐</span>
                    Global tournaments
                  </li>
                  <li className="flex items-center">
                    <span className="text-purple-500 mr-2">⭐</span>
                    Blockchain verification
                  </li>
                </ul>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  Requires Flow wallet
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSignUp}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📧 Sign Up to Save Progress
              </button>
              <button
                onClick={handleDismiss}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Unlock Prompt */}
      {achievements.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🏆</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Achievement Unlocked!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                You've earned achievements! Sign up to save them permanently and unlock NFT versions.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {achievements.slice(0, 3).map((achievement, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs"
                  >
                    {achievement.icon} {achievement.name}
                  </span>
                ))}
                {achievements.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                    +{achievements.length - 3} more
                  </span>
                )}
              </div>
              <button
                onClick={handleSignUp}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
              >
                Save Achievements
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* General Feature Comparison */}
      {!gameResult && achievements.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🚀 Unlock More Features
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You're playing anonymously. Sign up to unlock social features and save your progress!
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  📧 With Email Account
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ Save progress across devices</li>
                  <li>✓ Community leaderboards</li>
                  <li>✓ Achievement tracking</li>
                  <li>✓ Social features</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  🏆 With Flow Wallet
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>⭐ Everything above PLUS:</li>
                  <li>⭐ NFT achievements</li>
                  <li>⭐ Verifiable randomness</li>
                  <li>⭐ Global tournaments</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSignUp}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleDismiss}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact banner version for top of pages
export function AnonymousUserBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (user || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 text-center">
      <div className="flex items-center justify-center space-x-4">
        <span className="text-sm">
          🎮 Playing anonymously? Sign up to save progress and compete!
        </span>
        <button
          onClick={() => router.push('/login?signup=true')}
          className="px-4 py-1 bg-white text-blue-600 text-sm rounded-full hover:bg-gray-100 transition-colors"
        >
          Sign Up
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

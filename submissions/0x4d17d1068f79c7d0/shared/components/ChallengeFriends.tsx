"use client";

import React, { useState } from "react";
import { useAuth } from "../providers/AuthProvider";

interface Challenge {
  id: string;
  gameType: string;
  difficulty: string;
  score: number;
  accuracy: number;
  challengerName: string;
  message: string;
  shareUrl: string;
}

export function ChallengeFriends({
  gameType,
  score,
  accuracy,
  difficulty,
}: {
  gameType: string;
  score: number;
  accuracy: number;
  difficulty: string;
}) {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [shareMethod, setShareMethod] = useState<"link" | "social" | null>(
    null
  );
  const [customMessage, setCustomMessage] = useState("");

  const challengeData: Challenge = {
    id: `challenge-${Date.now()}`,
    gameType,
    difficulty,
    score,
    accuracy,
    challengerName:
      (user as any)?.user_metadata?.full_name || user?.email || "Anonymous",
    message:
      customMessage ||
      `I just scored ${score} points with ${accuracy}% accuracy on ${gameType}! Think you can beat me?`,
    shareUrl: `${window.location.origin}/challenge/${gameType}?score=${score}&difficulty=${difficulty}`,
  };

  const shareMessages = {
    twitter: `🧠 Memory Challenge Alert! 🧠\n\nI just scored ${score} points with ${accuracy}% accuracy on Memory Speed Challenge!\n\nThink you can beat me? Try it here: ${challengeData.shareUrl}\n\n#MemoryTraining #BrainGames #Challenge`,

    facebook: `I just crushed a Memory Speed Challenge with ${score} points and ${accuracy}% accuracy! 🧠⚡\n\nThink you've got what it takes to beat my score? Give it a try!`,

    linkedin: `Just completed a memory training challenge with impressive results: ${score} points, ${accuracy}% accuracy! 🧠\n\nMemory training is such a valuable skill for professional development. Anyone else working on cognitive enhancement?`,

    discord: `🧠 **Memory Challenge!** 🧠\n\nJust scored **${score} points** with **${accuracy}% accuracy** on Memory Speed Challenge!\n\nWho thinks they can beat me? 😏\nTry it here: ${challengeData.shareUrl}`,
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);

    try {
      let shareUrl = "";
      const message = shareMessages[platform as keyof typeof shareMessages];

      switch (platform) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            message
          )}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            challengeData.shareUrl
          )}&quote=${encodeURIComponent(message)}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            challengeData.shareUrl
          )}&summary=${encodeURIComponent(message)}`;
          break;
        case "discord":
          // For Discord, we'll copy to clipboard since there's no direct share URL
          await navigator.clipboard.writeText(message);
          alert(
            "Challenge message copied to clipboard! Paste it in your Discord server."
          );
          setIsSharing(false);
          return;
        case "copy":
          await navigator.clipboard.writeText(
            `${challengeData.message}\n\nTry to beat my score: ${challengeData.shareUrl}`
          );
          alert("Challenge link copied to clipboard!");
          setIsSharing(false);
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank", "width=600,height=400");
      }
    } catch (error) {
      console.error("Error sharing challenge:", error);
      alert(
        "Sorry, there was an error sharing your challenge. Please try again."
      );
    } finally {
      setIsSharing(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Sign in to challenge friends!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        🏆 Challenge Friends
      </h3>

      {!shareMethod ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Great score! Want to challenge your friends to beat it?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShareMethod("link")}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <div className="text-2xl mb-1">🔗</div>
              <div className="text-sm font-medium text-blue-800">
                Share Link
              </div>
            </button>

            <button
              onClick={() => setShareMethod("social")}
              className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <div className="text-2xl mb-1">📱</div>
              <div className="text-sm font-medium text-green-800">
                Social Media
              </div>
            </button>
          </div>
        </div>
      ) : shareMethod === "link" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={challengeData.message}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleShare("copy")}
              disabled={isSharing}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
            >
              {isSharing ? "Copying..." : "📋 Copy Challenge Link"}
            </button>

            <button
              onClick={() => setShareMethod(null)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose your platform:</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleShare("twitter")}
              disabled={isSharing}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center disabled:opacity-50"
            >
              <div className="text-2xl mb-1">🐦</div>
              <div className="text-sm font-medium text-blue-800">Twitter</div>
            </button>

            <button
              onClick={() => handleShare("facebook")}
              disabled={isSharing}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center disabled:opacity-50"
            >
              <div className="text-2xl mb-1">📘</div>
              <div className="text-sm font-medium text-blue-800">Facebook</div>
            </button>

            <button
              onClick={() => handleShare("linkedin")}
              disabled={isSharing}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center disabled:opacity-50"
            >
              <div className="text-2xl mb-1">💼</div>
              <div className="text-sm font-medium text-blue-800">LinkedIn</div>
            </button>

            <button
              onClick={() => handleShare("discord")}
              disabled={isSharing}
              className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center disabled:opacity-50"
            >
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-sm font-medium text-purple-800">Discord</div>
            </button>
          </div>

          <button
            onClick={() => setShareMethod(null)}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {/* Challenge Stats Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Your Challenge:
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Game: Memory Speed Challenge ({difficulty})</div>
          <div>Score: {score} points</div>
          <div>Accuracy: {accuracy}%</div>
        </div>
      </div>
    </div>
  );
}

// Simple challenge acceptance component for when someone clicks a challenge link
export function ChallengeAccept({
  challengeData,
}: {
  challengeData: Challenge;
}) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">🏆</div>
        <div>
          <h3 className="font-bold text-yellow-800">
            Challenge from {challengeData.challengerName}!
          </h3>
          <p className="text-sm text-yellow-700">{challengeData.message}</p>
        </div>
      </div>

      <div className="bg-white rounded p-3 mb-3">
        <div className="text-sm space-y-1">
          <div>
            <strong>Target Score:</strong> {challengeData.score} points
          </div>
          <div>
            <strong>Target Accuracy:</strong> {challengeData.accuracy}%
          </div>
          <div>
            <strong>Difficulty:</strong> {challengeData.difficulty}
          </div>
        </div>
      </div>

      <p className="text-sm text-yellow-700 font-medium">
        🎯 Beat their score to win the challenge!
      </p>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Share2, Twitter, Copy, Check } from "lucide-react";

interface SocialShareProps {
  title: string;
  description: string;
  url?: string;
  hashtags?: string[];
  className?: string;
}

export function SocialShare({ 
  title, 
  description, 
  url = typeof window !== 'undefined' ? window.location.href : '',
  hashtags = ['Memoreee', 'MemoryTraining', 'BrainGames'],
  className = ""
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareText = `${title}\n\n${description}`;
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
  const fullShareText = `${shareText}\n\n${hashtagString}\n\n${url}`;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=${encodeURIComponent(hashtags.join(','))}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-64">
            <h4 className="font-semibold text-gray-800 mb-3">Share your achievement</h4>
            
            <div className="space-y-2">
              {/* Twitter Share */}
              <button
                onClick={handleTwitterShare}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <Twitter className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Share on Twitter</div>
                  <div className="text-xs text-gray-600">Post to your timeline</div>
                </div>
              </button>

              {/* Native Share (if supported) */}
              {supportsNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Share</div>
                    <div className="text-xs text-gray-600">Use device share menu</div>
                  </div>
                </button>
              )}

              {/* Copy to Clipboard */}
              <button
                onClick={handleCopyToClipboard}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {copied ? 'Ready to paste anywhere' : 'Copy shareable text'}
                  </div>
                </div>
              </button>
            </div>

            {/* Preview */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Preview:</div>
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 max-h-24 overflow-y-auto">
                {fullShareText}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface AchievementShareProps {
  achievementName: string;
  description: string;
  points: number;
  icon: string;
  className?: string;
}

export function AchievementShare({ 
  achievementName, 
  description, 
  points, 
  icon,
  className = ""
}: AchievementShareProps) {
  const title = `🏆 Achievement Unlocked: ${achievementName}`;
  const shareDescription = `I just earned "${achievementName}" (+${points} points) in Memoreee! ${description}`;

  return (
    <SocialShare
      title={title}
      description={shareDescription}
      hashtags={['Memoreee', 'MemoryTraining', 'Achievement', 'BrainGames']}
      className={className}
    />
  );
}

interface GameScoreShareProps {
  gameType: string;
  score: number;
  accuracy: number;
  className?: string;
}

export function GameScoreShare({ 
  gameType, 
  score, 
  accuracy,
  className = ""
}: GameScoreShareProps) {
  const gameNames: Record<string, string> = {
    'random_palace': 'Random Palace Generator',
    'chaos_cards': 'Chaos Cards',
    'entropy_storytelling': 'Entropy Storytelling',
  };

  const gameName = gameNames[gameType] || gameType;
  const title = `🎯 New High Score in ${gameName}!`;
  const shareDescription = `I just scored ${score} points with ${accuracy.toFixed(1)}% accuracy in ${gameName} on Memoreee! Can you beat my score?`;

  return (
    <SocialShare
      title={title}
      description={shareDescription}
      hashtags={['Memoreee', 'MemoryTraining', 'HighScore', 'BrainGames', 'Challenge']}
      className={className}
    />
  );
}

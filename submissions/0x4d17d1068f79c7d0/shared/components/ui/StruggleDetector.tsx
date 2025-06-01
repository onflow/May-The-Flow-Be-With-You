"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StruggleDetectorProps {
  gameType: string;
  currentScore: number;
  accuracy: number;
  attempts: number;
  onNudgeShown?: () => void;
  className?: string;
}

interface StruggleMetrics {
  lowScoreStreak: number;
  lowAccuracyStreak: number;
  totalAttempts: number;
  averageScore: number;
  averageAccuracy: number;
  lastNudgeTime: number;
}

export function StruggleDetector({
  gameType,
  currentScore,
  accuracy,
  attempts,
  onNudgeShown,
  className = ""
}: StruggleDetectorProps) {
  const router = useRouter();
  const [showNudge, setShowNudge] = useState(false);
  const [metrics, setMetrics] = useState<StruggleMetrics>({
    lowScoreStreak: 0,
    lowAccuracyStreak: 0,
    totalAttempts: 0,
    averageScore: 0,
    averageAccuracy: 0,
    lastNudgeTime: 0
  });

  // Define struggle thresholds based on game type
  const getThresholds = (gameType: string) => {
    switch (gameType) {
      case 'chaos_cards':
        return {
          lowScoreThreshold: 300,
          lowAccuracyThreshold: 50,
          streakTrigger: 3,
          minAttempts: 3,
          nudgeCooldown: 5 * 60 * 1000 // 5 minutes
        };
      case 'speed_challenge':
        return {
          lowScoreThreshold: 400,
          lowAccuracyThreshold: 60,
          streakTrigger: 3,
          minAttempts: 3,
          nudgeCooldown: 5 * 60 * 1000
        };
      case 'memory_palace':
        return {
          lowScoreThreshold: 500,
          lowAccuracyThreshold: 70,
          streakTrigger: 2,
          minAttempts: 2,
          nudgeCooldown: 5 * 60 * 1000
        };
      default:
        return {
          lowScoreThreshold: 400,
          lowAccuracyThreshold: 60,
          streakTrigger: 3,
          minAttempts: 3,
          nudgeCooldown: 5 * 60 * 1000
        };
    }
  };

  // Update metrics when game results come in
  useEffect(() => {
    if (attempts === 0) return;

    const thresholds = getThresholds(gameType);
    const isLowScore = currentScore < thresholds.lowScoreThreshold;
    const isLowAccuracy = accuracy < thresholds.lowAccuracyThreshold;

    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        totalAttempts: attempts,
        averageScore: ((prev.averageScore * (attempts - 1)) + currentScore) / attempts,
        averageAccuracy: ((prev.averageAccuracy * (attempts - 1)) + accuracy) / attempts,
        lowScoreStreak: isLowScore ? prev.lowScoreStreak + 1 : 0,
        lowAccuracyStreak: isLowAccuracy ? prev.lowAccuracyStreak + 1 : 0
      };

      // Check if we should show nudge
      const shouldShowNudge = shouldTriggerNudge(newMetrics, thresholds);
      if (shouldShowNudge && !showNudge) {
        setShowNudge(true);
        onNudgeShown?.();
      }

      return newMetrics;
    });
  }, [currentScore, accuracy, attempts, gameType]);

  // Determine if we should show the struggle nudge
  const shouldTriggerNudge = (metrics: StruggleMetrics, thresholds: any): boolean => {
    const now = Date.now();
    const timeSinceLastNudge = now - metrics.lastNudgeTime;
    
    // Don't show nudge too frequently
    if (timeSinceLastNudge < thresholds.nudgeCooldown) {
      return false;
    }

    // Need minimum attempts
    if (metrics.totalAttempts < thresholds.minAttempts) {
      return false;
    }

    // Check for struggle patterns
    const hasLowScoreStreak = metrics.lowScoreStreak >= thresholds.streakTrigger;
    const hasLowAccuracyStreak = metrics.lowAccuracyStreak >= thresholds.streakTrigger;
    const hasPoorOverallPerformance = metrics.averageAccuracy < thresholds.lowAccuracyThreshold && metrics.totalAttempts >= 5;

    return hasLowScoreStreak || hasLowAccuracyStreak || hasPoorOverallPerformance;
  };

  // Handle user accepting the nudge
  const handleAcceptNudge = () => {
    setMetrics(prev => ({ ...prev, lastNudgeTime: Date.now() }));
    setShowNudge(false);
    router.push('/?chat=true'); // Open home page with Steddie chat
  };

  // Handle user dismissing the nudge
  const handleDismissNudge = () => {
    setMetrics(prev => ({ ...prev, lastNudgeTime: Date.now() }));
    setShowNudge(false);
  };

  // Get encouraging message based on game type
  const getEncouragingMessage = (gameType: string) => {
    switch (gameType) {
      case 'chaos_cards':
        return {
          title: "Having trouble with the sequence?",
          message: "The Linking Method can make these cards much easier to remember! Steddie can teach you how to create memorable stories.",
          technique: "Linking Method"
        };
      case 'speed_challenge':
        return {
          title: "Numbers feeling overwhelming?",
          message: "The Major System turns numbers into words, making them much easier to remember! Let Steddie show you the technique.",
          technique: "Major System"
        };
      case 'memory_palace':
        return {
          title: "Palace construction challenging?",
          message: "Building memory palaces is an art! Steddie has 2,500 years of wisdom about the Method of Loci to share.",
          technique: "Method of Loci"
        };
      default:
        return {
          title: "Finding this challenging?",
          message: "Memory techniques can make this much easier! Steddie has ancient wisdom to help you improve.",
          technique: "Memory Techniques"
        };
    }
  };

  if (!showNudge) return null;

  const encouragement = getEncouragingMessage(gameType);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-green-200">
        {/* Steddie Avatar */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🐢
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {encouragement.title}
          </h3>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            {encouragement.message}
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <span className="font-semibold">💡 Recommended:</span>
              <span className="bg-green-100 px-2 py-1 rounded text-sm font-medium">
                {encouragement.technique}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            "Slow and steady builds the strongest memories!" - Steddie
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAcceptNudge}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🎓</span>
            Learn with Steddie
          </button>
          
          <button
            onClick={handleDismissNudge}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Keep Trying
          </button>
        </div>

        {/* Performance Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div>Attempts: {metrics.totalAttempts} • Avg Accuracy: {Math.round(metrics.averageAccuracy)}%</div>
            <div className="text-green-600">💚 We believe in your potential!</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy integration
export function useStruggleDetection(gameType: string) {
  const [gameSession, setGameSession] = useState({
    attempts: 0,
    scores: [] as number[],
    accuracies: [] as number[]
  });

  const recordAttempt = (score: number, accuracy: number) => {
    setGameSession(prev => ({
      attempts: prev.attempts + 1,
      scores: [...prev.scores, score],
      accuracies: [...prev.accuracies, accuracy]
    }));
  };

  const resetSession = () => {
    setGameSession({
      attempts: 0,
      scores: [],
      accuracies: []
    });
  };

  const getCurrentStats = () => {
    const { scores, accuracies, attempts } = gameSession;
    return {
      attempts,
      currentScore: scores[scores.length - 1] || 0,
      accuracy: accuracies[accuracies.length - 1] || 0,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      averageAccuracy: accuracies.length > 0 ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : 0
    };
  };

  return {
    recordAttempt,
    resetSession,
    getCurrentStats,
    gameSession
  };
}

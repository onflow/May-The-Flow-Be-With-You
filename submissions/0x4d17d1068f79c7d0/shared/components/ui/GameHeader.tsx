"use client";

import React from "react";
import { GamePhase, DifficultyLevel } from "../../types/game";
import { formatTime, calculateProgress } from "../../utils/gameUtils";

interface GameHeaderProps {
  phase: GamePhase;
  score: number;
  timeLeft?: number;
  maxTime?: number;
  difficulty?: DifficultyLevel;
  onDifficultyChange?: (difficulty: DifficultyLevel) => void;
  onStart?: () => void;
  isLoading?: boolean;
  gameTitle: string;
  phaseDescription?: string;
  showTimer?: boolean;
  timerColor?: string;
}

export function GameHeader({
  phase,
  score,
  timeLeft,
  maxTime,
  difficulty = "medium",
  onDifficultyChange,
  onStart,
  isLoading = false,
  gameTitle,
  phaseDescription,
  showTimer = true,
  timerColor = "blue",
}: GameHeaderProps) {
  const getPhaseColor = (currentPhase: GamePhase) => {
    switch (currentPhase) {
      case "setup": return "gray";
      case "study": case "memorize": return "blue";
      case "chaos": return "purple";
      case "recall": return "green";
      case "results": return "indigo";
      default: return "gray";
    }
  };

  const phaseColor = getPhaseColor(phase);
  const progress = maxTime && timeLeft ? calculateProgress(maxTime - timeLeft, maxTime) : 0;

  return (
    <div className={`mb-6 p-4 bg-gradient-to-r from-${phaseColor}-50 to-${phaseColor}-100 rounded-lg border border-${phaseColor}-200`}>
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <h2 className="text-xl font-bold text-gray-800">{gameTitle}</h2>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-semibold">Phase:</span>{" "}
              <span className={`capitalize text-${phaseColor}-700 font-medium`}>
                {phase}
              </span>
            </div>
            <div>
              <span className="font-semibold">Score:</span>{" "}
              <span className="text-gray-800 font-medium">{score}</span>
            </div>
            {showTimer && timeLeft !== undefined && (
              <div>
                <span className="font-semibold">Time:</span>{" "}
                <span className={`text-${timerColor}-700 font-medium`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Setup Controls */}
        {phase === "setup" && (
          <div className="flex gap-2 items-center">
            {onDifficultyChange && (
              <select
                value={difficulty}
                onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
                className={`px-3 py-1 border border-${phaseColor}-300 rounded text-sm bg-white`}
                disabled={isLoading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            )}
            {onStart && (
              <button
                onClick={onStart}
                disabled={isLoading}
                className={`px-6 py-2 bg-${phaseColor}-500 text-white rounded-lg hover:bg-${phaseColor}-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Loading...
                  </div>
                ) : (
                  "Start Game"
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Phase Description */}
      {phaseDescription && (
        <div className="text-center mb-4">
          <p className={`text-lg font-medium text-${phaseColor}-800`}>
            {phaseDescription}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {showTimer && maxTime && timeLeft !== undefined && timeLeft > 0 && (
        <div className="w-full">
          <div className={`w-full bg-${phaseColor}-200 rounded-full h-2`}>
            <div
              className={`bg-${timerColor}-500 h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${(timeLeft / maxTime) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized headers for different game phases
export function StudyHeader(props: Omit<GameHeaderProps, "phase" | "phaseDescription">) {
  return (
    <GameHeader
      {...props}
      phase="study"
      phaseDescription="Study the items carefully!"
      timerColor="blue"
    />
  );
}

export function ChaosHeader(props: Omit<GameHeaderProps, "phase" | "phaseDescription">) {
  return (
    <GameHeader
      {...props}
      phase="chaos"
      phaseDescription="🌪️ CHAOS MODE - Items are shuffling!"
      timerColor="purple"
    />
  );
}

export function RecallHeader(props: Omit<GameHeaderProps, "phase" | "phaseDescription">) {
  return (
    <GameHeader
      {...props}
      phase="recall"
      phaseDescription="Recall the items in the correct order!"
      timerColor="green"
    />
  );
}

export function ResultsHeader(props: Omit<GameHeaderProps, "phase" | "phaseDescription" | "showTimer">) {
  return (
    <GameHeader
      {...props}
      phase="results"
      phaseDescription="🏆 Game Complete!"
      showTimer={false}
    />
  );
}

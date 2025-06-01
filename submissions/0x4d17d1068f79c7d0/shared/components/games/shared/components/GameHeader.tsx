"use client";

import React from "react";
import { CulturalTheme } from "../../../../config/culturalThemes";
import { ModeSelector } from "../../../ModeSelector";
import { VRFBadge } from "../../../VRFVerification";
import { VRFVerification } from "../types";

interface GameHeaderProps {
  theme: CulturalTheme;
  gameInfo: any;
  gameIcon: string;
  gameMode: "offchain" | "onchain";
  lastVerification?: VRFVerification | null;
  showModeSelector: boolean;
  onToggleModeSelector: () => void;
  onCloseModeSelector: () => void;
  gameType: string;
}

export function GameHeader({
  theme,
  gameInfo,
  gameIcon,
  gameMode,
  lastVerification,
  showModeSelector,
  onToggleModeSelector,
  onCloseModeSelector,
  gameType,
}: GameHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {gameIcon}
          </div>
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: theme.colors.primary }}
            >
              {gameInfo.title}
            </h1>
            <p className="text-gray-600 mt-1">{gameInfo.description}</p>
          </div>
        </div>

        {/* Game Mode and VRF Indicators */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={onToggleModeSelector}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {gameMode === "offchain" ? "Practice Mode" : "Blockchain Mode"}
          </button>

          {lastVerification && (
            <VRFBadge verificationData={lastVerification} gameMode={gameMode} />
          )}
        </div>

        {/* Cultural Context */}
        <div
          className="p-4 rounded-lg border-l-4 text-left max-w-2xl mx-auto"
          style={{
            backgroundColor: theme.colors.background,
            borderLeftColor: theme.colors.primary,
          }}
        >
          <h3
            className="font-semibold mb-2"
            style={{ color: theme.colors.primary }}
          >
            🌍 {theme.name} Memory Training
          </h3>
          <p className="text-sm text-gray-700">{gameInfo.culturalContext}</p>
        </div>
      </div>

      {/* Mode Selector Modal */}
      {showModeSelector && (
        <div className="mb-6">
          <ModeSelector
            currentMode={gameMode}
            onModeChange={(mode) => {
              onCloseModeSelector();
            }}
          />
        </div>
      )}
    </>
  );
}

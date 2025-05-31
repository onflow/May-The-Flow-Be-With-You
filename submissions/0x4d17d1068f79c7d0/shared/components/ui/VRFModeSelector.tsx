"use client";

import React from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useGame } from "../../providers/GameProvider";
import { NetworkStatusBanner } from "./NetworkStatusBanner";

interface VRFModeSelectorProps {
  onModeChange?: (mode: "practice" | "competitive") => void;
  className?: string;
}

export default function VRFModeSelector({
  onModeChange,
  className = "",
}: VRFModeSelectorProps) {
  const { user } = useAuth();
  const { gameMode, switchMode, lastVerification } = useGame();

  const hasFlowWallet = user?.authMethod === "flow" && user?.flowAddress;
  const isVRFAvailable = hasFlowWallet && gameMode === "onchain";

  // Network status is now handled by NetworkStatusBanner

  const handleModeToggle = (mode: "practice" | "competitive") => {
    if (mode === "competitive" && !hasFlowWallet) {
      // Prompt user to connect Flow wallet
      return;
    }

    if (mode === "competitive") {
      switchMode("onchain");
    } else {
      switchMode("offchain");
    }

    onModeChange?.(mode);
  };

  return (
    <div
      className={`bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 border-2 border-gray-600/60 shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🎮 Game Mode
        </h3>
        {isVRFAvailable && lastVerification?.isVerified && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/15 px-3 py-1 rounded-full border border-green-400/30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            VRF Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Practice Mode */}
        <button
          onClick={() => handleModeToggle("practice")}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            gameMode === "offchain"
              ? "bg-blue-600/30 border-blue-400 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
              : "bg-gray-800/60 border-gray-600 text-gray-200 hover:bg-gray-700/60 hover:border-gray-500"
          }`}
        >
          <div className="text-base font-semibold flex items-center gap-2">
            ⚡ Practice
          </div>
          <div className="text-sm opacity-90 mt-2 text-left">
            Instant play • Local randomness
          </div>
        </button>

        {/* Competitive Mode */}
        <button
          onClick={() => handleModeToggle("competitive")}
          disabled={!hasFlowWallet}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            gameMode === "onchain" && hasFlowWallet
              ? "bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/30"
              : hasFlowWallet
              ? "bg-gray-800/60 border-gray-600 text-gray-200 hover:bg-gray-700/60 hover:border-gray-500"
              : "bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed opacity-60"
          }`}
        >
          <div className="text-base font-semibold flex items-center gap-2">
            🏆 Competitive
            {!hasFlowWallet && (
              <span className="text-xs bg-orange-500/30 text-orange-200 px-2 py-1 rounded-full border border-orange-400/30">
                Wallet Required
              </span>
            )}
          </div>
          <div className="text-sm opacity-90 mt-2 text-left">
            {hasFlowWallet ? "Flow VRF • Verifiable" : "Connect Flow wallet"}
          </div>
        </button>
      </div>

      {/* VRF Status */}
      {isVRFAvailable && (
        <div className="mt-4 p-3 bg-purple-500/15 rounded-lg border border-purple-400/30">
          <div className="text-sm text-purple-200">
            <div className="flex items-center justify-between">
              <span className="font-medium">Randomness Source:</span>
              <span className="font-mono text-purple-100 bg-purple-400/20 px-2 py-1 rounded">
                Flow VRF
              </span>
            </div>
            {lastVerification && (
              <div className="flex items-center justify-between mt-2">
                <span className="font-medium">Last Verification:</span>
                <a
                  href={`https://testnet.flowscan.org/transaction/${lastVerification.transactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-purple-100 underline font-medium"
                >
                  View on Explorer →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Status Banner */}
      <NetworkStatusBanner className="mt-4" />

      {/* Connect Wallet Prompt */}
      {!hasFlowWallet && (
        <div className="mt-4 p-3 bg-orange-500/15 rounded-lg border border-orange-400/30">
          <div className="text-sm text-orange-200 font-medium">
            💡 Connect a Flow wallet to access competitive mode with provably
            fair randomness
          </div>
        </div>
      )}
    </div>
  );
}

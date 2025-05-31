"use client";

import React, { useState } from "react";
import { RandomnessVerification } from "../providers/RandomnessProvider";

interface VRFVerificationProps {
  verificationData: RandomnessVerification | null;
  gameMode: "offchain" | "onchain";
  className?: string;
}

export function VRFVerification({
  verificationData,
  gameMode,
  className = "",
}: VRFVerificationProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!verificationData) {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSeed = (seed: number) => {
    return seed.toString(16).toUpperCase().padStart(8, "0");
  };

  return (
    <div className={`vrf-verification ${className}`}>
      {/* Verification Status Badge */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              verificationData.isVerified
                ? "bg-green-500 animate-pulse"
                : "bg-yellow-500"
            }`}
          ></div>

          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {gameMode === "onchain"
                ? "Flow VRF Randomness"
                : "Local Randomness"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {verificationData.isVerified
                ? "Cryptographically verified on Flow blockchain"
                : "Generated locally for instant gameplay"}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {/* Detailed Verification Info */}
      {showDetails && (
        <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Randomness Details
          </h4>

          <div className="space-y-3">
            {/* Seed Information */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Random Seed
              </span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {formatSeed(verificationData.seed)}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Generated At
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatTimestamp(verificationData.timestamp)}
              </span>
            </div>

            {/* Verification Status */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Verification Status
              </span>
              <span
                className={`text-sm font-medium ${
                  verificationData.isVerified
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {verificationData.isVerified ? "Verified" : "Local Only"}
              </span>
            </div>

            {/* On-Chain Specific Information */}
            {gameMode === "onchain" && verificationData.isVerified && (
              <>
                {verificationData.transactionId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Transaction ID
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {verificationData.transactionId.slice(0, 8)}...
                      </span>
                      {verificationData.verificationUrl && (
                        <a
                          href={verificationData.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {verificationData.blockHeight && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Block Height
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      #{verificationData.blockHeight.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Verification Explanation */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>
                {gameMode === "onchain"
                  ? "Flow VRF Verification:"
                  : "Local Randomness:"}
              </strong>
              <p className="mt-1">
                {gameMode === "onchain"
                  ? "This randomness was generated using Flow's native Verifiable Random Function (VRF), ensuring provably fair and tamper-proof random number generation. The seed can be independently verified on the Flow blockchain."
                  : "This randomness was generated locally using cryptographically secure methods for instant gameplay. While not blockchain-verified, it provides excellent randomness for practice sessions."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {gameMode === "onchain" && verificationData.verificationUrl && (
            <div className="mt-4 flex space-x-3">
              <a
                href={verificationData.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View on Flow Explorer
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    verificationData.transactionId || ""
                  );
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Copy TX ID
              </button>
            </div>
          )}
        </div>
      )}

      {/* Verification Benefits */}
      {gameMode === "onchain" && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-green-900 dark:text-green-100 font-medium">
              <strong>Competitive Advantage:</strong> Your game results are
              cryptographically verified and cannot be manipulated, ensuring
              fair competition in tournaments and leaderboards.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function VRFBadge({
  verificationData,
  gameMode,
}: {
  verificationData: RandomnessVerification | null;
  gameMode: "offchain" | "onchain";
}) {
  if (!verificationData) return null;

  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          verificationData.isVerified ? "bg-green-500" : "bg-yellow-500"
        }`}
      ></div>
      <span className="text-gray-700 dark:text-gray-300">
        {gameMode === "onchain" ? "Flow VRF" : "Local RNG"}
      </span>
      {verificationData.isVerified && (
        <svg
          className="w-3 h-3 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
}

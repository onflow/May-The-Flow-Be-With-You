"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { createGameService } from "../services/GameService";
import { GAME_FEATURES } from "../adapters/GameAdapter";

interface ModeSelectorProps {
  onModeChange: (mode: 'offchain' | 'onchain') => void;
  currentMode: 'offchain' | 'onchain';
  className?: string;
}

export function ModeSelector({ onModeChange, currentMode, className = "" }: ModeSelectorProps) {
  const { user } = useAuth();
  const [gameService, setGameService] = useState(() => createGameService(currentMode));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Update game service when mode changes
  useEffect(() => {
    setGameService(createGameService(currentMode));
  }, [currentMode]);

  const availableFeatures = gameService.getAvailableFeatures();
  const offChainFeatures = GAME_FEATURES.filter(f => !f.requiresOnChain);
  const onChainFeatures = GAME_FEATURES.filter(f => f.requiresOnChain);

  const handleModeSwitch = async (newMode: 'offchain' | 'onchain') => {
    if (newMode === 'onchain' && !user?.flowAddress) {
      // Prompt user to connect Flow wallet
      alert('Please connect your Flow wallet to use on-chain mode');
      return;
    }

    if (newMode === 'onchain' && currentMode === 'offchain') {
      // Show upgrade modal
      setShowUpgradeModal(true);
      return;
    }

    onModeChange(newMode);
  };

  const handleUpgradeToOnChain = async () => {
    if (!user?.flowAddress) return;

    setIsUpgrading(true);
    try {
      // Here we would implement the upgrade logic
      // For now, just switch modes
      onModeChange('onchain');
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Failed to upgrade to on-chain:', error);
      alert('Failed to upgrade to on-chain mode. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className={`mode-selector ${className}`}>
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => handleModeSwitch('offchain')}
          className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
            currentMode === 'offchain'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>🎮</span>
            <span>Practice Mode</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Instant play, local progress
          </div>
        </button>

        <button
          onClick={() => handleModeSwitch('onchain')}
          className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
            currentMode === 'onchain'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          disabled={!user?.flowAddress}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>🏆</span>
            <span>Competitive Mode</span>
            {!user?.flowAddress && <span className="text-xs">🔒</span>}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            NFT achievements, global leaderboards
          </div>
        </button>
      </div>

      {/* Feature Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Off-Chain Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🎮</span>
            Practice Mode Features
          </h3>
          <ul className="space-y-3">
            {offChainFeatures.map((feature) => (
              <li key={feature.id} className="flex items-start space-x-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {feature.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* On-Chain Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            Competitive Mode Features
          </h3>
          <ul className="space-y-3">
            {/* All off-chain features */}
            {offChainFeatures.map((feature) => (
              <li key={feature.id} className="flex items-start space-x-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {feature.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </div>
                </div>
              </li>
            ))}
            {/* Plus on-chain exclusive features */}
            {onChainFeatures.map((feature) => (
              <li key={feature.id} className="flex items-start space-x-3">
                <span className="text-blue-500 mt-0.5">⭐</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {feature.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {!user?.flowAddress && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Connect Flow Wallet</strong> to unlock competitive mode features
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Mode Status */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Current Mode: {currentMode === 'offchain' ? 'Practice' : 'Competitive'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentMode === 'offchain' 
                ? 'Playing locally with instant feedback'
                : 'Playing on Flow blockchain with verifiable results'
              }
            </div>
          </div>
          
          {currentMode === 'onchain' && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upgrade to Competitive Mode
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Upgrading to competitive mode will:
              </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Migrate your current progress to the blockchain</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Convert existing achievements to NFTs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Enable verifiable randomness for fair play</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Access global tournaments and competitions</span>
                </li>
              </ul>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This will require a small transaction fee on Flow blockchain.
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isUpgrading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeToOnChain}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isUpgrading}
              >
                {isUpgrading ? 'Upgrading...' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

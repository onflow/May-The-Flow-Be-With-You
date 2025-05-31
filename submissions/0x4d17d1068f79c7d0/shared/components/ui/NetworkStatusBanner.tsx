"use client";

import React from 'react';
import { useFlowNetworkStatus } from '../../hooks/useFlowNetworkStatus';

interface NetworkStatusBannerProps {
  className?: string;
  showWhenCorrect?: boolean;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ 
  className = '', 
  showWhenCorrect = false 
}) => {
  const { networkStatus, refreshNetworkStatus } = useFlowNetworkStatus();

  // Don't show anything if not connected to Flow
  if (!networkStatus.isConnected) {
    return null;
  }

  // Don't show if network is correct and showWhenCorrect is false
  if (!networkStatus.hasMismatch && !showWhenCorrect) {
    return null;
  }

  // Show loading state
  if (networkStatus.isLoading) {
    return (
      <div className={`p-3 bg-yellow-500/15 rounded-lg border border-yellow-400/30 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
          <span className="text-sm text-yellow-200">Checking network status...</span>
        </div>
      </div>
    );
  }

  // Show success state
  if (!networkStatus.hasMismatch && showWhenCorrect) {
    return (
      <div className={`p-3 bg-green-500/15 rounded-lg border border-green-400/30 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✅</span>
            <span className="text-sm text-green-200 font-medium">
              Connected to {networkStatus.expectedNetwork} network
            </span>
          </div>
          <button
            onClick={refreshNetworkStatus}
            className="text-xs text-green-300 hover:text-green-200 underline"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (networkStatus.hasMismatch) {
    const isMainnetToTestnet = networkStatus.userNetwork === 'mainnet' && networkStatus.expectedNetwork === 'testnet';
    
    return (
      <div className={`p-4 bg-red-500/15 rounded-lg border border-red-400/30 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-200 font-medium">
              ⚠️ <strong>Network Mismatch Detected!</strong>
            </div>
            <button
              onClick={refreshNetworkStatus}
              className="text-xs text-red-300 hover:text-red-200 underline"
            >
              Refresh
            </button>
          </div>
          
          <div className="text-xs text-red-300 space-y-2">
            <div className="flex justify-between">
              <span>App configured for:</span>
              <span className="font-mono bg-red-400/20 px-2 py-1 rounded">
                {networkStatus.expectedNetwork}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Your wallet is on:</span>
              <span className="font-mono bg-red-400/20 px-2 py-1 rounded">
                {networkStatus.userNetwork}
              </span>
            </div>
          </div>

          {networkStatus.message && (
            <div className="p-2 bg-red-400/10 rounded text-red-200 text-xs">
              💡 <strong>How to fix:</strong> {networkStatus.message}
            </div>
          )}

          {isMainnetToTestnet && (
            <div className="p-3 bg-blue-400/10 rounded text-blue-200 text-xs">
              <div className="font-medium mb-2">🔧 Switch to Testnet:</div>
              <div className="space-y-1">
                <div>1. Open your Flow wallet (Blocto, Lilico, etc.)</div>
                <div>2. Look for network settings or preferences</div>
                <div>3. Switch from "Mainnet" to "Testnet"</div>
                <div>4. Refresh this page or reconnect your wallet</div>
              </div>
              <div className="mt-2 text-blue-300 text-xs">
                <strong>Note:</strong> Testnet is required for this demo app. Your mainnet assets are safe.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-red-400/20">
            <span className="text-xs text-red-300">
              On-chain features disabled until network is switched
            </span>
            <span className="text-xs text-red-400 font-mono">
              {networkStatus.canSubmitOnChain ? '✅' : '❌'} VRF Available
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

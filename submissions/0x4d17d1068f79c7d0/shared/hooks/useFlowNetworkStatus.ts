import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { detectNetworkMismatch, detectFlowNetworkFromAddress } from '../config/flow';

export interface NetworkStatus {
  isConnected: boolean;
  userNetwork: string;
  expectedNetwork: string;
  hasMismatch: boolean;
  message?: string;
  isLoading: boolean;
  canSubmitOnChain: boolean;
}

export const useFlowNetworkStatus = () => {
  const { user } = useAuth();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    userNetwork: 'none',
    expectedNetwork: process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet',
    hasMismatch: false,
    isLoading: false,
    canSubmitOnChain: false
  });

  useEffect(() => {
    const checkNetworkStatus = async () => {
      if (!user?.flowAddress || user.authMethod !== 'flow') {
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: false,
          userNetwork: 'none',
          hasMismatch: false,
          isLoading: false,
          canSubmitOnChain: false
        }));
        return;
      }

      setNetworkStatus(prev => ({ ...prev, isLoading: true }));

      try {
        const expectedNetwork = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';
        
        // First try synchronous detection
        const syncMismatch = detectNetworkMismatch(expectedNetwork, user.flowAddress);
        
        // Then try async detection for more accurate results
        const userNetwork = await detectFlowNetworkFromAddress(user.flowAddress);
        const asyncMismatch = detectNetworkMismatch(expectedNetwork, user.flowAddress);
        
        // Use async results if available, fallback to sync
        const finalMismatch = userNetwork !== 'unknown' ? {
          ...asyncMismatch,
          userNetwork
        } : syncMismatch;

        setNetworkStatus({
          isConnected: true,
          userNetwork: finalMismatch.userNetwork,
          expectedNetwork: finalMismatch.expectedNetwork,
          hasMismatch: finalMismatch.hasMismatch,
          message: finalMismatch.message,
          isLoading: false,
          canSubmitOnChain: !finalMismatch.hasMismatch
        });
      } catch (error) {
        console.error('Failed to check network status:', error);
        setNetworkStatus(prev => ({
          ...prev,
          isLoading: false,
          canSubmitOnChain: false
        }));
      }
    };

    checkNetworkStatus();
  }, [user?.flowAddress, user?.authMethod]);

  const refreshNetworkStatus = () => {
    // Trigger a re-check
    setNetworkStatus(prev => ({ ...prev, isLoading: true }));
  };

  return {
    networkStatus,
    refreshNetworkStatus
  };
};

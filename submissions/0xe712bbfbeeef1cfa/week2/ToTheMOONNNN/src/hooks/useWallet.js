import { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';

export const useWallet = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Subscribe to user changes
    fcl.currentUser.subscribe(setUser);
  }, []);

  const connectWallet = async () => {
    try {
      await fcl.authenticate();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return {
    user,
    connectWallet,
    disconnectWallet
  };
}; 
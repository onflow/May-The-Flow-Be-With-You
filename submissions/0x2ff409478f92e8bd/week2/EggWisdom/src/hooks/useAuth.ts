import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import '../services/fcl-config'; // Ensure FCL is configured

interface User {
  addr: string | null;
  loggedIn: boolean;
  cid: string | null;
  expiresAt: number | null;
  f_type: string;
  f_vsn: string;
  services: any[];
}

interface AuthState {
  loggedIn: boolean;
  user: User | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    loggedIn: false,
    user: null,
  });

  // Subscribe to user changes
  useEffect(() => {
    // Return the unsubscribe function from FCL
    const unsub = fcl.currentUser().subscribe((user: any) => {
      setAuthState({
        loggedIn: user.loggedIn,
        user,
      });
    });
    
    return () => {
      unsub();
    };
  }, []);

  // Authentication functions
  const login = () => {
    fcl.authenticate();
  };

  const logout = () => {
    fcl.unauthenticate();
  };

  return {
    ...authState,
    login,
    logout,
  };
}; 
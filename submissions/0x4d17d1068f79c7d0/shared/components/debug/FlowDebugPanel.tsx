"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { flowAuth } from '../../config/flow';
import * as fcl from '@onflow/fcl';

export default function FlowDebugPanel() {
  const { user } = useAuth();
  const [fclUser, setFclUser] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadFclUser = async () => {
      try {
        const currentUser = await fcl.currentUser.snapshot();
        setFclUser(currentUser);
      } catch (error) {
        console.error('Error loading FCL user:', error);
      }
    };

    loadFclUser();
  }, []);

  const handleClearAuth = async () => {
    try {
      await flowAuth.signOut();
      // Reload the page to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const handleConnectFlow = async () => {
    try {
      await flowAuth.signIn();
    } catch (error) {
      console.error('Error connecting Flow wallet:', error);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        🔧 Debug Flow
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md z-50 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">🔧 Flow Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Environment Info */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="font-medium mb-2">🌐 Environment</h4>
          <div className="space-y-1 text-xs">
            <div>Network: <span className="text-green-400">{process.env.NEXT_PUBLIC_FLOW_NETWORK || 'undefined'}</span></div>
            <div>VRF Contract: <span className="text-blue-400">{process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT || 'undefined'}</span></div>
          </div>
        </div>

        {/* Auth Provider User */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="font-medium mb-2">👤 Auth Provider User</h4>
          <div className="space-y-1 text-xs">
            <div>Logged In: <span className={user ? 'text-green-400' : 'text-red-400'}>{user ? 'Yes' : 'No'}</span></div>
            <div>Auth Method: <span className="text-yellow-400">{user?.authMethod || 'None'}</span></div>
            <div>Flow Address: <span className="text-blue-400 font-mono">{user?.flowAddress || 'None'}</span></div>
          </div>
        </div>

        {/* FCL User */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="font-medium mb-2">🔗 FCL User</h4>
          <div className="space-y-1 text-xs">
            <div>Logged In: <span className={fclUser?.loggedIn ? 'text-green-400' : 'text-red-400'}>{fclUser?.loggedIn ? 'Yes' : 'No'}</span></div>
            <div>Address: <span className="text-blue-400 font-mono">{fclUser?.addr || 'None'}</span></div>
            <div>Services: <span className="text-purple-400">{fclUser?.services?.length || 0} services</span></div>
          </div>
        </div>

        {/* Address Analysis */}
        {(user?.flowAddress || fclUser?.addr) && (
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="font-medium mb-2">🔍 Address Analysis</h4>
            <div className="space-y-1 text-xs">
              {user?.flowAddress && (
                <div>
                  Auth Provider: 
                  <span className={user.flowAddress === '0xf8d6e0586b0a20c7' ? 'text-red-400' : 'text-green-400'}>
                    {user.flowAddress === '0xf8d6e0586b0a20c7' ? ' ❌ Emulator' : ' ✅ Testnet'}
                  </span>
                </div>
              )}
              {fclUser?.addr && (
                <div>
                  FCL: 
                  <span className={fclUser.addr === '0xf8d6e0586b0a20c7' ? 'text-red-400' : 'text-green-400'}>
                    {fclUser.addr === '0xf8d6e0586b0a20c7' ? ' ❌ Emulator' : ' ✅ Testnet'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleClearAuth}
            className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
          >
            🚪 Clear Auth
          </button>
          <button
            onClick={handleConnectFlow}
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
          >
            🔗 Connect Flow
          </button>
        </div>

        {/* Quick Fix */}
        {(user?.flowAddress === '0xf8d6e0586b0a20c7' || fclUser?.addr === '0xf8d6e0586b0a20c7') && (
          <div className="bg-red-900/50 border border-red-600 p-3 rounded">
            <div className="text-red-200 text-xs">
              ⚠️ <strong>Emulator address detected!</strong><br/>
              Clear auth and connect a testnet wallet to use VRF.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

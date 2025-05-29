import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Loader2, AlertCircle, Settings } from 'lucide-react';

interface FCLConfig {
  put: (key: string, value: string) => FCLConfig;
}

interface FCLQuery {
  cadence: string;
  args: () => string[];
}

const mockFcl = {
  config: (): FCLConfig => ({
    put: (key: string, value: string) => {
      console.log(`FCL Config: ${key} = ${value}`);
      return mockFcl.config();
    }
  }),
  query: async ({ cadence, args }: FCLQuery) => {
    console.log('FCL Query:', { cadence, args: args?.() });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const address = args?.()[0];
    if (address === '0xdfab49498c36d959') {
      return true;
    }
    return false;
  }
};

const FlowGatingComponent = () => {
  const [userAddress, setUserAddress] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    configureFCL();
  }, []);

  const configureFCL = () => {
    try {
      mockFcl.config()
        .put("accessNode.api", "https://rest-testnet.onflow.org")
        .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
        .put("0xFlowToken", "0x7e60df042a9c0868")
        .put("0xFungibleToken", "0x9a0766d93b6608b7")
        .put("0xFlowGating", "0xdfab49498c36d959");

      setIsConfigured(true);
    } catch (err) {
      setError('Failed to configure Flow connection');
    }
  };

  const checkFlowBalance = async (address: string) => {
    if (!isConfigured) throw new Error('FCL not configured');

    const script = `
      import FlowGating from 0xdfab49498c36d959
      access(all) fun main(userAddress: Address): Bool {
          return FlowGating.hasAccess(userAddress: userAddress)
      }
    `;
    
    try {
      return await mockFcl.query({ cadence: script, args: () => [address] });
    } catch (err) {
      console.error('Query failed:', err);
      throw err;
    }
  };

  const handleCheckAccess = async () => {
    if (!userAddress.trim()) {
      setError('Please enter a Flow address');
      return;
    }

    if (!userAddress.startsWith('0x') || userAddress.length !== 18) {
      setError('Please enter a valid Flow address (0x + 16 characters)');
      return;
    }

    if (!isConfigured) {
      setError('Flow connection not configured. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const access = await checkFlowBalance(userAddress);
      setHasAccess(access);
      setChecked(true);
    } catch (err) {
      setError('Failed to check balance. Please verify the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetCheck = () => {
    setChecked(false);
    setHasAccess(false);
    setUserAddress('');
    setError('');
  };

  if (checked && !hasAccess) {
    return (
      <div className="access-denied-container">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <Lock className="lock-icon" />
          </div>
          <h2>Access Denied</h2>
          <p className="access-message">
            You need at least <span className="required-tokens">1.0 FLOW tokens</span> to access this premium content.
          </p>
          <div className="address-display">
            <p>
              <strong>Address checked:</strong><br />
              <code>{userAddress}</code>
            </p>
          </div>
          <div className="access-tip">
            <p>
              <strong>💡 How to get access:</strong><br />
              Purchase FLOW tokens on an exchange and transfer at least 1.0 FLOW to your wallet.
            </p>
          </div>
          <button onClick={resetCheck} className="try-again-btn">
            Try Different Address
          </button>
        </div>
      </div>
    );
  }

  if (checked && hasAccess) {
    return (
      <div className="access-granted-container">
        <div className="access-granted-header">
          <div className="header-content">
            <div className="logo-container">
              <Shield className="shield-icon" />
            </div>
            <h1>Premium Content</h1>
            <div className="access-badge">
              <Unlock className="unlock-icon" />
              <span>Access Granted</span>
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="welcome-card">
            <div className="welcome-header">
              <div className="unlock-icon-container">
                <Unlock className="large-unlock-icon" />
              </div>
              <h2>Welcome to Premium Content!</h2>
              <p>You have successfully unlocked this exclusive content with your FLOW tokens.</p>
            </div>

            <div className="features-container">
              <div className="feature-card blue-card">
                <h3>🚀 Exclusive Features</h3>
                <ul>
                  <li>• Advanced analytics dashboard</li>
                  <li>• Priority customer support</li>
                  <li>• Early access to new features</li>
                  <li>• Exclusive community access</li>
                </ul>
              </div>

              <div className="feature-card orange-card">
                <h3>💎 Premium Tools</h3>
                <p>
                  Access to advanced tools and resources only available to token holders.
                </p>
                <button className="launch-btn">
                  Launch Premium Tools
                </button>
              </div>

              <div className="feature-card green-card">
                <h3>📊 Your Access Details</h3>
                <div className="address-card">
                  <p>Flow Address:</p>
                  <code>{userAddress}</code>
                  <p className="access-status">✓ Minimum balance requirement met</p>
                </div>
              </div>
            </div>
          </div>

          <div className="check-another">
            <button onClick={resetCheck}>
              Check Different Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="initial-check-container">
      <div className="check-card">
        <div className="card-header">
          <div className="shield-icon-container">
            <Shield className="large-shield-icon" />
          </div>
          <h1>Flow Token Gating</h1>
          <p>
            Enter your Flow address to check if you have access to premium content.
          </p>
        </div>

        <div className="config-status">
          <div className={`status-message ${isConfigured ? 'configured' : 'configuring'}`}>
            <Settings className="settings-icon" />
            <span>
              {isConfigured ? 'Connected to Flow Testnet' : 'Configuring Flow connection...'}
            </span>
          </div>
        </div>

        <div className="form-container">
          <div className="input-group">
            <label>Flow Address</label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="0xdfab49498c36d959"
              disabled={loading || !isConfigured}
            />
            <p className="input-hint">
              Enter your Flow address to check access
            </p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleCheckAccess}
            disabled={loading || !isConfigured}
            className="check-access-btn"
          >
            {loading ? (
              <>
                <Loader2 className="spinner" />
                <span>Checking Balance...</span>
              </>
            ) : (
              <>
                <Shield className="btn-shield-icon" />
                <span>Check Access</span>
              </>
            )}
          </button>
        </div>

        <div className="requirements">
          <p>Requires minimum 1.0 FLOW tokens for access</p>
        </div>

        <div className="integration-guide">
          <h3>🚀 Production Integration:</h3>
          <div className="guide-steps">
            <p><strong>1. Install FCL:</strong> npm install @onflow/fcl @onflow/types</p>
            <p><strong>2. Replace mock:</strong> import * as fcl from '@onflow/fcl'</p>
            <p><strong>3. Your contract:</strong> 0xdfab49498c36d959 (testnet)</p>
            <p><strong>4. Network:</strong> Flow Testnet configured</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowGatingComponent;
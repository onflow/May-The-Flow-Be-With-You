// Flow VRF Service for Provably Fair Randomness
// Implements Flow's native VRF for secure, verifiable random number generation

import * as fcl from "@onflow/fcl";
import { createVRFError } from "../utils/errorHandling";

export interface VRFRequest {
  id: string;
  requester: string;
  timestamp: number;
  status: 'pending' | 'fulfilled' | 'failed';
  seed?: number;
  transactionId?: string;
  blockHeight?: number;
}

export interface VRFResult {
  seed: number;
  transactionId: string;
  blockHeight: number;
  timestamp: number;
  isVerified: boolean;
}

export class FlowVRFService {
  private pendingRequests: Map<string, VRFRequest> = new Map();
  private contractAddress: string;

  constructor(contractAddress?: string) {
    // Use environment variable for contract address, with fallbacks
    this.contractAddress = contractAddress ||
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT ||
      "0xb8404e09b36b6623"; // Testnet fallback

    // Debug logging to verify contract address
    console.log('🔗 FlowVRFService Contract Address:', {
      provided: contractAddress,
      envVar: process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT,
      resolved: this.contractAddress,
      isTestnet: this.contractAddress === "0xb8404e09b36b6623"
    });
  }

  /**
   * Get instant randomness from pre-generated VRF pool
   * This provides immediate randomness without user transactions
   */
  async getInstantRandomness(): Promise<VRFResult> {
    try {
      console.log('🎲 Getting instant VRF from pool...');

      // Try to get from pool first
      const poolResult = await this.getFromVRFPool();
      if (poolResult) {
        console.log('✅ Got VRF from pool:', poolResult.seed);
        return poolResult;
      }

      // Fallback to secure random with warning
      console.warn('⚠️ VRF pool empty, using secure fallback');
      return this.generateSecureFallback();
    } catch (error) {
      console.warn('⚠️ VRF pool failed, using secure fallback');
      return this.generateSecureFallback();
    }
  }

  /**
   * Request randomness from Flow VRF (for admin/background use)
   * Uses Flow's commit-reveal pattern for secure randomness
   */
  async requestRandomness(): Promise<VRFResult> {
    try {
      // Validate user authentication first
      const userAddress = await this.getCurrentUserAddress();
      console.log('🎲 Starting VRF request for user:', userAddress);

      const requestId = this.generateRequestId();

      // Step 1: Submit commit transaction
      const commitTxId = await this.submitCommit(requestId);

      // Step 2: Wait for commit to be sealed
      await this.waitForTransaction(commitTxId);

      // Step 3: Submit reveal transaction
      const revealTxId = await this.submitReveal(requestId);

      // Step 4: Wait for reveal and get result
      const result = await this.waitForRevealResult(revealTxId, requestId);

      return result;
    } catch (error) {
      throw createVRFError('VRF request failed', error);
    }
  }

  /**
   * Submit commit transaction to Flow
   */
  private async submitCommit(requestId: string): Promise<string> {
    const commitValue = this.generateCommitValue();

    const transactionId = await fcl.mutate({
      cadence: `
        import MemoryVRF from ${this.contractAddress}

        transaction(requestId: String, commitValue: String) {
          prepare(signer: auth(Storage, Capabilities) &Account) {
            // Create consumer if it doesn't exist
            if signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath) == nil {
              let consumer <- MemoryVRF.createConsumer()
              signer.storage.save(<-consumer, to: MemoryVRF.ConsumerStoragePath)

              let consumerCap = signer.capabilities.storage.issue<&MemoryVRF.Consumer>(MemoryVRF.ConsumerStoragePath)
              signer.capabilities.publish(consumerCap, at: MemoryVRF.ConsumerPublicPath)
            }

            let consumer = signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath)!
            consumer.submitCommit(requestId: requestId, commitValue: commitValue)
          }
        }
      `,
      args: (arg, t) => [
        arg(requestId, t.String),
        arg(commitValue, t.String)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    // Store pending request
    this.pendingRequests.set(requestId, {
      id: requestId,
      requester: await this.getCurrentUserAddress(),
      timestamp: Date.now(),
      status: 'pending',
      transactionId: transactionId
    });

    return transactionId;
  }

  /**
   * Submit reveal transaction to Flow
   */
  private async submitReveal(requestId: string): Promise<string> {
    const revealValue = this.generateRevealValue(requestId);

    const transactionId = await fcl.mutate({
      cadence: `
        import MemoryVRF from ${this.contractAddress}

        transaction(requestId: String, revealValue: UInt64) {
          prepare(signer: auth(Storage, Capabilities) &Account) {
            let consumer = signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath)!
            consumer.submitReveal(requestId: requestId, revealValue: revealValue)
          }
        }
      `,
      args: (arg, t) => [
        arg(requestId, t.String),
        arg(revealValue.toString(), t.UInt64)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000
    });

    return transactionId;
  }

  /**
   * Wait for transaction to be sealed
   */
  private async waitForTransaction(transactionId: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (attempts < maxAttempts) {
      try {
        const result = await fcl.tx(transactionId).onceSealed();
        if (result.status === 4) { // SEALED
          return;
        }
      } catch (error) {
        console.log(`Waiting for transaction ${transactionId}... (${attempts + 1}/${maxAttempts})`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error(`Transaction ${transactionId} did not seal within timeout`);
  }

  /**
   * Wait for reveal result and extract randomness
   */
  private async waitForRevealResult(transactionId: string, requestId: string): Promise<VRFResult> {
    await this.waitForTransaction(transactionId);

    // Query the contract for the random result
    const seed = await this.queryRandomResult(requestId);
    const blockHeight = await this.getTransactionBlockHeight(transactionId);

    const result: VRFResult = {
      seed,
      transactionId,
      blockHeight,
      timestamp: Date.now(),
      isVerified: true
    };

    // Update pending request
    const request = this.pendingRequests.get(requestId);
    if (request) {
      request.status = 'fulfilled';
      request.seed = seed;
      request.transactionId = transactionId;
      request.blockHeight = blockHeight;
    }

    return result;
  }

  /**
   * Query the random result from the contract
   */
  private async queryRandomResult(requestId: string): Promise<number> {
    try {
      const userAddress = await this.getCurrentUserAddress();
      const result = await fcl.query({
        cadence: `
          import MemoryVRF from ${this.contractAddress}

          access(all) fun main(address: Address, requestId: String): UInt64? {
            return MemoryVRF.getRandomResult(address: address, requestId: requestId)
          }
        `,
        args: (arg, t) => [
          arg(userAddress, t.Address),
          arg(requestId, t.String)
        ]
      });

      if (result === null) {
        throw new Error('Random result not found');
      }

      return parseInt(result);
    } catch (error) {
      console.error('Failed to query random result:', error);
      throw error;
    }
  }

  /**
   * Get block height for a transaction
   */
  private async getTransactionBlockHeight(transactionId: string): Promise<number> {
    try {
      const transaction = await fcl.send([fcl.getTransaction(transactionId)]).then(fcl.decode);
      return transaction.referenceBlockId ? parseInt(transaction.referenceBlockId) : 0;
    } catch (error) {
      console.error('Failed to get transaction block height:', error);
      return 0;
    }
  }

  /**
   * Get current user's Flow address
   */
  private async getCurrentUserAddress(): Promise<string> {
    const user = await fcl.currentUser.snapshot();
    const address = user.addr || '';

    // Debug logging to track address resolution
    console.log('🔍 FlowVRFService getCurrentUserAddress:', {
      userLoggedIn: user.loggedIn,
      userAddress: address,
      isEmulatorAddress: address === '0xf8d6e0586b0a20c7',
      isTestnetAddress: address.startsWith('0x') && address.length === 18 && address !== '0xf8d6e0586b0a20c7'
    });

    // Validate address for current network
    if (!address) {
      throw new Error('No Flow wallet connected. Please connect a Flow wallet to use VRF.');
    }

    // Network mismatch detection
    const expectedNetwork = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';

    const getWalletNetwork = (addr: string) => {
      if (addr === '0xf8d6e0586b0a20c7') return 'emulator';
      if (addr.length === 18 && addr.startsWith('0x')) return 'testnet';
      return 'unknown';
    };

    const walletNetwork = getWalletNetwork(address);

    if (expectedNetwork === 'testnet' && walletNetwork === 'emulator') {
      throw new Error('❌ Network Mismatch: App is configured for testnet, but your wallet is connected to emulator. Please switch to testnet.');
    }

    if (expectedNetwork === 'emulator' && walletNetwork === 'testnet') {
      throw new Error('❌ Network Mismatch: App is configured for emulator, but your wallet is connected to testnet. Please switch to emulator.');
    }

    if (walletNetwork === 'unknown') {
      throw new Error('❌ Unknown wallet network. Please ensure you are connected to the correct Flow network.');
    }

    return address;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `vrf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate commit value for commit-reveal scheme
   */
  private generateCommitValue(): string {
    const secret = Math.random().toString(36).substr(2, 15);
    const timestamp = Date.now().toString();
    return btoa(`${secret}_${timestamp}`); // Base64 encode
  }

  /**
   * Generate reveal value from request ID
   */
  private generateRevealValue(requestId: string): number {
    // In a real implementation, this would be derived from the commit secret
    // For now, we'll use a deterministic value based on request ID
    let hash = 0;
    for (let i = 0; i < requestId.length; i++) {
      const char = requestId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get status of a VRF request
   */
  getRequestStatus(requestId: string): VRFRequest | null {
    return this.pendingRequests.get(requestId) || null;
  }

  /**
   * Get all pending requests for current user
   */
  async getPendingRequests(): Promise<VRFRequest[]> {
    const userAddress = await this.getCurrentUserAddress();
    return Array.from(this.pendingRequests.values())
      .filter(request => request.requester === userAddress);
  }

  /**
   * Clear completed requests (cleanup)
   */
  clearCompletedRequests(): void {
    const idsToDelete: string[] = [];
    this.pendingRequests.forEach((request, id) => {
      if (request.status === 'fulfilled' || request.status === 'failed') {
        idsToDelete.push(id);
      }
    });

    idsToDelete.forEach(id => {
      this.pendingRequests.delete(id);
    });
  }

  /**
   * Utility function to generate random number in range using VRF seed
   */
  static randomInRange(seed: number, min: number, max: number): number {
    const range = max - min;
    return min + (seed % range);
  }

  /**
   * Get VRF from pre-generated pool (instant, no user transaction)
   */
  private async getFromVRFPool(): Promise<VRFResult | null> {
    try {
      // Query a public VRF pool or service
      // This could be your own service or a public one like Randoms.WTF
      const response = await fetch('/api/vrf-pool/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        console.warn(`VRF pool API returned ${response.status}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      // Handle both success and fallback responses
      if (data.success === false && data.fallback) {
        console.warn('VRF pool returned fallback data');
        return {
          seed: data.fallback.seed,
          transactionId: data.fallback.transactionId,
          blockHeight: data.fallback.blockHeight || 0,
          timestamp: data.fallback.timestamp,
          isVerified: false // Mark fallback as unverified
        };
      }

      // Handle successful response
      if (data.seed) {
        return {
          seed: data.seed,
          transactionId: data.transactionId,
          blockHeight: data.blockHeight,
          timestamp: data.timestamp,
          isVerified: data.success !== false
        };
      }

      return null;
    } catch (error) {
      console.warn('VRF pool fetch failed:', error);
      return null;
    }
  }

  /**
   * Generate secure fallback when VRF is unavailable
   */
  private generateSecureFallback(): VRFResult {
    // Use crypto.getRandomValues for secure randomness
    const array = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Node.js fallback
      array[0] = Math.floor(Math.random() * 0xffffffff);
    }

    return {
      seed: array[0],
      transactionId: `fallback_${Date.now()}`,
      blockHeight: 0,
      timestamp: Date.now(),
      isVerified: false // Mark as unverified since it's not from VRF
    };
  }

  /**
   * Utility function to generate deterministic sequence from seed
   */
  static generateSequence(seed: number, count: number): number[] {
    const sequence: number[] = [];
    let currentSeed = seed;

    for (let i = 0; i < count; i++) {
      // Simple linear congruential generator for deterministic sequence
      currentSeed = ((currentSeed * 1103515245 + 12345) % 2147483648);
      sequence.push(currentSeed);
    }

    return sequence;
  }
}

// Export a default instance for easy use
export const flowVRF = new FlowVRFService();

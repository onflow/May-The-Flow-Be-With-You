// Randomness Provider Interface for Dual-Mode Architecture
// Supports both off-chain (pseudo-random) and on-chain (Flow VRF) randomness

export interface RandomnessProvider {
  /**
   * Generate a random seed for game initialization
   * @returns Promise<number> - Random seed value
   */
  generateSeed(): Promise<number>;

  /**
   * Generate a secure random number within range
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Promise<number> - Random number in range
   */
  generateSecureRandom(min: number, max: number): Promise<number>;

  /**
   * Generate multiple random numbers at once
   * @param count - Number of random values to generate
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Promise<number[]> - Array of random numbers
   */
  generateMultipleRandom(count: number, min: number, max: number): Promise<number[]>;

  /**
   * Check if this provider supports verifiable randomness
   * @returns boolean - True if randomness can be verified on-chain
   */
  isVerifiable(): boolean;

  /**
   * Get the mode of this provider
   * @returns 'offchain' | 'onchain'
   */
  getMode(): 'offchain' | 'onchain';

  /**
   * Get verification data for the last random generation (if verifiable)
   * @returns Promise<RandomnessVerification | null>
   */
  getVerificationData(): Promise<RandomnessVerification | null>;
}

export interface RandomnessVerification {
  transactionId?: string;
  blockHeight?: number;
  seed: number;
  timestamp: number;
  verificationUrl?: string;
  isVerified: boolean;
}

export interface CommitRevealPair {
  commit: string;
  reveal: string;
  seed: number;
  timestamp: number;
}

// Off-Chain Randomness Provider (Fast, Local)
export class OffChainRandomnessProvider implements RandomnessProvider {
  private lastSeed: number = Date.now();

  async generateSeed(): Promise<number> {
    this.lastSeed = Math.floor(Math.random() * 1000000) + Date.now();
    return this.lastSeed;
  }

  async generateSecureRandom(min: number, max: number): Promise<number> {
    // Use crypto.getRandomValues if available, fallback to Math.random
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const randomValue = array[0] / (0xffffffff + 1);
      return Math.floor(randomValue * (max - min)) + min;
    }
    
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async generateMultipleRandom(count: number, min: number, max: number): Promise<number[]> {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(await this.generateSecureRandom(min, max));
    }
    return results;
  }

  isVerifiable(): boolean {
    return false;
  }

  getMode(): 'offchain' | 'onchain' {
    return 'offchain';
  }

  async getVerificationData(): Promise<RandomnessVerification | null> {
    return {
      seed: this.lastSeed,
      timestamp: Date.now(),
      isVerified: false,
    };
  }
}

// Flow VRF Randomness Provider (Secure, Verifiable)
export class FlowVRFRandomnessProvider implements RandomnessProvider {
  private flowService: any; // Will be properly typed when FlowService is implemented
  private lastVerification: RandomnessVerification | null = null;

  constructor(flowService: any) {
    this.flowService = flowService;
  }

  async generateSeed(): Promise<number> {
    try {
      // Request randomness from Flow VRF
      const result = await this.flowService.requestRandomness();
      
      this.lastVerification = {
        transactionId: result.transactionId,
        blockHeight: result.blockHeight,
        seed: result.seed,
        timestamp: Date.now(),
        verificationUrl: `https://testnet.flowscan.org/transaction/${result.transactionId}`,
        isVerified: true,
      };

      return result.seed;
    } catch (error) {
      console.error('Flow VRF generation failed, falling back to secure random:', error);
      // Fallback to secure random if Flow VRF fails
      const fallbackSeed = Math.floor(Math.random() * 1000000) + Date.now();
      
      this.lastVerification = {
        seed: fallbackSeed,
        timestamp: Date.now(),
        isVerified: false,
      };

      return fallbackSeed;
    }
  }

  async generateSecureRandom(min: number, max: number): Promise<number> {
    const seed = await this.generateSeed();
    // Use the VRF seed to generate deterministic random in range
    const normalized = (seed % 1000000) / 1000000;
    return Math.floor(normalized * (max - min)) + min;
  }

  async generateMultipleRandom(count: number, min: number, max: number): Promise<number[]> {
    const baseSeed = await this.generateSeed();
    const results: number[] = [];
    
    // Generate multiple deterministic randoms from single VRF seed
    for (let i = 0; i < count; i++) {
      const derivedSeed = (baseSeed + i * 1337) % 1000000;
      const normalized = derivedSeed / 1000000;
      results.push(Math.floor(normalized * (max - min)) + min);
    }
    
    return results;
  }

  isVerifiable(): boolean {
    return true;
  }

  getMode(): 'offchain' | 'onchain' {
    return 'onchain';
  }

  async getVerificationData(): Promise<RandomnessVerification | null> {
    return this.lastVerification;
  }
}

// Factory function to create appropriate provider based on mode
export function createRandomnessProvider(
  mode: 'offchain' | 'onchain',
  flowService?: any
): RandomnessProvider {
  if (mode === 'onchain' && flowService) {
    return new FlowVRFRandomnessProvider(flowService);
  }
  return new OffChainRandomnessProvider();
}

// Utility function to create seeded random generator (for deterministic sequences)
export function createSeededRandomFromProvider(
  provider: RandomnessProvider,
  seed?: number
) {
  return {
    provider,
    seed: seed || Date.now(),
    
    async next(): Promise<number> {
      if (seed) {
        // Use deterministic generation if seed provided
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
      } else {
        // Use provider's secure random
        return (await provider.generateSecureRandom(0, 233280)) / 233280;
      }
    },

    async shuffle<T>(array: T[]): Promise<T[]> {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor((await this.next()) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  };
}

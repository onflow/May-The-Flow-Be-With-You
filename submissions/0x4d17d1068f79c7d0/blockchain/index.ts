// Blockchain-related exports

// Flow configuration
export * from '../shared/config/flow';

// Contract addresses and deployment info
export const CONTRACTS = {
  MemoryAchievements: 'MemoryAchievements',
  MemoryVRF: 'MemoryVRF',
  Counter: 'Counter'
} as const;

// Contract deployment addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  emulator: {
    MemoryAchievements: '0xf8d6e0586b0a20c7',
    MemoryVRF: '0xf8d6e0586b0a20c7',
    Counter: '0xf8d6e0586b0a20c7'
  },
  testnet: {
    MemoryAchievements: '',
    MemoryVRF: '',
    Counter: ''
  },
  mainnet: {
    MemoryAchievements: '',
    MemoryVRF: '',
    Counter: ''
  }
} as const;

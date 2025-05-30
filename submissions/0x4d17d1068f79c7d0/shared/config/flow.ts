import * as fcl from "@onflow/fcl";

// Flow network configuration
interface NetworkConfig {
  accessNode: string;
  discoveryWallet: string;
  discoveryAuthnEndpoint?: string;
  discoveryAuthInclude: string[];
}

const fclConfigInfo: Record<string, NetworkConfig> = {
  emulator: {
    accessNode: 'http://127.0.0.1:8888',
    discoveryWallet: 'http://localhost:8701/fcl/authn',
    discoveryAuthInclude: [],
  },
  testnet: {
    accessNode: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/testnet/authn',
    // Adds in Dapper + Ledger
    discoveryAuthInclude: ['0x82ec283f88a62e65', '0x9d2e44203cb13051'],
  },
  mainnet: {
    accessNode: 'https://rest-mainnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
    discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/authn',
    // Adds in Dapper + Ledger
    discoveryAuthInclude: ['0xead892083b3e2c6c', '0xe5cd26afebe62781'],
  },
};

// Get network from environment or default to emulator for development
const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'emulator';

// Get network configuration
const networkConfig = fclConfigInfo[network as keyof typeof fclConfigInfo];

// Configure FCL
const fclConfig: Record<string, any> = {
  'walletconnect.projectId': process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '', // your WalletConnect project ID
  'app.detail.title': 'Memoreee', // the name of your DApp
  'app.detail.icon': '/icon.png', // your DApps icon
  'app.detail.description': 'Ancient memory wisdom meets modern mastery', // a description of your DApp
  'app.detail.url': 'https://memoreee.vercel.app', // the URL of your DApp
  'flow.network': network,
  'accessNode.api': networkConfig.accessNode,
  'discovery.wallet': networkConfig.discoveryWallet,
  // adds in opt-in wallets like Dapper and Ledger
  'discovery.authn.include': networkConfig.discoveryAuthInclude,
  'discovery.authn.exclude': [], // excludes chosen wallets by address
  "0xProfile": network === 'testnet' ? "0xba1132bc08f82fe2" : "0xf8d6e0586b0a20c7", // Profile contract address
  // EVM support on Flow
  'evm.enabled': true,
  'evm.gasLimit': 9999999,
};

// Only add discovery.authn.endpoint if it exists
if (networkConfig.discoveryAuthnEndpoint) {
  fclConfig['discovery.authn.endpoint'] = networkConfig.discoveryAuthnEndpoint;
}

fcl.config(fclConfig);

// Network and wallet type detection
export const getWalletType = (user: any) => {
  if (!user?.addr) return null;

  // EVM addresses start with 0x and are 40 characters (20 bytes)
  if (user.addr.startsWith('0x') && user.addr.length === 42) {
    return 'evm';
  }

  // Flow Cadence addresses are typically 16 characters (8 bytes) without 0x prefix
  // or with 0x prefix and 18 characters total
  if (user.addr.length === 16 || (user.addr.startsWith('0x') && user.addr.length === 18)) {
    return 'cadence';
  }

  return 'unknown';
};

// Authentication functions
export const flowAuth = {
  // Sign in with Flow wallet
  signIn: () => fcl.authenticate(),

  // Sign out
  signOut: () => fcl.unauthenticate(),

  // Get current user (returns Promise in newer FCL versions)
  getCurrentUser: async () => {
    try {
      return await fcl.currentUser.snapshot();
    } catch (error) {
      console.error('Error getting current user:', error);
      return { loggedIn: false, addr: null };
    }
  },

  // Subscribe to auth changes
  onAuthChange: (callback: (user: any) => void) => fcl.currentUser.subscribe(callback)
};

// Memory NFT contract interactions (for future implementation)
export const memoryNFT = {
  // Mint achievement NFT
  mintAchievement: async (achievementType: string, score: number) => {
    // TODO: Implement NFT minting for memory achievements
    console.log("Minting achievement NFT:", { achievementType, score });
  },

  // Get user's memory NFTs
  getUserNFTs: async (address: string) => {
    // TODO: Implement NFT fetching
    console.log("Fetching NFTs for:", address);
    return [];
  }
};

export default fcl;

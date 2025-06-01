// Conditional import to prevent server-side issues in Netlify
let fcl: any;
if (typeof window !== 'undefined') {
  fcl = require("@onflow/fcl");
} else {
  // Server-side mock for FCL - minimal to avoid interference
  fcl = {
    config: () => {},
    authenticate: () => Promise.reject(new Error('FCL not available on server')),
    unauthenticate: () => Promise.reject(new Error('FCL not available on server')),
    currentUser: {
      snapshot: () => Promise.resolve({ loggedIn: false, addr: null }),
      subscribe: () => () => {}
    },
    mutate: () => Promise.reject(new Error('FCL not available on server')),
    query: () => Promise.reject(new Error('FCL not available on server')),
    authz: null
  };
}

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

// Get network from environment or default to testnet for production
const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';

// Debug logging to verify network configuration
console.log('🌐 Flow Network Configuration:', {
  envVar: process.env.NEXT_PUBLIC_FLOW_NETWORK,
  resolvedNetwork: network,
  isTestnet: network === 'testnet'
});

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
  "0xProfile": network === 'testnet' ? "0xba1132bc08f82fe2" : "0xba1132bc08f82fe2", // Profile contract address
  // EVM support on Flow
  'evm.enabled': true,
  'evm.gasLimit': 9999999,
};

// Only add discovery.authn.endpoint if it exists
if (networkConfig.discoveryAuthnEndpoint) {
  fclConfig['discovery.authn.endpoint'] = networkConfig.discoveryAuthnEndpoint;
}

// Only configure FCL on the client side
if (typeof window !== 'undefined') {
  fcl.config(fclConfig);
}

// Contract addresses based on network
const CONTRACTS = {
  MemoryAchievements: network === 'testnet'
    ? '0xb8404e09b36b6623'
    : network === 'mainnet'
    ? '0x1234567890abcdef' // Replace with actual mainnet address when deployed
    : '0xf8d6e0586b0a20c7', // Emulator address
  NonFungibleToken: network === 'testnet'
    ? '0x631e88ae7f1d7c20'
    : network === 'mainnet'
    ? '0x1d7e57aa55817448'
    : '0xf8d6e0586b0a20c7' // Emulator address
};

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

// Enhanced network detection for Flow addresses
export const getFlowNetworkFromAddress = (address: string): 'emulator' | 'testnet' | 'mainnet' | 'unknown' => {
  if (!address) return 'unknown';

  // Emulator has a specific known address
  if (address === '0xf8d6e0586b0a20c7') return 'emulator';

  // For Flow addresses, we need to check the actual network they're on
  // This is a simplified approach - in production, you'd query the network
  if (address.startsWith('0x') && address.length === 18) {
    // Known testnet service accounts (these are examples)
    const knownTestnetAddresses = [
      '0xb8404e09b36b6623', // Your testnet contract address
      '0x82ec283f88a62e65', // Dapper testnet
      '0x9d2e44203cb13051', // Ledger testnet
    ];

    // Known mainnet service accounts (these are examples)
    const knownMainnetAddresses = [
      '0xead892083b3e2c6c', // Dapper mainnet
      '0xe5cd26afebe62781', // Ledger mainnet
    ];

    if (knownTestnetAddresses.includes(address)) return 'testnet';
    if (knownMainnetAddresses.includes(address)) return 'mainnet';

    // For unknown addresses, we'll need to make an API call to determine the network
    // For now, we'll assume testnet for development purposes
    return 'testnet';
  }

  return 'unknown';
};

// Async network detection that queries Flow APIs
export const detectFlowNetworkFromAddress = async (address: string): Promise<'emulator' | 'testnet' | 'mainnet' | 'unknown'> => {
  if (!address) return 'unknown';

  // Emulator has a specific known address
  if (address === '0xf8d6e0586b0a20c7') return 'emulator';

  if (!address.startsWith('0x') || address.length !== 18) return 'unknown';

  try {
    // Try testnet first
    const testnetResponse = await fetch(`https://rest-testnet.onflow.org/v1/accounts/${address}`);
    if (testnetResponse.ok) {
      return 'testnet';
    }

    // Try mainnet
    const mainnetResponse = await fetch(`https://rest-mainnet.onflow.org/v1/accounts/${address}`);
    if (mainnetResponse.ok) {
      return 'mainnet';
    }

    return 'unknown';
  } catch (error) {
    console.warn('Failed to detect Flow network for address:', address, error);
    // Fallback to the synchronous method
    return getFlowNetworkFromAddress(address);
  }
};

// Network mismatch detection
export const detectNetworkMismatch = (expectedNetwork: string, userAddress: string): {
  hasMismatch: boolean;
  userNetwork: string;
  expectedNetwork: string;
  message?: string;
} => {
  if (!userAddress) {
    return { hasMismatch: false, userNetwork: 'none', expectedNetwork };
  }

  const userNetwork = getFlowNetworkFromAddress(userAddress);
  const hasMismatch = expectedNetwork !== userNetwork && userNetwork !== 'unknown';

  let message = '';
  if (hasMismatch) {
    if (expectedNetwork === 'testnet' && userNetwork === 'mainnet') {
      message = 'Please switch your Flow wallet from Mainnet to Testnet to use this app.';
    } else if (expectedNetwork === 'testnet' && userNetwork === 'emulator') {
      message = 'Please switch your Flow wallet from Emulator to Testnet to use this app.';
    } else if (expectedNetwork === 'emulator' && userNetwork === 'testnet') {
      message = 'Please switch your Flow wallet from Testnet to Emulator for development.';
    } else {
      message = `Please switch your Flow wallet to ${expectedNetwork} network.`;
    }
  }

  return {
    hasMismatch,
    userNetwork,
    expectedNetwork,
    message
  };
};

// Authentication functions
export const flowAuth = {
  // Sign in with Flow wallet
  signIn: () => fcl.authenticate(),

  // Sign out and clear all cached data
  signOut: async () => {
    await fcl.unauthenticate();
    // Clear any cached user data
    localStorage.removeItem('fcl:current_user');
    console.log('🚪 Flow authentication cleared');
  },

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

// Memory NFT contract interactions
export const memoryNFT = {
  // Mint achievement NFT
  mintAchievement: async (
    achievementId: string,
    name: string,
    description: string,
    category: string,
    culture?: string,
    icon: string = "🏆",
    rarity: string = "common",
    gameData: Record<string, any> = {}
  ) => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import MemoryAchievements from ${CONTRACTS.MemoryAchievements}
          import NonFungibleToken from ${CONTRACTS.NonFungibleToken}

          transaction(
            achievementId: String,
            name: String,
            description: String,
            category: String,
            culture: String?,
            icon: String,
            rarity: String,
            gameData: {String: AnyStruct}
          ) {
            prepare(signer: auth(Storage, Capabilities) &Account) {
              // Get or create collection
              if signer.storage.borrow<&MemoryAchievements.Collection>(from: MemoryAchievements.CollectionStoragePath) == nil {
                let collection <- MemoryAchievements.createEmptyCollection(nftType: Type<@MemoryAchievements.NFT>())
                signer.storage.save(<-collection, to: MemoryAchievements.CollectionStoragePath)

                let collectionCap = signer.capabilities.storage.issue<&MemoryAchievements.Collection>(MemoryAchievements.CollectionStoragePath)
                signer.capabilities.publish(collectionCap, at: MemoryAchievements.CollectionPublicPath)
              }

              let collection = signer.storage.borrow<&MemoryAchievements.Collection>(from: MemoryAchievements.CollectionStoragePath)!
              let minter = signer.storage.borrow<&MemoryAchievements.NFTMinter>(from: MemoryAchievements.MinterStoragePath)!

              let nftId = minter.mintNFT(
                recipient: collection,
                achievementId: achievementId,
                name: name,
                description: description,
                category: category,
                culture: culture,
                icon: icon,
                rarity: rarity,
                gameData: gameData
              )
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(achievementId, t.String),
          arg(name, t.String),
          arg(description, t.String),
          arg(category, t.String),
          arg(culture, t.Optional(t.String)),
          arg(icon, t.String),
          arg(rarity, t.String),
          arg(gameData, t.Dictionary({ key: t.String, value: t.AnyStruct }))
        ],
        authorizations: [fcl.authz],
        payer: fcl.authz,
        proposer: fcl.authz
      });

      const result = await fcl.tx(transactionId).onceSealed();
      return { transactionId, success: true, result };
    } catch (error) {
      console.error("Failed to mint achievement NFT:", error);
      throw error;
    }
  },

  // Get user's memory NFTs
  getUserNFTs: async (address: string) => {
    try {
      const nfts = await fcl.query({
        cadence: `
          import MemoryAchievements from ${CONTRACTS.MemoryAchievements}
          import NonFungibleToken from ${CONTRACTS.NonFungibleToken}

          access(all) fun main(address: Address): [MemoryAchievements.AchievementMetadata] {
            let account = getAccount(address)
            let collectionRef = account.capabilities.borrow<&MemoryAchievements.Collection>(MemoryAchievements.CollectionPublicPath)
              ?? return []

            let nfts: [MemoryAchievements.AchievementMetadata] = []
            let ids = collectionRef.getIDs()

            for id in ids {
              if let nft = collectionRef.borrowNFT(id) {
                let memoryNFT = nft as! &MemoryAchievements.NFT
                nfts.append(memoryNFT.metadata)
              }
            }

            return nfts
          }
        `,
        args: (arg: any, t: any) => [arg(address, t.Address)]
      });

      return nfts || [];
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      return [];
    }
  },

  // Check if user has collection set up
  hasCollection: async (address: string): Promise<boolean> => {
    try {
      const hasCollection = await fcl.query({
        cadence: `
          import MemoryAchievements from ${CONTRACTS.MemoryAchievements}

          access(all) fun main(address: Address): Bool {
            let account = getAccount(address)
            return account.capabilities.borrow<&MemoryAchievements.Collection>(MemoryAchievements.CollectionPublicPath) != nil
          }
        `,
        args: (arg: any, t: any) => [arg(address, t.Address)]
      });

      return hasCollection || false;
    } catch (error) {
      console.error("Failed to check collection:", error);
      return false;
    }
  }
};

export default fcl;

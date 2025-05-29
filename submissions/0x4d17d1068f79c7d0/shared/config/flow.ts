import * as fcl from "@onflow/fcl";

// Flow configuration for testnet (hackathon)
fcl.config({
  "accessNode.api": process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org",
  "discovery.wallet": process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || "https://fcl-discovery.onflow.org/testnet/authn",
  "0xProfile": "0xba1132bc08f82fe2", // Flow testnet profile contract
  "app.detail.title": "Memoreee",
  "app.detail.icon": "https://memoreee.vercel.app/icon.png",
  "app.detail.description": "Ancient memory wisdom meets modern mastery"
});

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

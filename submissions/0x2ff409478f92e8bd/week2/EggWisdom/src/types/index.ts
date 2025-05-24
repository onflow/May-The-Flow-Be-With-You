// Flow blockchain types
export type FlowAddress = string;

// NFT types
export interface EggWisdomNFT {
  id: string;
  metadata: {
    image: string;
    name: string;
    description: string;
    players: string[];
    cats: string[];
    uploadedBy: FlowAddress;
    lastPettedBy?: FlowAddress;
    petCount: number;
  }
}

export interface WisdomPhraseNFT {
  id: string;
  metadata: {
    phrase: string;
    author: FlowAddress;
    createdAt: string;
  }
}

// User types
export interface UserData {
  address: FlowAddress;
  zenBalance: number;
  eggs: EggWisdomNFT[];
  phrases: WisdomPhraseNFT[];
}

// Leaderboard types
export interface LeaderboardEntry {
  address: FlowAddress;
  zenBalance: number;
  rank: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalZenSupply: number;
}

// Transaction types
export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  txId?: string;
}

// Upload types
export interface UploadData {
  image: string;  // Base64 encoded image
  players: string[];
  cats: string[];
} 
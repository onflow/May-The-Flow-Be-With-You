import { ethers } from 'ethers';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export const FLOW_TESTNET_RPC = 'https://testnet.evm.nodes.onflow.org';

export const MINESWEEPER_CONTRACT_ADDRESS = '0x2EF339935B5210d9bBBbfB15B85884Df59F430bD';

export const MINESWEEPER_CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "timeTaken",
                "type": "uint256"
            }
        ],
        "name": "addRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ERC721InsufficientApproval",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "approver",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidApprover",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidOperator",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidReceiver",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidSender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ERC721NonexistentToken",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_uri",
                "type": "string"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "approved",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "ApprovalForAll",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_fromTokenId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_toTokenId",
                "type": "uint256"
            }
        ],
        "name": "BatchMetadataUpdate",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_tokenId",
                "type": "uint256"
            }
        ],
        "name": "MetadataUpdate",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getRecords",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "player",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timeTaken",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct MineSweeper.Record[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ownerOf",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
    ,
    {
        "inputs": [],
        "name": "getRandomNumber",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

// Initialize read-only provider for view functions
const initializeReadOnlyProvider = () => {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(FLOW_TESTNET_RPC);
        contract = new ethers.Contract(
            MINESWEEPER_CONTRACT_ADDRESS,
            MINESWEEPER_CONTRACT_ABI,
            provider
        );
    }
    return { provider, contract };
};

// Initialize provider with signer for write functions
const initializeProviderWithSigner = async () => {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(FLOW_TESTNET_RPC);
    }
    if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
    }
    const signer = await provider.getSigner();
    contract = new ethers.Contract(
        MINESWEEPER_CONTRACT_ADDRESS,
        MINESWEEPER_CONTRACT_ABI,
        signer
    );
    return { provider, contract };
};

export const getRandomNumber = async (): Promise<number> => {
    if (!contract) {
        initializeReadOnlyProvider();
    }
    if (!contract) throw new Error('Contract not initialized');

    try {
        const result = await contract.getRandomNumber();
        // Convert the integer (1-10) to a float in [0, 1)
        return (Number(result) - 1) / 10;
    } catch (error: any) {
        console.error('Error in getRandomNumber:', error);
        throw new Error('Failed to generate random number');
    }
};

export const addRecord = async (timeTaken: number): Promise<void> => {
    try {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask to use this feature');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        if (!userAddress) {
            throw new Error('Please connect your wallet first');
        }

        const contract = new ethers.Contract(
            MINESWEEPER_CONTRACT_ADDRESS,
            MINESWEEPER_CONTRACT_ABI,
            signer
        );

        const tx = await contract.addRecord(timeTaken);
        await tx.wait();
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to add record');
    }
};

export const mint = async (uri: string): Promise<void> => {
    if (!contract) {
        await initializeProviderWithSigner();
    }
    if (!contract) throw new Error('Contract not initialized');

    try {
        const tx = await contract.mint(uri);
        await tx.wait();
    } catch (error: unknown) {
        console.error('Error in mint:', error);
        if (error instanceof Error) {
            throw new Error(error.message || 'Failed to mint NFT');
        }
        throw new Error('Failed to mint NFT');
    }
};

interface Record {
    player: string;
    timestamp: number;
    timeTaken: number;
}

export const getRecords = async (): Promise<Record[]> => {
    if (!contract) {
        initializeReadOnlyProvider();
    }
    if (!contract) throw new Error('Contract not initialized');

    try {
        const records = await contract.getRecords();
        return records.map((record: any) => ({
            player: record.player,
            timestamp: Number(record.timestamp),
            timeTaken: Number(record.timeTaken)
        }));
    } catch (error: unknown) {
        console.error('Error in getRecords:', error);
        if (error instanceof Error) {
            throw new Error(error.message || 'Failed to get records');
        }
        throw new Error('Failed to get records');
    }
};

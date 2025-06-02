import { ethers } from 'ethers';

export const RANDOMNESS_CONTRACT_ADDRESS = '0x53D08325C60346d6D3C779aF6261f3DEBF4E993A';

export const RANDOMNESS_CONTRACT_ABI = [
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
];

let provider: ethers.Provider | null = null;
let contract: ethers.Contract | null = null;

const FLOW_TESTNET_RPC = 'https://testnet.evm.nodes.onflow.org';

// Initialize read-only provider for view functions
const initializeReadOnlyProvider = () => {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(FLOW_TESTNET_RPC);
        contract = new ethers.Contract(
            RANDOMNESS_CONTRACT_ADDRESS,
            RANDOMNESS_CONTRACT_ABI,
            provider
        );
    }
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
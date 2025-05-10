import { ethers } from 'ethers';
import { RANDOMNESS_CONTRACT_ABI, RANDOMNESS_CONTRACT_ADDRESS } from '../config/contracts';

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
    // Use read-only provider for view functions
    if (!contract) {
        initializeReadOnlyProvider();
    }
    if (!contract) throw new Error('Contract not initialized');

    try {
        const result = await contract.getRandomNumber();
        return Number(result);
    } catch (error: any) {
        console.error('Error in getRandomNumber:', error);
        throw new Error(error.message || 'Failed to generate random number');
    }
};
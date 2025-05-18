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
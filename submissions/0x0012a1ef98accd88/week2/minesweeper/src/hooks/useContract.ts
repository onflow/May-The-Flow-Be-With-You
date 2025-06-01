import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { MINESWEEPER_CONTRACT_ADDRESS, MINESWEEPER_CONTRACT_ABI } from '../contracts/contracts';

export function useSaveScore() {
    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const saveScore = async (timeTaken: number, level: number) => {
        writeContract({
            address: MINESWEEPER_CONTRACT_ADDRESS,
            abi: MINESWEEPER_CONTRACT_ABI,
            functionName: 'addRecord',
            args: [BigInt(timeTaken), level],
        });
    };

    return {
        saveScore,
        isPending,
        isConfirming,
        isConfirmed,
        error
    };
}

export function useSaveNFT() {
    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const saveNFT = async (uri: string) => {
        writeContract({
            address: MINESWEEPER_CONTRACT_ADDRESS,
            abi: MINESWEEPER_CONTRACT_ABI,
            functionName: 'mint',
            args: [uri],
        });
    };

    return {
        saveNFT,
        isPending,
        isConfirming,
        isConfirmed,
        error
    };
}

export function useGetRecords() {
    const {
        data,
        error,
        isPending
    } = useReadContract({
        address: MINESWEEPER_CONTRACT_ADDRESS,
        abi: MINESWEEPER_CONTRACT_ABI,
        functionName: 'getRecords',
    });

    return {
        records: data,
        isPending,
        error
    };
}

export function useGetRandomNumber() {
    const {
        data,
        error,
        isPending
    } = useReadContract({
        address: MINESWEEPER_CONTRACT_ADDRESS,
        abi: MINESWEEPER_CONTRACT_ABI,
        functionName: 'getRandomNumber',
    });

    return {
        randomNumber: data ? (Number(data) - 1) / 10 : undefined,
        isPending,
        error
    };
} 
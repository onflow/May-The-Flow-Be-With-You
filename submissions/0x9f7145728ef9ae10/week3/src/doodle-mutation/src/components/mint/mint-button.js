'use client';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { potion } from "@/contracts/abi";
import { useEffect, useState } from 'react';

const POTION_ADDRESS = '0x6Ea1258406B88101073Fec4c3a306699717B69d9';

export default function MintButton() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState(null);
  const [isMinting, setIsMinting] = useState(false);

  const {
    data: hash,
    writeContractAsync,
    isPending: isWriting,
  } = useWriteContract();

  const {
    isLoading: isWaiting,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    setIsMinting(isWriting || isWaiting);
  }, [isWriting, isWaiting]);

  const handleMint = async () => {
    if (!address) return;
    setTxHash(null);
    try {
      const tx = await writeContractAsync({
        address: POTION_ADDRESS,
        abi: potion,
        functionName: 'mint',
        args: [address, 1],
      });
      setTxHash(tx);
    } catch (err) {
      console.error('Mint failed:', err);
    }
  };

  return (
    <div className="w-full">
      {!isMinting && !txHash && (
        <button
          className={`mt-10 flex items-center justify-center w-full ${
            address ? 'bg-green-300 text-black hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000]' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          } text-2xl font-bold border-4 border-black rounded-full shadow-[4px_4px_0_0_#000] transition-all duration-200 py-4 disabled:opacity-50`}
          onClick={handleMint}
          disabled={!address || isWriting}
        >
          {address ? 'Mint on Flow EVM' : 'Connect wallet to proceed'}
        </button>
      )}

      {isMinting && (
        <div className="flex items-center justify-center gap-3 text-yellow-600 font-medium text-lg mt-10">
          <svg className="animate-spin h-6 w-6 text-yellow-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Minting in Progress...
        </div>
      )}

      {txHash && isSuccess && (
        <div className="text-green-700 font-bold text-xl mt-8 text-center">
          ✅ It&apos;s in your wallet.<br />
          <a
            href={`https://evm-testnet.flowscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-gray-400 text-sm"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}

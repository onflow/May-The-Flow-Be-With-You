'use client';

import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { potion } from '@/contracts/abi';

const POTION_ADDRESS = '0x6Ea1258406B88101073Fec4c3a306699717B69d9';

export async function burnPotion(address) {
  if (!address) throw new Error('No wallet address provided to burnPotion');

  const tx = await writeContract(config, {
    address: POTION_ADDRESS,
    abi: potion,
    functionName: 'burn',
    args: [address, 1],
  });

  const receipt = await waitForTransactionReceipt(config, {
    hash: tx.hash,
  });

  if (!receipt.status) throw new Error('Burn transaction failed');

  return receipt;
}


import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { mutatedDoodles } from '@/contracts/abi';

const CONTRACT_ADDRESS = "0x5F3193B499718107E047975758381c1f43E2961d";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = 'https://testnet.evm.nodes.onflow.org';

export async function POST(request) {
  try {
    const body = await request.json();
    const { address, tokenURI } = body;

    if (!address || !tokenURI) {
      return new NextResponse('Missing address or tokenURI', { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, mutatedDoodles, wallet);

    const tx = await contract.mintNFT(address, tokenURI);
    const receipt = await tx.wait();

    return new NextResponse(`https://evm-testnet.flowscan.io/tx/${receipt.hash}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Mint error:', error);
    return new NextResponse('Minting failed', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { randomness } from '@/contracts/abi';
import { potion } from '@/database/potion';

const contractAddress = '0x9ACB1CF584AE558c7eedaDCc7dDF30Cd00461419';
const rpcEndpoint = 'https://testnet.evm.nodes.onflow.org';

// Fallback: generate a number from 0–49
function getRandomIndex() {
  return Math.floor(Math.random() * Math.min(50, potion.length));
}

export async function GET() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: 'Private key missing' }, { status: 500 });
  }

  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, randomness, signer);

  try {
    const tx = await contract.generateRandom();
    const receipt = await tx.wait();

    const iface = new ethers.Interface(randomness);
    let randomNumber;

    for (const log of receipt.logs) {
      try {
        const parsedLog = iface.parseLog(log);
        if (parsedLog.name === 'RandomNumberGenerated') {
          randomNumber = parsedLog.args.randomNumber;
          break;
        }
      } catch {
        continue;
      }
    }

    if (randomNumber === undefined) {
      const fallbackIndex = getRandomIndex();
      return NextResponse.json(potion[fallbackIndex]);
      
    }

    const index = Number(BigInt(randomNumber) % BigInt(potion.length));
    return NextResponse.json(potion[index]);

  } catch (err) {
    console.error('Error generating potion:', err);
    const fallbackIndex = getRandomIndex();
    return NextResponse.json(potion[fallbackIndex]);
  }
}

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import admin from 'firebase-admin';
import { sender } from '@/contract/abi.js';

// Firebase Setup
const firebaseConfig = JSON.parse(
  Buffer.from(process.env.FIREBASE, 'base64').toString('utf8')
);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: 'https://layerzero-cross-chain-default-rtdb.asia-southeast1.firebasedatabase.app',
  });
}
const db = admin.database();

// Ethers Setup
const provider = new ethers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/${process.env.INFURA}`
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const CONTRACT_ADDRESS = '0x48Cf9d4519FC0e6667CF6C409331333F61392F12';
const DST_EID = 40351;

export async function POST(req) {
  try {
    const { message } = await req.json();
    const senderAddress = await wallet.getAddress();

    // Quote fee (optional depending on your contract's requirements)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, sender, wallet);
    const [nativeFee] = await contract.quote(DST_EID, message, false);
    console.log(nativeFee);

    // Send tx
    const tx = await contract.send(DST_EID, message, { value: nativeFee });
    const txHash = tx.hash;
    const timestamp = new Date().toISOString();

    // Update Firebase
    // Increment the amount in pendingToSe/amount
    const amountRef = db.ref('pendingToFlow/amount');
    await amountRef.transaction((currentValue) => {
      return (currentValue || 0) + 1;
    });

    // Add txHash to pendingToSe/messages array
    const messagesRef = db.ref('pendingToFlow/messages');
    await messagesRef.transaction((messages) => {
      if (messages === null) {
        return [txHash];
      } else {
        if (!messages.includes(txHash)) {
          messages.push(txHash);
        }
        return messages;
      }
    });

    // Write details to toSe/${txHash}
    const txRef = db.ref(`toFlow/${txHash}`);
    await txRef.set({
      message,
      timestamp,
      sender: senderAddress,
      isReady: false,
    });

    return NextResponse.json({ status: 'success', txHash });
  } catch (error) {
    console.error('[toFlow error]', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

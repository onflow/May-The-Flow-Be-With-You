import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Decode Base64 env variable
const firebaseConfig = process.env.FIREBASE;

if (!firebaseConfig) {
  throw new Error('FIREBASE environment variable is missing.');
}

const decoded = JSON.parse(Buffer.from(firebaseConfig, 'base64').toString('utf8'));

// Initialize Firebase Admin (guard against re-initialization)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(decoded),
    databaseURL: 'https://layerzero-cross-chain-default-rtdb.asia-southeast1.firebasedatabase.app/',
  });
}

const db = admin.database();

// toSe
export async function POST(req) {
  try {
    const body = await req.json();
    const { txHash, message, sender } = body;

    if (!txHash || !message || !sender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Increment the amount in pendingToSe/amount
    const amountRef = db.ref('pendingToSe/amount');
    await amountRef.transaction((currentValue) => {
      return (currentValue || 0) + 1;
    });

    // Add txHash to pendingToSe/messages array
    const messagesRef = db.ref('pendingToSe/messages');
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
    const txRef = db.ref(`toSe/${txHash}`);
    await txRef.set({
      message,
      timestamp: now,
      sender,
      isReady: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to database:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

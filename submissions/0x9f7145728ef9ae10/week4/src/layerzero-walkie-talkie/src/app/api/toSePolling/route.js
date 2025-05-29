import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase setup
const firebaseConfig = process.env.FIREBASE;
if (!firebaseConfig) throw new Error('Missing FIREBASE env var');

const decoded = JSON.parse(Buffer.from(firebaseConfig, 'base64').toString('utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(decoded),
    databaseURL: 'https://layerzero-cross-chain-default-rtdb.asia-southeast1.firebasedatabase.app/',
  });
}

const db = admin.database();

export async function GET() {
  try {
    const pendingMessagesRef = db.ref('pendingToSe/messages');
    const amountRef = db.ref('pendingToSe/amount');

    // Get all txHashes from pendingToSe/messages
    const snapshot = await pendingMessagesRef.once('value');
    const txHashes = snapshot.val();

    if (!Array.isArray(txHashes) || txHashes.length === 0) {
      return NextResponse.json({ message: 'No pending txHashes' });
    }

    const remainingTxHashes = [];

    for (const txHash of txHashes) {
      const res = await fetch(`https://scan-testnet.layerzero-api.com/v1/messages/tx/${txHash}`, {
        headers: { accept: 'application/json' },
      });

      if (!res.ok) {
        console.warn(`Failed to fetch status for ${txHash}`);
        remainingTxHashes.push(txHash);
        continue;
      }

      const data = await res.json();
      const statusName = data?.data?.[0]?.status?.name;

      if (statusName === 'FAILED') {
        // Decrement amount
        await amountRef.transaction(current => (current || 1) - 1);

        // Delete toSe/${txHash}
        await db.ref(`toSe/${txHash}`).remove();

        // Do NOT add to remainingTxHashes
        continue;
      }

      if (statusName !== 'DELIVERED') {
        remainingTxHashes.push(txHash);
        continue;
      }

      // Update: toSe/${txHash}/isReady = true
      await db.ref(`toSe/${txHash}/isReady`).set(true);

      // Decrement amount
      await amountRef.transaction(current => (current || 1) - 1);

      // Fetch message
      const messageSnap = await db.ref(`toSe/${txHash}/message`).once('value');
      const message = messageSnap.val();

      if (typeof message === 'string' && message.trim().length > 0) {
        try {
          const replyRes = await fetch('https://layerzero-crosschain.vercel.app/api/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          });

          const replyText = await replyRes.text();

          await fetch('https:/layerzero-crosschain.vercel.app/api/toFlow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: replyText }),
          });
        } catch (error) {
          console.error(`Error calling reply or toFlow for ${txHash}:`, error);
        }
      } else {
        console.warn(`No valid message for txHash ${txHash}`);
      }
    }

    await pendingMessagesRef.set(remainingTxHashes);

    return NextResponse.json({ message: 'Polling complete', remaining: remainingTxHashes.length });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

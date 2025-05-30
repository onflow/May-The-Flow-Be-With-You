import admin from "firebase-admin";
import { NextResponse } from "next/server";

// Firebase setup
const firebaseConfig = process.env.FIREBASE;
if (!firebaseConfig) throw new Error("Missing FIREBASE env var");

const decoded = JSON.parse(
  Buffer.from(firebaseConfig, "base64").toString("utf8")
);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(decoded),
    databaseURL:
      "https://layerzero-cross-chain-default-rtdb.asia-southeast1.firebasedatabase.app/",
  });
}

const db = admin.database();

export async function GET() {
  try {
    const pendingMessagesRef = db.ref("pendingToFlow/messages");
    const amountRef = db.ref("pendingToFlow/amount");

    const snapshot = await pendingMessagesRef.once("value");
    const txHashes = snapshot.val();

    if (!Array.isArray(txHashes) || txHashes.length === 0) {
      return NextResponse.json({ message: "No pending txHashes" });
    }

    const remainingTxHashes = [];

    for (const txHash of txHashes) {
      const res = await fetch(
        `https://scan-testnet.layerzero-api.com/v1/messages/tx/${txHash}`,
        {
          headers: { accept: "application/json" },
        }
      );

      if (!res.ok) {
        console.warn(`Failed to fetch status for ${txHash}`);
        remainingTxHashes.push(txHash);
        continue;
      }

      const data = await res.json();
      const statusName = data?.data?.[0]?.status?.name;

      if (statusName === "FAILED") {

        await amountRef.transaction((current) =>
          Math.max((current || 1) - 1, 0)
        );
        
        await db.ref(`toFlow/${txHash}`).remove();

        continue;
      }

      if (statusName !== "DELIVERED") {
        remainingTxHashes.push(txHash);
        continue;
      }

      // DELIVERED
      await db.ref(`toFlow/${txHash}/isReady`).set(true);
      await amountRef.transaction((current) => Math.max((current || 1) - 1, 0));

    }

    // Update the pending messages list
    await pendingMessagesRef.set(remainingTxHashes);

    return NextResponse.json({
      message: "Polling complete",
      remaining: remainingTxHashes.length,
    });
  } catch (error) {
    console.error("Polling error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

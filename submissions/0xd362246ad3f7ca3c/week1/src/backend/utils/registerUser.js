import db from "../config.js";

export default async function registerUser(walletAddress) {
  if (!walletAddress || typeof walletAddress !== "string") {
    throw new Error("Invalid wallet address");
  }

  const userRef = db.ref(`${walletAddress}/completedGhibli`);

  try {
    await userRef.set(false);
    return `✅ User ${walletAddress} registered`;
  } catch (error) {
    console.error(`❌ Failed to register user ${walletAddress}:`, error);
    throw error;
  }
}

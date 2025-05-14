import db from "../config.js";
import { put } from "@vercel/blob";

export default async function uploadImage(walletAddress, arrayBuffer, dir) {

  if (!walletAddress || !arrayBuffer) {
    throw new Error("walletAddress and arrayBuffer are required.");
  }

  const filePath = `${dir}/${walletAddress}.png`;

  const blob = await put(filePath, arrayBuffer, {
    access: "public",
    contentType: "image/png",
  });

  const userRef = db.ref(`${walletAddress}/${dir}`);
  await userRef.set(blob.url);

  return blob.url;
}
import { db } from "@/lib/firebase"; // Firebase initialization
import { ref, set } from "firebase/database";
import { put } from "@vercel/blob"; // Vercel Blob SDK

export async function POST(req) {
  try {
    const { walletAddress, imageFile } = await req.json(); // Parse the incoming JSON body

    if (!walletAddress || !imageFile) {
      return new Response(
        JSON.stringify({ error: "walletAddress and imageFile are required." }),
        { status: 400 }
      );
    }

    // Decode the Base64-encoded image (assuming it's a PNG image)
    const buffer = Buffer.from(imageFile, "base64");

    const filePath = `images/${walletAddress}.png`; // Construct filename based on wallet address

    // Upload image to Vercel Blob Storage
    const blob = await put(filePath, buffer, {
      access: "public",
      contentType: "image/png",
    });

    // Save the image URL in Firebase under the user's profile
    const userRef = ref(db, `${walletAddress}/image`);
    await set(userRef, blob.url);

    return new Response(
      JSON.stringify({ message: "Image uploaded successfully", url: blob.url }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during file upload:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upload image" }),
      { status: 500 }
    );
  }
}

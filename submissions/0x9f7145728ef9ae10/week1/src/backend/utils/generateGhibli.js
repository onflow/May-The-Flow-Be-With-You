import db from "../config.js";
import uploadImage from "./uploadImage.js";
import OpenAI, { toFile } from "openai";
import axios from "axios";

export default async function generateGhibli(
  costume,
  accessory,
  background,
  walletAddress
) {
  const prompt = `Recreate this picture as a Studio Ghibli style upper-body headshot. 
  Change the person costume into ${costume} with a Flow blockchain logo on it. 
  The person has ${accessory} as an accessory. The headshot background is ${background}`;

  // Fetch image URL from Firebase Realtime Database
  const snapshot = await db.ref(`${walletAddress}/image`).once("value");
  const image = snapshot.val();

  const client = new OpenAI({
    apiKey: process.env.OPEN_AI
  });

  // Fetch the image from the URL as a buffer
  const response = await axios.get(image, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data);

  // Convert buffer to File object using toFile
  const imageFile = await toFile(imageBuffer, "input.png", {
    type: "image/png",
  });

  // Send the image to OpenAI for generating Ghibli art
  const rsp = await client.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt: prompt,
    quality: "high",
    size: "1024x1024"
  });

  // Store the result to Vercel storage
  const imageBase64 = rsp.data[0].b64_json;
  const outputBuffer = Buffer.from(imageBase64, "base64");
  await uploadImage(walletAddress, outputBuffer, "result");

  // Set completedGhibli=true
  const resultSnapshot = db.ref(`${walletAddress}`);
  await resultSnapshot.update({completedGhibli: true});

  return("Generate Ghibli and db updated successfully!");
}

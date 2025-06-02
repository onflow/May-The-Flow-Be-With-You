import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export async function generateMessage(prompt: string): Promise<string | undefined> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: `Generate a heartfelt gift card message based on this context: ${prompt}. 
     Keep it under 200 characters and make it personal and meaningful.`,
  });
  return response.text;
}

export async function generateImage(prompt: string): Promise<string | undefined> {
  /*const response = await ai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt: `Generate a beautiful gift card image with this description: ${prompt}
               Style: Digital art, high quality, vibrant colors
               Resolution: 360x360
               Format: PNG`,
    config: { numberOfImages: 1, aspectRatio: "1:1" },
  });

  
  return response.generatedImages?.[0]?.image?.gcsUri;*/

  // Image generation is not working as I don't have access to the paid API of Imagen, so we return a placeholder image
  return "https://picsum.photos/id/29/200/300"
} 
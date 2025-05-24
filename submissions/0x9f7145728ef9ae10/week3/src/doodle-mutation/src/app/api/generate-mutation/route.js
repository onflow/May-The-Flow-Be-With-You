import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

// Disable default body parsing (we're handling multipart form manually)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt");
    const openaiKey = formData.get("openaiKey");
    const imageBlob = formData.get("image");

    if (!prompt || !openaiKey || !imageBlob) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    const file = await toFile(buffer, "input.png", { type: "image/png" });

    const openai = new OpenAI({ apiKey: openaiKey });

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt: prompt,
      size: "1024x1024",
      quality: "high"
    });

    return new NextResponse(result.data[0].b64_json, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("Error in generate-mutation:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}

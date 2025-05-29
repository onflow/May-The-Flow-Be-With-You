import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPEN_AI
});

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'message' field" },
        { status: 400 }
      );
    }

    const prompt = `Imagine you are a futuristic explorer from the Flow Blockchain and travel cross-chain to the Ethereum blockchain to complete some mission. Response messages sent from the command center from Flow blockchain with a cyberpunk tone. You can sometimes share some of your adventure story. Remember, keep your response short.

Message: ${message}`;

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    return new NextResponse(reply, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error in /api/reply:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

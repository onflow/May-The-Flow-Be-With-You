import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPEN_AI,
});

export async function GET() {
  try {
    const prompt = `You're a cyberpunk explorer on the Flow Blockchain chit chatting to another explorer far on Ethereum blockchain. Remember, keep your respond around 150 chars.`;

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = completion.choices[0].message.content;

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error generating dummy response:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

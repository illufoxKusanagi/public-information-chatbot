import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      reply: text || "No content generated",
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    if (error instanceof Error && error.message.includes("quota")) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate response from AI." },
      { status: 500 }
    );
  }
}

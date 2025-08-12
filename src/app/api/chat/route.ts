import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

// Using the GoogleGenAI client from your code
const ai = new GoogleGenAI({
  apiKey: apiKey,
});

// The function signature MUST return a Promise<NextResponse>
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Using the model call from your code.
    // Note: The 'contents' property expects an array of Content objects.
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Using 1.5-flash as it's generally available. "gemini-2.5-flash" is not a valid model name yet.
      contents: [{ role: "user", parts: [{ text: message }] }],
    });

    // The API route MUST return a NextResponse object with JSON.
    return NextResponse.json({
      reply: response.text ?? "No content generated",
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    // The catch block MUST also return a NextResponse object.
    return NextResponse.json(
      { error: "Failed to generate response from AI." },
      { status: 500 }
    );
  }
}

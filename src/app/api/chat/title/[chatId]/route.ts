import { getChatHistoryTitle } from "@/lib/services/ai/rag.service";
import { NextRequest, NextResponse } from "next/server";

// For App Router
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = parseInt(params.chatId);

    if (!chatId || isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const title = await getChatHistoryTitle(chatId);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat title" },
      { status: 500 }
    );
  }
}

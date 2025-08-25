import { db } from "@/lib/db/index";
import { chatHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = 1;
  try {
    const history = await db.query.chatHistory.findMany({
      where: eq(chatHistory.userId, userId),
      orderBy: (chats, { desc }) => [desc(chats.createdAt)],
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch chat history",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = 1;
  try {
    const newChat = await db
      .insert(chatHistory)
      .values({
        userId: userId,
        title: "New Chat",
        messages: [],
      })
      .returning();
    return NextResponse.json(newChat[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create a new chat",
      },
      { status: 500 }
    );
  }
}

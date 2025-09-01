// Lokasi: app/api/chat/[chatId]/route.ts

import { db } from "@/lib/db/index";
import { chatHistory } from "@/lib/db/schema";
import { Message } from "@/lib/types/chat";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    chatId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { chatId } = await params;
  const userId = 1; // Ganti dengan logika autentikasi Anda

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  try {
    const history = await db.query.chatHistory.findFirst({
      where: eq(chatHistory.id, parseInt(chatId)),
      // Anda bisa menambahkan validasi userId di sini untuk keamanan
      // where: and(eq(chatHistory.id, parseInt(chatId)), eq(chatHistory.userId, userId)),
    });

    if (!history) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    const message = (history.messages as Message[]) || [];
    return NextResponse.json({
      id: history.id,
      title: history.title,
      messages: message,
      createdAt: history.createdAt,
      userId: history.userId,
    });
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

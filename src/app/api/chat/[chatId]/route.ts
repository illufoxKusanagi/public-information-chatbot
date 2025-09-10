import { db } from "@/lib/db/index";
import { chatHistory } from "@/lib/db/schema";
import {
  getAuthCookie,
  getUserFromToken,
} from "@/lib/services/auth/auth.service";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    chatId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Edited Here: Get authenticated user instead of hardcoding userId = 1
    const token = getAuthCookie();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = parseInt(params.chatId);

    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    // Edited Here: Query with both chatId AND userId to ensure user can only access their own chats
    const chat = await db.query.chatHistory.findFirst({
      where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, user.id)),
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF guard: allow only same-origin requests
    const origin = request.headers.get("origin");
    if (origin) {
      const reqHost = request.nextUrl.host;
      const originHost = new URL(origin).host;
      if (originHost !== reqHost) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // Edited Here: Get authenticated user for deletion
    const token = getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = parseInt(params.chatId);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    // Edited Here: Delete with user verification
    const deletedChat = await db
      .delete(chatHistory)
      .where(and(eq(chatHistory.id, chatId), eq(chatHistory.userId, user.id)))
      .returning();

    if (deletedChat.length === 0) {
      return NextResponse.json(
        { error: "Chat not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}

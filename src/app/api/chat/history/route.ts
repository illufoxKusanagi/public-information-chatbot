import { useAuth } from "@/app/context/auth-context";
import { db } from "@/lib/db/index";
import { chatHistory } from "@/lib/db/schema";
import {
  getAuthCookie,
  getUserFromToken,
} from "@/lib/services/auth/auth.service";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Tidak ada token" },
        { status: 401 }
      );
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }
    const userId = user.id;
    const history = await db.query.chatHistory.findMany({
      where: eq(chatHistory.userId, userId),
      orderBy: (chats, { desc }) => [desc(chats.createdAt)],
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal untuk fetch chat history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthCookie();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized - Tidak ada token" },
        { status: 401 }
      );
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }
    const userId = user.id;
    const newChat = await db
      .insert(chatHistory)
      .values({
        userId: userId,
        title: "Chat baru",
        messages: [],
      })
      .returning();
    return NextResponse.json(newChat[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat history chat" },
      { status: 500 }
    );
  }
}

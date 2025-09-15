import { getDb } from "@/lib/db";
import { chatHistory, messages } from "@/lib/db/schema";
import {
  withMiddleware,
  createAuthMiddleware,
  createRateLimitMiddleware,
  ApiError,
  AuthenticatedRequest,
} from "@/middleware/api";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface ChatParams {
  chatId: string;
}

async function getChatHandler(
  request: AuthenticatedRequest,
  { params }: { params: ChatParams }
) {
  const userId = request.user!.userId;
  const chatId = params.chatId;

  // if (isNaN(chatId) || chatId <= 0) {
  //   throw new ApiError("ID chat tidak valid", 400, "INVALID_CHAT_ID");
  // }

  console.log(`[GET_CHAT] User ${userId} requesting chat ${chatId}`);

  try {
    const db = getDb();

    // Verify chat exists and user owns it
    const [chat] = await db
      .select({
        id: chatHistory.id,
        title: chatHistory.title,
        userId: chatHistory.userId,
        createdAt: chatHistory.createdAt,
        // updatedAt: chatHistory.updatedAt,
      })
      .from(chatHistory)
      .where(eq(chatHistory.id, chatId))
      .limit(1);

    if (!chat) {
      throw new ApiError("Chat tidak ditemukan", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new ApiError(
        "Anda tidak memiliki akses ke chat ini",
        403,
        "CHAT_ACCESS_DENIED"
      );
    }

    // Get all messages for this chat
    const chatMessages = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    console.log(
      `[GET_CHAT] Found chat ${chatId} with ${chatMessages.length} messages`
    );

    return NextResponse.json({
      success: true,
      data: {
        chat: {
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          // updatedAt: chat.updatedAt,
        },
        messages: chatMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
        messageCount: chatMessages.length,
      },
    });
  } catch (error) {
    console.error(`[GET_CHAT] Error fetching chat ${chatId}:`, error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Gagal mengambil data chat",
      500,
      "GET_CHAT_ERROR"
      //   {
      //   chatId,
      //   userId,
      // }
    );
  }
}

async function deleteChatHandler(
  request: AuthenticatedRequest,
  { params }: { params: ChatParams }
) {
  const userId = request.user!.userId;
  const chatId = params.chatId;

  // if (isNaN(chatId) || chatId <= 0) {
  //   throw new ApiError("ID chat tidak valid", 400, "INVALID_CHAT_ID");
  // }

  console.log(`[DELETE_CHAT] User ${userId} deleting chat ${chatId}`);

  try {
    const db = getDb();

    // Verify chat exists and user owns it
    const [chat] = await db
      .select({ userId: chatHistory.userId })
      .from(chatHistory)
      .where(eq(chatHistory.id, chatId))
      .limit(1);

    if (!chat) {
      throw new ApiError("Chat tidak ditemukan", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new ApiError(
        "Anda tidak memiliki akses ke chat ini",
        403,
        "CHAT_ACCESS_DENIED"
      );
    }

    // Delete messages first (foreign key constraint)
    const deletedMessages = await db
      .delete(messages)
      .where(eq(messages.chatId, chatId))
      .returning({ id: messages.id });

    // Delete the chat
    await db.delete(chatHistory).where(eq(chatHistory.id, chatId));

    console.log(
      `[DELETE_CHAT] Deleted chat ${chatId} and ${deletedMessages.length} messages`
    );

    return NextResponse.json({
      success: true,
      message: "Chat berhasil dihapus",
      data: {
        deletedChatId: chatId,
        deletedMessageCount: deletedMessages.length,
      },
    });
  } catch (error) {
    console.error(`[DELETE_CHAT] Error deleting chat ${chatId}:`, error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Gagal menghapus chat",
      500,
      "DELETE_CHAT_ERROR"
      // {
      //   chatId,
      //   userId,
      // }
    );
  }
}

export const GET = (request: NextRequest, context: { params: ChatParams }) => {
  return withMiddleware(
    createRateLimitMiddleware(60, 60000), // 60 requests per minute for reading
    createAuthMiddleware()
  )(request, (req) => getChatHandler(req, context));
};

export const DELETE = (
  request: NextRequest,
  context: { params: ChatParams }
) => {
  return withMiddleware(
    createRateLimitMiddleware(10, 60000), // 10 deletes per minute
    createAuthMiddleware()
  )(request, (req) => deleteChatHandler(req, context));
};

// import { getDb } from "@/lib/db/index";
// import { chatHistory } from "@/lib/db/schema";
// import {
//   getAuthCookie,
//   getUserFromToken,
// } from "@/lib/services/auth/auth.service";
// import { eq, and } from "drizzle-orm";
// import { NextRequest, NextResponse } from "next/server";

// interface RouteParams {
//   params: {
//     chatId: string;
//   };
// }

// const db = getDb();

// export async function GET(request: NextRequest, { params }: RouteParams) {
//   try {
//     const token = await getAuthCookie();

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await getUserFromToken(token);

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const chatId = parseInt(params.chatId);

//     if (isNaN(chatId)) {
//       return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
//     }

//     const chat = await db.query.chatHistory.findFirst({
//       where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, user.id)),
//     });

//     if (!chat) {
//       return NextResponse.json(
//         { error: "Chat not found or access denied" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(chat);
//   } catch (error) {
//     console.error("Error fetching chat:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch chat" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(request: NextRequest, { params }: RouteParams) {
//   try {
//     // CSRF guard: allow only same-origin requests
//     const origin = request.headers.get("origin");
//     if (origin) {
//       const reqHost = request.nextUrl.host;
//       const originHost = new URL(origin).host;
//       if (originHost !== reqHost) {
//         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//       }
//     }
//     // Edited Here: Get authenticated user for deletion
//     const token = await getAuthCookie();
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await getUserFromToken(token);
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const chatId = parseInt(params.chatId);
//     if (isNaN(chatId)) {
//       return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
//     }
//     const deletedChat = await db
//       .delete(chatHistory)
//       .where(and(eq(chatHistory.id, chatId), eq(chatHistory.userId, user.id)))
//       .returning();
//     if (deletedChat.length === 0) {
//       return NextResponse.json(
//         { error: "Chat not found or access denied" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ message: "Chat deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting chat:", error);
//     return NextResponse.json(
//       { error: "Failed to delete chat" },
//       { status: 500 }
//     );
//   }
// }

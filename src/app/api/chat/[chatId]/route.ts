import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import {
  withMiddleware,
  createRateLimitMiddleware,
  ApiError,
} from "@/middleware/api";
import { verifyToken } from "@/lib/auth/jwt";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface ChatParams {
  chatId: string;
}

// Hybrid handler that supports both authenticated and guest users
async function getChatHandler(
  request: NextRequest,
  { params }: { params: ChatParams }
) {
  const chatId = params.chatId;
  let userId = null;
  let isAuthenticated = false;

  // Try to get user authentication, but don't require it
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload.type === "access") {
        userId = payload.userId;
        isAuthenticated = true;
      }
    }
  } catch (error) {
    console.log("No valid auth token, attempting guest access");
  }

  console.log(
    `[GET_CHAT] ${
      isAuthenticated ? "User " + userId : "Guest"
    } requesting chat ${chatId}`
  );

  try {
    const db = getDb();

    // Get chat details
    const [chat] = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        userId: conversations.userId,
        isGuestChat: conversations.isGuestChat,
        expiresAt: conversations.expiresAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(eq(conversations.id, chatId))
      .limit(1);

    if (!chat) {
      throw new ApiError("Chat tidak ditemukan", 404, "CHAT_NOT_FOUND");
    }

    // Check access permissions
    if (chat.isGuestChat) {
      // For guest chats, check if expired
      if (chat.expiresAt && new Date() > chat.expiresAt) {
        throw new ApiError(
          "Chat sementara telah kedaluwarsa",
          410,
          "CHAT_EXPIRED"
        );
      }
      // Guest chats are accessible by anyone
    } else {
      // For user chats, must be authenticated and own the chat
      if (!isAuthenticated) {
        throw new ApiError(
          "Autentikasi diperlukan untuk chat pengguna",
          401,
          "AUTH_REQUIRED"
        );
      }
      if (chat.userId !== userId) {
        throw new ApiError(
          "Anda tidak memiliki akses ke chat ini",
          403,
          "CHAT_ACCESS_DENIED"
        );
      }
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
      `[GET_CHAT] Found ${
        chat.isGuestChat ? "guest" : "user"
      } chat ${chatId} with ${chatMessages.length} messages`
    );

    return NextResponse.json({
      success: true,
      data: {
        chat: {
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          isGuestChat: chat.isGuestChat || false,
          expiresAt: chat.expiresAt,
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

    throw new ApiError("Gagal mengambil data chat", 500, "GET_CHAT_ERROR");
  }
}

// Hybrid delete handler
async function deleteChatHandler(
  request: NextRequest,
  { params }: { params: ChatParams }
) {
  const chatId = params.chatId;
  let userId = null;
  let isAuthenticated = false;

  // Try to get user authentication
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload.type === "access") {
        userId = payload.userId;
        isAuthenticated = true;
      }
    }
  } catch (error) {
    console.log("No valid auth token for delete operation");
  }

  console.log(
    `[DELETE_CHAT] ${
      isAuthenticated ? "User " + userId : "Guest"
    } deleting chat ${chatId}`
  );

  try {
    const db = getDb();

    // Get chat details to verify access
    const [chat] = await db
      .select({
        userId: conversations.userId,
        isGuestChat: conversations.isGuestChat,
        expiresAt: conversations.expiresAt,
      })
      .from(conversations)
      .where(eq(conversations.id, chatId))
      .limit(1);

    if (!chat) {
      throw new ApiError("Chat tidak ditemukan", 404, "CHAT_NOT_FOUND");
    }

    // Check permissions
    if (chat.isGuestChat) {
      // Guest chats can be deleted by anyone (for cleanup)
      if (chat.expiresAt && new Date() > chat.expiresAt) {
        console.log("Deleting expired guest chat");
      }
    } else {
      // User chats require authentication and ownership
      if (!isAuthenticated) {
        throw new ApiError("Autentikasi diperlukan", 401, "AUTH_REQUIRED");
      }
      if (chat.userId !== userId) {
        throw new ApiError(
          "Anda tidak memiliki akses ke chat ini",
          403,
          "CHAT_ACCESS_DENIED"
        );
      }
    }

    // Delete messages first (foreign key constraint)
    const deletedMessages = await db
      .delete(messages)
      .where(eq(messages.chatId, chatId))
      .returning({ id: messages.id });

    // Delete the chat
    await db.delete(conversations).where(eq(conversations.id, chatId));

    console.log(
      `[DELETE_CHAT] Deleted ${
        chat.isGuestChat ? "guest" : "user"
      } chat ${chatId} and ${deletedMessages.length} messages`
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

    throw new ApiError("Gagal menghapus chat", 500, "DELETE_CHAT_ERROR");
  }
}

export const GET = (request: NextRequest, context: { params: ChatParams }) => {
  return withMiddleware(
    createRateLimitMiddleware(60, 60000) // 60 requests per minute for reading
  )(request, () => getChatHandler(request, context));
};

export const DELETE = (
  request: NextRequest,
  context: { params: ChatParams }
) => {
  return withMiddleware(
    createRateLimitMiddleware(10, 60000) // 10 deletes per minute
  )(request, () => deleteChatHandler(request, context));
};

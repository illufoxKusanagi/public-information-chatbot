import { getDb } from "@/lib/db";
import { chatHistory, messages } from "@/lib/db/schema";
import {
  withMiddleware,
  createAuthMiddleware,
  createRateLimitMiddleware,
  ApiError,
  AuthenticatedRequest,
} from "@/middleware/api";
import { eq, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function getChatHistoryHandler(request: AuthenticatedRequest) {
  const userId = request.user!.userId;

  console.log(`[CHAT_HISTORY] Fetching history for user: ${userId}`);

  try {
    const db = getDb();

    // Get chat history with message counts
    const chats = await db
      .select({
        id: chatHistory.id,
        title: chatHistory.title,
        createdAt: chatHistory.createdAt,
        // updatedAt: chatHistory.updatedAt,
        messageCount: sql<number>`(
          SELECT COUNT(*) FROM ${messages} 
          WHERE ${messages.chatId} = ${chatHistory.id}
        )`.as("message_count"),
        lastMessage: sql<string>`(
          SELECT ${messages.content} FROM ${messages} 
          WHERE ${messages.chatId} = ${chatHistory.id}
          ORDER BY ${messages.createdAt} DESC 
          LIMIT 1
        )`.as("last_message"),
      })
      .from(chatHistory)
      .where(eq(chatHistory.userId, userId))
      // .orderBy(desc(chatHistory.updatedAt))
      .limit(50); // Limit to last 50 chats

    console.log(
      `[CHAT_HISTORY] Found ${chats.length} chats for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        chats: chats.map((chat) => ({
          id: chat.id,
          title: chat.title,
          messageCount: Number(chat.messageCount) || 0,
          lastMessage: chat.lastMessage
            ? chat.lastMessage.length > 100
              ? chat.lastMessage.substring(0, 97) + "..."
              : chat.lastMessage
            : null,
          createdAt: chat.createdAt,
          // updatedAt: chat.updatedAt,
        })),
        total: chats.length,
      },
    });
  } catch (error) {
    console.error(`[CHAT_HISTORY] Error fetching history:`, error);
    throw new ApiError(
      "Gagal mengambil riwayat chat",
      500,
      "CHAT_HISTORY_ERROR"
      // { userId }
    );
  }
}

export const GET = (request: NextRequest) => {
  return withMiddleware(
    createRateLimitMiddleware(30, 60000), // 30 requests per minute
    createAuthMiddleware()
  )(request, getChatHistoryHandler);
};

// import { useAuth } from "@/app/context/auth-context";
// import { getDb } from "@/lib/db/index";
// import { chatHistory } from "@/lib/db/schema";
// // import {
// //   getAuthCookie,
// //   getUserFromToken,
// // } from "@/lib/services/auth/auth.service";
// import { eq } from "drizzle-orm";
// import { NextRequest, NextResponse } from "next/server";

// const db = getDb();

// export async function GET(request: NextRequest) {
//   try {
//     const token = await getAuthCookie();
//     if (!token) {
//       return NextResponse.json(
//         { error: "Unauthorized - Tidak ada token" },
//         { status: 401 }
//       );
//     }
//     const user = await getUserFromToken(token);
//     if (!user) {
//       return NextResponse.json(
//         { message: "Unauthorized - Token tidak valid" },
//         { status: 401 }
//       );
//     }
//     const userId = user.id;
//     const history = await db.query.chatHistory.findMany({
//       where: eq(chatHistory.userId, userId),
//       orderBy: (chats, { desc }) => [desc(chats.createdAt)],
//     });
//     return NextResponse.json(history);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Gagal untuk fetch chat history" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const token = getAuthCookie();
//     if (!token) {
//       return NextResponse.json(
//         { message: "Unauthorized - Tidak ada token" },
//         { status: 401 }
//       );
//     }
//     const user = await getUserFromToken(token);
//     if (!user) {
//       return NextResponse.json(
//         { message: "Unauthorized - Token tidak valid" },
//         { status: 401 }
//       );
//     }
//     const userId = user.id;
//     const newChat = await db
//       .insert(chatHistory)
//       .values({
//         userId: userId,
//         title: "Chat baru",
//         messages: [],
//       })
//       .returning();
//     return NextResponse.json(newChat[0], { status: 200 });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Gagal membuat history chat" },
//       { status: 500 }
//     );
//   }
// }

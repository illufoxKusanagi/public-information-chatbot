import { getDb } from "@/lib/db";
import { chatHistory } from "@/lib/db/schema";
import {
  withMiddleware,
  createAuthMiddleware,
  createValidationMiddleware,
  createRateLimitMiddleware,
  ApiError,
  AuthenticatedRequest,
} from "@/middleware/api";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface ChatTitleParams {
  chatId: string;
}

const updateTitleSchema = z.object({
  title: z
    .string()
    .min(1, "Judul tidak boleh kosong")
    .max(100, "Judul terlalu panjang (maksimal 100 karakter)")
    .trim(),
});

async function getChatTitleHandler(
  request: AuthenticatedRequest,
  { params }: { params: ChatTitleParams }
) {
  const userId = request.user!.userId;
  const chatId = params.chatId;

  // if (isNaN(chatId) || chatId <= 0) {
  //   throw new ApiError("ID chat tidak valid", 400, "INVALID_CHAT_ID");
  // }

  try {
    const db = getDb();

    const [chat] = await db
      .select({
        title: chatHistory.title,
        userId: chatHistory.userId,
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

    return NextResponse.json({
      success: true,
      data: {
        chatId,
        title: chat.title || `Chat #${chatId}`,
      },
    });
  } catch (error) {
    console.error(`[GET_TITLE] Error getting title for chat ${chatId}:`, error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Gagal mengambil judul chat",
      500,
      "GET_TITLE_ERROR"
      //    {
      //   chatId,
      //   userId,
      // }
    );
  }
}

async function updateChatTitleHandler(
  request: AuthenticatedRequest & { validatedData?: any },
  { params }: { params: ChatTitleParams }
) {
  const userId = request.user!.userId;
  const chatId = params.chatId;
  const { title } = request.validatedData;

  // if (isNaN(chatId) || chatId <= 0) {
  //   throw new ApiError("ID chat tidak valid", 400, "INVALID_CHAT_ID");
  // }

  console.log(
    `[UPDATE_TITLE] User ${userId} updating title for chat ${chatId} to: ${title}`
  );

  try {
    const db = getDb();

    // Verify chat exists and user owns it
    const [existingChat] = await db
      .select({ userId: chatHistory.userId })
      .from(chatHistory)
      .where(eq(chatHistory.id, chatId))
      .limit(1);

    if (!existingChat) {
      throw new ApiError("Chat tidak ditemukan", 404, "CHAT_NOT_FOUND");
    }

    if (existingChat.userId !== userId) {
      throw new ApiError(
        "Anda tidak memiliki akses ke chat ini",
        403,
        "CHAT_ACCESS_DENIED"
      );
    }

    // Update the title
    const [updatedChat] = await db
      .update(chatHistory)
      .set({
        title,
        // updatedAt: new Date(),
      })
      .where(eq(chatHistory.id, chatId))
      .returning({
        id: chatHistory.id,
        title: chatHistory.title,
        // updatedAt: chatHistory.updatedAt,
      });

    console.log(`[UPDATE_TITLE] Successfully updated title for chat ${chatId}`);

    return NextResponse.json({
      success: true,
      message: "Judul chat berhasil diperbarui",
      data: {
        chatId: updatedChat.id,
        title: updatedChat.title,
        // updatedAt: updatedChat.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      `[UPDATE_TITLE] Error updating title for chat ${chatId}:`,
      error
    );

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Gagal memperbarui judul chat",
      500,
      "UPDATE_TITLE_ERROR"
      // { chatId, userId, title }
    );
  }
}

export const GET = (
  request: NextRequest,
  context: { params: ChatTitleParams }
) => {
  return withMiddleware(
    createRateLimitMiddleware(60, 60000),
    createAuthMiddleware()
  )(request, (req) => getChatTitleHandler(req, context));
};

export const PUT = (
  request: NextRequest,
  context: { params: ChatTitleParams }
) => {
  return withMiddleware(
    createRateLimitMiddleware(20, 60000),
    createAuthMiddleware(),
    createValidationMiddleware(updateTitleSchema)
  )(request, (req) => updateChatTitleHandler(req, context));
};

// import { getChatHistoryTitleWithAuth } from "@/lib/services/ai/rag.service";
// import {
//   getAuthCookie,
//   getUserFromToken,
// } from "@/lib/services/auth/auth.service";
// import { NextRequest, NextResponse } from "next/server";

// // Edited Here: Changed parameter destructuring to match [chatId] file name
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { chatId: string } }
// ) {
//   try {
//     const token = getAuthCookie();

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await getUserFromToken(token);

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Edited Here: Use params.chatId instead of params.id
//     const chatIdString = params.chatId;
//     console.log("Received chatId parameter:", chatIdString);

//     if (!chatIdString || chatIdString.trim() === "") {
//       return NextResponse.json(
//         { error: "Chat ID is required" },
//         { status: 400 }
//       );
//     }

//     const chatId = parseInt(chatIdString, 10);

//     if (isNaN(chatId) || chatId <= 0) {
//       console.log("Invalid chatId:", chatIdString, "parsed as:", chatId);
//       return NextResponse.json(
//         { error: "Invalid chat ID format" },
//         { status: 400 }
//       );
//     }

//     console.log("Fetching title for chatId:", chatId, "userId:", user.id);

//     const result = await getChatHistoryTitleWithAuth(chatId, user.id);

//     if (!result.success) {
//       console.log("Failed to get chat title:", result.error);
//       return NextResponse.json(
//         { error: result.error },
//         { status: result.error?.includes("access denied") ? 403 : 404 }
//       );
//     }

//     return NextResponse.json({ title: result.title });
//   } catch (error) {
//     console.error("Error fetching chat title:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch chat title" },
//       { status: 500 }
//     );
//   }
// }

// // import { getChatHistoryTitleWithAuth } from "@/lib/services/ai/rag.service";
// // import {
// //   getAuthCookie,
// //   getUserFromToken,
// // } from "@/lib/services/auth/auth.service";
// // import { NextRequest, NextResponse } from "next/server";

// // export async function GET(
// //   request: NextRequest,
// //   { params }: { params: { id: string } }
// // ) {
// //   try {
// //     // Edited Here: Get authenticated user instead of allowing anonymous access
// //     const token = getAuthCookie();

// //     if (!token) {
// //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //     }

// //     const user = await getUserFromToken(token);

// //     if (!user) {
// //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //     }

// //     const chatId = parseInt(params.id);

// //     if (isNaN(chatId)) {
// //       return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
// //     }

// //     // Edited Here: Use the authenticated user ID instead of hardcoded value
// //     const result = await getChatHistoryTitleWithAuth(chatId, user.id);

// //     if (!result.success) {
// //       return NextResponse.json(
// //         { error: result.error },
// //         { status: result.error?.includes("access denied") ? 403 : 404 }
// //       );
// //     }

// //     return NextResponse.json({ title: result.title });
// //   } catch (error) {
// //     console.error("Error fetching chat title:", error);
// //     return NextResponse.json(
// //       { error: "Failed to fetch chat title" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // import { getChatHistoryTitleWithAuth } from "@/lib/services/ai/rag.service";
// // import {
// //   getAuthCookie,
// //   getUserFromToken,
// // } from "@/lib/services/auth/auth.service";
// // import { NextRequest, NextResponse } from "next/server";

// // // For App Router
// // export async function GET(
// //   request: NextRequest,
// //   { params }: { params: { id: string } }
// // ) {
// //   try {
// //     const token = getAuthCookie();
// //     if (!token) {
// //       return NextResponse.json(
// //         { message: "Unauthorized - Tidak ada token" },
// //         { status: 401 }
// //       );
// //     }
// //     const user = await getUserFromToken(token);
// //     if (!user) {
// //       return NextResponse.json(
// //         { message: "Unauthorized - Token tidak valid" },
// //         { status: 401 }
// //       );
// //     }
// //     const chatId = parseInt(params.id);
// //     const result = await getChatHistoryTitleWithAuth(chatId, user.id);
// //     if (!result.success) {
// //       return NextResponse.json(
// //         { error: result.error },
// //         { status: result.error?.includes("access denied") ? 403 : 404 }
// //       );
// //     }

// //     return NextResponse.json({ title: result.title });
// //   } catch (error) {
// //     console.error("API Error:", error);
// //     return NextResponse.json(
// //       { error: "Failed to fetch chat title" },
// //       { status: 500 }
// //     );
// //   }
// // }

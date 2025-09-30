import { getDb } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { findRelevantContents } from "@/lib/services/ai/rag.service";
import {
  ApiError,
  AuthenticatedRequest,
  withMiddleware,
} from "@/middleware/api";
import { verifyToken } from "@/lib/auth/jwt";
import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const apiKey: string = process.env.GEMINI_API_KEY || "";
const generativeModel: string =
  process.env.GENERATIVE_MODEL || "gemini-1.5-flash";

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  throw new ApiError(
    "Tidak dapat memproses respon chatbot, silahkan hubungi admin.",
    500,
    "API_CONFIG_ERROR"
  );
}

const genAI = new GoogleGenAI({ apiKey });

const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long")
    .trim(),
  chatId: z.union([z.string(), z.number()]).optional(), // Accept string, number, or undefined
});

// Edited here: Fixed generateChatTitle function that was missing
async function generateChatTitle(message: string): Promise<string> {
  try {
    const result = await genAI.models.generateContent({
      model: generativeModel,
      contents: `Generate a short, descriptive title (max 50 characters) for a chat that starts with: "${message}". Return only the title.`,
    });
    const title = result.text?.trim() || "New Chat";
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    console.error("Title generation error:", error);
    return "New Chat";
  }
}

async function chatHandler(
  request: AuthenticatedRequest & { validatedData?: any }
) {
  const { message, chatId } = request.validatedData || {};
  const db = getDb();
  const userId = request.user!.userId;
  let currentChatId = chatId;
  if (!message) {
    throw new ApiError("Pesan tidak boleh kosong", 400, "MISSING_MESSAGE");
  }
  try {
    if (!currentChatId) {
      const title = await generateChatTitle(message);
      const [newChat] = await db
        .insert(conversations)
        .values({
          userId: request.user!.userId,
          title: title || "New Chat",
          createdAt: new Date(),
          // updatedAt: new Date(),
        })
        .returning({ id: conversations.id });
      currentChatId = newChat.id;
    } else {
      // Edited here: Your original ownership verification
      const [existingChat] = await db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, currentChatId))
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
    }

    const [userMessage] = await db
      .insert(messages)
      .values({
        chatId: currentChatId,
        role: "user",
        content: message,
        createdAt: new Date(),
      })
      .returning();

    // Edited here: Your original RAG implementation
    const ragResults = await findRelevantContents(message);

    const aiResponse = await generateAiResponse(message, ragResults);
    const [aiMessage] = await db
      .insert(messages)
      .values({
        chatId: currentChatId,
        role: "bot",
        content: aiResponse,
        createdAt: new Date(),
      })
      .returning();

    const sources = ragResults.map((r) => ({
      title: r.title || "Sumber Internal",
      source: r.source || "INTERNAL",
      similarity: r.similarity || 0,
    }));

    // Edited here: Your original AI message insertion

    return NextResponse.json({
      success: true,
      data: {
        chatId: currentChatId,
        userMessage,
        aiMessage,
        sources,
        context: {
          totalSources: sources.length,
          hasExternalData: sources.some((s) => s.source !== "INTERNAL"),
        },
      },
    });
  } catch (error) {
    console.error("Chat error: ", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Failed to process chat message",
      500,
      "CHAT_PROCESSING_ERROR"
    );
  }
}

// Edited here: Your original superior AI response generation
async function generateAiResponse(userMessage: string, contextData: any[]) {
  try {
    const context =
      contextData.length > 0
        ? `
KONTEKS INFORMASI:
${contextData
  .map(
    (item, index) => `
[SUMBER ${index + 1}: ${
      item.source?.toUpperCase() || "INTERNAL"
    } - Relevansi: ${(item.similarity * 100).toFixed(1)}%]
${
  typeof item.data === "object"
    ? JSON.stringify(item.data, null, 2)
    : item.content
}
---`
  )
  .join("\n")}
`
        : "KONTEKS: Tidak ada informasi spesifik ditemukan di database untuk pertanyaan ini.";

    const systemPrompt = `
Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

PERATURAN PENTING:
1.  HANYA GUNAKAN BAHASA INDONESIA
2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
3.  JAWAB HANYA BERDASARKAN INFORMASI DARI KONTEKS.
4.  Jika informasi yang diminta tidak ada di dalam KONTEKS, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
7.  Jika menggunakan data dari sumber eksternal (OPENWEATHER, NEWSAPI, dll), sebutkan sumbernya di akhir jawaban.

FORMAT JAWABAN:
- Berikan jawaban yang terstruktur dan mudah dibaca
- Jika data dari API eksternal, tambahkan: "*(Sumber: [NAMA_SUMBER])*" di akhir
- Contoh: "Cuaca hari ini di Madiun cerah dengan suhu 28°C. *(Sumber: OpenWeather)*"

FORMAT PEMBERIAN SUMBER:
- Berikan dalam bentuk poin-poin
- Contoh:
"Sumber: * OpenWeather
         * OpenHoliday
         * Internal: <kategori>
`;

    const augmentedPrompt = `${systemPrompt} ${context}\nPERTANYAAN PENGGUNA: "${userMessage}"\nJAWABAN ANDA:`;

    const result = await genAI.models.generateContent({
      model: generativeModel,
      contents: augmentedPrompt,
    });

    return (
      result.text || "Maaf, tidak dapat memproses permintaan Anda saat ini."
    );
  } catch (error) {
    console.error("AI generation error:", error);
    return "Maaf, terjadi kesalahan dalam memproses pertanyaan Anda. Silakan coba lagi.";
  }
}

// Create a new handler that supports both authenticated and anonymous users
async function hybridChatHandler(request: NextRequest) {
  const body = await request.json();
  const { message, chatId } = chatMessageSchema.parse(body);
  const db = getDb();

  // Try to get user authentication, but don't require it
  let user = null;
  let userId = null;
  let isGuestUser = false;

  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload.type === "access") {
        user = { userId: payload.userId, email: payload.email };
        userId = payload.userId;
      }
    }
  } catch (error) {
    console.log("No valid auth token, continuing as guest user");
    isGuestUser = true;
  }

  // If no user authentication, we're dealing with a guest
  if (!userId) {
    isGuestUser = true;
  }

  // Convert chatId to string if it exists (database uses UUID strings)
  let currentChatId = chatId ? String(chatId) : undefined;

  // For authenticated users - existing logic
  if (userId) {
    try {
      if (!currentChatId) {
        const title = await generateChatTitle(message);
        const [newChat] = await db
          .insert(conversations)
          .values({
            userId: userId,
            title: title || "New Chat",
            createdAt: new Date(),
            isGuestChat: false,
          })
          .returning({ id: conversations.id });
        currentChatId = newChat.id;
      } else {
        // Verify ownership for authenticated users
        const [existingChat] = await db
          .select({ userId: conversations.userId })
          .from(conversations)
          .where(eq(conversations.id, currentChatId))
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
      }

      // Save user message for authenticated users
      await db.insert(messages).values({
        chatId: currentChatId,
        role: "user",
        content: message,
        createdAt: new Date(),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error("Database error for authenticated user:", error);
      throw new ApiError("Failed to save message", 500);
    }
  }

  // For guest users - create temporary chat with 1-day expiration
  else {
    try {
      if (!currentChatId) {
        const title = await generateChatTitle(message);
        const guestSessionId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

        const [newGuestChat] = await db
          .insert(conversations)
          .values({
            userId: null, // No user ID for guest chats
            title: title || "Guest Chat",
            createdAt: new Date(),
            isGuestChat: true,
            guestSessionId: guestSessionId,
            expiresAt: expiresAt,
          })
          .returning({ id: conversations.id });
        currentChatId = newGuestChat.id;
      } else {
        // For guest users with existing chatId, verify it's a guest chat
        const [existingChat] = await db
          .select({
            isGuestChat: conversations.isGuestChat,
            expiresAt: conversations.expiresAt,
          })
          .from(conversations)
          .where(eq(conversations.id, currentChatId))
          .limit(1);

        if (!existingChat) {
          throw new ApiError("Chat tidak ditemukan", 404, "CHAT_NOT_FOUND");
        }
        if (!existingChat.isGuestChat) {
          throw new ApiError(
            "Akses ditolak ke chat pengguna terdaftar",
            403,
            "CHAT_ACCESS_DENIED"
          );
        }
        // Check if guest chat has expired
        if (existingChat.expiresAt && new Date() > existingChat.expiresAt) {
          throw new ApiError(
            "Chat sementara telah kedaluwarsa",
            410,
            "CHAT_EXPIRED"
          );
        }
      }

      // Save user message for guest users
      await db.insert(messages).values({
        chatId: currentChatId,
        role: "user",
        content: message,
        createdAt: new Date(),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error("Database error for guest user:", error);
      throw new ApiError("Failed to save guest message", 500);
    }
  }

  // Generate AI response (works for both authenticated and guest users)
  const ragResults = await findRelevantContents(message);
  const aiResponse = await generateAiResponse(message, ragResults);

  // Save AI response for both authenticated and guest users
  if (currentChatId) {
    try {
      await db.insert(messages).values({
        chatId: currentChatId,
        role: "bot",
        content: aiResponse,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving AI response:", error);
      // Continue without saving - user still gets response
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      chatId: currentChatId, // Always return chatId for both user types
      message: {
        role: "bot",
        content: aiResponse,
      },
      sources: ragResults.map((r) => ({
        title: r.title || "Internal Source",
        source: r.source || "INTERNAL",
      })),
    },
  });
} // Export the new hybrid handler
export const POST = (request: NextRequest) =>
  withMiddleware()(request, hybridChatHandler);

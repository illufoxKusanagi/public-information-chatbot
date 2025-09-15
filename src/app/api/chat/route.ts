import { getDb } from "@/lib/db";
import { chatHistory, chats, messages } from "@/lib/db/schema";
import { findRelevantContents } from "@/lib/services/ai/rag.service";
import {
  ApiError,
  AuthenticatedRequest,
  withMiddleware,
  createAuthMiddleware,
} from "@/middleware/api";
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
  chatId: z.string().uuid().optional(), // Edited here: Changed to string uuid to match your schema
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
  const { message, chatId } = request.validatedData;
  const db = getDb();
  const userId = request.user!.userId;
  let currentChatId = chatId;

  // try {
  //   if (!currentChatId) {
  //     const title = await generateChatTitle(message);
  //     const [newChat] = await db
  //       .insert(chats)
  //       .values({
  //         userId: request.user!.userId,
  //         title: title || "New Chat",
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       })
  //       .returning();
  //     currentChatId = newChat.id;
  //   } else {
  //     // Edited here: Your original ownership verification
  //     const [existingChat] = await db
  //       .select()
  //       .from(chats)
  //       .where(eq(chats.id, currentChatId))
  //       .limit(1);

  //     if (!existingChat || existingChat.userId !== request.user!.userId) {
  //       throw new ApiError("Chat not found or access denied", 404);
  //     }
  //   }

  //   // Edited here: Your original message insertion logic
  //   await db.insert(messages).values({
  //     chatId: currentChatId,
  //     role: "user",
  //     content: message,
  //     createdAt: new Date(),
  //   });

  //   // Edited here: Your original RAG implementation
  //   const ragResults = await findRelevantContents(message);
  //   const sources = ragResults.map((r) => ({
  //     title: r.title || "Internal Source",
  //     source: r.source || "INTERNAL",
  //   }));

  //   const aiResponse = await generateAiResponse(message, ragResults);

  //   // Edited here: Your original AI message insertion
  //   const [aiMessage] = await db
  //     .insert(messages)
  //     .values({
  //       chatId: currentChatId,
  //       role: "bot",
  //       content: aiResponse,
  //       createdAt: new Date(),
  //     })
  //     .returning();

  //   return NextResponse.json({
  //     success: true,
  //     data: {
  //       chatId: currentChatId,
  //       message: aiMessage,
  //       sources: sources,
  //     },
  //   });
  // } catch (error) {
  //   console.error("Chat error: ", error);
  //   if (error instanceof ApiError) throw error;
  //   throw new ApiError("Failed to process chat message", 500);
  // }

  try {
    if (!currentChatId) {
      const title = await generateChatTitle(message);
      const [newChat] = await db
        .insert(chatHistory)
        .values({
          userId: request.user!.userId,
          title: title || "New Chat",
          messages: [],
          createdAt: new Date(),
          // updatedAt: new Date(),
        })
        .returning({ id: chatHistory.id });
      currentChatId = newChat.id;
    } else {
      // Edited here: Your original ownership verification
      const [existingChat] = await db
        .select({ userId: chatHistory.userId })
        .from(chatHistory)
        .where(eq(chatHistory.id, currentChatId))
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

    // await db.insert(messages).values({
    //   chatId: currentChatId,
    //   role: "user",
    //   content: message,
    //   createdAt: new Date(),
    // });

    // // Edited here: Your original RAG implementation
    // const ragResults = await findRelevantContents(message);
    // const sources = ragResults.map((r) => ({
    //   title: r.title || "Internal Source",
    //   source: r.source || "INTERNAL",
    // }));

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

    // Update chat history with new updated timestamp
    // await db
    //   .update(chatHistory)
    //   .set({
    //     // updatedAt: new Date(),
    //     // Optionally update the messages array if you want to store it there too
    //   })
    //   .where(eq(chatHistory.id, currentChatId));

    const sources = ragResults.map((r) => ({
      title: r.title || "Sumber Internal",
      source: r.source || "INTERNAL",
      similarity: r.similarity || 0,
    }));

    // const sources = ragResults.map((r) => ({
    //   title: r.title || "Internal Source",
    //   source: r.source || "INTERNAL",
    // }));

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

    // return NextResponse.json({
    //   success: true,
    //   data: {
    //     chatId: currentChatId,
    //     message: aiMessage,
    //     sources: sources,
    //   },
    // });
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

    //     const context =
    //       contextData.length > 0
    //         ? `
    // CONTEXT:
    // ---
    // ${contextData
    //   .map(
    //     (item, index) => `
    // [SUMBER ${index + 1}: ${item.source?.toUpperCase() || "INTERNAL"}]
    // ${
    //   typeof item.data === "object"
    //     ? JSON.stringify(item.data, null, 2)
    //     : item.content
    // }
    // ---`
    //   )
    //   .join("\n")}
    // ---
    // `
    //         : "CONTEXT: Tidak ada informasi yang ditemukan di database internal dan eksternal.";

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

// Edited here: Your original middleware composition pattern
export const POST = (request: NextRequest) =>
  withMiddleware(createAuthMiddleware())(request, chatHandler);

// // import { getDb } from "@/lib/db";
// // import { chats, messages } from "@/lib/db/schema";
// // import { findRelevantContents } from "@/lib/services/ai/rag.service";
// // import { ApiError, AuthenticatedRequest } from "@/middleware/api";
// // import { GoogleGenAI } from "@google/genai";
// // import { eq } from "drizzle-orm";
// // import { NextResponse } from "next/server";
// // import z from "zod";

// // const apiKey: string = process.env.GEMINI_API_KEY || "";
// // const generativeModel: string =
// //   process.env.GENERATIVE_MODEL || "gemini-1.5-flash";

// // if (!apiKey) {
// //   console.error("Missing GEMINI_API_KEY");
// //   throw new ApiError(
// //     "Tidak dapat memproses respon chatbot, silahkan hubungi admin.",
// //     500,
// //     "API_CONFIG_ERROR"
// //   );
// // }

// // const genAI = new GoogleGenAI({ apiKey });

// // const chatMessageSchema = z.object({
// //   message: z
// //     .string()
// //     .min(1, "Message cannot be empty")
// //     .max(4000, "Message is too long"),
// //   chatId: z.uuid().optional(),
// // });

// // async function chatHandler(request: AuthenticatedRequest) {
// //   const body = await request.json();
// //   const { message, chatId } = chatMessageSchema.parse(body);
// //   const db = getDb();
// //   let currentChatId = chatId;

// //   try {
// //     if (!currentChatId) {
// //       // TODO : make the function
// //       const title = await generateChatTitle(messages);
// //       const [newChat] = await db
// //         .insert(chats)
// //         .values({
// //           userId: request.user!.userId,
// //           title: title || "New Chat",
// //           createdAt: new Date(),
// //           updatedAt: new Date(),
// //         })
// //         .returning();
// //       currentChatId = newChat.id;
// //     } else {
// //       const [existingChat] = await db
// //         .select()
// //         .from(chats)
// //         .where(eq(chats.id, currentChatId))
// //         .limit(1);
// //       if (!existingChat || existingChat.userId !== request.user!.userId) {
// //         throw new ApiError("Chat not found or access denied", 404);
// //       }
// //       // TODO : Review this code, whether i use chat_history only and jsonb
// //       // column or separate table
// //       await db.insert(messages).values({
// //         chatId: currentChatId,
// //         role: "user",
// //         content: message,
// //         createdAt: new Date(),
// //       });

// //       // TODO : Implement searchRagData
// //       const ragResults = await searchRagData(message, 5);
// //       const context = ragResults.map((r) => r.content).join("\n\n");

// //       const aiResponse = await generateAiResponse(message, context);

// //       const [aiMessage] = await db
// //         .insert(messages)
// //         .values({
// //           chatId: currentChatId,
// //           message: aiMessage,
// //           sources: ragResults.map((r) => ({
// //             title: r.title,
// //             source: r.source,
// //           })),
// //         })
// //         .returning();
// //       return NextResponse.json({
// //         success: true,
// //         data: {
// //           chatId: currentChatId,
// //           message: aiMessage,
// //           sources: ragResults.map((r) => ({
// //             title: r.title,
// //             source: r.source,
// //           })),
// //         },
// //       });
// //     }
// //   } catch (error) {
// //     console.error("Chat error: ", error);
// //     if (error instanceof ApiError) {
// //       throw new ApiError("Failed to process chat message", 500);
// //     }
// //   }
// // }

// // async function generateAiResponse(userMessage: string, context: string) {
// //   try {
// //     let contextData: any[] = [];
// //     let sources: any[] = [];
// //     try {
// //       contextData = await findRelevantContents(userMessage);
// //       sources = contextData.map((item, index) => ({
// //         id: index + 1,
// //         sources: item.source || "INTERNAL",
// //         content:
// //           typeof item.data === "object"
// //             ? JSON.stringify(item.data, null, 2).substring(0, 200) + "..."
// //             : item.content?.substring(0, 200) + "..." || "",
// //         similarity: item.similarity || 0,
// //       }));
// //     } catch (ragError) {
// //       console.error("RAG search failed: ", ragError);
// //     }
// //     const context =
// //       contextData.length > 0
// //         ? `
// //     CONTEXT:
// // ---
// // ${contextData
// //   .map(
// //     (item, index) => `
// // [SUMBER ${index + 1}: ${item.source?.toUpperCase() || "INTERNAL"}]
// // ${
// //   typeof item.data === "object"
// //     ? JSON.stringify(item.data, null, 2)
// //     : item.content
// // }
// // ---`
// //   )
// //   .join("\n")}
// // ---
// // `
// //         : "CONTEXT: Tidak ada informasi yang ditemukan di database internal dan eksternal.";
// //     const systemPrompt = `
// //     Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
// //     Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

// //     PERATURAN PENTING:
// //     1.  HANYA GUNAKAN BAHASA INDONESIA
// //     2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
// //     3.  JAWAB HANYA BERDASARKAN INFORMASI DARI CONTEXT.
// //     4.  Jika informasi yang diminta tidak ada di dalam CONTEXT, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
// //     5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
// //     6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
// //     7.  Jika menggunakan data dari sumber eksternal (OPENWEATHER, NEWSAPI, dll), sebutkan sumbernya di akhir jawaban.

// //     FORMAT JAWABAN:
// //     - Jawab dengan jelas dan informatif
// //     - Jika data dari API eksternal, tambahkan: "*(Sumber: [NAMA_SUMBER])*" di akhir
// //     - Contoh: "Cuaca hari ini di Madiun cerah dengan suhu 28°C. *(Sumber: OpenWeather)*"

// //     FORMAT PEMBERIAN SUMBER:
// //     - Berikan dalam bentuk poin-poin
// //     - Contoh:
// //     "Sumber: - OpenWeather
// //              - OpenHoliday
// //     `;

// //     const augmentedPrompt = `${systemPrompt} ${context}\nPERTANYAAN PENGGUNA: "${message}\nJAWABAN ANDA: `;
// //     const result = await genAI.models.generateContent({
// //       model: generativeModel,
// //       contents: augmentedPrompt,
// //     });
// //   } catch (error) {}
// // }

// import { getDb } from "@/lib/db";
// import { chatHistory } from "@/lib/db/schema";
// import {
//   ApiError,
//   AuthenticatedRequest,
//   createValidationMiddleware,
// } from "@/middleware/api";
// import { findRelevantContents } from "@/lib/services/ai/rag.service";
// import {} from "@/lib/services/auth/auth.service";
// import { Message } from "@/lib/types/chat";
// import { GoogleGenAI } from "@google/genai";
// import { eq } from "drizzle-orm";
// import { NextResponse } from "next/server";
// import z from "zod";

// const chatSchema = z.object({
//   message: z
//     .string()
//     .min(1, "Message cannot be empty")
//     .max(2000, "Message too long"),
//   chatId: z.number().optional(),
// });

// async function handleChat(request: AuthenticatedRequest) {
//   const validationMiddleware = createValidationMiddleware(chatSchema);
//   const { message, chatId } = await validationMiddleware(request);

//   const db = getDb();
//   const userId = request.user!.userId;

//   let currentChatId = chatId;
//   let newChatCreated = false;

//   const apiKey: string = process.env.GEMINI_API_KEY || "";
//   const generativeModel: string =
//     process.env.GENERATIVE_MODEL || "gemini-1.5-flash";

//   if (!apiKey) {
//     console.error("Missing GEMINI_API_KEY");
//     throw new ApiError(
//       "Tidak dapat memproses respon chatbot, silahkan hubungi admin.",
//       500,
//       "API_CONFIG_ERROR"
//     );
//   }

//   const genAI = new GoogleGenAI({ apiKey });

//   try {
//     // const [existingChat] = await db
//     //   .select()
//     //   .from(chatHistory)
//     //   .where(eq(chatHistory.id, currentChatId))
//     //   .limit(1);
//     // if (!existingChat) {
//     //   throw new ApiError("Access denied", 403, "ACCESS_DENIED");
//     // }
//     let contextData: any[] = [];
//     let sources: any[] = [];
//     try {
//       contextData = await findRelevantContents(message);
//       sources = contextData.map((item, index) => ({
//         id: index + 1,
//         sources: item.source || "INTERNAL",
//         content:
//           typeof item.data === "object"
//             ? JSON.stringify(item.data, null, 2).substring(0, 200) + "..."
//             : item.content?.substring(0, 200) + "..." || "",
//         similarity: item.similarity || 0,
//       }));
//     } catch (ragError) {
//       console.error("RAG search failed: ", ragError);
//     }
//     const context =
//       contextData.length > 0
//         ? `
//     CONTEXT:
// ---
// ${contextData
//   .map(
//     (item, index) => `
// [SUMBER ${index + 1}: ${item.source?.toUpperCase() || "INTERNAL"}]
// ${
//   typeof item.data === "object"
//     ? JSON.stringify(item.data, null, 2)
//     : item.content
// }
// ---`
//   )
//   .join("\n")}
// ---
// `
//         : "CONTEXT: Tidak ada informasi yang ditemukan di database internal dan eksternal.";
//     const systemPrompt = `
//     Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
//     Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

//     PERATURAN PENTING:
//     1.  HANYA GUNAKAN BAHASA INDONESIA
//     2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
//     3.  JAWAB HANYA BERDASARKAN INFORMASI DARI CONTEXT.
//     4.  Jika informasi yang diminta tidak ada di dalam CONTEXT, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
//     5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
//     6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
//     7.  Jika menggunakan data dari sumber eksternal (OPENWEATHER, NEWSAPI, dll), sebutkan sumbernya di akhir jawaban.

//     FORMAT JAWABAN:
//     - Jawab dengan jelas dan informatif
//     - Jika data dari API eksternal, tambahkan: "*(Sumber: [NAMA_SUMBER])*" di akhir
//     - Contoh: "Cuaca hari ini di Madiun cerah dengan suhu 28°C. *(Sumber: OpenWeather)*"

//     FORMAT PEMBERIAN SUMBER:
//     - Berikan dalam bentuk poin-poin
//     - Contoh:
//     "Sumber: - OpenWeather
//              - OpenHoliday
//     `;

//     const augmentedPrompt = `${systemPrompt} ${context}\nPERTANYAAN PENGGUNA: "${message}\nJAWABAN ANDA: `;
//     const result = await genAI.models.generateContent({
//       model: generativeModel,
//       contents: augmentedPrompt,
//     });
//     const text: string = result.text!;
//     const userMsg: Message = { role: "user", content: message };
//     const botMsg: Message = { role: "bot", content: text };
//     if (!currentChatId) {
//       const chatTitle =
//         message.length > 35 ? message.substring(0, 35) + "..." : message;
//       const [newChat] = await db
//         .insert(chatHistory)
//         .values({
//           userId: String(userId), // TODO: handle userId better to match uuid
//           title: chatTitle,
//           messages: [userMsg, botMsg],
//           createdAt: new Date(),
//           // TODO : Add `updatedAt` in schema later
//           // updatedAt: new Date(),
//         })
//         .returning({ id: chatHistory.id });
//       currentChatId = newChat.id;
//       newChatCreated = true;
//     } else {
//       const [existingChat] = await db
//         .select()
//         .from(chatHistory)
//         .where(eq(chatHistory.id, currentChatId))
//         .limit(1);
//       if (existingChat) {
//         const currentMessages = Array.isArray(existingChat.messages)
//           ? (existingChat.messages as Message[])
//           : [];

//         const updatedMessages = [...currentMessages, userMsg, botMsg];

//         await db
//           .update(chatHistory)
//           .set({
//             messages: updatedMessages,
//             // TODO : Add `updatedAt` in schema later
//             // updatedAt: new Date(),
//           })
//           .where(eq(chatHistory.id, currentChatId));
//       }
//     }
//     return NextResponse.json({
//       role: "bot",
//       content: text,
//       chatId: newChatCreated ? currentChatId : undefined,
//       sources: sources,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Chat error: ", error);
//     // Cleanup failed chat creation
//     if (newChatCreated && currentChatId) {
//       try {
//         await db.delete(chatHistory).where(eq(chatHistory.id, currentChatId));
//       } catch (cleanupError) {
//         console.error("Cleanup error: ", cleanupError);
//       }
//     }
//     if (error instanceof ApiError) {
//       throw error;
//     }
//     throw new ApiError("Failed to process message", 500, "CHAT_ERROR");
//   }
// }

// // export const POST = (req: NextRequest) =>
// //   withMiddleware(createAuthMiddleware())(req, handleChat);
// // //   let currentChatId = chatId;
// // //   let newChatCreated = false;

// // //   try {
// // //     if (currentChatId) {
// // //       const [existingChat] = await db
// // //         .select()
// // //         .from(chatHistory)
// // //         .where(eq(chatHistory.id, currentChatId));

// // //       // TODO : fix this error
// // //       if (existingChat.userId !== userId) {
// // //         throw new ApiError("Access denied", 403, "ACCESS_DENIED");
// // //       }
// // //     } else {
// // //       const chatTitle =
// // //         message.length > 35 ? message.substring(0, 35) + "..." : message;
// // //       const [newChat] = await db
// // //         .insert(chatHistory)
// // //         .values({
// // //           userId, // TODO : Match userId to uuid
// // //           title: chatTitle,
// // //           createdAt: new Date(),
// // //           updatedAt: new Date(),
// // //         })
// // //         .returning({ id: chatHistory.id });
// // //       currentChatId = newChat.id;
// // //       newChatCreated = true;

// // //       // edited here: Save user message with proper error handling
// // //       await db.insert(messages).values({
// // //         chatId: currentChatId,
// // //         role: "user",
// // //         content: message,
// // //         createdAt: new Date(),
// // //       });
// // //       let ragContext = "";
// // //       let sources: any[] = [];
// // //       try {
// // //         const ragService = new RagService();
// // //         const ragResult = await searchSimilar;
// // //       } catch (error) {}
// // //     }
// // //   } catch (error) {}
// // // }

// // // const apiKey: string = process.env.GEMINI_API_KEY || "";
// // // const generativeModel: string =
// // //   process.env.GENERATIVE_MODEL || "gemini-1.5-flash";

// // // if (!apiKey) {
// // //   console.error("Missing GEMINI_API_KEY");
// // //   throw new Error(
// // //     "Tidak dapat memproses respon chatbot, silahkan hubungi admin."
// // //   );
// // // }

// // // const genAI = new GoogleGenAI({ apiKey });

// // // export async function POST(request: NextRequest): Promise<NextResponse> {
// // //   try {
// // //     const body = await request.json();
// // //     const rawMessage = body?.message;
// // //     const existingChatId = body?.chatId;
// // //     const userMessage =
// // //       typeof rawMessage === "string"
// // //         ? rawMessage.trim()
// // //         : typeof rawMessage?.content === "string"
// // //         ? rawMessage.content.trim()
// // //         : "";

// // //     if (!userMessage) {
// // //       return NextResponse.json(
// // //         { error: "Invalid 'message' payload" },
// // //         { status: 400 }
// // //       );
// // //     }
// // //     let currentChatId = existingChatId;
// // //     let newChatCreated = false;

// // //     const token = await getAuthCookie();
// // //     let user: Awaited<ReturnType<typeof getUserFromToken>> | null = null;
// // //     let userId: string | null = null;

// // //     if (token) {
// // //       user = await getUserFromToken(token);
// // //       if (user) {
// // //         // userId = user.id;
// // //         userId = String(user.id);
// // //       }
// // //     }

// // //     const contextData = await findRelevantContents(userMessage);
// // //     // Enhanced context with source information
// // //     const context =
// // //       contextData.length > 0
// // //         ? `
// // // CONTEXT:
// // // ---
// // // ${contextData
// // //   .map(
// // //     (item, index) => `
// // // [SUMBER ${index + 1}: ${item.source?.toUpperCase() || "INTERNAL"}]
// // // ${
// // //   typeof item.data === "object"
// // //     ? JSON.stringify(item.data, null, 2)
// // //     : item.content
// // // }
// // // ---`
// // //   )
// // //   .join("\n")}
// // // ---
// // // `
// // //         : "CONTEXT: Tidak ada informasi yang ditemukan di database internal dan eksternal.";

// // //     const systemPrompt = `
// // // Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
// // // Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

// // // PERATURAN PENTING:
// // // 1.  HANYA GUNAKAN BAHASA INDONESIA
// // // 2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
// // // 3.  JAWAB HANYA BERDASARKAN INFORMASI DARI CONTEXT.
// // // 4.  Jika informasi yang diminta tidak ada di dalam CONTEXT, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
// // // 5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
// // // 6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
// // // 7.  Jika menggunakan data dari sumber eksternal (OPENWEATHER, NEWSAPI, dll), sebutkan sumbernya di akhir jawaban.

// // // FORMAT JAWABAN:
// // // - Jawab dengan jelas dan informatif
// // // - Jika data dari API eksternal, tambahkan: "*(Sumber: [NAMA_SUMBER])*" di akhir
// // // - Contoh: "Cuaca hari ini di Madiun cerah dengan suhu 28°C. *(Sumber: OpenWeather)*"

// // // FORMAT PEMBERIAN SUMBER:
// // // - Berikan dalam bentuk poin-poin
// // // - Contoh:
// // // "Sumber: - OpenWeather
// // //          - OpenHoliday
// // // `;
// // //     //     const context =
// // //     //       contextData.length > 0
// // //     //         ? `
// // //     // CONTEXT:
// // //     // ---
// // //     // ${JSON.stringify(contextData, null, 2)}
// // //     // ---
// // //     // `
// // //     //         : "CONTEXT: Tidak ada informasi yang ditemukan di database.";

// // //     //     const systemPrompt = `
// // //     // Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
// // //     // Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

// // //     // PERATURAN PENTING:
// // //     // 1.  HANYA GUNAKAN BAHASA INDONESIA
// // //     // 2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
// // //     // 3.  JAWAB HANYA BERDASARKAN INFORMASI DARI CONTEXT.
// // //     // 4.  Jika informasi yang diminta tidak ada di dalam CONTEXT, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
// // //     // 5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
// // //     // 6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
// // //     // `;
// // //     const augmentedPrompt = `${systemPrompt} ${context}\nPERTANYAAN PENGGUNA: "${userMessage}"\nJAWABAN ANDA:`;
// // //     const result = await genAI.models.generateContent({
// // //       model: generativeModel,
// // //       contents: augmentedPrompt,
// // //     });
// // //     const text: string = result.text!;
// // //     const userMsg: Message = { role: "user", content: userMessage };
// // //     const botMsg: Message = { role: "bot", content: text };
// // //     if (userId && !currentChatId) {
// // //       const title =
// // //         userMessage.substring(0, 25) + (userMessage.length > 25 ? "..." : "");

// // //       try {
// // //         const newChat = await db
// // //           .insert(chatHistory)
// // //           .values({
// // //             userId: userId,
// // //             title: title,
// // //             messages: [userMsg, botMsg],
// // //           })
// // //           .returning({ id: chatHistory.id });

// // //         currentChatId = newChat[0].id;
// // //         newChatCreated = true;

// // //         console.log(
// // //           "New chat created with ID:",
// // //           currentChatId,
// // //           "for user:",
// // //           userId
// // //         );
// // //       } catch (error) {
// // //         console.error("Error creating new chat:", error);
// // //       }
// // //     } else if (userId && currentChatId) {
// // //       try {
// // //         const chatIdNum = Number(currentChatId);
// // //         if (!Number.isFinite(chatIdNum)) {
// // //           return NextResponse.json(
// // //             { error: "Invalid chatId" },
// // //             { status: 400 }
// // //           );
// // //         }
// // //         const existingChat = await db.query.chatHistory.findFirst({
// // //           where: eq(chatHistory.id, chatIdNum),
// // //         });
// // //         if (existingChat) {
// // //           if (existingChat.userId === userId) {
// // //             const currentMessages = Array.isArray(existingChat.messages)
// // //               ? (existingChat.messages as Message[])
// // //               : [];

// // //             const updatedMessages = [...currentMessages, userMsg, botMsg];
// // //             await db
// // //               .update(chatHistory)
// // //               .set({
// // //                 messages: updatedMessages,
// // //               })
// // //               .where(eq(chatHistory.id, parseInt(currentChatId)));

// // //             console.log(
// // //               "Updated chat:",
// // //               currentChatId,
// // //               "New messages count:",
// // //               updatedMessages.length
// // //             );
// // //           } else {
// // //             console.warn(
// // //               "User tried to access chat that doesn't belong to them"
// // //             );
// // //           }
// // //         }
// // //       } catch (error) {
// // //         console.error("Error updating chat:", error);
// // //       }
// // //     }
// // //     return NextResponse.json(
// // //       {
// // //         role: "bot",
// // //         content: text,
// // //         chatId: newChatCreated ? currentChatId : undefined,
// // //       },
// // //       { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
// // //     );
// // //   } catch (error) {
// // //     console.error("Error in /api/chat:", error);
// // //     return NextResponse.json(
// // //       { error: "An internal server error occurred: " + error },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

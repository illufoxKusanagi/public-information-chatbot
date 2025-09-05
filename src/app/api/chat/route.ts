import { db } from "@/lib/db/index";
import { chatHistory } from "@/lib/db/schema";
import { findRelevantContents } from "@/lib/services/ai/rag.service";
import {
  getAuthCookie,
  getUserFromToken,
} from "@/lib/services/auth/auth.service";
import { Message } from "@/lib/types/chat";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const apiKey: string = process.env.GEMINI_API_KEY || "";
const generativeModel: string =
  process.env.GENERATIVE_MODEL || "gemini-1.5-flash";

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  throw new Error(
    "Tidak dapat memproses respon chatbot, silahkan hubungi admin."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // const { message, chatId: existingChatId } = await request.json();
    // const userMessage = message.content;
    const body = await request.json();
    const rawMessage = body?.message;
    const existingChatId = body?.chatId;
    const userMessage =
      typeof rawMessage === "string"
        ? rawMessage.trim()
        : typeof rawMessage?.content === "string"
        ? rawMessage.content.trim()
        : "";

    if (!userMessage) {
      return NextResponse.json(
        { error: "Invalid 'message' payload" },
        { status: 400 }
      );
    }
    let currentChatId = existingChatId;
    let newChatCreated = false;

    // Edited Here: Get authenticated user instead of hardcoding userId = 1
    const token = getAuthCookie();
    // let user = null;
    // let userId: string | null = null;
    let user: Awaited<ReturnType<typeof getUserFromToken>> | null = null;
    let userId: string | null = null;

    if (token) {
      user = await getUserFromToken(token);
      if (user) {
        // userId = user.id;
        userId = String(user.id);
      }
    }

    const contextData = await findRelevantContents(userMessage);
    const context =
      contextData.length > 0
        ? `
CONTEXT:
---
${JSON.stringify(contextData, null, 2)}
---
`
        : "CONTEXT: Tidak ada informasi yang ditemukan di database.";

    const systemPrompt = `
Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

PERATURAN PENTING:
1.  HANYA GUNAKAN BAHASA INDONESIA 
2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
3.  JAWAB HANYA BERDASARKAN INFORMASI DARI CONTEXT.
4.  Jika informasi yang diminta tidak ada di dalam CONTEXT, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
`;

    const augmentedPrompt = `${systemPrompt} ${context}\nPERTANYAAN PENGGUNA: "${userMessage}"\nJAWABAN ANDA:`;

    const model = genAI.getGenerativeModel({ model: generativeModel });
    const result = await model.generateContent(augmentedPrompt);
    const text = result.response.text();

    const userMsg: Message = { role: "user", content: userMessage };
    const botMsg: Message = { role: "bot", content: text };

    // Edited Here: Only save to database if user is authenticated
    if (userId && !currentChatId) {
      // Create new chat for authenticated user
      const title =
        userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");

      try {
        const newChat = await db
          .insert(chatHistory)
          .values({
            userId: userId,
            title: title,
            messages: [userMsg, botMsg],
          })
          .returning({ id: chatHistory.id });

        currentChatId = newChat[0].id;
        newChatCreated = true;

        console.log(
          "New chat created with ID:",
          currentChatId,
          "for user:",
          userId
        );
      } catch (error) {
        console.error("Error creating new chat:", error);
        // Continue without saving if there's an error
      }
    } else if (userId && currentChatId) {
      // Update existing chat for authenticated user
      try {
        //         const existingChat = await db.query.chatHistory.findFirst({
        //   where: eq(chatHistory.id, parseInt(currentChatId)),
        // });
        const chatIdNum = Number(currentChatId);
        if (!Number.isFinite(chatIdNum)) {
          return NextResponse.json(
            { error: "Invalid chatId" },
            { status: 400 }
          );
        }
        const existingChat = await db.query.chatHistory.findFirst({
          where: eq(chatHistory.id, chatIdNum),
        });
        if (existingChat) {
          // Edited Here: Verify the chat belongs to the authenticated user
          if (existingChat.userId === userId) {
            const currentMessages = Array.isArray(existingChat.messages)
              ? (existingChat.messages as Message[])
              : [];

            const updatedMessages = [...currentMessages, userMsg, botMsg];

            await db
              .update(chatHistory)
              .set({
                messages: updatedMessages,
              })
              .where(eq(chatHistory.id, parseInt(currentChatId)));

            console.log(
              "Updated chat:",
              currentChatId,
              "New messages count:",
              updatedMessages.length
            );
          } else {
            console.warn(
              "User tried to access chat that doesn't belong to them"
            );
          }
        }
      } catch (error) {
        console.error("Error updating chat:", error);
        // Continue without saving if there's an error
      }
    }

    // return NextResponse.json({
    // role: "model",
    // content: text,
    // context: contextData,
    // chatId: newChatCreated ? currentChatId : undefined,
    // });
    return NextResponse.json(
      {
        role: "bot",
        content: text,
        chatId: newChatCreated ? currentChatId : undefined,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "An internal server error occurred: " + error },
      { status: 500 }
    );
  }
}

// import { db } from "@/lib/db/index";
// import { chatHistory } from "@/lib/db/schema";
// import { findRelevantContents } from "@/lib/services/ai/rag.service";
// import {
//   getAuthCookie,
//   getUserFromToken,
// } from "@/lib/services/auth/auth.service";
// import { Message } from "@/lib/types/chat";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { eq } from "drizzle-orm";
// import { NextRequest, NextResponse } from "next/server";

// const apiKey: string = process.env.GEMINI_API_KEY!;
// const generativeModel: string = process.env.GENERATIVE_MODEL!;

// if (!apiKey) {
//   throw new Error(
//     "Tidak dapat memproses respon chatbot, silahkan hubungi admin."
//   );
// }

// const genAI = new GoogleGenerativeAI(apiKey);

// export async function POST(request: NextRequest): Promise<NextResponse> {
//   const { message, chatId: existingChatId } = await request.json();
//   const userMessage = message.content;
//   // const userId = 1;
//   let currentChatId = existingChatId;
//   let newChatCreated = false;

//   try {
//     // Edited Here: Get user from token for chat context
//     const token = getAuthCookie();

//     if (!token) {

//     }
//     const user =
//     const contextData = await findRelevantContents(userMessage);
//     const context =
//       contextData.length > 0
//         ? `
//   CONTEXT:
//   ---
//   ${JSON.stringify(contextData, null, 2)}
//   ---
//   `
//         : "CONTEXT: Tidak ada informasi yang ditemukan di database.";

//     const systemPrompt = `
// Anda adalah asisten AI untuk Portal Informasi Pemerintah Kabupaten Madiun.
// Tugas utama Anda adalah menjawab pertanyaan pengguna berdasarkan informasi yang disediakan di dalam CONTEXT.

// PERATURAN PENTING:
// 1.  HANYA GUNAKAN BAHASA INDONESIA
// 2.  APABILA USER MENGGUNAKAN BAHASA INGGRIS, BERITAHU UNTUK MENGGUNAKAN BAHASA INDONESIA
// 3.  JAWAB HANYA BERDASARKAN INFORMASI DARI CONTEXT.
// 4.  Jika informasi yang diminta tidak ada di dalam CONTEXT, Anda WAJIB menjawab dengan sopan bahwa Anda tidak memiliki informasi tersebut di dalam database.
// 5.  JANGAN PERNAH menggunakan pengetahuan umum Anda atau mengarang jawaban.
// 6.  Jika pengguna hanya menyapa (misal: "halo", "selamat pagi"), jawab sapaan tersebut dengan ramah tanpa mencari informasi.
// `;

//     const augmentedPrompt = `${systemPrompt} ${context}\nPERTANYAAN PENGGUNA: "${userMessage}"\nJAWABAN ANDA:`;

//     const model = genAI.getGenerativeModel({ model: generativeModel });
//     const result = await model.generateContent(augmentedPrompt);
//     const text = result.response.text();

//     const userMsg: Message = { role: "user", content: userMessage };
//     const botMsg: Message = { role: "bot", content: text };
//     if (userId && !currentChatId) {
//       const title =
//         userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");

//       const newChat = await db
//         .insert(chatHistory)
//         .values({
//           userId: userId,
//           title: title,
//           messages: [userMsg, botMsg],
//         })
//         .returning({ id: chatHistory.id });

//       currentChatId = newChat[0].id;
//       newChatCreated = true;

//       console.log("New chat created with ID:", currentChatId, "Messages:", [
//         userMsg,
//         botMsg,
//       ]);
//     } else {
//       const existingChat = await db.query.chatHistory.findFirst({
//         where: eq(chatHistory.id, parseInt(currentChatId)),
//       });

//       if (existingChat) {
//         const currentMessages = Array.isArray(existingChat.messages)
//           ? (existingChat.messages as Message[])
//           : [];

//         const updatedMessages = [...currentMessages, userMsg, botMsg];

//         await db
//           .update(chatHistory)
//           .set({
//             messages: updatedMessages,
//           })
//           .where(eq(chatHistory.id, parseInt(currentChatId)));

//         console.log(
//           "Updated chat:",
//           currentChatId,
//           "New messages count:",
//           updatedMessages.length
//         );
//       }
//     }

//     return NextResponse.json({
//       role: "model",
//       content: text,
//       context: contextData,
//       chatId: newChatCreated ? currentChatId : undefined,
//     });
//   } catch (error) {
//     console.error("Error in /api/chat:", error);
//     return NextResponse.json(
//       { error: "An internal server error occurred. with" + error },
//       { status: 500 }
//     );
//   }
// }

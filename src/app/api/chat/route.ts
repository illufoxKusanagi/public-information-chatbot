import { db } from "@/lib/db/index";
import { chatHistory } from "@/lib/db/schema";
import { findRelevantContents } from "@/lib/services/ai/rag.service";
import { Message } from "@/lib/types/chat";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const apiKey: string = process.env.GEMINI_API_KEY!;
const generativeModel: string = process.env.GENERATIVE_MODEL!;

if (!apiKey) {
  throw new Error(
    "Tidak dapat memproses respon chatbot, silahkan hubungi admin."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { message, chatId: existingChatId } = await request.json();
  const userMessage = message.content;
  const userId = 1;
  let currentChatId = existingChatId;
  let newChatCreated = false;

  try {
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
    if (!currentChatId) {
      const title =
        userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");

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

      console.log("New chat created with ID:", currentChatId, "Messages:", [
        userMsg,
        botMsg,
      ]);
    } else {
      const existingChat = await db.query.chatHistory.findFirst({
        where: eq(chatHistory.id, parseInt(currentChatId)),
      });

      if (existingChat) {
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
      }
    }

    return NextResponse.json({
      role: "model",
      content: text,
      context: contextData,
      chatId: newChatCreated ? currentChatId : undefined,
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "An internal server error occurred. with" + error },
      { status: 500 }
    );
  }
}

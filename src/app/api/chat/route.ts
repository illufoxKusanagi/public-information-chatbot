import { searchRagData } from "@/lib/db/index";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { message } = await request.json();
  const userMessage = message[message.length - 1];

  try {
    const contextData = await searchRagData(userMessage.content);
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

    const augmentedPrompt = `${systemPrompt} ${context}
      PERTANYAAN PENGGUNA: "${userMessage.content}"
JAWABAN ANDA: 
`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(augmentedPrompt);
    const text = result.response.text();
    return NextResponse.json({
      role: "model",
      content: text,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

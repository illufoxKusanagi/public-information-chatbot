import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenAI({ apiKey });

export interface QueryAnalysis {
  type: "weather" | "news" | "holiday" | "official" | "general";
  location: string | null;
  timeframe: "today" | "tomorrow" | "week" | "specific_date";
  confidence: number;
  intent: string;
  keywords: string[];
}

export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  try {
    const prompt = `Analisis query bahasa Indonesia berikut dan ekstrak informasi penting:

Query: "${query}"

Tugas:
1. Identifikasi jenis informasi yang diminta
2. Ekstrak nama kota/lokasi spesifik (penting: bedakan antara Madiun, Solo, Surabaya, dll)
3. Tentukan rentang waktu
4. Berikan skor kepercayaan (0.0-1.0)
5. Ekstrak kata kunci penting

PENTING: Jika query menyebutkan kota tertentu seperti "Solo", "Surabaya", "Jakarta", jangan asumsikan sebagai Madiun.

Respons dalam format JSON:
{
  "type": "weather|news|holiday|official|general",
  "location": "nama_kota_spesifik_atau_null",
  "timeframe": "today|tomorrow|week|specific_date", 
  "confidence": 0.85,
  "intent": "deskripsi_singkat_maksud_user",
  "keywords": ["kata", "kunci", "penting"]
}`;

    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.text ?? "{}";

    // Clean the response to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Fallback validation
    return {
      type: analysis.type || "general",
      location: analysis.location,
      timeframe: analysis.timeframe || "today",
      confidence: analysis.confidence || 0.5,
      intent: analysis.intent || "general query",
      keywords: analysis.keywords || [],
    };
  } catch (error) {
    console.error("Query analysis error:", error);
    // Fallback manual analysis
    return analyzeQueryFallback(query);
  }
}

function analyzeQueryFallback(query: string): QueryAnalysis {
  const queryLower = query.toLowerCase();

  // Location detection
  const locations = [
    "madiun",
    "solo",
    "surakarta",
    "surabaya",
    "jakarta",
    "yogyakarta",
    "semarang",
  ];
  let detectedLocation: string | null = null;

  for (const loc of locations) {
    if (queryLower.includes(loc)) {
      detectedLocation = loc;
      break;
    }
  }

  // Type detection
  let type: QueryAnalysis["type"] = "general";
  if (queryLower.includes("cuaca") || queryLower.includes("weather")) {
    type = "weather";
  } else if (queryLower.includes("berita") || queryLower.includes("news")) {
    type = "news";
  } else if (queryLower.includes("libur") || queryLower.includes("holiday")) {
    type = "holiday";
  } else if (
    queryLower.includes("pejabat") ||
    queryLower.includes("camat") ||
    queryLower.includes("bupati")
  ) {
    type = "official";
  }

  return {
    type,
    location: detectedLocation,
    timeframe: "today",
    confidence: 0.6,
    intent: `Fallback analysis for ${type} query`,
    keywords: queryLower.split(" ").filter((word) => word.length > 2),
  };
}

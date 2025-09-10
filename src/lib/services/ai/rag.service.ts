import { chatHistory, ragData } from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { generateEmbedding } from "./embeddings.service";
import { DynamicEmbeddingCacheHelper } from "./dynamic-enbedding-cache.service";

// import { findRelevantContents } from './rag.service';
import { analyzeQuery, QueryAnalysis } from "./semantic-search.service";
import { WeatherApiService } from "./weather.service";
// import { WeatherApiService } from '../api/weather.api.service'; // Use existing service

export interface EnhancedSearchResult {
  query_analysis: QueryAnalysis;
  weather_data?: any;
  rag_contents?: any[];
  total_sources: number;
  search_strategy: string;
}

export class EnhancedRAGService {
  private weatherService: WeatherApiService; // Use existing service

  constructor() {
    this.weatherService = new WeatherApiService(); // Use existing service
  }

  async searchRelevantData(query: string): Promise<EnhancedSearchResult> {
    try {
      // Step 1: Analyze the query semantically
      const analysis = await analyzeQuery(query);
      console.log("[ENHANCED RAG] Query analysis:", analysis);

      const result: EnhancedSearchResult = {
        query_analysis: analysis,
        total_sources: 0,
        search_strategy: "semantic_enhanced",
      };

      // Step 2: Route to appropriate services based on analysis
      if (analysis.type === "weather" && analysis.confidence > 0.7) {
        // High confidence weather query - use weather API
        try {
          const weatherData = await this.weatherService.getWeatherData(
            analysis
          );
          if (weatherData) {
            result.weather_data = weatherData;
            result.total_sources++;
          }
        } catch (error) {
          console.error("[ENHANCED RAG] Weather service error:", error);
        }
      }

      // Step 3: Always try RAG for additional context
      try {
        // Enhance query for RAG search based on analysis
        const enhancedQuery = this.buildEnhancedQuery(query, analysis);
        const ragContents = await findRelevantContents(enhancedQuery);

        if (ragContents && ragContents.length > 0) {
          result.rag_contents = ragContents;
          result.total_sources += ragContents.length;
        }
      } catch (error) {
        console.error("[ENHANCED RAG] RAG service error:", error);
      }

      return result;
    } catch (error) {
      console.error("[ENHANCED RAG] Enhanced RAG service error:", error);
      throw error;
    }
  }

  private buildEnhancedQuery(
    originalQuery: string,
    analysis: QueryAnalysis
  ): string {
    let enhancedQuery = originalQuery;

    // Add location context if detected
    if (analysis.location) {
      enhancedQuery += ` ${analysis.location}`;
    }

    // Add type-specific keywords
    if (analysis.type === "official") {
      enhancedQuery += " pejabat daerah camat bupati";
    }

    // Add keywords from analysis
    if (analysis.keywords.length > 0) {
      enhancedQuery += " " + analysis.keywords.join(" ");
    }

    return enhancedQuery;
  }
}

// Initialize cache helper
const cacheHelper = new DynamicEmbeddingCacheHelper();

export async function findRelevantContents(userQuery: string) {
  try {
    console.log("[RAG SERVICE] Mencari konten relevan untuk:", userQuery);

    // Use the dynamic cache helper
    const results = await cacheHelper.search(userQuery, 5);

    if (results && results.length > 0) {
      console.log(`[RAG SERVICE] Ditemukan ${results.length} hasil relevan`);

      // Format results for consistency
      return results.map((result) => ({
        content: result.content,
        data: result.data,
        similarity: result.similarity,
        source: result.source || "internal",
      }));
    }

    console.log("[RAG SERVICE] Tidak ada hasil relevan ditemukan");
    return [];
  } catch (error) {
    console.error("Failed to search relevant contents:", error);

    // Fallback to traditional search
    return await traditionalSearch(userQuery);
  }
}

// Keep the traditional search as fallback
async function traditionalSearch(userQuery: string) {
  try {
    console.log("[RAG SERVICE] Using traditional search as fallback");

    const embedding = await generateEmbedding(userQuery);
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      console.error(
        "Invalid embedding dimension:",
        Array.isArray(embedding) ? embedding.length : "n/a"
      );
      return [];
    }

    const cosineDistance = (embedding1: any, embedding2: number[]) => {
      return sql<number>`1 - (${embedding1} <=> ${embedding2})`;
    };

    const similarity = sql<number>`1 - (${cosineDistance(
      ragData.embedding,
      embedding as number[]
    )})`;

    const relevantContent = await db
      .select({
        content: ragData.content,
        data: ragData.data,
        similarity: similarity,
        source: ragData.source,
      })
      .from(ragData)
      .where(
        gt(
          similarity,
          parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.55")
        )
      )
      .orderBy(desc(similarity))
      .limit(parseInt(process.env.RAG_MAX_RESULTS || "5"));

    return relevantContent;
  } catch (error) {
    console.error("Failed in traditional search:", error);
    return [];
  }
}
// }

// export async function findRelevantContents(userQuery: string) {
//   try {
//     const embedding = await generateEmbedding(userQuery);
//     if (!Array.isArray(embedding) || embedding.length !== 768) {
//       console.error(
//         "Invalid embedding dimension:",
//         Array.isArray(embedding) ? embedding.length : "n/a"
//       );
//       return [];
//     }
//     const similarity = sql<number>`1 - (${cosineDistance(
//       ragData.embedding,
//       embedding as number[]
//     )})`;

//     const relevantContent = await db
//       .select({
//         content: ragData.content,
//         data: ragData.data,
//         similarity: similarity,
//       })
//       .from(ragData)
//       .where(gt(similarity, 0.5))
//       .orderBy(desc(similarity))
//       .limit(5);
//     return relevantContent;
//   } catch (error) {
//     console.error("Failed to search relevant contents:", error);
//     return [];
//   }
// }

// export async function getChatHistoryTitle(
//   chatId: number,
//   userId: string
// ): Promise<string> {
//   try {
//     const chat = await db.query.chatHistory.findFirst({
//       where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)),
//       columns: {
//         title: true,
//       },
//     });

//     if (!chat || !chat.title || chat.title.trim() === "") {
//       return `Chat #${chatId}`;
//     }

//     return chat.title.trim();
//   } catch (error) {
//     console.error("Failed to get chat history title:", error);
//     return `Chat #${chatId}`;
//   }
// }

// export async function getChatHistoryTitleWithAuth(
//   chatId: number,
//   userId: string
// ): Promise<{
//   title: string;
//   success: boolean;
//   error?: string;
// }> {
//   try {
//     console.log("getChatHistoryTitleWithAuth called with:", { chatId, userId });
//     if (!chatId || isNaN(chatId) || chatId <= 0) {
//       console.log("Invalid chatId:", chatId);
//       return {
//         title: "New Chat",
//         success: false,
//         error: "Invalid chat ID",
//       };
//     }
//     if (!userId) {
//       console.log("Invalid userId:", userId);
//       return {
//         title: `Chat #${chatId}`,
//         success: false,
//         error: "User ID is required",
//       };
//     }
//     const chat = await db.query.chatHistory.findFirst({
//       where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)),
//       columns: {
//         title: true,
//       },
//     });
//     if (!chat) {
//       console.log("Chat not found or access denied");
//       return {
//         title: `Chat #${chatId}`,
//         success: false,
//         error: "Chat not found or access denied",
//       };
//     }
//     const title = chat.title;
//     if (!title || title.trim() === "") {
//       console.log("Chat found but title is empty");
//       return {
//         title: `Chat #${chatId}`,
//         success: true,
//       };
//     }
//     console.log("Successfully retrieved title:", title);
//     return {
//       title: title.trim(),
//       success: true,
//     };
//   } catch (error) {
//     console.error("Failed to get chat history title with auth:", error);
//     return {
//       title: `Chat #${chatId}`,
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }

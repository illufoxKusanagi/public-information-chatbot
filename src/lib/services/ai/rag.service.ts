import { chatHistory, ragData } from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { generateEmbedding } from "./embeddings.service";
import { DynamicEmbeddingCacheHelper } from "./dynamic-enbedding-cache.service";

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

export async function getChatHistoryTitle(
  chatId: number,
  userId: string
): Promise<string> {
  try {
    const chat = await db.query.chatHistory.findFirst({
      where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)),
      columns: {
        title: true,
      },
    });

    if (!chat || !chat.title || chat.title.trim() === "") {
      return `Chat #${chatId}`;
    }

    return chat.title.trim();
  } catch (error) {
    console.error("Failed to get chat history title:", error);
    return `Chat #${chatId}`;
  }
}

export async function getChatHistoryTitleWithAuth(
  chatId: number,
  userId: string
): Promise<{
  title: string;
  success: boolean;
  error?: string;
}> {
  try {
    console.log("getChatHistoryTitleWithAuth called with:", { chatId, userId });
    if (!chatId || isNaN(chatId) || chatId <= 0) {
      console.log("Invalid chatId:", chatId);
      return {
        title: "New Chat",
        success: false,
        error: "Invalid chat ID",
      };
    }
    if (!userId) {
      console.log("Invalid userId:", userId);
      return {
        title: `Chat #${chatId}`,
        success: false,
        error: "User ID is required",
      };
    }
    const chat = await db.query.chatHistory.findFirst({
      where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)),
      columns: {
        title: true,
      },
    });
    if (!chat) {
      console.log("Chat not found or access denied");
      return {
        title: `Chat #${chatId}`,
        success: false,
        error: "Chat not found or access denied",
      };
    }
    const title = chat.title;
    if (!title || title.trim() === "") {
      console.log("Chat found but title is empty");
      return {
        title: `Chat #${chatId}`,
        success: true,
      };
    }
    console.log("Successfully retrieved title:", title);
    return {
      title: title.trim(),
      success: true,
    };
  } catch (error) {
    console.error("Failed to get chat history title with auth:", error);
    return {
      title: `Chat #${chatId}`,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

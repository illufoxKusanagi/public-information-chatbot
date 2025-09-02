import { chatHistory, ragData } from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { generateEmbedding } from "./embeddings.service";

export async function findRelevantContents(userQuery: string) {
  try {
    const embedding = await generateEmbedding(userQuery);
    const similarity = sql<number>`1 - (${cosineDistance(
      ragData.embedding,
      embedding
    )})`;

    const relevantContent = await db
      .select({
        content: ragData.content,
        data: ragData.data,
        similarity: similarity,
      })
      .from(ragData)
      .where(gt(similarity, 0.5))
      .orderBy(desc(similarity))
      .limit(5);
    return relevantContent;
  } catch (error) {
    console.error("Failed to search relevant contents:", error);
    return [];
  }
}

export async function getChatHistoryTitle(chatId: number): Promise<string> {
  try {
    const chatHistoryItem = await db
      .select({
        title: chatHistory.title,
      })
      .from(chatHistory)
      .where(eq(chatHistory.id, chatId))
      .limit(1);
    if (chatHistoryItem.length === 0) {
      return `Chat #${chatId}`;
    }
    const title = chatHistoryItem[0].title;
    if (!title || title.trim() === "") {
      return `Chat #${chatId}`;
    }
    return title;
  } catch (error) {
    console.error("Failed to get chat history title:", error);
    return `Chat #${chatId}`;
  }
}

export async function getChatHistoryTitleSafe(chatId: number): Promise<{
  title: string;
  success: boolean;
  error?: string;
}> {
  try {
    if (!chatId || isNaN(chatId)) {
      return {
        title: "New Chat",
        success: false,
        error: "Invalid chat ID",
      };
    }

    const chatHistoryItem = await db
      .select({
        title: chatHistory.title,
      })
      .from(chatHistory)
      .where(eq(chatHistory.id, chatId))
      .limit(1);

    if (chatHistoryItem.length === 0) {
      return {
        title: `Chat #${chatId}`,
        success: false,
        error: "Chat not found",
      };
    }

    const title = chatHistoryItem[0].title;

    if (!title || title.trim() === "") {
      return {
        title: `Chat #${chatId}`,
        success: false,
        error: "Empty title",
      };
    }

    return {
      title: title.trim(),
      success: true,
    };
  } catch (error) {
    console.error("Failed to get chat history title:", error);
    return {
      title: `Chat #${chatId}`,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

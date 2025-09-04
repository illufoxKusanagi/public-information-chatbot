import { chatHistory, ragData } from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc, eq, and } from "drizzle-orm";
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

// Edited Here: Fixed the query to use chatHistory.userId instead of chatHistory.id
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

    console.log("Querying database for chatId:", chatId, "userId:", userId);

    const chat = await db.query.chatHistory.findFirst({
      where: and(eq(chatHistory.id, chatId), eq(chatHistory.userId, userId)),
      columns: {
        title: true,
      },
    });

    console.log("Database query result:", chat);

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
        success: true, // Still success because chat exists
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

// import { chatHistory, ragData } from "@/lib/db/schema";
// import { cosineDistance, sql, gt, desc, eq, and } from "drizzle-orm";
// import { db } from "@/lib/db/index";
// import { generateEmbedding } from "./embeddings.service";

// export async function findRelevantContents(userQuery: string) {
//   try {
//     const embedding = await generateEmbedding(userQuery);
//     const similarity = sql<number>`1 - (${cosineDistance(
//       ragData.embedding,
//       embedding
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
//       where: and(eq(chatHistory.id, chatId), eq(chatHistory.id, userId)),
//       columns: { title: true },
//     });
//     if (!chat || chat.title || chat.title.trim() === "") {
//       return "Chat Baru";
//     }
//     return chat.title.trim();
//   } catch (error) {
//     console.error("Failed to get chat history title:", error);
//     return "Chat Baru";
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
//     if (!chatId || isNaN(chatId)) {
//       return {
//         title: "New Chat",
//         success: false,
//         error: "Invalid chat ID",
//       };
//     }

//     if (!userId || userId.trim() === "") {
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
//       return {
//         title: `Chat #${chatId}`,
//         success: false,
//         error: "Chat not found or access denied",
//       };
//     }

//     const title = chat.title;

//     if (!title || title.trim() === "") {
//       return {
//         title: `Chat #${chatId}`,
//         success: true, // Still success because chat exists, just no custom title
//       };
//     }

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

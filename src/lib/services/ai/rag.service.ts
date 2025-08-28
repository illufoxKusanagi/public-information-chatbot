import { ragData } from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { generateEmbedding } from "./embeddings.service";

// const apiKey = process.env.GEMINI_API_KEY;
// if (!apiKey) {
//   throw new Error("GEMINI_API_KEY is not defined in environment variables.");
// }
// const genAI = new GoogleGenerativeAI(apiKey);

// export async function generateEmbedding(text: string) {
//   const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
//   const result = await model.embedContent(text.toLowerCase());
//   return result.embedding.values;
// }

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
        metadata: ragData.data,
        similarity: similarity,
      })
      .from(ragData)
      .where(gt(similarity, 0.7))
      .orderBy(desc(similarity))
      .limit(5);
    return relevantContent;
  } catch (error) {
    console.error("Error during semantic search:", error);
    return [];
  }
}

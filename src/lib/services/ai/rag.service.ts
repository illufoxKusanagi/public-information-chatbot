import { ragData } from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc } from "drizzle-orm";
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
    return [];
  }
}

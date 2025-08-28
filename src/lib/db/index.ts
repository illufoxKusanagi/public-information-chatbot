import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { cosineDistance, eq, ilike, or, desc, gt, sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set in the environment variables. Please check your .env.local file."
  );
}
const sql_db = postgres(connectionString);
export const db = drizzle(sql_db, { schema });

export async function insertRagData(
  data: schema.InsertRagData | schema.InsertRagData[]
) {
  try {
    const insertedData = await db
      .insert(schema.ragData)
      .values(data)
      .returning();

    const count = insertedData.length;
    console.log(`✅ ${count} record(s) inserted successfully.`);

    return { success: true, count: count, data: insertedData };
  } catch (error) {
    console.error("❌ Database insertion failed:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function findUserByIdentifier(identifier: string) {
  try {
    const user = db.query.users.findFirst({
      where: or(
        eq(schema.users.email, identifier),
        eq(schema.users.name, identifier)
      ),
    });
    return user;
  } catch (error) {
    console.error("Error finding user by identifier:", error);
    return null;
  }
}

export async function findUserByEmail(email: string) {
  try {
    const user = db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

export async function searchRagData(searchTerm: string) {
  try {
    const similarity = sql<number>`${cosineDistance(
      schema.ragData.embedding,
      embedding
    )}`;
    // Jalankan query untuk mencari data yang paling mirip
    const results = await db
      .select({
        // Kita ambil 'content' dan 'metadata' untuk dijadikan CONTEXT di RAG
        content: schema.ragData.data,
        metadata: schema.ragData.metadata,
      })
      .from(schema.ragData)
      .where(gt(similarity, 0.75)) // Ambil hasil dengan kemiripan di atas 75% (bisa disesuaikan)
      .orderBy(desc(similarity)) // Urutkan dari yang paling mirip
      .limit(5); // Batasi hingga 5 hasil teratas
    const resultses = await db
      .select()
      .from(schema.ragData)
      .where(ilike(schema.ragData.data, `%${searchTerm}%`));
    return resultses;
  } catch (error) {
    return [];
  }
}

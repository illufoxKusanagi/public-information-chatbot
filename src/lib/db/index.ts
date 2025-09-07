import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { eq, or } from "drizzle-orm";
import { users } from "./schema";

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
    if (!data) {
      throw new Error("No data provided for insertion");
    }
    const dataArray = Array.isArray(data) ? data : [data];
    for (let i = 0; i < dataArray.length; i++) {
      const record = dataArray[i];
      console.log(`🔍 Validating record ${i + 1}:`, {
        hasContent: !!record.content,
        hasData: !!record.data,
        hasEmbedding: !!record.embedding,
        contentLength: record.content?.length,
        embeddingLength: record.embedding?.length,
      });

      if (!record.content || record.content.trim() === "") {
        throw new Error(
          `Record ${i + 1}: content is required and cannot be empty`
        );
      }

      if (!record.data) {
        throw new Error(`Record ${i + 1}: data field is required`);
      }

      if (!record.embedding || !Array.isArray(record.embedding)) {
        throw new Error(`Record ${i + 1}: embedding must be a non-empty array`);
      }

      if (record.embedding.length === 0) {
        throw new Error(`Record ${i + 1}: embedding array cannot be empty`);
      }
    }

    console.log("✅ All records validated successfully");

    const insertedData = await db
      .insert(schema.ragData)
      .values(dataArray)
      .returning();

    const count = insertedData.length;
    console.log(`✅ ${count} record(s) inserted successfully.`);

    return { success: true, count: count, data: insertedData };
  } catch (error) {
    console.error("❌ Database insertion failed:");
    console.error("Error details:", error);

    // Edited Here: Enhanced error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    };
  }
}

export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function findUserByIdentifier(identifier: string) {
  const result = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.name, identifier)));
  return result[0] || null;
}

export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

// Edited Here: Added helper function to test database connection
export async function testDatabaseConnection() {
  try {
    const result = await sql_db`SELECT 1 as test`;
    console.log(`✅ Database connection successful: ${result}`);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Edited Here: Added function to check if ragData table exists and has correct schema
export async function checkRagDataSchema() {
  try {
    const result = await sql_db`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'rag_data'
      ORDER BY ordinal_position;
    `;
    console.log("📊 RAG Data table schema:", result);
    return result;
  } catch (error) {
    console.error("❌ Error checking schema:", error);
    return null;
  }
}

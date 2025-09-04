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

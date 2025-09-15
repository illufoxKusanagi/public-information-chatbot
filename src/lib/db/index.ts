import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, or } from "drizzle-orm";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Edited here: Simple connection setup - removed unnecessary complexity
// Reason: Your original was over-engineered for a typical Next.js app
const client = postgres(connectionString, {
  prepare: false, // Recommended for serverless environments like Vercel
});

const db = drizzle(client, { schema });

// Edited here: Simple getDb function - clear intent without complexity
// Reason: Provides abstraction you prefer while keeping it simple
export const getDb = () => db;

// Edited here: Also export db directly for flexibility
// Reason: Some developers prefer direct access
// export { db };

// Edited here: Restored your useful helper functions in functional style
// Reason: These are actually useful utilities that your routes need
export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email));
  return result[0] || null;
}

export async function findUserByIdentifier(identifier: string) {
  const result = await db
    .select()
    .from(schema.users)
    .where(
      or(
        eq(schema.users.email, identifier),
        eq(schema.users.username, identifier)
      )
    );
  return result[0] || null;
}

export async function findUserById(id: string) {
  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  return result[0] || null;
}

// Edited here: Simple connection test function
// Reason: Useful for debugging without the verbose logging
export const testConnection = async (): Promise<boolean> => {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
};

// Edited here: Restored insertRagData function - it's actually useful
// Reason: Your RAG system needs this, but simplified the validation
export async function insertRagData(
  data: schema.InsertRagData | schema.InsertRagData[]
) {
  try {
    if (!data) {
      throw new Error("No data provided for insertion");
    }

    const dataArray = Array.isArray(data) ? data : [data];
    const EXPECTED_DIM = 768;

    // Edited here: Simplified validation - less verbose logging
    for (const record of dataArray) {
      if (!record.content?.trim()) {
        throw new Error("Content is required and cannot be empty");
      }
      if (!record.data) {
        throw new Error("Data field is required");
      }
      if (!record.embedding || record.embedding.length !== EXPECTED_DIM) {
        throw new Error(`Embedding must be exactly ${EXPECTED_DIM} dimensions`);
      }
    }

    const insertedData = await db
      .insert(schema.ragData)
      .values(dataArray)
      .returning();

    return {
      success: true,
      count: insertedData.length,
      data: insertedData,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Edited here: Optional cleanup function for graceful shutdown
export const closeConnection = async (): Promise<void> => {
  await client.end();
};

// import postgres from "postgres";
// import { drizzle } from "drizzle-orm/postgres-js";
// import * as schema from "./schema";

// // Edited here: Pure function for configuration validation
// // Reason: Functional approach - no side effects, predictable behavior
// const validateDatabaseConfig = () => {
//   const connectionString = process.env.DATABASE_URL;
//   if (!connectionString) {
//     throw new Error("DATABASE_URL is not set in environment variables");
//   }
//   return connectionString;
// };

// // Edited here: Functional connection factory instead of singleton class
// // Reason: Functional approach - creates connection when needed, no global state
// const createDatabaseConnection = () => {
//   const connectionString = validateDatabaseConfig();

//   const client = postgres(connectionString, {
//     max: 10,
//     idle_timeout: 20,
//     connect_timeout: 10,
//   });

//   const database = drizzle(client, { schema });

//   return { client, database };
// };

// // Edited here: Memoized connection to prevent multiple instances
// // Reason: Functional approach using closure instead of class static properties
// let connectionCache: ReturnType<typeof createDatabaseConnection> | null = null;

// export const getDbConnection = () => {
//   if (!connectionCache) {
//     connectionCache = createDatabaseConnection();
//   }
//   return connectionCache;
// };

// // Edited here: Pure function for connection testing
// // Reason: Functional approach - no side effects except logging
// export const testConnection = async (): Promise<boolean> => {
//   try {
//     const { client } = getDbConnection();
//     await client`SELECT 1`;
//     console.log("✅ Database connection successful");
//     return true;
//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//     return false;
//   }
// };

// // Edited here: Pure function for graceful shutdown
// // Reason: Functional approach - handles cleanup without class methods
// export const closeConnection = async (): Promise<void> => {
//   if (connectionCache) {
//     await connectionCache.client.end();
//     connectionCache = null;
//     console.log("🔌 Database connection closed");
//   }
// };

// // Edited here: Export database instance functionally
// // Reason: Provides easy access while maintaining functional approach
// export const { database: db } = getDbConnection();

// // const sql_db = postgres(connectionString);
// // export const db = drizzle(sql_db, { schema });

// // export async function insertRagData(
// //   data: schema.InsertRagData | schema.InsertRagData[]
// // ) {
// //   try {
// //     if (!data) {
// //       throw new Error("No data provided for insertion");
// //     }
// //     const dataArray = Array.isArray(data) ? data : [data];
// //     const EXPECTED_DIM = 768;
// //     for (let i = 0; i < dataArray.length; i++) {
// //       const record = dataArray[i];
// //       console.log(`🔍 Validating record ${i + 1}:`, {
// //         hasContent: !!record.content,
// //         hasData: !!record.data,
// //         hasEmbedding: !!record.embedding,
// //         contentLength: record.content?.length,
// //         embeddingLength: record.embedding?.length,
// //       });

// //       if (!record.content || record.content.trim() === "") {
// //         throw new Error(
// //           `Record ${i + 1}: content is required and cannot be empty`
// //         );
// //       }

// //       if (!record.data) {
// //         throw new Error(`Record ${i + 1}: data field is required`);
// //       }

// //       if (!record.embedding || !Array.isArray(record.embedding)) {
// //         throw new Error(`Record ${i + 1}: embedding must be a non-empty array`);
// //       }

// //       if (record.embedding.length === 0) {
// //         throw new Error(`Record ${i + 1}: embedding array cannot be empty`);
// //       }
// //       if (record.embedding.length !== EXPECTED_DIM) {
// //         throw new Error(
// //           `Record ${i + 1}: Embedding must be lenght ${EXPECTED_DIM}, got ${
// //             record.embedding.length
// //           }`
// //         );
// //       }
// //     }

// //     console.log("✅ All records validated successfully");

// //     const insertedData = await db
// //       .insert(schema.ragData)
// //       .values(dataArray)
// //       .returning();

// //     const count = insertedData.length;
// //     console.log(`✅ ${count} record(s) inserted successfully.`);

// //     return { success: true, count: count, data: insertedData };
// //   } catch (error) {
// //     console.error("❌ Database insertion failed:");
// //     console.error("Error details:", error);

// //     // Edited Here: Enhanced error logging
// //     if (error instanceof Error) {
// //       console.error("Error message:", error.message);
// //       console.error("Error stack:", error.stack);
// //     }

// //     return {
// //       success: false,
// //       count: 0,
// //       error: error instanceof Error ? error.message : "Unknown error",
// //       details: error,
// //     };
// //   }
// // }

// // export async function findUserByEmail(email: string) {
// //   const result = await db.select().from(users).where(eq(users.email, email));
// //   return result[0] || null;
// // }

// // export async function findUserByIdentifier(identifier: string) {
// //   const result = await db
// //     .select()
// //     .from(users)
// //     .where(or(eq(users.email, identifier), eq(users.name, identifier)));
// //   return result[0] || null;
// // }

// // export async function findUserById(id: string) {
// //   const result = await db.select().from(users).where(eq(users.id, id));
// //   return result[0] || null;
// // }

// // // Edited Here: Added helper function to test database connection
// // export async function testDatabaseConnection() {
// //   try {
// //     const result = await sql_db`SELECT 1 as test`;
// //     console.log(`✅ Database connection successful: ${result}`);
// //     return true;
// //   } catch (error) {
// //     console.error("❌ Database connection failed:", error);
// //     return false;
// //   }
// // }

// // // Edited Here: Added function to check if ragData table exists and has correct schema
// // export async function checkRagDataSchema() {
// //   try {
// //     const result = await sql_db`
// //       SELECT column_name, data_type, is_nullable
// //       FROM information_schema.columns
// //       WHERE table_name = 'rag_data'
// //       ORDER BY ordinal_position;
// //     `;
// //     console.log("📊 RAG Data table schema:", result);
// //     return result;
// //   } catch (error) {
// //     console.error("❌ Error checking schema:", error);
// //     return null;
// //   }
// // }

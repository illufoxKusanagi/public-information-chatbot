// "use server";

// import postgres from "postgres";

// const sql = postgres(process.env.DATABASE_URL!);

// export async function testDatabaseConnection() {
//   try {
//     const result = await sql`SELECT NOW()`;
//     console.log("✅ Database connected successfully!");
//     console.log("📅 Current database time:", result[0].now);

//     return { success: true, message: "Connected successfully" };
//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }

// export { sql };

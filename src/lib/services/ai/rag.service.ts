"use server";

import { db, ragData } from "@/lib/db"; // Changed: correct import path
import { eq, sql } from "drizzle-orm"; // Changed: use sql for JSONB queries

export class RagService {
  // Fixed: JSONB search using SQL operator
  static async searchByKeyword(query: string) {
    return await db
      .select()
      .from(ragData)
      .where(sql`${ragData.data}::text ILIKE ${`%${query}%`}`);
  }

  static async insertData(data: any) {
    return await db.insert(ragData).values({ data }).returning();
  }

  static async getAllData() {
    return await db.select().from(ragData);
  }

  // Bonus: Search by data type (city, service, location)
  static async searchByType(type: string) {
    return await db
      .select()
      .from(ragData)
      .where(sql`${ragData.data}->>'type' = ${type}`);
  }
}

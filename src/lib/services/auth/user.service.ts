import { or, eq } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";

export async function findUserByIdentifier(identifier: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.name, identifier)));

    return user[0] || null;
  } catch (error) {
    console.error("Error finding user by identifier:", error);
    return null;
  }
}

export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function findUserByEmail(email: string) {
  try {
    const user = db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

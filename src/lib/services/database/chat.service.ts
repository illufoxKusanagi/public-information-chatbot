import { getDb } from "@/lib/db"; // Edited here: Fixed import
import { chats, messages } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function getUserChats(userId: string) {
  const db = getDb(); // Edited here: Get db instance
  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function getChatMessages(chatId: string) {
  const db = getDb(); // Edited here: Get db instance
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt)); // Edited here: Use asc for chronological order
}

export async function createChat(userId: string, title: string) {
  const db = getDb(); // Edited here: Get db instance
  const [newChat] = await db
    .insert(chats)
    .values({
      userId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newChat;
}

export async function addMessage(
  chatId: string,
  role: string,
  content: string
) {
  const db = getDb(); // Edited here: Get db instance
  const [newMessage] = await db
    .insert(messages)
    .values({
      chatId,
      role,
      content,
      createdAt: new Date(),
    })
    .returning();

  return newMessage;
}

export async function deleteChat(chatId: string) {
  const db = getDb(); // Edited here: Get db instance

  // Delete messages first (foreign key constraint)
  await db.delete(messages).where(eq(messages.chatId, chatId));

  // Delete the chat
  await db.delete(chats).where(eq(chats.id, chatId));
}

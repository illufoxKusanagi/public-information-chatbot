import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  role: integer("role").default(2),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ragData = pgTable("rag_data", {
  id: serial("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  title: text("title").notNull(),
  messages: jsonb("messages"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertRagData = typeof ragData.$inferInsert;
export type SelectRagData = typeof ragData.$inferSelect;

export type InsertChatHistory = typeof chatHistory.$inferInsert;
export type SelectChatHistory = typeof chatHistory.$inferSelect;

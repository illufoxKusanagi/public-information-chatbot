import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  integer,
  vector,
  uuid,
  real,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  role: integer("role").default(2),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ragData = pgTable("rag_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  data: jsonb("data").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),

  source: varchar("source", { length: 50 }).default("internal").notNull(),
  external_id: varchar("external_id", { length: 255 }),

  is_cached: boolean("is_cached").default(false),
  cache_expires_at: timestamp("cache_expires_at"),
  last_fetched_at: timestamp("last_fetched_at"),

  similarity_score: real("similarity_score"),
  fetch_count: integer("fetch_count").default(0),

  api_response_metadata: jsonb("api_response_metadata"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
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

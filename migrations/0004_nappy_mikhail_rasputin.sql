ALTER TABLE "chat_history" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "chat_history" ALTER COLUMN "user_id" DROP NOT NULL;
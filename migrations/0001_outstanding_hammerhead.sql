ALTER TABLE "rag_data" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "content" text NOT NULL;
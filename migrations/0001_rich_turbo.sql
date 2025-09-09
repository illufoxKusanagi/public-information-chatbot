ALTER TABLE "rag_data" ALTER COLUMN "embedding" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "source" varchar(50) DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "is_cached" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "cache_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "last_fetched_at" timestamp;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "similarity_score" real;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "fetch_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "api_response_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "rag_data" ADD COLUMN "updated_at" timestamp DEFAULT now();
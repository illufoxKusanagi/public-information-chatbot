import { ragData } from "@/lib/db/schema";
import { generateEmbedding } from "./embeddings.service";
import { ExternalAPIClient } from "../external/api-client.service";
import { sql } from "drizzle-orm";
import { eq, inArray, gt, desc, and } from "drizzle-orm";
import { getDb } from "@/lib/db";

interface CacheEntry {
  id: string;
  content: string;
  embedding: number[];
  source: string;
  metadata: any;
  timestamp: Date;
}

interface ExternalDocument {
  id: string;
  content: string;
  source: string;
  metadata: any;
  timestamp: Date;
}

interface SearchOptions {
  topK?: number;
  similarityThreshold?: number;
  cacheEnabled?: boolean;
  cacheTtl?: number;
}

const getConfig = () => ({
  cacheEnabled: process.env.EMBEDDING_CACHE_ENABLED === "true",
  cacheTtl: parseInt(process.env.EXTERNAL_API_CACHE_TTL || "3600"),
  similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || "0.5"),
});

// const cosineDistance = (embedding1: any, embedding2: number[]) => {
//   return sql<number>`1 - (${embedding1} <=> ${embedding2})`;
// };

// const getConfig = () => ({
//   cacheEnabled: process.env.EMBEDDING_CACHE_ENABLED === "true",
//   cacheTtl: parseInt(process.env.EXTERNAL_API_CACHE_TTL || "3600"),
//   similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || "0.5"),
// });

const cosineDistance = (embedding1: any, embedding2: number[]) => {
  return sql<number>`1 - (${embedding1} <=> ${JSON.stringify(embedding2)})`;
};

const db = getDb();

// export const searchWithDynamicCache = async (
//   query: string,
//   options: SearchOptions = {}
// ) => {
//   const { topK = 5 } = options;
//   console.log(`[CACHE HELPER] Memulai pencarian untuk: "${query}`);

//   try {
//     // Step 1: Search internal data
//     const internalResults = await searchInternalData(
//       query,
//       Math.ceil(topK / 2)
//     );
//     console.log(
//       `[CACHE HELPER] Menemukan ${internalResults.length} hasil internal`
//     );

//     // Step 2: Search external APIs
//     const externalResults = await searchExternalData(query, topK);
//     console.log(
//       `[CACHE HELPER] Menemukan ${externalResults.length} hasil eksternal`
//     );

//     // Step 3: Combine and rerank results
//     const combinedResults = await combineAndRerankResults(
//       query,
//       internalResults,
//       externalResults,
//       topK
//     );
//   } catch (error) {
//     console.error("[CACHE HELPER] Error dalam pencarian:", error);
//     // Fallback to internal search only
//     return await searchInternalData(query, topK);
//   }
// };

export const searchWithDynamicCache = async (
  query: string,
  options: SearchOptions = {}
) => {
  const { topK = 5 } = options;
  console.log(`[CACHE HELPER] Memulai pencarian untuk: "${query}"`);

  try {
    // Step 1: Search internal data
    const internalResults = await searchInternalData(
      query,
      Math.ceil(topK / 2)
    );
    console.log(
      `[CACHE HELPER] Menemukan ${internalResults.length} hasil internal`
    );

    // Step 2: Search external APIs
    const externalResults = await searchExternalData(query, topK);
    console.log(
      `[CACHE HELPER] Menemukan ${externalResults.length} hasil eksternal`
    );

    // Step 3: Combine and rerank results
    const combinedResults = await combineAndRerankResults(
      query,
      internalResults,
      externalResults,
      topK
    );

    return combinedResults; // Edited here: Added missing return statement
  } catch (error) {
    console.error("[CACHE HELPER] Error dalam pencarian:", error);
    // Fallback to internal search only
    return await searchInternalData(query, topK);
  }
};

const searchInternalData = async (query: string, limit: number) => {
  try {
    const embedding = await generateEmbedding(query);
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      console.error("[CACHE HELPER] Invalid query embedding dimension");
      return [];
    }

    const config = getConfig();
    const db = getDb(); // Edited here: Get db instance

    const similarity = sql<number>`1 - (${
      ragData.embedding
    } <=> ${JSON.stringify(embedding)})`;

    const results = await db
      .select({
        id: ragData.id,
        content: ragData.content,
        data: ragData.data,
        similarity: similarity,
        source: sql<string>`COALESCE(${ragData.source}, 'internal')`,
        title: ragData.title, // Edited here: Added title field
      })
      .from(ragData)
      .where(
        and(
          gt(similarity, config.similarityThreshold),
          eq(ragData.source, "internal")
        )
      )
      .orderBy(desc(similarity))
      .limit(limit);
    return results;
  } catch (error) {
    console.error("[CACHE HELPER] Error in internal search:", error);
    return [];
  }
};

// const searchInternalData = async (query: string, limit: number) => {
//   try {
//     const embedding = await generateEmbedding(query);
//     if (!Array.isArray(embedding) || embedding.length !== 768) {
//       console.error("[CACHE HELPER] Invalid query embedding dimension");
//       return [];
//     }
//     const config = getConfig();
//     const similarity = sql<number>`1 - (${cosineDistance(
//       ragData.embedding,
//       embedding as number[]
//     )})`;
//     const results = await db
//       .select({
//         id: ragData.id,
//         content: ragData.content,
//         data: ragData.data,
//         similarity: similarity,
//         source: sql<string>`COALESCE(${ragData.source}, 'internal')`,
//       })
//       .from(ragData)
//       .where(
//         and(
//           gt(similarity, config.similarityThreshold),
//           eq(ragData.source, "internal")
//         )
//       )
//       .orderBy(desc(similarity))
//       .limit(limit);
//     return results;
//   } catch (error) {
//     console.error("[CACHE HELPER] Error in internal search:", error);
//     return [];
//   }
// };

// const searchExternalData = async (query: string, limit: number) => {
//   try {
//     console.log("[CACHE HELPER] Fetching from external APIs...");
//     const apiClient = createExternalApiClient();
//     const candidateDocs = await apiClient.keywordSearch(query, 20);
//     if (candidateDocs.length === 0) {
//       console.log("[CACHE HELPER] Tidak ada kandidat eksternal ditemukan");
//       return [];
//     }
//     console.log(
//       `[CACHE HELPER] Got ${candidateDocs.length} external candidates`
//     );
//     return candidateDocs.slice(0, limit).map((doc) => ({
//       id: doc.id,
//       content: doc.content,
//       data: doc.metadata,
//       similarity: 0.8, // Fake similarity for external data
//       source: doc.source,
//     }));
//   } catch (error) {
//     console.error("[CACHE HELPER] Error in external search:", error);
//     return [];
//   }
// };

// const searchExternalData = async (query: string, limit: number) => {
//   try {
//     console.log("[CACHE HELPER] Fetching from external APIs...");
//     const apiClient = createExternalApiClient();
//     const candidateDocs = await apiClient.keywordSearch(query, 20);
//     if (candidateDocs.length === 0) {
//       console.log("[CACHE HELPER] Tidak ada kandidat eksternal ditemukan");
//       return [];
//     }
//     console.log(
//       `[CACHE HELPER] Got ${candidateDocs.length} external candidates`
//     );
//     return candidateDocs.slice(0, limit).map((doc) => ({
//       id: doc.id,
//       content: doc.content,
//       data: doc.metadata,
//       similarity: 0.8, // Fake similarity for external data
//       source: doc.source,
//       title: doc.title || "External Source", // Edited here: Added title field
//     }));
//   } catch (error) {
//     console.error("[CACHE HELPER] Error in external search:", error);
//     return [];
//   }
// };

const searchExternalData = async (query: string, limit: number) => {
  try {
    console.log("[CACHE HELPER] Fetching from external APIs...");
    const apiClient = createExternalApiClient();
    const candidateDocs = await apiClient.keywordSearch(query, 20);
    if (candidateDocs.length === 0) {
      console.log("[CACHE HELPER] Tidak ada kandidat eksternal ditemukan");
      return [];
    }
    console.log(
      `[CACHE HELPER] Got ${candidateDocs.length} external candidates`
    );
    return candidateDocs.slice(0, limit).map((doc) => ({
      id: doc.id,
      content: doc.content,
      data: doc.metadata,
      similarity: 0.8, // Fake similarity for external data
      source: doc.source,
      title: doc.title || "External Source", // Edited here: Added title field
    }));
  } catch (error) {
    console.error("[CACHE HELPER] Error in external search:", error);
    return [];
  }
};
const combineAndRerankResults = async (
  query: string,
  internalResults: any[],
  externalResults: any[],
  topK: number
) => {
  try {
    const allResults = [
      ...internalResults.map((r) => ({ ...r, resultType: "internal" })),
      ...externalResults.map((r) => ({ ...r, resultType: "external" })),
    ];
    const sortedResults = allResults.sort(
      (a, b) => b.similarity - a.similarity
    );
    return applyDiversityFilter(sortedResults, topK);
  } catch (error) {
    console.error("[CACHE HELPER] Error in combining results:", error);
    return [...internalResults, ...externalResults].slice(0, topK);
  }
};

// Edited here: Pure function for diversity filtering
// Reason: Functional approach - separate concern, easier to test and modify
const applyDiversityFilter = (results: any[], topK: number) => {
  const finalResults: any[] = [];
  const usedInternal = new Set<string>();
  const usedExternal = new Set<string>();

  for (const result of results) {
    if (finalResults.length >= topK) break;

    const isInternal = result.resultType === "internal";
    const isExternal = result.resultType === "external";
    const isNotUsedInternal = !usedInternal.has(result.id);
    const isNotUsedExternal = !usedExternal.has(result.id);

    if (isInternal && isNotUsedInternal) {
      finalResults.push(result);
      usedInternal.add(result.id);
    } else if (isExternal && isNotUsedExternal) {
      finalResults.push(result);
      usedExternal.add(result.id);
    }
  }

  return finalResults;
};

// Edited here: Factory function instead of class instantiation
// Reason: Functional approach - create instances without classes
const createExternalApiClient = () => {
  // This should be refactored to functional approach too, but for now keeping it
  return new ExternalAPIClient();
};

// Edited here: Additional utility functions for cache management
// Reason: Functional approach - separate utilities that can be composed

export const validateEmbedding = (embedding: any): number[] => {
  if (!Array.isArray(embedding)) {
    throw new Error("Embedding must be an array");
  }

  if (embedding.length !== 768) {
    throw new Error(
      `Expected embedding dimension 768, got ${embedding.length}`
    );
  }

  return embedding.map((value, index) => {
    const num =
      typeof value === "number" ? value : parseFloat(value.toString());
    if (isNaN(num)) {
      throw new Error(`Invalid embedding value at index ${index}`);
    }
    return num;
  });
};

export const validateSearchQuery = (query: string): string => {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("Query must be a non-empty string");
  }
  return query.trim();
};

// Edited here: Cache stats function (pure function)
// Reason: Functional approach - no class state, just database query
// export const getCacheStats = async () => {
//   try {
//     const [result] = await db.execute(
//       sql`SELECT COUNT(*) as total FROM ${ragData}`
//     );

//     return {
//       total: parseInt(result.total.toString()),
//       timestamp: new Date().toISOString(),
//     };
//   } catch (error) {
//     console.error("❌ Error getting cache stats:", error);
//     return { total: 0, timestamp: new Date().toISOString() };
//   }
// };

export const getCacheStats = async () => {
  try {
    const db = getDb(); // Edited here: Get db instance
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as total FROM ${ragData}`
    );

    return {
      total: parseInt(result.total.toString()),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error getting cache stats:", error);
    return { total: 0, timestamp: new Date().toISOString() };
  }
};

// Edited here: Main export function that replaces class usage
// Reason: Functional approach - single entry point instead of class instantiation
export const createDynamicEmbeddingCache = (options: SearchOptions = {}) => ({
  search: (query: string) => searchWithDynamicCache(query, options),
  getStats: getCacheStats,
  validateQuery: validateSearchQuery,
  validateEmbedding: validateEmbedding,
});

// Edited here: Default export for backward compatibility
// Reason: Provides easy migration from class-based approach
export default {
  search: searchWithDynamicCache,
  getStats: getCacheStats,
  validateQuery: validateSearchQuery,
  validateEmbedding: validateEmbedding,
};

// export class DynamicEmbeddingCacheHelper {
//   private apiClient: ExternalAPIClient;
//   private cacheEnabled: boolean;
//   private cacheTTL: number; // in seconds

//   constructor() {
//     this.apiClient = new ExternalAPIClient();
//     this.cacheEnabled = process.env.EMBEDDING_CACHE_ENABLED === "true";
//     this.cacheTTL = parseInt(process.env.EXTERNAL_API_CACHE_TTL || "3600");
//   }

//   /**
//    * Metode utama untuk melakukan pencarian semantik dengan cache dinamis
//    */
//   public async search(query: string, topK: number = 5) {
//     console.log(`[CACHE HELPER] Memulai pencarian untuk: "${query}"`);

//     try {
//       // Step 1: Cari di data internal terlebih dahulu
//       const internalResults = await this.searchInternalData(
//         query,
//         Math.ceil(topK / 2)
//       );
//       console.log(
//         `[CACHE HELPER] Menemukan ${internalResults.length} hasil internal`
//       );

//       // Step 2: Cari di external APIs
//       const externalResults = await this.searchExternalData(query, topK);
//       console.log(
//         `[CACHE HELPER] Menemukan ${externalResults.length} hasil eksternal`
//       );

//       // Step 3: Gabungkan dan ranking ulang
//       const combinedResults = await this.combineAndRerankResults(
//         query,
//         internalResults,
//         externalResults,
//         topK
//       );

//       console.log(
//         `[CACHE HELPER] Mengembalikan ${combinedResults.length} hasil terbaik`
//       );
//       return combinedResults;
//     } catch (error) {
//       console.error("[CACHE HELPER] Error dalam pencarian:", error);
//       // Fallback ke pencarian internal saja
//       return await this.searchInternalData(query, topK);
//     }
//   }

//   /**
//    * Pencarian di data internal (existing RAG data)
//    */
//   private async searchInternalData(query: string, limit: number) {
//     try {
//       const embedding = await generateEmbedding(query);
//       if (!Array.isArray(embedding) || embedding.length !== 768) {
//         console.error("[CACHE HELPER] Invalid query embedding dimension");
//         return [];
//       }

//       const similarity = sql<number>`1 - (${this.cosineDistance(
//         ragData.embedding,
//         embedding as number[]
//       )})`;

//       const results = await db
//         .select({
//           id: ragData.id,
//           content: ragData.content,
//           data: ragData.data,
//           similarity: similarity,
//           source: sql<string>`COALESCE(${ragData.source}, 'internal')`,
//         })
//         .from(ragData)
//         .where(
//           and(
//             gt(
//               similarity,
//               parseFloat(process.env.SIMILARITY_THRESHOLD || "0.5")
//             ),
//             eq(ragData.source, "internal") // Only internal data
//           )
//         )
//         .orderBy(desc(similarity))
//         .limit(limit);

//       return results;
//     } catch (error) {
//       console.error("[CACHE HELPER] Error in internal search:", error);
//       return [];
//     }
//   }

//   /**
//    * Pencarian di external APIs dengan caching
//    */
//   private async searchExternalData(query: string, limit: number) {
//     try {
//       // Step 1: Fetch candidate documents from external APIs
//       console.log("[CACHE HELPER] Fetching from external APIs...");
//       const candidateDocs = await this.apiClient.keywordSearch(query, 20);

//       if (candidateDocs.length === 0) {
//         console.log("[CACHE HELPER] Tidak ada kandidat eksternal ditemukan");
//         return [];
//       }

//       console.log(
//         `[CACHE HELPER] Got ${candidateDocs.length} external candidates`
//       );

//       // For now, return the external documents directly without embedding search
//       // since your database might not have the external data cached yet
//       return candidateDocs.slice(0, limit).map((doc) => ({
//         id: doc.id,
//         content: doc.content,
//         data: doc.metadata,
//         similarity: 0.8, // Fake similarity for external data
//         source: doc.source,
//       }));
//     } catch (error) {
//       console.error("[CACHE HELPER] Error in external search:", error);
//       return [];
//     }
//   }

//   /**
//    * Gabungkan dan ranking ulang hasil internal dan eksternal
//    */
//   private async combineAndRerankResults(
//     query: string,
//     internalResults: any[],
//     externalResults: any[],
//     topK: number
//   ) {
//     try {
//       // Combine results
//       const allResults = [
//         ...internalResults.map((r) => ({ ...r, resultType: "internal" })),
//         ...externalResults.map((r) => ({ ...r, resultType: "external" })),
//       ];

//       // Sort by similarity score
//       allResults.sort((a, b) => b.similarity - a.similarity);

//       // Apply diversity: ensure mix of internal and external results
//       const finalResults = [];
//       const usedInternal = new Set();
//       const usedExternal = new Set();

//       for (const result of allResults) {
//         if (finalResults.length >= topK) break;

//         if (result.resultType === "internal" && !usedInternal.has(result.id)) {
//           finalResults.push(result);
//           usedInternal.add(result.id);
//         } else if (
//           result.resultType === "external" &&
//           !usedExternal.has(result.id)
//         ) {
//           finalResults.push(result);
//           usedExternal.add(result.id);
//         }
//       }

//       return finalResults;
//     } catch (error) {
//       console.error("[CACHE HELPER] Error in combining results:", error);
//       return [...internalResults, ...externalResults].slice(0, topK);
//     }
//   }

//   /**
//    * Helper function untuk cosine distance
//    */
//   private cosineDistance(embedding1: any, embedding2: number[]) {
//     return sql<number>`1 - (${embedding1} <=> ${embedding2})`;
//   }
// }

// // import { db } from "@/lib/db/index";
// // import { ragData } from "@/lib/db/schema";
// // import { generateEmbedding } from "./embeddings.service";
// // import { ExternalAPIClient } from "../external/api-client.service";
// // import { sql } from "drizzle-orm";
// // import { eq, inArray, gt, desc, and } from "drizzle-orm";

// // interface ExternalDocument {
// //   id: string;
// //   content: string;
// //   source: string;
// //   metadata: any;
// //   timestamp: Date;
// // }

// // interface CacheRecord {
// //   id: number;
// //   content: string;
// //   data: any;
// //   embedding: number[];
// //   source: string;
// //   external_id: string;
// //   last_updated: Date;
// // }

// // export class DynamicEmbeddingCacheHelper {
// //   private apiClient: ExternalAPIClient;
// //   private cacheEnabled: boolean;
// //   private cacheTTL: number; // in seconds

// //   constructor() {
// //     this.apiClient = new ExternalAPIClient();
// //     this.cacheEnabled = process.env.EMBEDDING_CACHE_ENABLED === "true";
// //     this.cacheTTL = parseInt(process.env.EXTERNAL_API_CACHE_TTL || "3600");
// //   }

// //   /**
// //    * Metode utama untuk melakukan pencarian semantik dengan cache dinamis
// //    */
// //   public async search(query: string, topK: number = 5) {
// //     console.log(`[CACHE HELPER] Memulai pencarian untuk: "${query}"`);

// //     try {
// //       // Step 1: Cari di data internal terlebih dahulu
// //       const internalResults = await this.searchInternalData(
// //         query,
// //         Math.ceil(topK / 2)
// //       );
// //       console.log(
// //         `[CACHE HELPER] Menemukan ${internalResults.length} hasil internal`
// //       );

// //       // Step 2: Cari di external APIs
// //       const externalResults = await this.searchExternalData(query, topK);
// //       console.log(
// //         `[CACHE HELPER] Menemukan ${externalResults.length} hasil eksternal`
// //       );

// //       // Step 3: Gabungkan dan ranking ulang
// //       const combinedResults = await this.combineAndRerankResults(
// //         query,
// //         internalResults,
// //         externalResults,
// //         topK
// //       );

// //       console.log(
// //         `[CACHE HELPER] Mengembalikan ${combinedResults.length} hasil terbaik`
// //       );
// //       return combinedResults;
// //     } catch (error) {
// //       console.error("[CACHE HELPER] Error dalam pencarian:", error);
// //       // Fallback ke pencarian internal saja
// //       return await this.searchInternalData(query, topK);
// //     }
// //   }

// //   /**
// //    * Pencarian di data internal (existing RAG data)
// //    */
// //   private async searchInternalData(query: string, limit: number) {
// //     try {
// //       const embedding = await generateEmbedding(query);
// //       if (!Array.isArray(embedding) || embedding.length !== 768) {
// //         console.error("[CACHE HELPER] Invalid query embedding dimension");
// //         return [];
// //       }

// //       const similarity = sql<number>`1 - (${this.cosineDistance(
// //         ragData.embedding,
// //         embedding as number[]
// //       )})`;

// //       const results = await db
// //         .select({
// //           id: ragData.id,
// //           content: ragData.content,
// //           data: ragData.data,
// //           similarity: similarity,
// //           source: sql<string>`'internal'`,
// //         })
// //         .from(ragData)
// //         .where(
// //           and(
// //             gt(
// //               similarity,
// //               parseFloat(process.env.SIMILARITY_THRESHOLD || "0.5")
// //             ),
// //             eq(ragData.source, "internal") // Assuming you have a source column
// //           )
// //         )
// //         .orderBy(desc(similarity))
// //         .limit(limit);

// //       return results;
// //     } catch (error) {
// //       console.error("[CACHE HELPER] Error in internal search:", error);
// //       return [];
// //     }
// //   }

// //   /**
// //    * Pencarian di external APIs dengan caching
// //    */
// //   private async searchExternalData(query: string, limit: number) {
// //     try {
// //       // Step 1: Fetch candidate documents from external APIs
// //       const candidateDocs = await this.apiClient.keywordSearch(query, 20);

// //       if (candidateDocs.length === 0) {
// //         console.log("[CACHE HELPER] Tidak ada kandidat eksternal ditemukan");
// //         return [];
// //       }

// //       // Step 2: Enrich cache with embeddings
// //       await this.enrichCache(candidateDocs);

// //       // Step 3: Perform semantic search on cached external data
// //       return await this.semanticSearchOnExternalCache(
// //         query,
// //         candidateDocs,
// //         limit
// //       );
// //     } catch (error) {
// //       console.error("[CACHE HELPER] Error in external search:", error);
// //       return [];
// //     }
// //   }

// //   /**
// //    * Enrich cache dengan embedding untuk external documents
// //    */
// //   private async enrichCache(documents: ExternalDocument[]): Promise<void> {
// //     if (!this.cacheEnabled) {
// //       console.log("[CACHE HELPER] Cache disabled, skipping enrichment");
// //       return;
// //     }

// //     try {
// //       const externalIds = documents.map((doc) => doc.id);

// //       // Check existing cache records
// //       const existingRecords = await db
// //         .select({
// //           external_id: ragData.external_id,
// //           embedding: ragData.embedding,
// //           last_updated: ragData.updated_at,
// //         })
// //         .from(ragData)
// //         .where(inArray(ragData.external_id, externalIds));

// //       const existingMap = new Map(
// //         existingRecords.map((r) => [r.external_id, r])
// //       );

// //       const now = new Date();
// //       const cacheExpiry = new Date(now.getTime() - this.cacheTTL * 1000);

// //       // Find documents that need embedding (new or expired)
// //       const docsNeedingEmbedding = documents.filter((doc) => {
// //         const existing = existingMap.get(doc.id);
// //         return (
// //           !existing ||
// //           !existing.embedding ||
// //           existing.embedding.length === 0 ||
// //           new Date(existing.last_updated) < cacheExpiry
// //         );
// //       });

// //       if (docsNeedingEmbedding.length === 0) {
// //         console.log(
// //           "[CACHE HELPER] Cache sudah up-to-date untuk semua kandidat"
// //         );
// //         return;
// //       }

// //       console.log(
// //         `[CACHE HELPER] Generating embeddings untuk ${docsNeedingEmbedding.length} dokumen eksternal`
// //       );

// //       // Generate embeddings in batches to avoid rate limiting
// //       const batchSize = 5;
// //       for (let i = 0; i < docsNeedingEmbedding.length; i += batchSize) {
// //         const batch = docsNeedingEmbedding.slice(i, i + batchSize);

// //         for (const doc of batch) {
// //           try {
// //             const embedding = await generateEmbedding(doc.content);

// //             // Upsert to database
// //             await db
// //               .insert(ragData)
// //               .values({
// //                 content: doc.content,
// //                 data: doc.metadata,
// //                 embedding: embedding,
// //                 source: doc.source,
// //                 external_id: doc.id,
// //                 created_at: now,
// //                 updated_at: now,
// //               })
// //               .onConflictDoUpdate({
// //                 target: ragData.external_id,
// //                 set: {
// //                   content: doc.content,
// //                   data: doc.metadata,
// //                   embedding: embedding,
// //                   updated_at: now,
// //                 },
// //               });

// //             // Small delay to respect rate limits
// //             await new Promise((resolve) => setTimeout(resolve, 200));
// //           } catch (embeddingError) {
// //             console.error(
// //               `[CACHE HELPER] Failed to generate embedding for ${doc.id}:`,
// //               embeddingError
// //             );
// //           }
// //         }
// //       }

// //       console.log(`[CACHE HELPER] Cache enrichment completed`);
// //     } catch (error) {
// //       console.error("[CACHE HELPER] Error in enrichCache:", error);
// //     }
// //   }

// //   /**
// //    * Semantic search pada cached external data
// //    */
// //   private async semanticSearchOnExternalCache(
// //     query: string,
// //     candidates: ExternalDocument[],
// //     limit: number
// //   ) {
// //     try {
// //       const embedding = await generateEmbedding(query);
// //       if (!Array.isArray(embedding) || embedding.length !== 768) {
// //         console.error("[CACHE HELPER] Invalid query embedding dimension");
// //         return [];
// //       }

// //       const candidateIds = candidates.map((doc) => doc.id);

// //       const similarity = sql<number>`1 - (${this.cosineDistance(
// //         ragData.embedding,
// //         embedding as number[]
// //       )})`;

// //       const results = await db
// //         .select({
// //           id: ragData.id,
// //           content: ragData.content,
// //           data: ragData.data,
// //           similarity: similarity,
// //           source: ragData.source,
// //         })
// //         .from(ragData)
// //         .where(
// //           and(
// //             inArray(ragData.external_id, candidateIds),
// //             gt(
// //               similarity,
// //               parseFloat(process.env.SIMILARITY_THRESHOLD || "0.5")
// //             )
// //           )
// //         )
// //         .orderBy(desc(similarity))
// //         .limit(limit);

// //       return results;
// //     } catch (error) {
// //       console.error(
// //         "[CACHE HELPER] Error in semantic search on external cache:",
// //         error
// //       );
// //       return [];
// //     }
// //   }

// //   /**
// //    * Gabungkan dan ranking ulang hasil internal dan eksternal
// //    */
// //   private async combineAndRerankResults(
// //     query: string,
// //     internalResults: any[],
// //     externalResults: any[],
// //     topK: number
// //   ) {
// //     try {
// //       // Combine results
// //       const allResults = [
// //         ...internalResults.map((r) => ({ ...r, resultType: "internal" })),
// //         ...externalResults.map((r) => ({ ...r, resultType: "external" })),
// //       ];

// //       // Sort by similarity score
// //       allResults.sort((a, b) => b.similarity - a.similarity);

// //       // Apply diversity: ensure mix of internal and external results
// //       const finalResults = [];
// //       const usedInternal = new Set();
// //       const usedExternal = new Set();

// //       for (const result of allResults) {
// //         if (finalResults.length >= topK) break;

// //         if (result.resultType === "internal" && !usedInternal.has(result.id)) {
// //           finalResults.push(result);
// //           usedInternal.add(result.id);
// //         } else if (
// //           result.resultType === "external" &&
// //           !usedExternal.has(result.id)
// //         ) {
// //           finalResults.push(result);
// //           usedExternal.add(result.id);
// //         }
// //       }

// //       return finalResults;
// //     } catch (error) {
// //       console.error("[CACHE HELPER] Error in combining results:", error);
// //       return [...internalResults, ...externalResults].slice(0, topK);
// //     }
// //   }

// //   /**
// //    * Helper function untuk cosine distance
// //    */
// //   private cosineDistance(embedding1: any, embedding2: number[]) {
// //     return sql<number>`1 - (${embedding1} <=> ${embedding2})`;
// //   }
// // }

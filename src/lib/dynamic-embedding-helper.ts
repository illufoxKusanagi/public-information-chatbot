// import { db } from "@/lib/db/index";
// import { ragData } from "@/lib/db/schema";
// import { generateEmbedding } from "./services/ai/embeddings.service";
// import { sql } from "drizzle-orm";
// import { eq, inArray, gt, desc } from "drizzle-orm";

// interface CacheRecord {
//   external_id: string;
//   content: string;
//   data: any;
//   embedding: number[];
//   last_updated: Date;
// }

// interface Document {
//   id: string;
//   content: string;
//   data: any;
// }

// export class DynamicEmbeddingCacheHelper {
//   /**
//    * Metode utama untuk melakukan pencarian semantik dengan cache dinamis
//    * @param query Teks kueri dari pengguna
//    * @param topK Jumlah hasil relevan yang diinginkan
//    * @returns Array berisi dokumen yang paling relevan
//    */
//   public async search(query: string, topK: number = 5) {
//     console.log(`[CACHE HELPER] Memulai pencarian untuk: "${query}"`);

//     try {
//       // Langkah 1: Lakukan pencarian keyword sederhana untuk mendapatkan kandidat
//       const candidateDocs = await this.keywordSearch(query, 20);
//       console.log(
//         `[CACHE HELPER] Mendapatkan ${candidateDocs.length} kandidat dari keyword search.`
//       );

//       if (candidateDocs.length === 0) {
//         console.log(
//           "[CACHE HELPER] Tidak ada kandidat ditemukan dari keyword search."
//         );
//         return [];
//       }

//       // Langkah 2: Pastikan semua kandidat ada di dalam cache embedding
//       await this.enrichCache(candidateDocs);

//       // Langkah 3: Lakukan pencarian semantik pada kandidat
//       const relevantResults = await this.semanticSearchOnCandidates(
//         query,
//         candidateDocs,
//         topK
//       );

//       console.log(
//         `[CACHE HELPER] Pencarian semantik selesai. Ditemukan ${relevantResults.length} hasil.`
//       );
//       return relevantResults;
//     } catch (error) {
//       console.error("[CACHE HELPER] Error dalam pencarian:", error);
//       return [];
//     }
//   }

//   /**
//    * Melakukan pencarian keyword sederhana pada database
//    * @private
//    */
//   private async keywordSearch(
//     query: string,
//     limit: number = 20
//   ): Promise<Document[]> {
//     try {
//       // Pencarian sederhana berdasarkan konten yang mengandung kata kunci
//       const keywords = query
//         .toLowerCase()
//         .split(" ")
//         .filter((word) => word.length > 2);

//       if (keywords.length === 0) {
//         return [];
//       }

//       // Ambil semua data dan filter berdasarkan keyword
//       const allData = await db.select().from(ragData).limit(1000);

//       const candidates = allData.filter((item) => {
//         const content = item.content.toLowerCase();
//         return keywords.some((keyword) => content.includes(keyword));
//       });

//       return candidates.slice(0, limit).map((item) => ({
//         id: `${item.id}`, // Konversi ke string
//         content: item.content,
//         data: item.data,
//       }));
//     } catch (error) {
//       console.error("[CACHE HELPER] Error dalam keyword search:", error);
//       return [];
//     }
//   }

//   /**
//    * Memeriksa dokumen mana yang belum ada embedding-nya atau perlu update
//    * @private
//    */
//   private async enrichCache(documents: Document[]): Promise<void> {
//     try {
//       const docIds = documents.map((doc) => parseInt(doc.id));

//       // Cari data yang sudah ada di database
//       const existingRecords = await db
//         .select({ id: ragData.id, embedding: ragData.embedding })
//         .from(ragData)
//         .where(inArray(ragData.id, docIds));

//       const existingIds = new Set(existingRecords.map((r) => r.id));
//       const missingDocs = documents.filter((doc) => {
//         const id = parseInt(doc.id);
//         const existing = existingRecords.find((r) => r.id === id);
//         // Jika tidak ada atau embedding kosong
//         return (
//           !existingIds.has(id) ||
//           !existing?.embedding ||
//           existing.embedding.length === 0
//         );
//       });

//       if (missingDocs.length === 0) {
//         console.log("[CACHE HELPER] Cache sudah lengkap untuk kandidat ini.");
//         return;
//       }

//       console.log(
//         `[CACHE HELPER] ${missingDocs.length} dokumen perlu embedding baru.`
//       );

//       // Generate embedding untuk dokumen yang hilang
//       for (const doc of missingDocs) {
//         try {
//           console.log(
//             `[CACHE HELPER] Generating embedding untuk: "${doc.content.substring(
//               0,
//               50
//             )}..."`
//           );
//           const embedding = await generateEmbedding(doc.content);

//           // Update database dengan embedding baru
//           await db
//             .update(ragData)
//             .set({
//               embedding: embedding,
//               content: doc.content,
//               data: doc.data,
//             })
//             .where(eq(ragData.id, parseInt(doc.id)));

//           // Delay kecil untuk menghindari rate limiting
//           await new Promise((resolve) => setTimeout(resolve, 100));
//         } catch (embeddingError) {
//           console.error(
//             `[CACHE HELPER] Gagal membuat embedding untuk doc ${doc.id}:`,
//             embeddingError
//           );
//         }
//       }

//       console.log(
//         `[CACHE HELPER] Berhasil mengupdate ${missingDocs.length} embedding.`
//       );
//     } catch (error) {
//       console.error("[CACHE HELPER] Error dalam enrichCache:", error);
//     }
//   }

//   /**
//    * Melakukan pencarian semantik hanya pada kandidat yang sudah difilter
//    * @private
//    */
//   private async semanticSearchOnCandidates(
//     query: string,
//     candidates: Document[],
//     topK: number
//   ) {
//     try {
//       // Generate embedding untuk query
//       const queryEmbedding = await generateEmbedding(query);

//       if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
//         console.error("[CACHE HELPER] Invalid query embedding dimension");
//         return [];
//       }

//       const candidateIds = candidates.map((doc) => parseInt(doc.id));

//       // Hitung cosine similarity hanya untuk kandidat
//       const similarity = sql<number>`1 - (${this.cosineDistance(
//         ragData.embedding,
//         queryEmbedding as number[]
//       )})`;

//       const relevantContent = await db
//         .select({
//           id: ragData.id,
//           content: ragData.content,
//           data: ragData.data,
//           similarity: similarity,
//           source: ragData.source,
//         })
//         .from(ragData)
//         .where(inArray(ragData.id, candidateIds))
//         .orderBy(desc(similarity))
//         .limit(topK);

//       // Filter hasil dengan similarity minimum
//       return relevantContent.filter((item) => item.similarity > 0.5);
//     } catch (error) {
//       console.error("[CACHE HELPER] Error dalam semantic search:", error);
//       return [];
//     }
//   }

//   /**
//    * Helper function untuk menghitung cosine distance
//    * @private
//    */
//   private cosineDistance(embedding1: any, embedding2: number[]) {
//     return sql<number>`1 - (${embedding1} <=> ${embedding2})`;
//   }
// }

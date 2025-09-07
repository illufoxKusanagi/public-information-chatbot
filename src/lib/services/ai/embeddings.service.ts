import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const embeddingModel = process.env.EMBEDDING_MODEL ?? "text-embedding-004";
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}
const model = new GoogleGenAI({ apiKey });

export async function generateEmbedding(content: string) {
  try {
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      throw new Error("Content must be a non-empty string");
    }
    const result = await model.models.embedContent({
      model: embeddingModel,
      contents: content.toLowerCase(),
    });
    let embedding;
    if (result.embedding?.values) {
      embedding = result.embedding.values;
      console.log("Found embedding in result.embedding.values");
    } else if (result.embeddings?.length > 0 && result.embeddings[0].values) {
      embedding = result.embeddings[0].values;
      console.log("Found embedding in result.embeddings[0].values");
    } else if (result.values) {
      embedding = result.values;
      console.log("Found embedding in result.values");
    } else {
      console.log("No embedding found in expected locations");
      console.log("Available keys in result:", Object.keys(result));
    }

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(
        `Failed to generate embedding: empty or invalid result from API. Response keys: ${Object.keys(
          result
        ).join(", ")}`
      );
    }

    const validEmbedding = embedding.map((value, index) => {
      const num =
        typeof value === "number" ? value : parseFloat(value.toString());
      if (isNaN(num)) {
        throw new Error(`Invalid embedding value at index ${index}: ${value}`);
      }
      return num;
    });
    return validEmbedding;
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    console.error("Content that failed:", content?.substring(0, 100));
    console.error("Model being used:", embeddingModel);
    console.error("API Key exists:", !!apiKey);

    if (error instanceof Error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    } else {
      throw new Error("Embedding generation failed: Unknown error");
    }
  }
}

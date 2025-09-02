import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey: string = process.env.GEMINI_API_KEY!;
const embeddingModel: string = process.env.EMBEDDING_MODEL!;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateEmbedding(text: string) {
  const model = genAI.getGenerativeModel({
    model: embeddingModel,
  });
  const result = await model.embedContent(text.toLowerCase());
  return result.embedding.values;
}

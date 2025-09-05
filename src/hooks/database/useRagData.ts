/// UNUSED YET

"use client";

import { RagService } from "@/lib/services/ai/rag.service";
import { useState } from "react";

export function useRagData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchData = async (query: string) => {
    setLoading(true);
    try {
      const results = await RagService.searchByKeyword(query);
      setData(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, searchData };
}

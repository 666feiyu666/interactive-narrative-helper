import { cosineSimilarity } from "./cosine.mjs";
import { sha256 } from "../utils/hash.mjs";

export async function retrieveKnowledge({ question, snapshot, indexResult, provider, topK }) {
  const embedding = await provider.embed([question]);
  const queryVector = embedding.vectors[0];
  if (!queryVector || queryVector.length !== indexResult.index.dimensions) {
    throw new Error("Query embedding dimension does not match the Knowledge Card index.");
  }

  const results = indexResult.index.entries
    .map((entry) => ({
      knowledge_id: entry.knowledge_id,
      score: cosineSimilarity(queryVector, entry.vector),
    }))
    .sort((left, right) => right.score - left.score || left.knowledge_id.localeCompare(right.knowledge_id))
    .slice(0, topK)
    .map((entry, index) => ({
      rank: index + 1,
      knowledge_id: entry.knowledge_id,
      score: entry.score,
      card: snapshot.byId.get(entry.knowledge_id),
    }));

  return {
    results,
    execution: {
      method: "embedding-cosine-top-k/v1",
      provider: embedding.provider,
      model: embedding.model,
      query_sha256: sha256(question),
      latency_ms: embedding.latencyMs,
      usage: embedding.usage,
    },
  };
}

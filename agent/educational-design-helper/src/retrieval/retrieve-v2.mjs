import { cosineSimilarity } from "./cosine.mjs";
import { sha256 } from "../utils/hash.mjs";

function domainLabelPrevalence(domainSynthesis) {
  const prevalence = new Map();
  for (const synthesis of domainSynthesis) {
    if (!Number.isInteger(synthesis.eligible_n) || synthesis.eligible_n <= 0) continue;
    for (const labelCount of synthesis.label_counts) {
      prevalence.set(
        `${synthesis.dimension}:${labelCount.label}`,
        labelCount.support_n / synthesis.eligible_n,
      );
    }
  }
  return prevalence;
}

function patternPenalty(item, prevalence) {
  if (item.knowledge_type !== "cross_case_pattern") return 0;
  const includesNearUniversalLabel = item.labels.some(
    ({ dimension, label }) => (prevalence.get(`${dimension}:${label}`) ?? 0) >= 0.9,
  );
  return includesNearUniversalLabel ? 0.35 : 0;
}

function rankCollection({ items, indexResult, queryVector, topK, scoreAdjustment = () => 0 }) {
  if (queryVector.length !== indexResult.index.dimensions) {
    throw new Error("Query embedding dimension does not match a typed knowledge index.");
  }
  const byId = new Map(items.map((item) => [item.knowledge_id, item]));
  return indexResult.index.entries
    .map((entry) => ({
      knowledge_id: entry.knowledge_id,
      rawScore: cosineSimilarity(queryVector, entry.vector),
      item: byId.get(entry.knowledge_id),
    }))
    .map((entry) => ({
      ...entry,
      score: entry.rawScore - scoreAdjustment(entry.item),
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.knowledge_id.localeCompare(right.knowledge_id),
    )
    .slice(0, topK)
    .map((entry, index) => ({
      rank: index + 1,
      knowledge_id: entry.knowledge_id,
      score: entry.score,
      item: entry.item,
    }));
}

export async function retrieveTypedKnowledge({
  question,
  release,
  indexes,
  provider,
  crossCasePatternTopK,
  designCardTopK,
}) {
  const embedded = await provider.embed([question]);
  const queryVector = embedded.vectors[0];
  if (!queryVector) throw new Error("Embedding provider returned no query vector.");

  const domainSynthesis = release.domainSynthesis.map((item, index) => ({
    rank: index + 1,
    knowledge_id: item.knowledge_id,
    score: null,
    item,
  }));
  const prevalence = domainLabelPrevalence(release.domainSynthesis);
  const crossCasePatterns = rankCollection({
    items: release.crossCasePatterns,
    indexResult: indexes.cross_case_pattern,
    queryVector,
    topK: crossCasePatternTopK,
    scoreAdjustment: (item) => patternPenalty(item, prevalence),
  });
  const designCards = rankCollection({
    items: release.designCards,
    indexResult: indexes.case_design_card,
    queryVector,
    topK: designCardTopK,
  });

  return {
    domainSynthesis,
    crossCasePatterns,
    designCards,
    execution: {
      method: "typed-embedding-cosine-candidate-pool/v2",
      provider: embedded.provider,
      model: embedded.model,
      query_sha256: sha256(question),
      latency_ms: embedded.latencyMs,
      usage: embedded.usage,
    },
  };
}

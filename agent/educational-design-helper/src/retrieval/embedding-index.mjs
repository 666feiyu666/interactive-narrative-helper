import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { sha256 } from "../utils/hash.mjs";

const indexSchemaVersion = "track-a-embedding-index/v1";

function validateIndex(index, snapshot, provider, embeddingModel) {
  if (index.schema_version !== indexSchemaVersion) return false;
  if (index.snapshot_id !== snapshot.manifest.snapshot_id) return false;
  if (index.knowledge_cards_sha256 !== snapshot.cardsSha256) return false;
  if (index.provider !== provider.name || index.model !== embeddingModel) return false;
  if (!Number.isInteger(index.dimensions) || index.dimensions < 1) return false;
  if (!Array.isArray(index.entries) || index.entries.length !== snapshot.cards.length) return false;

  const expectedIds = new Set(snapshot.cards.map((card) => card.knowledge_id));
  for (const entry of index.entries) {
    if (!expectedIds.delete(entry.knowledge_id)) return false;
    if (!Array.isArray(entry.vector) || entry.vector.length !== index.dimensions) return false;
    if (!entry.vector.every(Number.isFinite)) return false;
  }
  return expectedIds.size === 0;
}

function resolveIndexPath(indexRoot = null) {
  return indexRoot ? path.join(indexRoot, "knowledge-cards.json") : paths.embeddingIndex;
}

async function readCompatibleIndex(snapshot, provider, embeddingModel, filePath) {
  try {
    const bytes = await readFile(filePath);
    const index = JSON.parse(bytes.toString("utf8"));
    if (!validateIndex(index, snapshot, provider, embeddingModel)) return null;
    return { index, indexSha256: sha256(bytes) };
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

export async function buildEmbeddingIndex(
  snapshot,
  provider,
  runtimeConfig,
  { indexRoot = null } = {},
) {
  const entries = [];
  const batchSize = runtimeConfig.retrieval.embedding_batch_size;
  for (let offset = 0; offset < snapshot.cards.length; offset += batchSize) {
    const batch = snapshot.cards.slice(offset, offset + batchSize);
    const result = await provider.embed(batch.map((card) => card.retrieval_text));
    if (result.vectors.length !== batch.length) {
      throw new Error(
        `Embedding provider returned ${result.vectors.length} vectors for ${batch.length} inputs.`,
      );
    }
    batch.forEach((card, index) => {
      entries.push({ knowledge_id: card.knowledge_id, vector: result.vectors[index] });
    });
  }

  const dimensions = entries[0]?.vector.length ?? 0;
  if (dimensions < 1 || entries.some((entry) => entry.vector.length !== dimensions)) {
    throw new Error("Embedding provider returned inconsistent vector dimensions.");
  }

  const index = {
    schema_version: indexSchemaVersion,
    created_at: new Date().toISOString(),
    snapshot_id: snapshot.manifest.snapshot_id,
    knowledge_cards_sha256: snapshot.cardsSha256,
    provider: provider.name,
    model: runtimeConfig.openai.embeddingModel,
    dimensions,
    entries,
  };
  const serialized = `${JSON.stringify(index, null, 2)}\n`;
  const filePath = resolveIndexPath(indexRoot);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, serialized, "utf8");
  return { index, indexSha256: sha256(serialized) };
}

export async function ensureEmbeddingIndex(
  snapshot,
  provider,
  runtimeConfig,
  { indexRoot = null } = {},
) {
  const filePath = resolveIndexPath(indexRoot);
  const existing = await readCompatibleIndex(
    snapshot,
    provider,
    runtimeConfig.openai.embeddingModel,
    filePath,
  );
  if (existing) return { ...existing, rebuilt: false };
  const built = await buildEmbeddingIndex(snapshot, provider, runtimeConfig, { indexRoot });
  return { ...built, rebuilt: true };
}

export function getIndexTrace(indexResult) {
  return {
    schema_version: indexResult.index.schema_version,
    provider: indexResult.index.provider,
    model: indexResult.index.model,
    dimensions: indexResult.index.dimensions,
    knowledge_cards_sha256: indexResult.index.knowledge_cards_sha256,
    index_sha256: indexResult.indexSha256,
  };
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { sha256 } from "../utils/hash.mjs";

const indexSchemaVersion = "track-a-embedding-index/v2";
const indexedCollections = [
  ["cross_case_pattern", "crossCasePatterns", "cross-case-patterns.json"],
  ["case_design_card", "designCards", "design-cards.json"],
];

function indexPathFor(release, fileName, indexRoot = null) {
  return path.join(
    indexRoot ?? path.join(paths.repositoryRoot, "outputs", "indexes", release.manifest.knowledge_release_id),
    fileName,
  );
}

function validateIndex(index, release, knowledgeType, items, knowledgeSha256, provider, embeddingModel) {
  if (index.schema_version !== indexSchemaVersion) return false;
  if (index.knowledge_release_id !== release.manifest.knowledge_release_id) return false;
  if (index.knowledge_type !== knowledgeType) return false;
  if (index.knowledge_sha256 !== knowledgeSha256) return false;
  if (index.provider !== provider.name || index.model !== embeddingModel) return false;
  if (!Number.isInteger(index.dimensions) || index.dimensions < 1) return false;
  if (!Array.isArray(index.entries) || index.entries.length !== items.length) return false;
  const expectedIds = new Set(items.map((item) => item.knowledge_id));
  for (const entry of index.entries) {
    if (!expectedIds.delete(entry.knowledge_id)) return false;
    if (!Array.isArray(entry.vector) || entry.vector.length !== index.dimensions) return false;
    if (!entry.vector.every(Number.isFinite)) return false;
  }
  return expectedIds.size === 0;
}

async function readCompatibleIndex({
  filePath,
  release,
  knowledgeType,
  items,
  knowledgeSha256,
  provider,
  embeddingModel,
}) {
  try {
    const bytes = await readFile(filePath);
    const index = JSON.parse(bytes.toString("utf8"));
    if (
      !validateIndex(
        index,
        release,
        knowledgeType,
        items,
        knowledgeSha256,
        provider,
        embeddingModel,
      )
    ) {
      return null;
    }
    return { index, indexSha256: sha256(bytes), rebuilt: false };
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

export async function buildTypedEmbeddingIndex({
  release,
  knowledgeType,
  items,
  knowledgeSha256,
  provider,
  runtimeConfig,
  filePath,
}) {
  const entries = [];
  const batchSize = runtimeConfig.retrieval.embedding_batch_size;
  for (let offset = 0; offset < items.length; offset += batchSize) {
    const batch = items.slice(offset, offset + batchSize);
    const embedded = await provider.embed(batch.map((item) => item.retrieval_text));
    if (embedded.vectors.length !== batch.length) {
      throw new Error(
        `Embedding provider returned ${embedded.vectors.length} vectors for ${batch.length} ${knowledgeType} items.`,
      );
    }
    batch.forEach((item, index) => {
      entries.push({ knowledge_id: item.knowledge_id, vector: embedded.vectors[index] });
    });
  }
  const dimensions = entries[0]?.vector.length ?? 0;
  if (dimensions < 1 || entries.some((entry) => entry.vector.length !== dimensions)) {
    throw new Error(`Embedding provider returned inconsistent ${knowledgeType} vector dimensions.`);
  }
  const index = {
    schema_version: indexSchemaVersion,
    created_at: new Date().toISOString(),
    knowledge_release_id: release.manifest.knowledge_release_id,
    knowledge_type: knowledgeType,
    knowledge_sha256: knowledgeSha256,
    provider: provider.name,
    model: runtimeConfig.openai.embeddingModel,
    dimensions,
    entries,
  };
  const serialized = `${JSON.stringify(index, null, 2)}\n`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, serialized, "utf8");
  return { index, indexSha256: sha256(serialized), rebuilt: true };
}

export async function ensureTypedEmbeddingIndexes(
  release,
  provider,
  runtimeConfig,
  { indexRoot = null } = {},
) {
  const results = {};
  for (const [knowledgeType, collectionKey, fileName] of indexedCollections) {
    const items = release[collectionKey];
    const knowledgeSha256 = release.fileHashes[knowledgeType];
    const filePath = indexPathFor(release, fileName, indexRoot);
    results[knowledgeType] =
      (await readCompatibleIndex({
        filePath,
        release,
        knowledgeType,
        items,
        knowledgeSha256,
        provider,
        embeddingModel: runtimeConfig.openai.embeddingModel,
      })) ??
      (await buildTypedEmbeddingIndex({
        release,
        knowledgeType,
        items,
        knowledgeSha256,
        provider,
        runtimeConfig,
        filePath,
      }));
  }
  return Object.freeze(results);
}

export function getTypedIndexTraces(indexes) {
  return indexedCollections.map(([knowledgeType]) => {
    const result = indexes[knowledgeType];
    return {
      schema_version: result.index.schema_version,
      knowledge_type: knowledgeType,
      provider: result.index.provider,
      model: result.index.model,
      dimensions: result.index.dimensions,
      knowledge_sha256: result.index.knowledge_sha256,
      index_sha256: result.indexSha256,
    };
  });
}

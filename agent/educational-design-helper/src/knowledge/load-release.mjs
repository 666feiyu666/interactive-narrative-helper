import { readFile } from "node:fs/promises";
import path from "node:path";

import { assertSchema } from "../validation/public-schemas.mjs";
import { sha256 } from "../utils/hash.mjs";

const collectionDefinitions = [
  ["domain_synthesis", "domain_synthesis", "domainSynthesis"],
  ["cross_case_patterns", "cross_case_pattern", "crossCasePatterns"],
  ["design_cards", "case_design_card", "designCards"],
];

function parseNdjson(bytes, label) {
  return bytes
    .toString("utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON in ${label} line ${index + 1}: ${error.message}`);
      }
    });
}

export async function loadKnowledgeRelease(validators, profile) {
  if (profile.knowledgeKind !== "release") {
    throw new Error(`Output ${profile.outputVersion} does not use a formal knowledge release.`);
  }
  const manifestPath = path.join(profile.knowledgeDirectory, "manifest.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assertSchema("Knowledge release manifest", validators.knowledgeRelease(manifest));
  if (manifest.knowledge_release_id !== profile.knowledgeId) {
    throw new Error(
      `Knowledge release mismatch: expected ${profile.knowledgeId}, got ${manifest.knowledge_release_id}.`,
    );
  }
  if (manifest.model_facing !== true) {
    throw new Error(`Knowledge release ${manifest.knowledge_release_id} is not model-facing.`);
  }

  const collections = {};
  const fileHashes = {};
  const byId = new Map();
  const aggregateParts = [];
  for (const [manifestKey, expectedType, collectionKey] of collectionDefinitions) {
    const record = manifest.files[manifestKey];
    const bytes = await readFile(path.join(profile.knowledgeDirectory, record.path));
    const actualHash = sha256(bytes);
    if (actualHash !== record.sha256) {
      throw new Error(
        `${manifestKey} hash mismatch: expected ${record.sha256}, got ${actualHash}.`,
      );
    }
    const items = parseNdjson(bytes, record.path);
    if (items.length !== record.count) {
      throw new Error(`${manifestKey} count mismatch: expected ${record.count}, got ${items.length}.`);
    }
    for (const item of items) {
      assertSchema(`Knowledge item ${item.knowledge_id ?? "unknown"}`, validators.knowledgeItem(item));
      if (item.knowledge_type !== expectedType) {
        throw new Error(
          `Knowledge item ${item.knowledge_id} has type ${item.knowledge_type}, expected ${expectedType}.`,
        );
      }
      if (item.model_facing !== true) {
        throw new Error(`Knowledge item ${item.knowledge_id} is not model-facing.`);
      }
      if (byId.has(item.knowledge_id)) {
        throw new Error(`Duplicate knowledge item ID ${item.knowledge_id}.`);
      }
      byId.set(item.knowledge_id, item);
    }
    collections[collectionKey] = items;
    fileHashes[expectedType] = actualHash;
    aggregateParts.push(bytes);
  }
  const aggregateHash = sha256(Buffer.concat(aggregateParts));
  if (aggregateHash !== manifest.model_facing_sha256) {
    throw new Error(
      `Knowledge release aggregate hash mismatch: expected ${manifest.model_facing_sha256}, got ${aggregateHash}.`,
    );
  }
  if (byId.size !== manifest.counts.total) {
    throw new Error(`Knowledge release total mismatch: expected ${manifest.counts.total}, got ${byId.size}.`);
  }

  return Object.freeze({
    manifest,
    manifestSha256: sha256(manifestBytes),
    fileHashes: Object.freeze(fileHashes),
    domainSynthesis: Object.freeze(collections.domainSynthesis),
    crossCasePatterns: Object.freeze(collections.crossCasePatterns),
    designCards: Object.freeze(collections.designCards),
    byId,
  });
}

import { readFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { assertSchema } from "../validation/public-schemas.mjs";
import { sha256 } from "../utils/hash.mjs";

const collectionDefinitions = [
  ["domain_summaries", "domain_synthesis", "domainSynthesis"],
  ["pattern_examples", "cross_case_pattern", "crossCasePatterns"],
  ["case_examples", "case_design_card", "designCards"],
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

export async function loadDemoData(validators) {
  const manifestPath = path.join(paths.demoDataDirectory, "manifest.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assertSchema("Demo data manifest", validators.demoData(manifest));

  const collections = {};
  const fileHashes = {};
  const byId = new Map();
  const aggregateParts = [];
  for (const [manifestKey, expectedType, collectionKey] of collectionDefinitions) {
    const record = manifest.files[manifestKey];
    const bytes = await readFile(path.join(paths.demoDataDirectory, record.path));
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
      assertSchema(`Demo item ${item.knowledge_id ?? "unknown"}`, validators.demoItem(item));
      if (item.knowledge_type !== expectedType) {
        throw new Error(
          `Knowledge item ${item.knowledge_id} has type ${item.knowledge_type}, expected ${expectedType}.`,
        );
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
  if (aggregateHash !== manifest.aggregate_sha256) {
    throw new Error(
      `Demo data aggregate hash mismatch: expected ${manifest.aggregate_sha256}, got ${aggregateHash}.`,
    );
  }

  return Object.freeze({
    manifest,
    manifestSha256: sha256(manifestBytes),
    dataSha256: aggregateHash,
    fileHashes: Object.freeze(fileHashes),
    domainSynthesis: Object.freeze(collections.domainSynthesis),
    crossCasePatterns: Object.freeze(collections.crossCasePatterns),
    designCards: Object.freeze(collections.designCards),
    byId,
  });
}

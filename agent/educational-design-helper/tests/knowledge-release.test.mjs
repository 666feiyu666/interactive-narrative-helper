import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildKnowledgeRelease,
  KNOWLEDGE_RELEASE_ID,
} from "../../../tools/knowledge/build-track-a-educational-design-knowledge-v1.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const releaseDirectory = path.join(
  repositoryRoot,
  "corpus",
  "derived-knowledge",
  KNOWLEDGE_RELEASE_ID,
);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readNdjson(filePath) {
  return (await readFile(filePath, "utf8"))
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

test("formal Track A knowledge release retains all source cards and minimum-support patterns", async () => {
  const manifest = JSON.parse(await readFile(path.join(releaseDirectory, "manifest.json"), "utf8"));
  assert.equal(manifest.knowledge_release_id, KNOWLEDGE_RELEASE_ID);
  assert.equal(manifest.source.source_design_card_count, 122);
  assert.equal(manifest.counts.domain_synthesis, 6);
  assert.equal(manifest.counts.design_cards, 122);

  const collections = {};
  for (const [key, file] of Object.entries(manifest.files)) {
    const bytes = await readFile(path.join(releaseDirectory, file.path));
    assert.equal(sha256(bytes), file.sha256);
    collections[key] = bytes
      .toString("utf8")
      .split(/\r?\n/u)
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
    assert.equal(collections[key].length, file.count);
  }

  assert.equal(collections.design_cards.length, 122);
  assert(collections.cross_case_patterns.length > 0);
  assert(collections.cross_case_patterns.every((pattern) => pattern.support_n >= 2));
  assert(
    collections.cross_case_patterns.every(
      (pattern) => pattern.support_n === pattern.supporting_case_ids.length,
    ),
  );
  assert.equal(
    new Set(collections.design_cards.map((card) => card.knowledge_id)).size,
    collections.design_cards.length,
  );

  const designCardIds = new Set(collections.design_cards.map((card) => card.knowledge_id));
  const patternIds = new Set(collections.cross_case_patterns.map((pattern) => pattern.knowledge_id));
  for (const synthesis of collections.domain_synthesis) {
    assert.equal(
      synthesis.eligible_n + synthesis.not_stated_n + synthesis.uncertain_n,
      synthesis.total_n,
    );
    assert.equal(
      Object.values(synthesis.status_counts).reduce((sum, count) => sum + count, 0),
      synthesis.total_n,
    );
    assert(synthesis.related_pattern_ids.every((id) => patternIds.has(id)));
    assert(synthesis.related_design_card_ids.every((id) => designCardIds.has(id)));
  }
  for (const pattern of collections.cross_case_patterns) {
    assert.equal(pattern.eligible_n + pattern.not_stated_n + pattern.uncertain_n, pattern.total_n);
    assert(pattern.support_n <= pattern.eligible_n);
    assert.equal(pattern.source_ids.length, pattern.support_n);
    assert.equal(pattern.supporting_case_ids.length, pattern.support_n);
    assert.deepEqual(pattern.related_design_card_ids, pattern.supporting_case_ids);
    assert(pattern.supporting_case_ids.every((id) => designCardIds.has(id)));
  }

  const serialized = JSON.stringify(collections);
  for (const forbidden of [
    "description_clean",
    "evidence_excerpt",
    "source_url",
    "record_path",
    "description_path",
    "corpus/restricted-sources",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `Found forbidden field ${forbidden}`);
  }
});

test("formal knowledge builder is deterministic and refuses divergent replacement", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "track-a-knowledge-v1-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const outputDirectory = path.join(temporaryRoot, KNOWLEDGE_RELEASE_ID);

  const first = await buildKnowledgeRelease({ outputDirectory });
  const second = await buildKnowledgeRelease({ outputDirectory });
  assert.equal(first.unchanged, false);
  assert.equal(second.unchanged, true);
  assert.equal(first.manifest.model_facing_sha256, second.manifest.model_facing_sha256);

  const generatedCards = await readNdjson(path.join(outputDirectory, "design-cards.ndjson"));
  const canonicalCards = await readNdjson(path.join(releaseDirectory, "design-cards.ndjson"));
  assert.deepEqual(generatedCards, canonicalCards);
});

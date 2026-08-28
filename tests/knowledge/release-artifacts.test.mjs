import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateFixture } from "../helpers/schema-fixture-validator.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const releases = [
  {
    label: "v1.0 strict release",
    annotationId: "track-a-itchio-v1.0",
    snapshotId: "track-a-itchio-v1.0-knowledge-v1",
    expectedCards: 2,
  },
  {
    label: "v1.1 scoped substantive-OR release",
    annotationId: "track-a-itchio-v1.1",
    snapshotId: "track-a-itchio-v1.1-knowledge-v1",
    expectedCards: 122,
  },
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const parseNdjson = (value) => value.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(repositoryRoot, relativePath), "utf8"));

const schemas = async () => ({
  manifest: await readJson("corpus/schemas/knowledge-snapshot.schema.json"),
  screening: await readJson("corpus/schemas/screening-decision.schema.json"),
  annotation: await readJson("corpus/schemas/coding-annotation.schema.json"),
  card: await readJson("corpus/schemas/knowledge-card.schema.json"),
});

for (const release of releases) {
  test(`${release.label} is internally consistent and schema-valid`, async () => {
    const annotationDirectory = path.join(repositoryRoot, "corpus", "annotations", release.annotationId);
    const snapshotDirectory = path.join(repositoryRoot, "corpus", "derived-knowledge", release.snapshotId);
    const manifest = JSON.parse(await readFile(path.join(snapshotDirectory, "manifest.json"), "utf8"));
    const screeningText = await readFile(path.join(annotationDirectory, "screening-decisions.ndjson"), "utf8");
    const annotationText = await readFile(path.join(annotationDirectory, "coding-annotations.ndjson"), "utf8");
    const cardText = await readFile(path.join(snapshotDirectory, "knowledge-cards.ndjson"), "utf8");
    const screening = parseNdjson(screeningText);
    const annotations = parseNdjson(annotationText);
    const cards = parseNdjson(cardText);
    const schema = await schemas();

    assert.deepEqual(validateFixture(schema.manifest, manifest), []);
    for (const item of screening) assert.deepEqual(validateFixture(schema.screening, item), []);
    for (const item of annotations) assert.deepEqual(validateFixture(schema.annotation, item), []);
    for (const item of cards) assert.deepEqual(validateFixture(schema.card, item), []);

    assert.equal(screening.length, 606);
    assert.equal(annotations.length, manifest.counts.included);
    assert.equal(cards.length, release.expectedCards);
    assert.equal(cards.length, manifest.counts.knowledge_cards);
    assert.equal(manifest.counts.included + manifest.counts.excluded + manifest.counts.uncertain, 606);
    assert.equal(
      manifest.counts.tier_a + manifest.counts.tier_b + (manifest.counts.tier_c ?? 0),
      cards.length,
    );
    assert.equal(sha256(screeningText), manifest.files.screening_decisions_sha256);
    assert.equal(sha256(annotationText), manifest.files.coding_annotations_sha256);
    assert.equal(sha256(cardText), manifest.files.knowledge_cards_sha256);

    const includedIds = screening.filter((item) => item.review_status === "included").map((item) => item.project_id).sort();
    const annotationProjectIds = annotations.map((item) => item.project_id).sort();
    const cardSourceIds = cards.flatMap((item) => item.source_ids).sort();
    assert.deepEqual(annotationProjectIds, includedIds);
    assert.deepEqual(cardSourceIds, includedIds);
    assert(annotations.every((item) => item.evidence.source_word_count <= 24));

    if (release.snapshotId.includes("v1.1")) {
      assert.equal(manifest.inclusion_policy, "scoped-substantive-or/v1");
      assert.equal(manifest.counts.complete_core, 2);
      assert.equal(manifest.counts.partial_substantive, 120);
      assert.equal(manifest.counts.tier_c, 120);
      assert.equal(cards.filter((card) => card.coverage_profile === "complete_core").length, 2);
      assert.equal(cards.filter((card) => card.coverage_profile === "partial_substantive").length, 120);
      assert.equal(cards.filter((card) => card.if_mechanics.length === 0).length, 23);
      assert(cards.every((card) => card.interactive_narrative_form.status === "explicit"));
      assert(cards.every((card) => [
        card.educational_purpose.status,
        card.intended_audience.status,
        card.application_setting.status,
        card.interaction_education_relationship.status,
      ].some((status) => status === "explicit" || status === "normalized")));
    }
  });

  test(`${release.label} contains normalized knowledge but no source excerpts, URLs, or local paths`, async () => {
    const cardPath = path.join(
      repositoryRoot,
      "corpus",
      "derived-knowledge",
      release.snapshotId,
      "knowledge-cards.ndjson",
    );
    const cardText = await readFile(cardPath, "utf8");
    for (const forbidden of [
      "description_clean",
      "evidence_excerpt",
      "minimal_excerpt",
      "source_url",
      "record_path",
      "description_path",
      "restricted-sources",
      "https://",
    ]) {
      assert(!cardText.includes(forbidden), `knowledge-cards.ndjson contains forbidden material: ${forbidden}`);
    }
  });
}


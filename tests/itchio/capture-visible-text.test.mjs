import test from "node:test";
import assert from "node:assert/strict";

import {
  ACQUISITION_METHOD,
  IMPLEMENTATION_VERSION,
  MANIFEST_SCHEMA_VERSION,
  PAGE_STRUCTURE_SCHEMA_VERSION,
  SCHEMA_VERSION,
  isAccessChallenge,
  normalizeProjectUrl,
  selectProjects,
  validatePageStructure,
} from "../../tools/itchio/capture-visible-text.mjs";

test("normalizes a public project URL without retaining query data", () => {
  assert.equal(
    normalizeProjectUrl("https://winspirationkids.itch.io/bully-busters/?source=test#section"),
    "https://winspirationkids.itch.io/bully-busters",
  );
});

test("rejects listing, download, nested, and external URLs as projects", () => {
  for (const url of [
    "https://itch.io/games/tag-educational",
    "https://example.com/game",
    "https://creator.itch.io/game/download/file.zip",
    "https://creator.itch.io/game/comments",
  ]) {
    assert.throws(() => normalizeProjectUrl(url), /Not a public itch\.io project URL/);
  }
});

test("detects challenge text without classifying ordinary project text", () => {
  assert.equal(isAccessChallenge("Just a moment...", "Checking your browser"), true);
  assert.equal(isAccessChallenge("Bully Busters", "An interactive story for children"), false);
});

test("a limited run is a slice of the same full manifest", () => {
  const manifest = {
    schema_version: MANIFEST_SCHEMA_VERSION,
    projects: Array.from({ length: 606 }, (_, index) => ({ id: index + 1 })),
  };
  assert.deepEqual(selectProjects(manifest, 10), manifest.projects.slice(0, 10));
  assert.deepEqual(
    selectProjects(manifest, 10, 46),
    manifest.projects.slice(45, 55),
  );
  assert.equal(selectProjects(manifest).length, 606);
});

test("rejects invalid limits", () => {
  const manifest = { projects: [{ id: 1 }] };
  assert.throws(() => selectProjects(manifest, 0), /positive integer/);
  assert.throws(() => selectProjects(manifest, 1.5), /positive integer/);
  assert.throws(() => selectProjects(manifest, 1, "missing"), /not in the manifest/);
});

test("accepts a generic page structure without requiring fixed metadata fields", () => {
  const structure = {
    schema_version: PAGE_STRUCTURE_SCHEMA_VERSION,
    document: {
      title: "Synthetic project",
      final_url: "https://creator.itch.io/project",
    },
    meta: [],
    structured_data: [],
    headings: [{ level: 1, text: "Synthetic project" }],
    breadcrumbs: [{ text: "Educational", href: "https://itch.io/games/tag-educational" }],
    tables: [{ rows: [{ label: "Genre", value: "Educational" }] }],
    links: [],
    media_references: [],
  };
  assert.equal(validatePageStructure(structure), structure);
  assert.equal(IMPLEMENTATION_VERSION, "1.0.0");
  assert.equal(MANIFEST_SCHEMA_VERSION, "itchio-public-text/v1.0");
  assert.equal(SCHEMA_VERSION, "itchio-public-page-capture/v1.0");
  assert.equal(ACQUISITION_METHOD, "rendered-browser-page-bundle/v1.0");
});

test("rejects incomplete page structure", () => {
  assert.throws(
    () => validatePageStructure({ schema_version: PAGE_STRUCTURE_SCHEMA_VERSION }),
    /identify its rendered document/,
  );
});

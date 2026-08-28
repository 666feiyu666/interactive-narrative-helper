import test from "node:test";
import assert from "node:assert/strict";

import { auditCodedCase, codeCase } from "../../tools/knowledge/coding-rules.mjs";

function record(overrides = {}) {
  return {
    project_id: "itchio-9999",
    title: "Synthetic fixture",
    url: "https://example.itch.io/synthetic-fixture",
    description_clean: [
      "This interactive fiction teaches students about climate change through meaningful choices and consequences.",
      "It is designed for students and for use in classrooms.",
    ].join(" "),
    genres_raw: "Educational | Interactive Fiction",
    tags_raw: "Meaningful Choices | Multiple Endings",
    languages_raw: "English",
    quality_status: "ok",
    ...overrides,
  };
}

test("strict English case with explicit purpose, audience, setting, and form is included", () => {
  const coded = codeCase(record());
  assert.equal(coded.review_status, "included");
  assert.equal(coded.quality_tier, "A");
  assert.deepEqual(auditCodedCase(coded), {
    passed: true,
    failures: [],
    review_status: "reviewed",
  });
});

test("a creator production course is not an application setting", () => {
  const coded = codeCase(record({
    description_clean: [
      "This interactive fiction teaches students about climate change.",
      "It is designed for students and was created for my university course.",
    ].join(" "),
  }));
  assert.notEqual(coded.review_status, "included");
  assert.deepEqual(coded.labels.application_setting, []);
});

test("characters are not silently treated as the intended audience", () => {
  const coded = codeCase(record({
    description_clean: [
      "This interactive fiction teaches empathy through meaningful choices.",
      "It follows children and parents and is designed for use in classrooms.",
    ].join(" "),
  }));
  assert.notEqual(coded.review_status, "included");
  assert.deepEqual(coded.labels.intended_audience, []);
});

test("explicit non-English metadata prevents English inclusion", () => {
  const coded = codeCase(record({ languages_raw: "French" }));
  assert.equal(coded.review_status, "excluded");
  assert(coded.exclusion_reasons.includes("not_english"));
});

test("minimal evidence remains within the 24-source-word boundary", () => {
  const coded = codeCase(record());
  const sourceWords = coded.evidence_excerpt
    .replace(/\b(?:purpose|audience|setting|form):/gi, "")
    .replace(/\|/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  assert(sourceWords.length <= 24);
});

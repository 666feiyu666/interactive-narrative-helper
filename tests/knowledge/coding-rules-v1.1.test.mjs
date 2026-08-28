import test from "node:test";
import assert from "node:assert/strict";

import { auditCodedCase, codeCase } from "../../tools/knowledge/coding-rules-v1.1.mjs";

function record(overrides = {}) {
  return {
    project_id: "itchio-9999",
    title: "Synthetic fixture",
    url: "https://example.itch.io/synthetic-fixture",
    description_clean: "This interactive fiction teaches climate science through meaningful choices.",
    genres_raw: "Educational | Interactive Fiction",
    tags_raw: "Meaningful Choices",
    languages_raw: "English",
    quality_status: "ok",
    ...overrides,
  };
}

test("v1.1 includes a scoped record when any substantive dimension is supported", () => {
  const coded = codeCase(record());
  assert.equal(coded.review_status, "included");
  assert.equal(coded.coverage_profile, "partial_substantive");
  assert.equal(coded.quality_tier, "C");
  assert.deepEqual(coded.labels.intended_audience, []);
  assert.deepEqual(coded.labels.application_setting, []);
  assert.deepEqual(auditCodedCase(coded), {
    passed: true,
    failures: [],
    review_status: "reviewed",
  });
});

test("v1.1 excludes form-only records from the model-facing pool", () => {
  const coded = codeCase(record({
    description_clean: "An interactive fiction about wandering through a strange city.",
    tags_raw: "Interactive Fiction",
  }));
  assert.equal(coded.review_status, "excluded");
  assert.equal(coded.coverage_profile, "form_only");
  assert(coded.exclusion_reasons.includes("no_substantive_knowledge_dimension"));
});

test("v1.1 can include an explicit interaction-education relationship as the substantive field", () => {
  const coded = codeCase(record({
    description_clean: "An interactive fiction that invites reflection on choices and consequences.",
    tags_raw: "Choices",
  }));
  assert.equal(coded.review_status, "included");
  assert.equal(coded.information_coverage.educational_purpose, "not_stated");
  assert.equal(coded.information_coverage.interaction_education_relationship, "explicit");
  assert.equal(coded.quality_tier, "C");
});

test("v1.1 preserves the complete-core A and B definitions", () => {
  const complete = codeCase(record({
    description_clean: [
      "This interactive fiction teaches students about climate science.",
      "It is designed for students and for use in classrooms.",
    ].join(" "),
    tags_raw: "Interactive Fiction",
  }));
  assert.equal(complete.review_status, "included");
  assert.equal(complete.coverage_profile, "complete_core");
  assert.equal(complete.quality_tier, "B");
});

test("v1.1 does not require a named mechanic when form and substantive knowledge exist", () => {
  const coded = codeCase(record({
    description_clean: "This interactive fiction teaches climate science.",
    tags_raw: "Interactive Fiction",
  }));
  assert.equal(coded.review_status, "included");
  assert.deepEqual(coded.labels.if_mechanics, []);
  assert.equal(auditCodedCase(coded).passed, true);
});


const allowedKeys = new Set([
  "knowledge_id",
  "knowledge_type",
  "quality_tier",
  "coverage_profile",
  "educational_purpose",
  "intended_audience",
  "application_setting",
  "interactive_narrative_form",
  "interaction_education_relationship",
  "if_mechanics",
  "design_pattern",
  "applicability_conditions",
  "transferable_design_questions",
  "limitations",
  "confidence",
]);

const forbiddenFragments = [
  "excerpt",
  "verbatim",
  "source_url",
  "record_path",
  "description_path",
  "restricted",
  "local_path",
  "html",
];

function assertNoForbiddenKeys(value, location = "knowledge") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (forbiddenFragments.some((fragment) => normalized.includes(fragment))) {
      throw new Error(`Forbidden provider field ${location}.${key}`);
    }
    assertNoForbiddenKeys(child, `${location}.${key}`);
  }
}

export function toModelFacingKnowledge(card) {
  if (card.model_facing !== true) {
    throw new Error(`Knowledge Card ${card.knowledge_id ?? "unknown"} is not model-facing.`);
  }

  const serialized = Object.fromEntries(
    Object.entries(card).filter(([key]) => allowedKeys.has(key)),
  );
  assertNoForbiddenKeys(serialized);
  return structuredClone(serialized);
}

export function assertProviderPayloadSafe(payload) {
  assertNoForbiddenKeys(payload, "provider_payload");
}

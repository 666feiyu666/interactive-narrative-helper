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
  "public_url",
  "display_title",
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

export function toModelFacingKnowledgeItem(item) {
  if (item.model_facing !== true) {
    throw new Error(`Knowledge item ${item.knowledge_id ?? "unknown"} is not model-facing.`);
  }
  let serialized;
  if (item.knowledge_type === "domain_synthesis") {
    serialized = {
      knowledge_id: item.knowledge_id,
      knowledge_type: item.knowledge_type,
      dimension: item.dimension,
      available_labels: item.label_counts.map(({ label }) => label),
    };
  } else if (item.knowledge_type === "cross_case_pattern") {
    serialized = {
      knowledge_id: item.knowledge_id,
      knowledge_type: item.knowledge_type,
      pattern_kind: item.pattern_kind,
      labels: item.labels,
    };
  } else if (item.knowledge_type === "case_design_card") {
    serialized = {
      knowledge_id: item.knowledge_id,
      knowledge_type: item.knowledge_type,
      educational_purpose: item.educational_purpose,
      intended_audience: item.intended_audience,
      application_setting: item.application_setting,
      interactive_narrative_form: item.interactive_narrative_form,
      if_mechanics: item.if_mechanics,
      interaction_education_relationship: item.interaction_education_relationship,
      design_pattern: item.design_pattern,
      applicability_conditions: item.applicability_conditions,
      transferable_design_questions: item.transferable_design_questions,
    };
  } else {
    throw new Error(`Unsupported Track A knowledge type ${item.knowledge_type}.`);
  }
  assertNoForbiddenKeys(serialized);
  return structuredClone(serialized);
}

export function assertProviderPayloadSafe(payload) {
  assertNoForbiddenKeys(payload, "provider_payload");
}

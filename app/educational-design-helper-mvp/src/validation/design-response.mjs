const bannedPublicLanguage = [
  /当前知识/iu,
  /现有知识/iu,
  /当前案例能够支持/iu,
  /没有直接证明/iu,
  /证据有限/iu,
  /待作者评审的迁移/iu,
  /不是成熟模式/iu,
  /已经验证的效果/iu,
  /领域综合知识/iu,
  /跨案例模式知识/iu,
  /设计卡片/iu,
  /\b(?:retrieval|confidence|coverage|corpus|validation|evidence status|Tier)\b/iu,
  /检索(?:结果|分数|记录)/iu,
  /置信度|覆盖概况|语料库|证据边界|统计显著性/iu,
];

function generatedText(response) {
  if (!response || typeof response !== "object") return "";
  const parts = [
    response.diagnosis?.concept_summary,
    ...(response.diagnosis?.confirmed_elements ?? []),
    ...(response.diagnosis?.design_decisions ?? []).flatMap((decision) => [
      decision.decision,
      decision.why_it_matters,
      ...(decision.options ?? []),
    ]),
    ...(response.directions ?? []).flatMap((direction) => [
      direction.title,
      direction.best_fit,
      direction.design_goal,
      direction.core_interaction,
      direction.system_role,
      direction.key_tradeoff,
      direction.prototype_step,
    ]),
    ...(response.reference_selections ?? []).flatMap((selection) => [
      selection.why_relevant,
      selection.inspect_for,
    ]),
    response.recommended_next_step,
    response.follow_up_question,
  ];
  return parts.filter((value) => typeof value === "string").join("\n");
}

function hasPositiveLearningEffectClaim(text) {
  const withoutNegatedBoundaries = text.replace(
    /(?:不|未|没有|不能|无法|并非|不等于).{0,16}(?:证明|验证|证实).{0,16}(?:学习效果|学习成果|学习成效|成绩)/giu,
    "",
  );
  return (
    /(?:证明|验证|证实)(?:了|出|可)?[^。；\n]{0,16}(?:学习效果|学习成果|学习成效)/iu.test(
      withoutNegatedBoundaries,
    ) ||
    /(?:能够|可以|将会|会|有效地?|显著地?|保证)[^。；\n]{0,18}(?:提升|提高|改善|促进)[^。；\n]{0,12}(?:学习效果|学习成果|学习成效|成绩)/iu.test(
      withoutNegatedBoundaries,
    )
  );
}

function bigrams(value) {
  const normalized = String(value ?? "").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
  if (normalized.length < 2) return new Set(normalized ? [normalized] : []);
  return new Set(Array.from({ length: normalized.length - 1 }, (_, index) => normalized.slice(index, index + 2)));
}

function jaccard(left, right) {
  const leftSet = bigrams(left);
  const rightSet = bigrams(right);
  const union = new Set([...leftSet, ...rightSet]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const token of leftSet) if (rightSet.has(token)) intersection += 1;
  return intersection / union.size;
}

function directionSignature(direction) {
  return [
    direction?.title,
    direction?.best_fit,
    direction?.design_goal,
    direction?.core_interaction,
    direction?.system_role,
  ].join(" ");
}

function distinctDirectionCount(directions) {
  const accepted = [];
  for (const direction of directions) {
    const signature = directionSignature(direction);
    if (accepted.every((prior) => jaccard(signature, prior) < 0.82)) accepted.push(signature);
  }
  return accepted.length;
}

export function validateDesignResponse({
  response,
  request,
  retrieved,
  sentKnowledgeIds,
  referenceCatalog,
  validators,
}) {
  const errors = [...validators.response(response)];
  if (response?.request_id !== request.request_id) {
    errors.push("/request_id does not match the server-generated request ID");
  }
  const decisions = response?.diagnosis?.design_decisions ?? [];
  const directions = response?.directions ?? [];
  const selections = response?.reference_selections ?? [];
  const references = response?.references ?? [];
  const directionIds = directions.map((direction) => direction.direction_id);
  const expectedDirectionIds = ["direction_1", "direction_2", "direction_3"];
  if (
    directionIds.length !== expectedDirectionIds.length ||
    !expectedDirectionIds.every((directionId) => directionIds.includes(directionId))
  ) {
    errors.push("/directions must contain direction_1, direction_2, and direction_3 exactly once");
  }
  const distinctCount = distinctDirectionCount(directions);
  if (distinctCount !== 3) {
    errors.push("/directions must describe three materially distinct design directions");
  }

  const sent = new Set(sentKnowledgeIds);
  const retrievedCardIds = new Set(retrieved.designCards.map((result) => result.knowledge_id));
  const selectionIds = selections.map((selection) => selection.knowledge_id);
  if (new Set(selectionIds).size !== selectionIds.length) {
    errors.push("/reference_selections must not select the same case twice");
  }
  for (const selection of selections) {
    if (!sent.has(selection.knowledge_id) || !retrievedCardIds.has(selection.knowledge_id)) {
      errors.push(`/reference_selections uses unsupplied case ${selection.knowledge_id}`);
    }
    for (const directionId of selection.direction_ids ?? []) {
      if (!directionIds.includes(directionId)) {
        errors.push(`/reference_selections uses unknown direction ${directionId}`);
      }
    }
    if (!referenceCatalog.byId.has(selection.knowledge_id)) {
      errors.push(`/reference_selections cannot resolve ${selection.knowledge_id} locally`);
    }
  }

  if (references.length !== selections.length) {
    errors.push("/references must resolve every selected case exactly once");
  }
  references.forEach((reference, index) => {
    const selection = selections[index];
    const canonical = referenceCatalog.byId.get(reference.knowledge_id);
    if (!selection || reference.knowledge_id !== selection.knowledge_id) {
      errors.push(`/references/${index} does not match its selection`);
    }
    if (
      !canonical ||
      reference.public_url !== canonical.public_url ||
      reference.display_title !== canonical.display_title ||
      reference.project_id !== canonical.project_id
    ) {
      errors.push(`/references/${index} is not the canonical local reference`);
    }
  });

  const text = generatedText(response);
  const bodyCharacterCount = Array.from(text.replace(/\s/gu, "")).length;
  if (bodyCharacterCount < 650 || bodyCharacterCount > 1800) {
    errors.push(
      `/response generated content must contain 650–1800 non-whitespace characters; got ${bodyCharacterCount}`,
    );
  }
  const internalLanguageAbsent = bannedPublicLanguage.every((pattern) => !pattern.test(text));
  if (!internalLanguageAbsent) {
    errors.push("/response exposes internal evidence-management or knowledge-reporting language");
  }
  if (hasPositiveLearningEffectClaim(text)) {
    errors.push("/response makes an unsupported positive learning-effectiveness claim");
  }
  if (/https?:\/\//iu.test(text)) {
    errors.push("/response generated fields must not contain URLs");
  }
  for (const knowledgeId of sent) {
    if (text.includes(knowledgeId)) {
      errors.push(`/response exposes knowledge ID ${knowledgeId} outside the reference field`);
    }
  }

  return {
    errors: [...new Set(errors)],
    metrics: {
      body_character_count: bodyCharacterCount,
      design_decision_count: decisions.length,
      direction_count: directions.length,
      distinct_direction_count: distinctCount,
      reference_selection_count: selections.length,
      internal_language_absent: internalLanguageAbsent,
    },
  };
}

export const designResponseValidation = Object.freeze({
  bannedPublicLanguage,
  generatedText,
  hasPositiveLearningEffectClaim,
});

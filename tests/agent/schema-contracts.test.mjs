import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateFixture } from "../helpers/schema-fixture-validator.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, relativePath), "utf8"));
}

const schemas = {
  screening: "corpus/schemas/screening-decision.schema.json",
  annotation: "corpus/schemas/coding-annotation.schema.json",
  knowledge: "corpus/schemas/knowledge-card.schema.json",
  snapshot: "corpus/schemas/knowledge-snapshot.schema.json",
  request: "agent/educational-design-helper/schemas/design-request.schema.json",
  requestV2: "agent/educational-design-helper/schemas/design-request-v2.schema.json",
  response: "agent/educational-design-helper/schemas/design-response.schema.json",
  responseV2: "agent/educational-design-helper/schemas/design-response-v2.schema.json",
  trace: "agent/educational-design-helper/schemas/run-trace.schema.json",
  traceV2: "agent/educational-design-helper/schemas/run-trace-v2.schema.json",
  case: "agent/narrative-technique-design-partner/techniques/counterfactual/schemas/counterfactual-case.schema.json",
};

const dimension = (status, labels, summary) => ({ status, labels, summary });
const designDimension = (value, basis) => ({ value, basis });

const fixtures = {
  screening: {
    schema_version: "screening-decision/v1",
    project_id: "itchio-0125",
    review_status: "included",
    language: { value: "en", method: "combined", reviewed: true },
    information_coverage: {
      educational_purpose: "explicit",
      intended_audience: "explicit",
      application_setting: "not_stated",
      interactive_narrative_form: "explicit",
      interaction_education_relationship: "interpreted",
    },
    quality_tier: "B",
    exclusion_reasons: [],
    reviewer_id: "reviewer-1",
    reviewed_at: "2026-08-28T12:00:00Z",
    review_notes: "Fixture only; contains no source text.",
  },
  annotation: {
    schema_version: "coding-annotation/v1",
    annotation_id: "ann-itchio-0125-v1",
    project_id: "itchio-0125",
    coding_rules_version: "itchio-track-a-coding-rules/v1.0",
    coder_id: "track-a-local-rules-v1",
    reviewer_id: "track-a-rule-audit-v1",
    review_status: "reviewed",
    coded_at: "2026-08-28T12:00:00Z",
    reviewed_at: "2026-08-28T12:00:00Z",
    evidence: {
      workbook_reference: "cases!E126",
      source_url: "https://example.itch.io/example",
      source_fields: ["description_clean", "genres_raw", "tags_raw"],
      minimal_excerpt: "purpose: teaches history | audience: designed for students | setting: used in classrooms",
      source_word_count: 9,
    },
    educational_purpose: dimension("explicit", ["history_and_cultural_learning"], "Educational purpose: history and cultural learning."),
    intended_audience: dimension("explicit", ["students"], "Intended audience: students."),
    application_setting: dimension("explicit", ["classroom_or_school"], "Application setting: classroom or school."),
    interactive_narrative_form: dimension("explicit", ["interactive_fiction"], "Interactive narrative form: interactive fiction."),
    if_mechanics: ["choices"],
    interaction_education_relationship: dimension("normalized", ["interaction_and_education_co_described"], "Relationship normalized."),
    limitations: ["Fixture only; learning effectiveness was not tested."],
  },
  knowledge: {
    schema_version: "knowledge-card/v1",
    knowledge_id: "kc-0001",
    knowledge_type: "case_precedent",
    quality_tier: "B",
    source_ids: ["itchio-0125"],
    annotation_ids: ["annotation-0001"],
    educational_purpose: dimension("normalized", ["perspective-taking"], "Compare perspectives."),
    intended_audience: dimension("explicit", ["young-adults"], "Young adult learners."),
    application_setting: dimension("not_stated", [], ""),
    interactive_narrative_form: dimension("explicit", ["choice-based"], "Choice-based narrative."),
    interaction_education_relationship: dimension(
      "normalized",
      ["perspective-comparison"],
      "Choices expose different interpretations.",
    ),
    design_pattern: "Use choices to compare interpretations of the same event.",
    applicability_conditions: ["The design can present more than one viewpoint."],
    transferable_design_questions: ["Which event should be revisited from another viewpoint?"],
    limitations: ["Creator description is not evidence of learning effectiveness."],
    confidence: "medium",
    retrieval_text: "Perspective-taking through choice-based comparison of interpretations.",
    model_facing: true,
  },
  snapshot: {
    schema_version: "knowledge-snapshot/v1",
    snapshot_id: "track-a-itchio-v1.0-knowledge-v1",
    created_at: "2026-08-28T12:00:00Z",
    source: {
      workbook_version: "1.0",
      source_derivation_id: "itchio-page-cleaning-full-001",
      workbook_sha256_before: "a".repeat(64),
      workbook_sha256_after: "b".repeat(64),
    },
    coding_rules_version: "itchio-track-a-coding-rules/v1.0",
    review: {
      method: "deterministic_second_pass_rule_audit",
      human_double_coding_complete: false,
    },
    counts: {
      source_records: 606,
      included: 1,
      excluded: 604,
      uncertain: 1,
      knowledge_cards: 1,
      tier_a: 0,
      tier_b: 1,
    },
    files: {
      knowledge_cards: "knowledge-cards.ndjson",
      knowledge_cards_sha256: "c".repeat(64),
      screening_decisions_sha256: "d".repeat(64),
      coding_annotations_sha256: "e".repeat(64),
    },
    limitations: ["Fixture only."],
    model_facing: true,
  },
  request: {
    schema_version: "educational-design-request/v1",
    request_id: "request-0001",
    raw_question: "How might a diary application develop narrative awareness?",
    educational_intent: ["narrative awareness"],
    target_audience: { status: "not_stated", description: "" },
    application_setting: { status: "stated", description: "personal diary application" },
    preferred_interactions: [],
    constraints: [],
    requested_direction_count: 3,
  },
  requestV2: {
    schema_version: "educational-design-request/v2",
    output_version: "0.2",
    request_id: "request-v2-0001",
    raw_question: "怎样帮助学习者比较同一事件的不同叙述？",
  },
  response: {
    schema_version: "educational-design-response/v1",
    request_id: "request-0001",
    knowledge_snapshot_id: "knowledge-v1",
    evidence_status: "sufficient_analogical",
    evidence_status_basis: {
      assessment_source: "generation_model",
      rationale: "The precedent transfers a related interaction into a new diary context.",
    },
    request_interpretation: "Explore reflective narrative interactions for a diary application.",
    design_directions: [
      {
        direction_id: "direction-1",
        title: "Perspective rewrite",
        concept: "Let the user revisit an entry from another viewpoint.",
        design_dimensions: {
          educational_purpose: designDimension("Narrative awareness", ["user_request"]),
          intended_audience: designDimension("Adult diary writers", ["agent_proposal"]),
          application_setting: designDimension("Personal reflective use", ["user_request"]),
          interactive_narrative_form: designDimension("Perspective-switching diary", ["agent_adaptation"]),
          interaction_education_relationship: designDimension(
            "Rewriting makes narrative framing inspectable.",
            ["knowledge_precedent", "agent_adaptation"],
          ),
        },
        interaction_mechanism: "The user rewrites one event under a selected perspective.",
        educational_relationship: "Contrasting accounts makes narrative framing visible.",
        knowledge_support: [
          {
            knowledge_id: "kc-0001",
            match_kind: "analogical",
            assessment_source: "generation_model",
            use: "Transfers perspective comparison into a diary context.",
          },
        ],
        applicability_conditions: ["The user is willing to revisit an entry."],
        transfer_assumptions: ["A personal diary can support perspective switching."],
        risks: ["A forced alternative viewpoint may feel invalidating."],
      },
    ],
    limitations: ["The supporting case is not a direct diary precedent."],
    follow_up_questions: ["Who is the intended audience?"],
  },
  responseV2: {
    schema_version: "educational-design-response/v2",
    output_version: "0.2",
    request_id: "request-v2-0001",
    diagnosis: {
      concept_summary: "比较同一事件的不同叙述方式。",
      confirmed_elements: ["比较叙述"],
      design_decisions: [
        { decision: "受众", why_it_matters: "决定语言与节奏。", options: ["学生", "成人"] },
        { decision: "场景", why_it_matters: "决定引导方式。", options: ["课堂", "个人"] },
        { decision: "反馈", why_it_matters: "决定系统介入。", options: ["提问", "对照"] },
      ],
    },
    directions: [
      {
        direction_id: "direction_1",
        title: "版本对照",
        best_fit: "适合个人复盘。",
        design_goal: "识别叙述变化。",
        core_interaction: "改写后并列比较。",
        system_role: "组织版本与差异。",
        key_tradeoff: "清楚但步骤较多。",
        prototype_step: "先测试两栏原型。",
      },
      {
        direction_id: "direction_2",
        title: "角色交换",
        best_fit: "适合课堂讨论。",
        design_goal: "理解不同视角。",
        core_interaction: "选择角色重新叙述。",
        system_role: "分发素材并匿名配对。",
        key_tradeoff: "讨论丰富但需要主持。",
        prototype_step: "先测试一段共同素材。",
      },
      {
        direction_id: "direction_3",
        title: "时间轨迹",
        best_fit: "适合长期记录。",
        design_goal: "观察反复出现的框架。",
        core_interaction: "按主题回看多个版本。",
        system_role: "整理私人档案。",
        key_tradeoff: "纵向可见但保存负担高。",
        prototype_step: "先用合成数据测试时间线。",
      },
    ],
    reference_selections: [
      {
        knowledge_id: "kc-example-v1",
        direction_ids: ["direction_1"],
        why_relevant: "提供反思互动参照。",
        inspect_for: "查看互动与回看的衔接。",
      },
    ],
    references: [
      {
        knowledge_id: "kc-example-v1",
        direction_ids: ["direction_1"],
        why_relevant: "提供反思互动参照。",
        inspect_for: "查看互动与回看的衔接。",
        project_id: "itchio-0001",
        display_title: "Example Game",
        platform: "itch.io",
        public_url: "https://example.itch.io/game",
        known_dimensions: ["if_mechanics"],
        missing_dimensions: ["intended_audience"],
      },
    ],
    recommended_next_step: "选择一个方向制作最小原型。",
    follow_up_question: "你想先服务哪类使用者？",
  },
  trace: {
    schema_version: "educational-design-run-trace/v1",
    run_id: "run-0001",
    started_at: "2026-08-28T12:00:00Z",
    completed_at: "2026-08-28T12:00:02Z",
    status: "succeeded",
    failure_stage: null,
    request_id: "request-0001",
    knowledge_snapshot_id: "knowledge-v1",
    embedding_index: {
      schema_version: "track-a-embedding-index/v1",
      provider: "fixture-provider",
      model: "fixture-embedding-model",
      dimensions: 3,
      knowledge_cards_sha256: "f".repeat(64),
      index_sha256: "e".repeat(64),
    },
    retrieval_execution: {
      method: "embedding-cosine-top-k/v1",
      provider: "fixture-provider",
      model: "fixture-embedding-model",
      query_sha256: "d".repeat(64),
      latency_ms: 1,
      usage: { input_tokens: 1, output_tokens: 0, total_tokens: 1 },
    },
    retrieval: [{ rank: 1, knowledge_id: "kc-0001", score: 0.82 }],
    model_calls: [
      {
        stage: "design_advisor",
        provider: "fixture-provider",
        model: "fixture-model",
        prompt_version: "design-advisor/v1",
        model_facing_knowledge_ids: ["kc-0001"],
        attempt: 1,
        request_sha256: "a".repeat(64),
        response_sha256: "b".repeat(64),
        latency_ms: 2,
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
        error_category: null,
      },
    ],
    validation: { status: "passed", errors: [] },
    error: null,
  },
  traceV2: {
    schema_version: "educational-design-run-trace/v2",
    helper_version: "0.2.0",
    output_version: "0.2",
    run_id: "run-v2-0001",
    started_at: "2026-08-29T12:00:00Z",
    completed_at: "2026-08-29T12:00:02Z",
    status: "succeeded",
    failure_stage: null,
    request_id: "request-v2-0001",
    raw_question: "怎样帮助学习者比较同一事件的不同叙述？",
    request_sha256: "a".repeat(64),
    knowledge_release_id: "track-a-educational-design-knowledge-v1",
    knowledge_manifest_sha256: "b".repeat(64),
    embedding_indexes: [
      {
        schema_version: "track-a-embedding-index/v2",
        knowledge_type: "cross_case_pattern",
        provider: "fixture-provider",
        model: "fixture-embedding-model",
        dimensions: 3,
        knowledge_sha256: "c".repeat(64),
        index_sha256: "d".repeat(64),
      },
      {
        schema_version: "track-a-embedding-index/v2",
        knowledge_type: "case_design_card",
        provider: "fixture-provider",
        model: "fixture-embedding-model",
        dimensions: 3,
        knowledge_sha256: "e".repeat(64),
        index_sha256: "f".repeat(64),
      },
    ],
    retrieval_execution: {
      method: "typed-embedding-cosine-candidate-pool/v2",
      provider: "fixture-provider",
      model: "fixture-embedding-model",
      query_sha256: "1".repeat(64),
      latency_ms: 1,
      usage: { input_tokens: 1, output_tokens: 0, total_tokens: 1 },
    },
    retrieval: {
      domain_synthesis: [
        { rank: 1, knowledge_id: "ks-domain-purpose-v1", score: null },
      ],
      cross_case_patterns: [
        { rank: 1, knowledge_id: "kp-pattern-v1", score: 0.82 },
      ],
      design_cards: [
        { rank: 1, knowledge_id: "kc-example-v1", score: 0.79 },
      ],
    },
    model_calls: [
      {
        stage: "design_advisor",
        provider: "fixture-provider",
        model: "fixture-model",
        prompt_version: "design-advisor/v2.1",
        model_facing_knowledge_ids: [
          "ks-domain-purpose-v1",
          "kp-pattern-v1",
          "kc-example-v1",
        ],
        selected_knowledge_ids: ["kc-example-v1"],
        attempt: 1,
        request_sha256: "2".repeat(64),
        response_sha256: "3".repeat(64),
        latency_ms: 2,
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
        error_category: null,
      },
    ],
    validation: {
      status: "passed",
      errors: [],
      body_character_count: 420,
      design_decision_count: 3,
      direction_count: 3,
      distinct_direction_count: 3,
      reference_selection_count: 1,
      internal_language_absent: true,
      repair_attempts: 0,
    },
    error: null,
  },
};

for (const name of [
  "screening",
  "annotation",
  "knowledge",
  "snapshot",
  "request",
  "requestV2",
  "response",
  "responseV2",
  "trace",
  "traceV2",
]) {
  test(`${name} fixture satisfies its initial public schema`, async () => {
    const schema = await loadJson(schemas[name]);
    assert.deepEqual(validateFixture(schema, fixtures[name]), []);
  });
}

test("model-facing knowledge rejects verbatim evidence and local paths", async () => {
  const schema = await loadJson(schemas.knowledge);
  const unsafe = {
    ...fixtures.knowledge,
    verbatim_evidence: "Source text must remain local.",
    restricted_source_path: "corpus/restricted-sources/example",
  };

  const errors = validateFixture(schema, unsafe);
  assert(errors.some((error) => error.includes("unexpected property verbatim_evidence")));
  assert(errors.some((error) => error.includes("unexpected property restricted_source_path")));
});

test("the existing Fox-and-Crow case still satisfies the preserved Track B schema", async () => {
  const schema = await loadJson(schemas.case);
  const fixture = await loadJson("cases/fox-and-crow/case.json");
  assert.deepEqual(validateFixture(schema, fixture), []);
});

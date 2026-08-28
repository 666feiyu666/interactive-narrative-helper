import { z } from "zod";

const basisValues = [
  "user_request",
  "knowledge_precedent",
  "agent_adaptation",
  "agent_proposal",
  "open_question",
];

const evidenceStatusValues = [
  "sufficient_direct",
  "sufficient_analogical",
  "limited",
  "insufficient",
];

const matchKindValues = ["direct", "partial", "analogical"];

const nonEmpty = () => z.string().min(1);

const designDimension = z
  .object({
    value: nonEmpty(),
    basis: z.array(z.enum(basisValues)).min(1),
  })
  .strict();

export function createDesignResponseFormat({ requestId, snapshotId, knowledgeIds }) {
  if (!Array.isArray(knowledgeIds) || knowledgeIds.length === 0) {
    throw new Error("At least one retrieved Knowledge Card ID is required for generation.");
  }

  const knowledgeId = z.enum(knowledgeIds);
  const knowledgeSupport = z
    .object({
      knowledge_id: knowledgeId,
      match_kind: z.enum(matchKindValues),
      assessment_source: z.literal("generation_model"),
      use: nonEmpty(),
    })
    .strict();

  const designDirection = z
    .object({
      direction_id: nonEmpty(),
      title: nonEmpty(),
      concept: nonEmpty(),
      design_dimensions: z
        .object({
          educational_purpose: designDimension,
          intended_audience: designDimension,
          application_setting: designDimension,
          interactive_narrative_form: designDimension,
          interaction_education_relationship: designDimension,
        })
        .strict(),
      interaction_mechanism: nonEmpty(),
      educational_relationship: nonEmpty(),
      knowledge_support: z.array(knowledgeSupport).min(1),
      applicability_conditions: z.array(nonEmpty()),
      transfer_assumptions: z.array(nonEmpty()),
      risks: z.array(nonEmpty()),
    })
    .strict();

  return z
    .object({
      schema_version: z.literal("educational-design-response/v1"),
      request_id: z.literal(requestId),
      knowledge_snapshot_id: z.literal(snapshotId),
      evidence_status: z.enum(evidenceStatusValues),
      evidence_status_basis: z
        .object({
          assessment_source: z.literal("generation_model"),
          rationale: nonEmpty(),
        })
        .strict(),
      request_interpretation: nonEmpty(),
      design_directions: z.array(designDirection).min(1).max(5),
      limitations: z.array(nonEmpty()),
      follow_up_questions: z.array(nonEmpty()),
    })
    .strict();
}

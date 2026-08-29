import { z } from "zod";

const adviceText = z.string().min(2).max(500);
const shortText = z.string().min(1).max(160);
const directionId = z.enum(["direction_1", "direction_2", "direction_3"]);

const diagnosis = z
  .object({
    concept_summary: adviceText,
    confirmed_elements: z.array(shortText).min(1).max(6),
    design_decisions: z
      .array(
        z
          .object({
            decision: shortText,
            why_it_matters: adviceText,
            options: z.array(shortText).min(2).max(3),
          })
          .strict(),
      )
      .min(3)
      .max(6),
  })
  .strict();

const direction = z
  .object({
    direction_id: directionId,
    title: z.string().min(2).max(80),
    best_fit: adviceText,
    design_goal: adviceText,
    core_interaction: adviceText,
    system_role: adviceText,
    key_tradeoff: adviceText,
    prototype_step: adviceText,
  })
  .strict();

const referenceSelection = z
  .object({
    knowledge_id: z.string().regex(/^kc-[a-z0-9_-]+$/u),
    direction_ids: z.array(directionId).min(1).max(3),
    why_relevant: adviceText,
    inspect_for: adviceText,
  })
  .strict();

export function createCompactDesignResponseFormat({ requestId }) {
  return z
    .object({
      schema_version: z.literal("educational-design-response/v2"),
      output_version: z.literal("0.2"),
      request_id: z.literal(requestId),
      diagnosis,
      directions: z.array(direction).length(3),
      reference_selections: z.array(referenceSelection).min(1).max(3),
      recommended_next_step: adviceText,
      follow_up_question: z.string().min(2).max(240).nullable(),
    })
    .strict();
}

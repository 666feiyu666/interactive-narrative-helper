import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import {
  assertProviderPayloadSafe,
  toModelFacingKnowledgeItem,
} from "../knowledge/model-facing.mjs";
import { createDesignResponseFormat } from "../model/design-response-format.mjs";
import { resolveReferenceSelections } from "../references/reference-catalog.mjs";
import { getIndexTraces } from "../retrieval/embedding-index.mjs";
import { retrieveDemoData } from "../retrieval/retrieve.mjs";
import { sha256, sha256Json } from "../utils/hash.mjs";
import { createId } from "../utils/ids.mjs";
import { writeJson } from "../utils/files.mjs";
import { assertSchema } from "../validation/public-schemas.mjs";
import { validateDesignResponse } from "../validation/design-response.mjs";

export class DesignRunError extends Error {
  constructor(message, { runId, category = "design_run_failed" } = {}) {
    super(message);
    this.name = "DesignRunError";
    this.runId = runId;
    this.category = category;
  }
}

function usageOrNull(usage) {
  if (!usage) return null;
  return {
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    total_tokens: usage.total_tokens ?? 0,
  };
}

function traceRecords(results) {
  return results.map(({ rank, knowledge_id, score }) => ({ rank, knowledge_id, score }));
}

function modelFacingRecords(results) {
  return results.map(({ rank, item }) => ({
    rank,
    knowledge: toModelFacingKnowledgeItem(item),
  }));
}

function selectedKnowledgeIds(draft) {
  return [...new Set((draft?.reference_selections ?? []).map(({ knowledge_id }) => knowledge_id))];
}

function withResolvedReferences(draft, referenceCatalog) {
  return {
    ...draft,
    references: resolveReferenceSelections(draft?.reference_selections ?? [], referenceCatalog),
  };
}

export function createDesignAdvisor({
  demoData,
  indexes,
  referenceCatalog,
  provider,
  runtimeConfig,
  validators,
  promptPath = paths.prompt,
  runOutputRoot = paths.runOutputRoot,
}) {
  const promptPromise = readFile(promptPath, "utf8");

  return async function runDesign(request) {
    const runId = createId("run");
    const runDirectory = path.join(runOutputRoot, runId);
    const persistRuns = runtimeConfig.save_runs === true;
    const save = async (fileName, value) => {
      if (persistRuns) await writeJson(path.join(runDirectory, fileName), value);
    };
    if (persistRuns) await mkdir(runDirectory, { recursive: true });
    await save("request.json", request);

    const promptId = "design-advisor";
    const trace = {
      schema_version: "educational-design-mvp-run",
      run_id: runId,
      started_at: new Date().toISOString(),
      completed_at: null,
      status: "running",
      failure_stage: null,
      request_id: request.request_id,
      raw_question: request.raw_question,
      request_sha256: sha256Json(request),
      demo_data_manifest_sha256: demoData.manifestSha256,
      demo_data_sha256: demoData.dataSha256,
      embedding_indexes: getIndexTraces(indexes),
      retrieval_execution: {
        method: "demo-embedding-cosine-candidate-pool",
        provider: provider.name,
        model: runtimeConfig.openai.embeddingModel,
        query_sha256: sha256(request.raw_question),
        latency_ms: 0,
        usage: null,
      },
      retrieval: {
        domain_summaries: [],
        pattern_examples: [],
        case_examples: [],
      },
      model_calls: [],
      validation: {
        status: "not_run",
        errors: [],
        body_character_count: null,
        design_decision_count: 0,
        direction_count: 0,
        distinct_direction_count: 0,
        reference_selection_count: 0,
        internal_language_absent: true,
        repair_attempts: 0,
      },
      error: null,
    };

    let stage = "retrieval";
    try {
      const retrieved = await retrieveDemoData({
        question: request.raw_question,
        demoData,
        indexes,
        provider,
        crossCasePatternTopK: runtimeConfig.retrieval.cross_case_pattern_top_k,
        designCardTopK: runtimeConfig.retrieval.design_card_top_k,
      });
      trace.retrieval_execution = {
        ...retrieved.execution,
        usage: usageOrNull(retrieved.execution.usage),
      };
      trace.retrieval = {
        domain_summaries: traceRecords(retrieved.domainSynthesis),
        pattern_examples: traceRecords(retrieved.crossCasePatterns),
        case_examples: traceRecords(retrieved.designCards),
      };
      await save("retrieval.json", trace.retrieval);

      const groupedKnowledge = {
        domain_summaries: modelFacingRecords(retrieved.domainSynthesis),
        pattern_examples: modelFacingRecords(retrieved.crossCasePatterns),
        case_examples: modelFacingRecords(retrieved.designCards),
      };
      const sentKnowledgeIds = [
        ...retrieved.domainSynthesis,
        ...retrieved.crossCasePatterns,
        ...retrieved.designCards,
      ].map((result) => result.knowledge_id);
      const sentDesignCardIds = retrieved.designCards.map((result) => result.knowledge_id);
      const basePayload = {
        request,
        retrieved_demo_data: groupedKnowledge,
        response_contract: {
          language: "zh-CN",
          direction_count: 3,
          allowed_reference_knowledge_ids: sentDesignCardIds,
          maximum_reference_selections: 3,
        },
      };
      assertProviderPayloadSafe(basePayload);
      const systemPrompt = await promptPromise;
      const format = createDesignResponseFormat({ requestId: request.request_id });

      let draft = null;
      let response = null;
      let validation = { errors: [], metrics: {} };
      const maximumAttempts = Math.max(
        1,
        Math.min(runtimeConfig.generation.max_attempts ?? 2, 2),
      );
      for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
        stage = attempt === 1 ? "generation" : "response_validation";
        const providerPayload = {
          ...basePayload,
          repair:
            attempt === 1
              ? null
              : {
                  instruction:
                    "Correct only the listed validation failures. Preserve every field that already satisfies the response contract.",
                  validation_errors: validation.errors,
                  previous_response: draft,
                },
        };
        assertProviderPayloadSafe(providerPayload);
        await save(`provider-request-attempt-${attempt}.json`, providerPayload);
        const providerRequestHash = sha256Json(providerPayload);
        const started = performance.now();
        try {
          const generated = await provider.generateDesign({
            format,
            systemPrompt,
            payload: providerPayload,
            attempt,
          });
          draft = generated.parsed;
          response = withResolvedReferences(draft, referenceCatalog);
          await save(`model-response-attempt-${attempt}.json`, generated.raw);
          trace.model_calls.push({
            stage: attempt === 1 ? "design_advisor" : "repair",
            provider: generated.provider,
            model: generated.model,
            prompt_id: promptId,
            supplied_demo_item_ids: sentKnowledgeIds,
            selected_case_ids: selectedKnowledgeIds(draft),
            attempt,
            request_sha256: providerRequestHash,
            response_sha256: sha256Json(generated.raw),
            latency_ms: generated.latencyMs,
            usage: usageOrNull(generated.usage),
            error_category: null,
          });
        } catch (error) {
          trace.model_calls.push({
            stage: attempt === 1 ? "design_advisor" : "repair",
            provider: provider.name,
            model: runtimeConfig.openai.generationModel,
            prompt_id: promptId,
            supplied_demo_item_ids: sentKnowledgeIds,
            selected_case_ids: [],
            attempt,
            request_sha256: providerRequestHash,
            response_sha256: null,
            latency_ms: Math.max(0, Math.round(performance.now() - started)),
            usage: null,
            error_category: "provider_error",
          });
          throw error;
        }

        stage = "response_validation";
        validation = validateDesignResponse({
          response,
          request,
          retrieved,
          sentKnowledgeIds,
          referenceCatalog,
          validators,
        });
        trace.validation = {
          status: validation.errors.length === 0 ? "passed" : "failed",
          errors: validation.errors,
          ...validation.metrics,
          repair_attempts: attempt - 1,
        };
        if (validation.errors.length === 0) break;
      }

      if (validation.errors.length > 0) {
        throw new Error(`Model response failed validation: ${validation.errors.join("; ")}`);
      }

      trace.status = "succeeded";
      trace.completed_at = new Date().toISOString();
      await save("response.json", response);
      assertSchema("Run trace", validators.trace(trace));
      await save("trace.json", trace);

      return {
        run_id: runId,
        request,
        retrieval: trace.retrieval,
        response,
      };
    } catch (error) {
      trace.status = "failed";
      trace.failure_stage = stage;
      trace.completed_at = new Date().toISOString();
      if (trace.validation.status === "not_run") {
        trace.validation = {
          ...trace.validation,
          status: "failed",
          errors: [error.message],
        };
      }
      trace.error = {
        category: error?.name === "AbortError" ? "timeout" : "design_run_failed",
        message: error.message,
      };
      const traceErrors = validators.trace(trace);
      if (traceErrors.length > 0) {
        trace.error.message = `${trace.error.message} | Trace validation: ${traceErrors.join("; ")}`;
      }
      await save("trace.json", trace);
      throw new DesignRunError(error.message, {
        runId,
        category: trace.error.category,
      });
    }
  };
}

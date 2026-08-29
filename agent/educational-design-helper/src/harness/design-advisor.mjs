import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { toModelFacingKnowledge, assertProviderPayloadSafe } from "../knowledge/model-facing.mjs";
import { createDesignResponseFormat } from "../model/design-response-format.mjs";
import { retrieveKnowledge } from "../retrieval/retrieve.mjs";
import { getIndexTrace } from "../retrieval/embedding-index.mjs";
import { sha256Json } from "../utils/hash.mjs";
import { createId } from "../utils/ids.mjs";
import { writeJson } from "../utils/files.mjs";
import { assertSchema } from "../validation/public-schemas.mjs";
import { validateDesignResponse } from "../validation/design-response.mjs";

const promptVersion = "design-advisor/v1";

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

function traceRetrieval(results) {
  return results.map(({ rank, knowledge_id, score }) => ({ rank, knowledge_id, score }));
}

export function createDesignAdvisor({
  snapshot,
  indexResult,
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
    await mkdir(runDirectory, { recursive: true });
    await writeJson(path.join(runDirectory, "request.json"), request);

    const trace = {
      schema_version: "educational-design-run-trace/v1",
      run_id: runId,
      started_at: new Date().toISOString(),
      completed_at: null,
      status: "running",
      failure_stage: null,
      request_id: request.request_id,
      knowledge_snapshot_id: snapshot.manifest.snapshot_id,
      embedding_index: getIndexTrace(indexResult),
      retrieval_execution: {
        method: "embedding-cosine-top-k/v1",
        provider: provider.name,
        model: runtimeConfig.openai.embeddingModel,
        query_sha256: sha256Json(request.raw_question),
        latency_ms: 0,
        usage: null,
      },
      retrieval: [],
      model_calls: [],
      validation: { status: "not_run", errors: [] },
      error: null,
    };

    let stage = "retrieval";
    try {
      const retrieval = await retrieveKnowledge({
        question: request.raw_question,
        snapshot,
        indexResult,
        provider,
        topK: runtimeConfig.retrieval.top_k,
      });
      trace.retrieval_execution = {
        ...retrieval.execution,
        usage: usageOrNull(retrieval.execution.usage),
      };
      trace.retrieval = traceRetrieval(retrieval.results);
      await writeJson(path.join(runDirectory, "retrieval.json"), trace.retrieval);

      const retrievedIds = retrieval.results.map((result) => result.knowledge_id);
      const modelFacingKnowledge = retrieval.results.map((result) => ({
        rank: result.rank,
        cosine_score: result.score,
        card: toModelFacingKnowledge(result.card),
      }));
      const systemPrompt = await promptPromise;
      const basePayload = {
        request,
        knowledge_snapshot: {
          snapshot_id: snapshot.manifest.snapshot_id,
          human_double_coding_complete: snapshot.manifest.review.human_double_coding_complete,
          limitations: snapshot.manifest.limitations,
        },
        retrieved_knowledge: modelFacingKnowledge,
        output_requirements: {
          requested_direction_count: request.requested_direction_count,
          assessment_source: "generation_model",
        },
      };
      assertProviderPayloadSafe(basePayload);

      const format = createDesignResponseFormat({
        requestId: request.request_id,
        snapshotId: snapshot.manifest.snapshot_id,
        knowledgeIds: retrievedIds,
      });

      let response = null;
      let validationErrors = [];
      for (let attempt = 1; attempt <= runtimeConfig.generation.max_attempts; attempt += 1) {
        stage = attempt === 1 ? "generation" : "response_validation";
        const providerPayload = {
          ...basePayload,
          repair:
            attempt === 1
              ? null
              : {
                  instruction: "Correct the prior response using the validation errors. Keep the same request and retrieved Knowledge Cards.",
                  validation_errors: validationErrors,
                  previous_response: response,
                },
        };
        assertProviderPayloadSafe(providerPayload);
        await writeJson(
          path.join(runDirectory, `provider-request-attempt-${attempt}.json`),
          providerPayload,
        );

        const requestHash = sha256Json(providerPayload);
        const outerStarted = performance.now();
        try {
          const generated = await provider.generateDesign({
            format,
            systemPrompt,
            payload: providerPayload,
            attempt,
          });
          response = generated.parsed;
          await writeJson(
            path.join(runDirectory, `model-response-attempt-${attempt}.json`),
            generated.raw,
          );
          trace.model_calls.push({
            stage: attempt === 1 ? "design_advisor" : "repair",
            provider: generated.provider,
            model: generated.model,
            prompt_version: promptVersion,
            model_facing_knowledge_ids: retrievedIds,
            attempt,
            request_sha256: requestHash,
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
            prompt_version: promptVersion,
            model_facing_knowledge_ids: retrievedIds,
            attempt,
            request_sha256: requestHash,
            response_sha256: null,
            latency_ms: Math.max(0, Math.round(performance.now() - outerStarted)),
            usage: null,
            error_category: "provider_error",
          });
          throw error;
        }

        stage = "response_validation";
        validationErrors = validateDesignResponse({
          response,
          request,
          snapshot,
          retrievedIds,
          validators,
        });
        if (validationErrors.length === 0) break;
      }

      if (validationErrors.length > 0) {
        trace.validation = { status: "failed", errors: validationErrors };
        throw new Error(`Model response failed validation: ${validationErrors.join("; ")}`);
      }

      trace.validation = { status: "passed", errors: [] };
      trace.status = "succeeded";
      trace.completed_at = new Date().toISOString();
      await writeJson(path.join(runDirectory, "response.json"), response);
      assertSchema("Run trace", validators.trace(trace));
      await writeJson(path.join(runDirectory, "trace.json"), trace);

      return {
        run_id: runId,
        helper_version: "0.1.0",
        output_version: "0.1",
        request,
        retrieval: trace.retrieval,
        response,
      };
    } catch (error) {
      trace.status = "failed";
      trace.failure_stage = stage;
      trace.completed_at = new Date().toISOString();
      if (trace.validation.status === "not_run") {
        trace.validation = { status: "failed", errors: [error.message] };
      }
      trace.error = {
        category: error?.name === "AbortError" ? "timeout" : "design_run_failed",
        message: error.message,
      };
      const traceErrors = validators.trace(trace);
      if (traceErrors.length > 0) {
        trace.error.message = `${trace.error.message} | Trace validation: ${traceErrors.join("; ")}`;
      }
      await writeJson(path.join(runDirectory, "trace.json"), trace);
      throw new DesignRunError(error.message, { runId, category: trace.error.category });
    }
  };
}

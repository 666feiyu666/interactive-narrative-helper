import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadRuntimeConfig } from "../src/config/load-config.mjs";
import { createDesignRequest } from "../src/harness/request.mjs";
import { FixtureProvider } from "../src/model/fixture-provider.mjs";
import { createRuntime } from "../src/runtime/create-runtime.mjs";
import {
  createFixtureResponse,
  fixtureVector,
} from "../src/server/start.mjs";

async function fixtureRuntime(context, { saveRuns = true } = {}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "inh-display-mvp-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const baseConfig = await loadRuntimeConfig({ requireApiKey: false });
  const config = Object.freeze({
    ...baseConfig,
    save_runs: saveRuns,
    openai: Object.freeze({
      ...baseConfig.openai,
      generationModel: "fixture-generation",
      embeddingModel: "fixture-embedding",
    }),
  });
  const provider = new FixtureProvider({
    embeddingFactory: fixtureVector,
    responseFactory: ({ payload }) => createFixtureResponse(payload),
  });
  const indexRoot = path.join(temporaryRoot, "indexes");
  const runOutputRoot = path.join(temporaryRoot, "runs");
  const runtime = await createRuntime({ config, provider, indexRoot, runOutputRoot });
  return { runtime, runOutputRoot };
}

test("display MVP loads local demo data and returns the single current response shape", async (context) => {
  const { runtime, runOutputRoot } = await fixtureRuntime(context);
  assert.equal(runtime.demoData.manifest.purpose, "display_only");
  assert.equal(runtime.demoData.manifest.research_status, "not_validated");
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(runtime.demoData.manifest.files).map(([key, value]) => [
        key,
        value.count,
      ]),
    ),
    { domain_summaries: 6, pattern_examples: 194, case_examples: 122 },
  );

  const request = createDesignRequest(
    "我想设计一个 Journaling 类应用，帮助使用者回看和改写日记。",
  );
  const result = await runtime.runDesign(request);

  assert.equal(result.response.schema_version, "educational-design-response");
  assert.equal(result.response.directions.length, 3);
  assert.equal(result.response.references.length, 2);
  assert.equal(result.retrieval.domain_summaries.length, 6);
  assert.equal(result.retrieval.pattern_examples.length, 8);
  assert.equal(result.retrieval.case_examples.length, 8);
  assert.equal("output_version" in result, false);
  assert.equal("helper_version" in result, false);

  const trace = JSON.parse(
    await readFile(path.join(runOutputRoot, result.run_id, "trace.json"), "utf8"),
  );
  assert.equal(trace.schema_version, "educational-design-mvp-run");
  assert.equal(trace.status, "succeeded");
  assert.equal(trace.model_calls[0].prompt_id, "design-advisor");
  assert.equal(trace.model_calls[0].supplied_demo_item_ids.length, 22);
  assert.equal(trace.model_calls[0].selected_case_ids.length, 2);
  assert.equal("knowledge_release_id" in trace, false);
  assert.deepEqual(runtime.validators.trace(trace), []);
});

test("offline display mode does not persist run payloads by default", async (context) => {
  const { runtime, runOutputRoot } = await fixtureRuntime(context, { saveRuns: false });
  const result = await runtime.runDesign(createDesignRequest("请比较三个教育互动叙事方向。"));
  await assert.rejects(
    readFile(path.join(runOutputRoot, result.run_id, "trace.json"), "utf8"),
    { code: "ENOENT" },
  );
});

test("request contract rejects empty input and contains no research-version fields", () => {
  assert.throws(() => createDesignRequest("   "), /请输入/u);
  const request = createDesignRequest("一个简短的设计问题");
  assert.deepEqual(Object.keys(request).sort(), [
    "raw_question",
    "request_id",
    "schema_version",
  ]);
});

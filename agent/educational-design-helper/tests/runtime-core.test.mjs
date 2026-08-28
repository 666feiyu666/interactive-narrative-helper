import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

import { createDesignAdvisor } from "../src/harness/design-advisor.mjs";
import { createDesignRequest } from "../src/harness/request.mjs";
import {
  assertProviderPayloadSafe,
  toModelFacingKnowledge,
} from "../src/knowledge/model-facing.mjs";
import { loadKnowledgeSnapshot } from "../src/knowledge/load-snapshot.mjs";
import { FixtureProvider } from "../src/model/fixture-provider.mjs";
import { cosineSimilarity } from "../src/retrieval/cosine.mjs";
import { retrieveKnowledge } from "../src/retrieval/retrieve.mjs";
import { createHttpServer } from "../src/server/app.mjs";
import { validateDesignResponse } from "../src/validation/design-response.mjs";
import { createSchemaValidators } from "../src/validation/public-schemas.mjs";

const dimension = (value, basis = ["knowledge_precedent"]) => ({ value, basis });

function fixtureResponse(request, snapshotId, retrievedIds) {
  return {
    schema_version: "educational-design-response/v1",
    request_id: request.request_id,
    knowledge_snapshot_id: snapshotId,
    evidence_status: "limited",
    evidence_status_basis: {
      assessment_source: "generation_model",
      rationale: "The precedents are relevant but do not establish learning effectiveness.",
    },
    request_interpretation: "Explore three author-reviewable educational IF directions.",
    design_directions: Array.from({ length: request.requested_direction_count }, (_, index) => ({
      direction_id: `direction_${index + 1}`,
      title: `Direction ${index + 1}`,
      concept: "Use consequential choices to support reflection without claiming measured outcomes.",
      design_dimensions: {
        educational_purpose: dimension("Critical reflection"),
        intended_audience: dimension("Adult learners", ["agent_proposal"]),
        application_setting: dimension("Facilitated workshop", ["agent_adaptation"]),
        interactive_narrative_form: dimension("Branching interactive fiction"),
        interaction_education_relationship: dimension("Choices make competing interpretations inspectable"),
      },
      interaction_mechanism: "Players choose among interpretations and inspect consequences.",
      educational_relationship: "The consequences create prompts for reflection and discussion.",
      knowledge_support: [
        {
          knowledge_id: retrievedIds[index % retrievedIds.length],
          match_kind: "partial",
          assessment_source: "generation_model",
          use: "Provides a creator-described precedent for the interaction form.",
        },
      ],
      applicability_conditions: ["A facilitator can support reflection."],
      transfer_assumptions: ["The precedent can transfer to this topic."],
      risks: ["The educational relationship may remain too implicit."],
    })),
    limitations: ["Creator descriptions do not demonstrate learning effectiveness."],
    follow_up_questions: ["Which audience and setting should anchor the next pass?"],
  };
}

test("cosine similarity handles aligned and orthogonal vectors", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.throws(() => cosineSimilarity([0, 0], [1, 0]), /zero-magnitude/u);
});

test("canonical snapshot validates and exposes exactly 122 model-facing cards", async () => {
  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  assert.equal(snapshot.manifest.snapshot_id, "track-a-itchio-v1.1-knowledge-v1");
  assert.equal(snapshot.cards.length, 122);
  assert.equal(snapshot.byId.size, 122);
});

test("provider serialization excludes provenance and retrieval-only fields", async () => {
  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  const source = snapshot.cards[0];
  const serialized = toModelFacingKnowledge(source);
  assert.equal(serialized.knowledge_id, source.knowledge_id);
  assert.equal("source_ids" in serialized, false);
  assert.equal("annotation_ids" in serialized, false);
  assert.equal("retrieval_text" in serialized, false);
  assertProviderPayloadSafe(serialized);
  assert.throws(
    () => assertProviderPayloadSafe({ nested: { source_url: "https://example.test" } }),
    /Forbidden provider field/u,
  );
});

test("request wrapping preserves the exact submitted question", () => {
  const raw = "  How could choices support ecological reflection?  ";
  const request = createDesignRequest(raw, 3);
  assert.equal(request.raw_question, raw);
  assert.equal(request.requested_direction_count, 3);
  assert.equal(request.target_audience.status, "not_stated");
});

test("embedding retrieval ranks by cosine and uses stable ID tie-breaking", async () => {
  const cards = [
    { knowledge_id: "kc_b", retrieval_text: "B" },
    { knowledge_id: "kc_a", retrieval_text: "A" },
    { knowledge_id: "kc_c", retrieval_text: "C" },
  ];
  const snapshot = { cards, byId: new Map(cards.map((card) => [card.knowledge_id, card])) };
  const indexResult = {
    index: {
      dimensions: 2,
      entries: [
        { knowledge_id: "kc_b", vector: [1, 0] },
        { knowledge_id: "kc_a", vector: [1, 0] },
        { knowledge_id: "kc_c", vector: [0, 1] },
      ],
    },
  };
  const provider = new FixtureProvider({ vectorsByText: new Map([["question", [1, 0]]]) });
  const result = await retrieveKnowledge({
    question: "question",
    snapshot,
    indexResult,
    provider,
    topK: 2,
  });
  assert.deepEqual(result.results.map((item) => item.knowledge_id), ["kc_a", "kc_b"]);
});

test("semantic validation accepts retrieved citations and rejects outside IDs", async () => {
  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  const request = createDesignRequest("How can choices support reflection?", 3);
  const retrievedIds = snapshot.cards.slice(0, 5).map((card) => card.knowledge_id);
  const response = fixtureResponse(request, snapshot.manifest.snapshot_id, retrievedIds);
  assert.deepEqual(
    validateDesignResponse({ response, request, snapshot, retrievedIds, validators }),
    [],
  );
  response.design_directions[0].knowledge_support[0].knowledge_id = "kc_not_retrieved";
  assert.match(
    validateDesignResponse({ response, request, snapshot, retrievedIds, validators }).join("\n"),
    /non-retrieved ID/u,
  );
});

test("browser export formatters preserve the complete result and create readable Markdown", async () => {
  const source = await readFile(new URL("../web/export-format.js", import.meta.url), "utf8");
  const context = vm.createContext({});
  vm.runInContext(source, context);

  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  const request = createDesignRequest("How can choices support reflection?", 3);
  const retrievedIds = snapshot.cards.slice(0, 5).map((card) => card.knowledge_id);
  const result = {
    run_id: "run_export_fixture",
    request,
    retrieval: retrievedIds.map((knowledge_id, index) => ({
      rank: index + 1,
      knowledge_id,
      score: 0.9 - index / 10,
    })),
    response: fixtureResponse(request, snapshot.manifest.snapshot_id, retrievedIds),
  };

  const markdown = context.TrackAExport.createMarkdownExport(result);
  assert.equal(markdown.fileName, "run_export_fixture-educational-design.md");
  assert.equal(markdown.mimeType, "text/markdown;charset=utf-8");
  assert.match(markdown.content, /# Educational Interactive Narrative Design Export/u);
  assert.match(markdown.content, /How can choices support reflection\?/u);
  assert.match(markdown.content, /## 1\. Direction 1/u);
  assert.match(markdown.content, /## Retrieved Knowledge Cards/u);
  assert.match(markdown.content, /## Limitations/u);
  assert.doesNotMatch(markdown.content, /undefined/u);

  const json = context.TrackAExport.createJsonExport(result);
  assert.equal(json.fileName, "run_export_fixture-educational-design.json");
  assert.equal(JSON.parse(json.content).run_id, result.run_id);
  assert.equal(JSON.parse(json.content).response.design_directions.length, 3);
});

test("fixture design run writes a validated response and trace", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "track-a-helper-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const promptPath = path.join(temporaryRoot, "prompt.md");
  await import("node:fs/promises").then(({ writeFile }) => writeFile(promptPath, "Return the schema.", "utf8"));

  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  const retrievedCards = snapshot.cards.slice(0, 5);
  const query = "How can choices support reflection?";
  const vectors = new Map([[query, [1, 0]]]);
  for (const card of retrievedCards) vectors.set(card.retrieval_text, [1, 0]);
  const provider = new FixtureProvider({
    vectorsByText: vectors,
    responseFactory: ({ payload }) =>
      fixtureResponse(
        payload.request,
        payload.knowledge_snapshot.snapshot_id,
        payload.retrieved_knowledge.map((item) => item.card.knowledge_id),
      ),
  });
  const indexResult = {
    index: {
      schema_version: "track-a-embedding-index/v1",
      provider: "fixture",
      model: "fixture-embedding-v1",
      dimensions: 2,
      knowledge_cards_sha256: snapshot.cardsSha256,
      entries: retrievedCards.map((card) => ({ knowledge_id: card.knowledge_id, vector: [1, 0] })),
    },
    indexSha256: "a".repeat(64),
    rebuilt: false,
  };
  const runtimeConfig = {
    openai: { embeddingModel: "fixture-embedding-v1", generationModel: "fixture-generation-v1" },
    retrieval: { top_k: 5 },
    generation: { max_attempts: 2 },
  };
  const runDesign = createDesignAdvisor({
    snapshot,
    indexResult,
    provider,
    runtimeConfig,
    validators,
    promptPath,
    runOutputRoot: temporaryRoot,
  });
  const result = await runDesign(createDesignRequest(query, 3));
  assert.equal(result.response.design_directions.length, 3);
  const trace = JSON.parse(await readFile(path.join(temporaryRoot, result.run_id, "trace.json"), "utf8"));
  assert.equal(trace.status, "succeeded");
  assert.equal(trace.validation.status, "passed");
  assert.equal(trace.retrieval.length, 5);
});

test("HTTP server exposes health, UI, and a design response", async (context) => {
  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  let submittedRequest = null;
  const runtime = {
    validators,
    snapshot,
    indexResult: { index: { model: "fixture-embedding-v1" } },
    config: {
      openai: {
        generationModel: "fixture-generation-v1",
        embeddingModel: "fixture-embedding-v1",
      },
      server: { max_request_bytes: 32768 },
    },
    runDesign: async (request) => {
      submittedRequest = request;
      const retrievedIds = snapshot.cards.slice(0, 5).map((card) => card.knowledge_id);
      return {
        run_id: "run_fixture",
        request,
        retrieval: retrievedIds.map((knowledge_id, index) => ({
          rank: index + 1,
          knowledge_id,
          score: 1 - index / 10,
        })),
        response: fixtureResponse(request, snapshot.manifest.snapshot_id, retrievedIds),
      };
    },
  };
  const server = createHttpServer(runtime);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${origin}/api/health`).then((response) => response.json());
  assert.equal(health.status, "ready");
  assert.equal(health.knowledge_cards, 122);
  const html = await fetch(origin).then((response) => response.text());
  assert.match(html, /Interactive Narrative Helper/u);
  assert.match(html, /href="\.\/styles\.css"/u);
  assert.match(html, /<script defer src="\.\/export-format\.js"><\/script>/u);
  assert.match(html, /<script defer src="\.\/app\.js"><\/script>/u);
  assert.match(html, /Preview file detected/u);
  const exportScript = await fetch(`${origin}/export-format.js`);
  assert.equal(exportScript.status, 200);
  assert.match(await exportScript.text(), /TrackAExport/u);

  const raw = "  Explore environmental role-play.  ";
  const designResponse = await fetch(`${origin}/api/design`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: raw, requested_direction_count: 3 }),
  });
  assert.equal(designResponse.status, 200);
  const payload = await designResponse.json();
  assert.equal(payload.response.design_directions.length, 3);
  assert.equal(submittedRequest.raw_question, raw);
});

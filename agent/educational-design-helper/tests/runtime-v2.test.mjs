import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

import { loadOutputProfiles, resolveOutputProfile } from "../src/config/output-profiles.mjs";
import { createCompactDesignRequest } from "../src/harness/request.mjs";
import { FixtureProvider } from "../src/model/fixture-provider.mjs";
import { createRuntime } from "../src/runtime/create-runtime.mjs";
import { createHttpServer } from "../src/server/app.mjs";
import { validateCompactDesignResponse } from "../src/validation/design-response-v2.mjs";

function fixtureVector(text) {
  const normalized = String(text).toLowerCase();
  const contains = (...terms) => (terms.some((term) => normalized.includes(term)) ? 3 : 0.2);
  return [
    1,
    contains("反思", "日记", "reflection", "journal"),
    contains("课堂", "学生", "classroom", "student"),
    contains("博物馆", "museum"),
  ];
}

function validDraft(payload) {
  const [firstReference, secondReference = firstReference] =
    payload.response_contract.allowed_reference_knowledge_ids;
  return {
    schema_version: "educational-design-response/v2",
    output_version: "0.2",
    request_id: payload.request.request_id,
    diagnosis: {
      concept_summary:
        "这个构想已经明确把记录后的重新阅读与主动改写设为核心体验。真正需要设计的是使用者在什么时刻回到旧内容、系统如何帮助他看见叙述选择，以及比较结束后留下什么可继续使用的结果。",
      confirmed_elements: ["回看已有记录", "改写同一经历", "反思自己的叙述方式"],
      design_decisions: [
        {
          decision: "主要使用者与使用时刻",
          why_it_matters: "个人晚间复盘、课堂写作和辅导对话会改变隐私默认值、提示语和一次使用的合理长度。",
          options: ["成人私人自省", "学生课堂写作", "有带领者的反思活动"],
        },
        {
          decision: "改写要关注的对象",
          why_it_matters: "事实与解释、叙述视角、情绪语气需要不同的标注方式，也会导向不同的比较问题。",
          options: ["区分事实与推测", "交换叙述视角", "调整语气与因果连接"],
        },
        {
          decision: "系统介入的深度",
          why_it_matters: "自动生成更快，逐步提问更能保留思考过程；两者对控制感和完成成本的影响不同。",
          options: ["只提示不代写", "提供改写骨架", "生成候选供逐句确认"],
        },
      ],
    },
    directions: [
      {
        direction_id: "direction_1",
        title: "双版本叙述镜",
        best_fit: "适合希望独自复盘一件具体经历的成人使用者。",
        design_goal: "让使用者辨认事实、推测、情绪和意图判断在原文中如何混合。",
        core_interaction: "选择一段旧记录，自行标注叙述层，保留事件事实完成改写，再并列查看删改并写下改变理由。",
        system_role: "系统只组织标注、版本和差异，并提出中性追问，不替使用者判定哪种讲法正确。",
        key_tradeoff: "结构清楚且私密，但标注太多会像作业，需要压缩一次流程。",
        prototype_step: "用三篇虚构日记做纸面原型，检查十分钟内能否完成标注、改写和比较。",
      },
      {
        direction_id: "direction_2",
        title: "视角交换写作室",
        best_fit: "适合教师带领的中学或大学写作课，并使用安全的共同素材。",
        design_goal: "训练学习者比较不同叙述者的位置如何改变信息选择和语言。",
        core_interaction: "学习者选择角色改写同一短事件，匿名交换版本，指出新增、遗漏与推断后再修订自己的写法。",
        system_role: "系统分发材料、匿名配对和对齐版本，教师负责设定边界并主持讨论。",
        key_tradeoff: "多人对照能形成讨论，但私人日记会带来暴露风险，首版应使用虚构事件。",
        prototype_step: "制作二十分钟课堂脚本，只实现角色选择、两栏改写与匿名评论。",
      },
      {
        direction_id: "direction_3",
        title: "长期叙述轨迹",
        best_fit: "适合持续记录数月并愿意定期回顾的长期日记者。",
        design_goal: "帮助使用者观察某类事件如何被反复归因、命名和收束。",
        core_interaction: "每次改写后选择一个自定义主题，月末沿时间线查看原文与修订版，再挑一个反复模式写总结。",
        system_role: "系统作为私人档案管理员组织版本和主题，提供可追溯索引，不生成心理诊断。",
        key_tradeoff: "长期变化更清楚，但要保存更多敏感内容，也可能增加回看负担。",
        prototype_step: "先用六周合成数据验证时间线筛选、版本定位和整条删除。",
      },
    ],
    reference_selections: [
      {
        knowledge_id: firstReference,
        direction_ids: ["direction_1", "direction_3"],
        why_relevant: "案例把反思安排进互动叙事过程，可用于检查反思出现的时机与节奏。",
        inspect_for: "查看玩家在何处停下来回应，以及回应是否改变之后的阅读或行动。",
      },
      {
        knowledge_id: secondReference,
        direction_ids: ["direction_2"],
        why_relevant: "案例提供文字叙事与互动机制结合的参照，可比较阅读、回应和回看的切换。",
        inspect_for: "查看页面先给玩家哪些信息、何时要求行动，以及下一步如何被提示。",
      },
    ],
    recommended_next_step:
      "先选定一个主要使用者和一次十分钟的使用时刻，再为“双版本叙述镜”做无账号原型，用虚构内容跑通选择、标注、改写、比较和删除。",
    follow_up_question: "你更希望先服务成人的私人自省，还是课堂中的写作练习？",
  };
}

function invalidDraft(payload) {
  return {
    schema_version: "educational-design-response/v2",
    output_version: "0.2",
    request_id: payload.request.request_id,
    diagnosis: { concept_summary: "太短", confirmed_elements: ["想法"], design_decisions: [] },
    directions: [],
    reference_selections: [],
    recommended_next_step: "稍后再说",
    follow_up_question: null,
  };
}

async function v2Config() {
  const registry = await loadOutputProfiles();
  const outputProfile = resolveOutputProfile(registry, "0.2");
  return {
    output_version: "0.2",
    outputProfile,
    openai: {
      embeddingModel: "fixture-embedding-v2",
      generationModel: "fixture-generation-v2",
    },
    retrieval: {
      cross_case_pattern_top_k: 8,
      design_card_top_k: 8,
      embedding_batch_size: 64,
    },
    generation: { max_attempts: 2 },
  };
}

async function createFixtureRuntime(context, prefix, responseFactory, embeddingFactory = fixtureVector) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), prefix));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const runtime = await createRuntime({
    config: await v2Config(),
    provider: new FixtureProvider({ embeddingFactory, responseFactory }),
    indexRoot: path.join(temporaryRoot, "indexes"),
    runOutputRoot: path.join(temporaryRoot, "runs"),
  });
  return { runtime, temporaryRoot };
}

test("v0.2 runtime returns three structured directions and locally resolved references", async (context) => {
  const { runtime, temporaryRoot } = await createFixtureRuntime(
    context,
    "track-a-v2-runtime-",
    ({ payload }) => validDraft(payload),
  );
  assert.equal(runtime.release.domainSynthesis.length, 6);
  assert.equal(runtime.release.designCards.length, 122);
  assert.equal(runtime.referenceCatalog.reference_count, 122);

  const result = await runtime.runDesign(
    createCompactDesignRequest("我想设计一个 Journaling 类应用，帮助使用者回看和改写日记。"),
  );
  assert.equal(result.response.directions.length, 3);
  assert.equal(result.response.references.length, 2);
  assert(result.response.references.every((reference) => reference.public_url.startsWith("https://")));
  assert.equal("scope_note" in result, false);
  assert.equal(result.retrieval.domain_synthesis.length, 6);
  assert.equal(result.retrieval.cross_case_patterns.length, 8);
  assert.equal(result.retrieval.design_cards.length, 8);

  const runDirectory = path.join(temporaryRoot, "runs", result.run_id);
  const trace = JSON.parse(await readFile(path.join(runDirectory, "trace.json"), "utf8"));
  assert.equal(trace.validation.status, "passed");
  assert.equal(trace.validation.repair_attempts, 0);
  assert.equal(trace.validation.direction_count, 3);
  assert.equal(trace.validation.distinct_direction_count, 3);
  assert.equal(trace.model_calls[0].model_facing_knowledge_ids.length, 22);
  assert.equal(trace.model_calls[0].selected_knowledge_ids.length, 2);

  const providerPayload = await readFile(
    path.join(runDirectory, "provider-request-attempt-1.json"),
    "utf8",
  );
  for (const forbidden of [
    "description_clean",
    "evidence_excerpt",
    "source_url",
    "public_url",
    "display_title",
    "record_path",
    "description_path",
    "annotation_ids",
    "quality_tier",
    "confidence",
    "limitations",
  ]) {
    assert.equal(providerPayload.includes(forbidden), false, `Provider payload contains ${forbidden}`);
  }
  assert.match(providerPayload, /interactive_fiction/u);

  const exportSource = await readFile(new URL("../web/export-format.js", import.meta.url), "utf8");
  const exportContext = vm.createContext({});
  vm.runInContext(exportSource, exportContext);
  const markdown = exportContext.TrackAExport.createMarkdownExport(result);
  assert.match(markdown.content, /## 01 设计诊断/u);
  assert.match(markdown.content, /## 02 三个设计方向/u);
  assert.match(markdown.content, /## 03 参考案例与下一步/u);
  assert.match(markdown.content, /\]\(https:\/\//u);
  assert.doesNotMatch(markdown.content, /领域综合知识|证据有限/u);

  const server = createHttpServer(runtime);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const meta = await fetch(`${origin}/api/meta`).then((response) => response.json());
  assert.equal(meta.release_status, "accepted");
  const html = await fetch(origin).then((response) => response.text());
  assert.match(html, /诊断关键决定、提出三个不同方向/u);
  const httpResult = await fetch(`${origin}/api/design`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "我想做一个供博物馆家庭访客使用的互动故事。" }),
  }).then((response) => response.json());
  assert.equal(httpResult.response.directions.length, 3);
  assert.equal(httpResult.response.references.length, 2);
});

test("v0.2 performs one targeted repair and keeps local reference metadata out of it", async (context) => {
  const { runtime, temporaryRoot } = await createFixtureRuntime(
    context,
    "track-a-v2-repair-",
    ({ payload, attempt }) => (attempt === 1 ? invalidDraft(payload) : validDraft(payload)),
  );
  const result = await runtime.runDesign(createCompactDesignRequest("我想帮助中学生反思网络欺凌。"));
  const runDirectory = path.join(temporaryRoot, "runs", result.run_id);
  const trace = JSON.parse(await readFile(path.join(runDirectory, "trace.json"), "utf8"));
  assert.equal(trace.model_calls.length, 2);
  assert.equal(trace.model_calls[1].stage, "repair");
  assert.equal(trace.validation.repair_attempts, 1);
  const repairPayload = await readFile(
    path.join(runDirectory, "provider-request-attempt-2.json"),
    "utf8",
  );
  assert.match(repairPayload, /Preserve every field/iu);
  assert.doesNotMatch(repairPayload, /public_url|display_title/iu);
});

test("v0.2 stops after one unsuccessful repair even when configuration asks for more", async (context) => {
  let modelCalls = 0;
  const { runtime, temporaryRoot } = await createFixtureRuntime(
    context,
    "track-a-v2-repair-limit-",
    ({ payload }) => {
      modelCalls += 1;
      return invalidDraft(payload);
    },
  );
  runtime.config.generation.max_attempts = 7;
  await assert.rejects(
    runtime.runDesign(createCompactDesignRequest("请探索一个教育互动叙事方向。")),
    /failed validation/iu,
  );
  assert.equal(modelCalls, 2);
  const runIds = await readdir(path.join(temporaryRoot, "runs"));
  const trace = JSON.parse(
    await readFile(path.join(temporaryRoot, "runs", runIds[0], "trace.json"), "utf8"),
  );
  assert.equal(trace.model_calls.length, 2);
  assert.equal(trace.validation.repair_attempts, 1);
});

test("v0.2 guardrails enforce distinct directions, reference resolution, public style, and effect claims", async (context) => {
  const { runtime } = await createFixtureRuntime(
    context,
    "track-a-v2-validation-",
    ({ payload }) => validDraft(payload),
  );
  const request = createCompactDesignRequest("请比较几个设计方向。");
  const wrap = (item, rank) => ({ rank, knowledge_id: item.knowledge_id, score: 0.5, item });
  const retrieved = {
    domainSynthesis: runtime.release.domainSynthesis.map(wrap),
    crossCasePatterns: runtime.release.crossCasePatterns.slice(0, 8).map(wrap),
    designCards: runtime.release.designCards.slice(0, 8).map(wrap),
  };
  const sentKnowledgeIds = Object.values(retrieved).flat().map(({ knowledge_id }) => knowledge_id);
  const payload = {
    request,
    response_contract: {
      allowed_reference_knowledge_ids: retrieved.designCards.map(({ knowledge_id }) => knowledge_id),
    },
  };
  const draft = validDraft(payload);
  const resolve = (source) => ({
    ...source,
    references: source.reference_selections.flatMap((selection) => {
      const reference = runtime.referenceCatalog.byId.get(selection.knowledge_id);
      return reference ? [{ ...selection, ...reference }] : [];
    }),
  });
  const validate = (response) => validateCompactDesignResponse({
    response,
    request,
    retrieved,
    sentKnowledgeIds,
    referenceCatalog: runtime.referenceCatalog,
    validators: runtime.validators,
  });

  const valid = resolve(draft);
  assert.deepEqual(validate(valid).errors, []);

  const negatedBoundary = structuredClone(valid);
  negatedBoundary.recommended_next_step += " 这次原型不能证明学习效果。";
  assert.doesNotMatch(validate(negatedBoundary).errors.join("\n"), /learning-effectiveness/iu);

  const positiveClaim = structuredClone(valid);
  positiveClaim.directions[0].design_goal = "这个流程能够显著提升学习效果。";
  assert.match(validate(positiveClaim).errors.join("\n"), /learning-effectiveness/iu);

  const internalStyle = structuredClone(valid);
  internalStyle.diagnosis.concept_summary += " 当前知识的证据有限。";
  assert.match(validate(internalStyle).errors.join("\n"), /internal evidence-management/iu);

  const duplicateDirections = structuredClone(valid);
  duplicateDirections.directions[1] = {
    ...duplicateDirections.directions[0],
    direction_id: "direction_2",
  };
  assert.match(validate(duplicateDirections).errors.join("\n"), /materially distinct/iu);

  const outsideId = runtime.release.designCards[20].knowledge_id;
  assert(!sentKnowledgeIds.includes(outsideId));
  const outsideReference = structuredClone(valid);
  outsideReference.reference_selections[0].knowledge_id = outsideId;
  outsideReference.references[0] = {
    ...outsideReference.reference_selections[0],
    ...runtime.referenceCatalog.byId.get(outsideId),
  };
  assert.match(validate(outsideReference).errors.join("\n"), /unsupplied case/iu);

  const unresolved = structuredClone(valid);
  unresolved.references = [];
  assert.match(validate(unresolved).errors.join("\n"), /resolve every selected case/iu);
});

test("near-universal labels are penalized in cross-case pattern ranking", async (context) => {
  const { runtime } = await createFixtureRuntime(
    context,
    "track-a-v2-pattern-penalty-",
    ({ payload }) => validDraft(payload),
    () => [1, 0],
  );
  const result = await runtime.runDesign(createCompactDesignRequest("请展开一个设计方向。"));
  const retrievedItems = result.retrieval.cross_case_patterns.map(({ knowledge_id }) =>
    runtime.release.byId.get(knowledge_id),
  );
  assert(
    retrievedItems.every((item) =>
      item.labels.every(({ label }) => label !== "interactive_fiction"),
    ),
  );
});

test("v0.2 startup rejects a formal release whose manifest hash no longer matches", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "track-a-v2-manifest-mismatch-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const registry = await loadOutputProfiles();
  const canonicalProfile = resolveOutputProfile(registry, "0.2");
  const alteredRelease = path.join(temporaryRoot, "release");
  await cp(canonicalProfile.knowledgeDirectory, alteredRelease, { recursive: true });
  const manifestPath = path.join(alteredRelease, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.files.design_cards.sha256 = "0".repeat(64);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const alteredProfile = Object.freeze({ ...canonicalProfile, knowledgeDirectory: alteredRelease });
  const config = await v2Config();
  config.outputProfile = alteredProfile;

  await assert.rejects(
    createRuntime({
      config,
      provider: new FixtureProvider({ embeddingFactory: fixtureVector }),
      indexRoot: path.join(temporaryRoot, "indexes"),
      runOutputRoot: path.join(temporaryRoot, "runs"),
    }),
    /design_cards hash mismatch/iu,
  );
});

test("six v0.2 quality scenarios use the same structured path without repair", async (context) => {
  const scenarios = JSON.parse(
    await readFile(new URL("./fixtures/v0.2/scenarios.json", import.meta.url), "utf8"),
  );
  const { runtime, temporaryRoot } = await createFixtureRuntime(
    context,
    "track-a-v2-scenarios-",
    ({ payload }) => validDraft(payload),
  );
  for (const scenario of scenarios) {
    const result = await runtime.runDesign(createCompactDesignRequest(scenario.raw_question));
    assert.equal(result.request.raw_question, scenario.raw_question, scenario.scenario_id);
    assert.equal(result.response.directions.length, 3, scenario.scenario_id);
    assert.equal(result.response.references.length, 2, scenario.scenario_id);
    const trace = JSON.parse(
      await readFile(path.join(temporaryRoot, "runs", result.run_id, "trace.json"), "utf8"),
    );
    assert.equal(trace.validation.repair_attempts, 0, scenario.scenario_id);
    assert.equal(trace.validation.internal_language_absent, true, scenario.scenario_id);
  }
});

test("the failed Journaling run remains a selected rejected regression fixture", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("./fixtures/v0.2/rejected-journaling-run.json", import.meta.url), "utf8"),
  );
  assert.equal(fixture.acceptance_status, "rejected");
  assert.equal("validator_errors" in fixture.repair_attempt, false);
  assert.equal(fixture.first_attempt.validator_errors.length, 1);
  assert.match(fixture.repair_attempt.answer_markdown, /领域综合知识/u);
  assert(fixture.rejection_reasons.length >= 7);
  assert.equal(fixture.replacement_acceptance_contract.direction_count, 3);
});

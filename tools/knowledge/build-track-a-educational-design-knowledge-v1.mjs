#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const componentRoot = path.join(repositoryRoot, "agent", "educational-design-helper");
const requireFromComponent = createRequire(path.join(componentRoot, "package.json"));
const Ajv2020 = requireFromComponent("ajv/dist/2020.js").default;
const addFormatsModule = requireFromComponent("ajv-formats");
const addFormats = addFormatsModule.default ?? addFormatsModule;

export const KNOWLEDGE_RELEASE_ID = "track-a-educational-design-knowledge-v1";
export const SOURCE_SNAPSHOT_ID = "track-a-itchio-v1.1-knowledge-v1";
export const BUILDER_VERSION = "track-a-educational-design-knowledge-builder/v1";
export const RELEASE_CREATED_AT = "2026-08-29T00:00:00Z";
export const MINIMUM_PATTERN_SUPPORT = 2;

const dimensionDefinitions = [
  ["educational_purpose", "Educational purpose"],
  ["intended_audience", "Intended audience"],
  ["application_setting", "Application setting"],
  ["interactive_narrative_form", "Interactive narrative form"],
  ["if_mechanics", "IF mechanics"],
  ["interaction_education_relationship", "Interaction–education relationship"],
];

const patternPairs = [
  ["interactive_narrative_form", "if_mechanics"],
  ["educational_purpose", "intended_audience"],
  ["educational_purpose", "application_setting"],
  ["educational_purpose", "interactive_narrative_form"],
  ["interaction_education_relationship", "if_mechanics"],
];

const releaseLimitations = [
  "This release covers 122 automation-reviewed public itch.io creator-description cases, not the broader educational Interactive Fiction population.",
  "Cross-case patterns are deterministic development summaries with support_n >= 2, not independently human-confirmed research findings.",
  "Missing and uncertain fields remain explicit and are not inferred.",
  "Creator-described educational purpose is not evidence of learning effectiveness.",
];

const patternCalculationRule =
  "support_n counts unique case design cards containing every listed label; eligible_n counts cards with analyzable labels for every listed dimension; support_n >= 2 is required.";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function ndjson(items) {
  return `${items.map((item) => JSON.stringify(item)).join("\n")}\n`;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function displayLabel(value) {
  return value.replaceAll("_", " ");
}

function dimensionState(card, dimension) {
  if (dimension === "if_mechanics") {
    const labels = [...(card.if_mechanics ?? [])];
    return {
      status: labels.length > 0 ? "explicit" : "not_stated",
      labels,
    };
  }
  const value = card[dimension];
  return {
    status: value?.status ?? "not_stated",
    labels: [...(value?.labels ?? [])],
  };
}

function statusCounts(cards, dimension) {
  const counts = { explicit: 0, normalized: 0, not_stated: 0, uncertain: 0 };
  for (const card of cards) counts[dimensionState(card, dimension).status] += 1;
  return counts;
}

function coverageCounts(cards, dimensions) {
  let eligible = 0;
  let notStated = 0;
  let uncertain = 0;
  for (const card of cards) {
    const states = dimensions.map((dimension) => dimensionState(card, dimension));
    if (states.some((state) => state.status === "uncertain")) uncertain += 1;
    else if (states.some((state) => state.status === "not_stated" || state.labels.length === 0)) {
      notStated += 1;
    } else {
      eligible += 1;
    }
  }
  return { eligible_n: eligible, not_stated_n: notStated, uncertain_n: uncertain };
}

function sourceIdsForCards(cards) {
  return uniqueSorted(cards.flatMap((card) => card.source_ids));
}

function patternId(kind, labels) {
  const key = `${kind}|${labels.map(({ dimension, label }) => `${dimension}:${label}`).join("|")}`;
  return `kp-${kind === "single_label_frequency" ? "single" : "pair"}-${sha256(key).slice(0, 16)}-v1`;
}

function makePattern({ kind, dimensions, labels, cards, supportingCards }) {
  const coverage = coverageCounts(cards, dimensions);
  const supportN = supportingCards.length;
  const labelPhrase = labels
    .map(({ dimension, label }) => `${displayLabel(dimension)} “${displayLabel(label)}”`)
    .join(" with ");
  const knowledgeId = patternId(kind, labels);
  return {
    schema_version: "track-a-knowledge-item/v1",
    knowledge_id: knowledgeId,
    knowledge_type: "cross_case_pattern",
    source_release_id: SOURCE_SNAPSHOT_ID,
    source_ids: sourceIdsForCards(supportingCards),
    evidence_status: "development_exploratory",
    pattern_kind: kind,
    dimensions,
    labels,
    total_n: cards.length,
    ...coverage,
    support_n: supportN,
    supporting_case_ids: supportingCards.map((card) => card.knowledge_id).sort(),
    calculation_rule: patternCalculationRule,
    pattern_summary: `${supportN} of ${coverage.eligible_n} eligible cases (within ${cards.length} development cases) co-described ${labelPhrase}.`,
    related_design_card_ids: supportingCards.map((card) => card.knowledge_id).sort(),
    limitations: releaseLimitations,
    retrieval_text: `Cross-case development pattern. ${labelPhrase}. Support ${supportN} cases; eligible ${coverage.eligible_n}; total ${cards.length}. ${patternCalculationRule}`,
    model_facing: true,
  };
}

function buildPatterns(cards) {
  const patterns = [];

  for (const [dimension] of dimensionDefinitions) {
    const labelCases = new Map();
    for (const card of cards) {
      const state = dimensionState(card, dimension);
      if (!["explicit", "normalized"].includes(state.status)) continue;
      for (const label of state.labels) {
        if (!labelCases.has(label)) labelCases.set(label, []);
        labelCases.get(label).push(card);
      }
    }
    for (const [label, supportingCards] of [...labelCases.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      if (supportingCards.length < MINIMUM_PATTERN_SUPPORT) continue;
      patterns.push(
        makePattern({
          kind: "single_label_frequency",
          dimensions: [dimension],
          labels: [{ dimension, label }],
          cards,
          supportingCards,
        }),
      );
    }
  }

  for (const [leftDimension, rightDimension] of patternPairs) {
    const combinationCases = new Map();
    for (const card of cards) {
      const left = dimensionState(card, leftDimension);
      const right = dimensionState(card, rightDimension);
      if (!["explicit", "normalized"].includes(left.status)) continue;
      if (!["explicit", "normalized"].includes(right.status)) continue;
      for (const leftLabel of left.labels) {
        for (const rightLabel of right.labels) {
          const key = JSON.stringify([leftLabel, rightLabel]);
          if (!combinationCases.has(key)) combinationCases.set(key, []);
          combinationCases.get(key).push(card);
        }
      }
    }
    for (const [key, supportingCards] of [...combinationCases.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      if (supportingCards.length < MINIMUM_PATTERN_SUPPORT) continue;
      const [leftLabel, rightLabel] = JSON.parse(key);
      patterns.push(
        makePattern({
          kind: "two_field_cooccurrence",
          dimensions: [leftDimension, rightDimension],
          labels: [
            { dimension: leftDimension, label: leftLabel },
            { dimension: rightDimension, label: rightLabel },
          ],
          cards,
          supportingCards,
        }),
      );
    }
  }

  return patterns.sort((left, right) => left.knowledge_id.localeCompare(right.knowledge_id));
}

function buildDomainSynthesis(cards, patterns) {
  return dimensionDefinitions.map(([dimension, displayName]) => {
    const states = statusCounts(cards, dimension);
    const counts = new Map();
    const relatedCards = [];
    for (const card of cards) {
      const state = dimensionState(card, dimension);
      if (state.labels.length > 0 && state.status !== "uncertain") relatedCards.push(card.knowledge_id);
      for (const label of state.labels) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const labelCounts = [...counts.entries()]
      .map(([label, support_n]) => ({ label, support_n }))
      .sort((left, right) => right.support_n - left.support_n || left.label.localeCompare(right.label));
    const coverage = coverageCounts(cards, [dimension]);
    const labelsText = labelCounts.map(({ label, support_n }) => `${displayLabel(label)} (${support_n})`).join(", ");
    return {
      schema_version: "track-a-knowledge-item/v1",
      knowledge_id: `ks-domain-${dimension.replaceAll("_", "-")}-v1`,
      knowledge_type: "domain_synthesis",
      source_release_id: SOURCE_SNAPSHOT_ID,
      source_ids: sourceIdsForCards(cards),
      evidence_status: "development_exploratory",
      dimension,
      summary: `${displayName} in the current ${cards.length}-case development release: ${labelsText || "no coded labels"}.`,
      total_n: cards.length,
      ...coverage,
      label_counts: labelCounts,
      status_counts: states,
      related_pattern_ids: patterns
        .filter((pattern) => pattern.dimensions.includes(dimension))
        .map((pattern) => pattern.knowledge_id)
        .sort(),
      related_design_card_ids: relatedCards.sort(),
      limitations: releaseLimitations,
      retrieval_text: `${displayName}. ${labelsText || "No coded labels"}. Coverage: eligible ${coverage.eligible_n}, not stated ${coverage.not_stated_n}, uncertain ${coverage.uncertain_n}, total ${cards.length}.`,
      model_facing: true,
    };
  });
}

function buildDesignCards(cards) {
  return cards
    .map((card) => ({
      schema_version: "track-a-knowledge-item/v1",
      knowledge_id: card.knowledge_id,
      knowledge_type: "case_design_card",
      source_release_id: SOURCE_SNAPSHOT_ID,
      source_ids: [...card.source_ids],
      annotation_ids: [...card.annotation_ids],
      evidence_status: "creator_described_automation_reviewed",
      quality_tier: card.quality_tier,
      coverage_profile: card.coverage_profile,
      educational_purpose: structuredClone(card.educational_purpose),
      intended_audience: structuredClone(card.intended_audience),
      application_setting: structuredClone(card.application_setting),
      interactive_narrative_form: structuredClone(card.interactive_narrative_form),
      if_mechanics: [...(card.if_mechanics ?? [])],
      interaction_education_relationship: structuredClone(card.interaction_education_relationship),
      design_pattern: card.design_pattern,
      applicability_conditions: [...card.applicability_conditions],
      transferable_design_questions: [...card.transferable_design_questions],
      limitations: [...card.limitations],
      confidence: card.confidence,
      retrieval_text: card.retrieval_text,
      model_facing: true,
    }))
    .sort((left, right) => left.knowledge_id.localeCompare(right.knowledge_id));
}

function assertSafeModelFacing(value, location = "knowledge") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeModelFacing(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const normalized = key.toLowerCase();
      assert(!["description_clean", "evidence_excerpt", "source_url", "record_path", "description_path", "local_path", "html"].some((fragment) => normalized.includes(fragment)), `Forbidden model-facing field ${location}.${key}`);
      assertSafeModelFacing(child, `${location}.${key}`);
    }
    return;
  }
  if (typeof value === "string") {
    assert(!/https?:\/\//iu.test(value), `Model-facing value contains a URL at ${location}`);
    assert(!/[A-Za-z]:\\/u.test(value), `Model-facing value contains a local path at ${location}`);
    assert(!value.includes("corpus/restricted-sources"), `Model-facing value contains a restricted path at ${location}`);
  }
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function validatorError(validate) {
  return (validate.errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
}

async function loadSource(sourceDirectory) {
  const manifest = await loadJson(path.join(sourceDirectory, "manifest.json"));
  assert(manifest.snapshot_id === SOURCE_SNAPSHOT_ID, `Expected source snapshot ${SOURCE_SNAPSHOT_ID}.`);
  assert(manifest.model_facing === true, "Source snapshot is not approved for model-facing use.");
  assert(manifest.review?.human_double_coding_complete === false, "Unexpected source review state.");
  const cardsPath = path.join(sourceDirectory, manifest.files.knowledge_cards);
  const bytes = await readFile(cardsPath);
  assert(sha256(bytes) === manifest.files.knowledge_cards_sha256, "Source Knowledge Card hash mismatch.");
  const cards = bytes
    .toString("utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
  assert(cards.length === manifest.counts.knowledge_cards, "Source Knowledge Card count mismatch.");
  assert(cards.length === 122, `Expected exactly 122 source Knowledge Cards, got ${cards.length}.`);

  const knowledgeCardSchema = await loadJson(
    path.join(repositoryRoot, "corpus", "schemas", "knowledge-card.schema.json"),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  const validateCard = ajv.compile(knowledgeCardSchema);
  for (const card of cards) {
    assert(validateCard(card), `Source Knowledge Card ${card.knowledge_id} is invalid: ${validatorError(validateCard)}`);
  }
  return { manifest, cards, cardsSha256: sha256(bytes) };
}

async function compileReleaseValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  const itemSchema = await loadJson(
    path.join(repositoryRoot, "corpus", "schemas", "track-a-knowledge-item.schema.json"),
  );
  const releaseSchema = await loadJson(
    path.join(repositoryRoot, "corpus", "schemas", "track-a-knowledge-release.schema.json"),
  );
  return {
    item: ajv.compile(itemSchema),
    release: ajv.compile(releaseSchema),
  };
}

function makeReadme(manifest) {
  return `# Track A educational design knowledge v1

This is the first formal runtime knowledge release for the maintained Track A
Educational Interactive Narrative Design Helper. Its directory and schemas are
independent of the number of source cards.

- Source snapshot: \`${manifest.source.source_snapshot_id}\`
- Domain-synthesis items: ${manifest.counts.domain_synthesis}
- Cross-case pattern items: ${manifest.counts.cross_case_patterns}
- Case design cards: ${manifest.counts.design_cards}
- Independent human double-coding complete: no

The cross-case patterns require at least two supporting cases and retain total,
eligible, not-stated, and uncertain counts. They are development summaries, not
claims about prevalence, effectiveness, or the broader educational IF population.
Raw descriptions, evidence excerpts, URLs, and local paths are not included.

Rebuild or verify this directory from the repository root with:

\`\`\`powershell
node tools/knowledge/build-track-a-educational-design-knowledge-v1.mjs
\`\`\`

The build is byte-stable and refuses to replace a divergent release. The
manifest aggregate model-facing hash is
\`${manifest.model_facing_sha256}\`.
`;
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function assertExistingReleaseMatches(outputDirectory, generatedFiles) {
  for (const [name, content] of Object.entries(generatedFiles)) {
    const existing = await readFile(path.join(outputDirectory, name), "utf8");
    assert(existing === content, `Existing release differs at ${name}; refusing to overwrite it.`);
  }
}

export async function buildKnowledgeRelease({
  sourceDirectory = path.join(repositoryRoot, "corpus", "derived-knowledge", SOURCE_SNAPSHOT_ID),
  outputDirectory = path.join(repositoryRoot, "corpus", "derived-knowledge", KNOWLEDGE_RELEASE_ID),
} = {}) {
  const source = await loadSource(sourceDirectory);
  const designCards = buildDesignCards(source.cards);
  const patterns = buildPatterns(source.cards);
  const domainSynthesis = buildDomainSynthesis(source.cards, patterns);
  const validators = await compileReleaseValidators();

  const allItems = [...domainSynthesis, ...patterns, ...designCards];
  const ids = new Set();
  for (const item of allItems) {
    assert(!ids.has(item.knowledge_id), `Duplicate knowledge ID ${item.knowledge_id}.`);
    ids.add(item.knowledge_id);
    assert(item.model_facing === true, `Knowledge item ${item.knowledge_id} is not model-facing.`);
    assertSafeModelFacing(item);
    assert(validators.item(item), `Knowledge item ${item.knowledge_id} is invalid: ${validatorError(validators.item)}`);
  }
  assert(designCards.length === 122, "The formal release must retain all 122 source design cards.");
  assert(patterns.every((pattern) => pattern.support_n >= MINIMUM_PATTERN_SUPPORT), "A cross-case pattern failed the minimum-support rule.");

  const domainText = ndjson(domainSynthesis);
  const patternText = ndjson(patterns);
  const designText = ndjson(designCards);
  const manifest = {
    schema_version: "track-a-knowledge-release/v1",
    knowledge_release_id: KNOWLEDGE_RELEASE_ID,
    created_at: RELEASE_CREATED_AT,
    source: {
      source_snapshot_id: source.manifest.snapshot_id,
      source_design_card_count: source.cards.length,
      source_cards_sha256: source.cardsSha256,
      human_double_coding_complete: source.manifest.review.human_double_coding_complete,
    },
    construction: {
      builder_version: BUILDER_VERSION,
      minimum_pattern_support: MINIMUM_PATTERN_SUPPORT,
      pattern_dimensions: patternPairs.map((pair) => pair.join("+")),
    },
    counts: {
      domain_synthesis: domainSynthesis.length,
      cross_case_patterns: patterns.length,
      design_cards: designCards.length,
      total: allItems.length,
    },
    files: {
      domain_synthesis: {
        path: "domain-synthesis.ndjson",
        count: domainSynthesis.length,
        sha256: sha256(domainText),
      },
      cross_case_patterns: {
        path: "cross-case-patterns.ndjson",
        count: patterns.length,
        sha256: sha256(patternText),
      },
      design_cards: {
        path: "design-cards.ndjson",
        count: designCards.length,
        sha256: sha256(designText),
      },
    },
    model_facing_sha256: sha256(`${domainText}${patternText}${designText}`),
    limitations: releaseLimitations,
    model_facing: true,
  };
  assert(validators.release(manifest), `Knowledge release manifest is invalid: ${validatorError(validators.release)}`);

  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const report = {
    schema_version: "track-a-knowledge-build-report/v1",
    builder_version: BUILDER_VERSION,
    knowledge_release_id: KNOWLEDGE_RELEASE_ID,
    completed_at: RELEASE_CREATED_AT,
    source_snapshot_id: source.manifest.snapshot_id,
    source_cards_sha256: source.cardsSha256,
    source_design_card_count: source.cards.length,
    configuration: {
      minimum_pattern_support: MINIMUM_PATTERN_SUPPORT,
      dimensions: dimensionDefinitions.map(([dimension]) => dimension),
      pattern_pairs: patternPairs,
    },
    counts: manifest.counts,
    artifact_hashes: {
      manifest_sha256: sha256(manifestText),
      ...Object.fromEntries(
        Object.entries(manifest.files).map(([key, value]) => [`${key}_sha256`, value.sha256]),
      ),
      model_facing_sha256: manifest.model_facing_sha256,
    },
    limitations: releaseLimitations,
    prohibited_inputs: [
      "canonical workbook writes",
      "restricted raw HTML",
      "source descriptions",
      "evidence excerpts",
      "external model calls",
    ],
  };

  const generatedFiles = {
    "manifest.json": manifestText,
    "domain-synthesis.ndjson": domainText,
    "cross-case-patterns.ndjson": patternText,
    "design-cards.ndjson": designText,
    "build-report.json": `${JSON.stringify(report, null, 2)}\n`,
    "README.md": makeReadme(manifest),
  };

  if (await pathExists(outputDirectory)) {
    await assertExistingReleaseMatches(outputDirectory, generatedFiles);
    return { manifest, report, outputDirectory, unchanged: true };
  }

  const parent = path.dirname(outputDirectory);
  await mkdir(parent, { recursive: true });
  const temporaryDirectory = await mkdtemp(path.join(parent, `.${KNOWLEDGE_RELEASE_ID}-`));
  try {
    for (const [name, content] of Object.entries(generatedFiles)) {
      await writeFile(path.join(temporaryDirectory, name), content, "utf8");
    }
    await rename(temporaryDirectory, outputDirectory);
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
  return { manifest, report, outputDirectory, unchanged: false };
}

export async function main(argv = process.argv.slice(2)) {
  const [command = "build", ...rest] = argv;
  assert(command === "build", "Usage: build-track-a-educational-design-knowledge-v1.mjs build [--output <directory>]");
  let outputDirectory;
  if (rest.length > 0) {
    assert(rest.length === 2 && rest[0] === "--output", "Expected --output <directory>.");
    outputDirectory = path.resolve(rest[1]);
  }
  const result = await buildKnowledgeRelease({ outputDirectory });
  console.log(
    JSON.stringify(
      {
        knowledge_release_id: result.manifest.knowledge_release_id,
        output_directory: result.outputDirectory,
        unchanged: result.unchanged,
        counts: result.manifest.counts,
        model_facing_sha256: result.manifest.model_facing_sha256,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  });
}

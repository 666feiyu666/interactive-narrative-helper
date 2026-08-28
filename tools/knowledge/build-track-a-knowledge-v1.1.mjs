#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

import { validateFixture } from "../../tests/helpers/schema-fixture-validator.mjs";
import {
  auditCodedCase,
  CODER_ID,
  CODING_RULES_VERSION,
  codeCase,
  INCLUSION_POLICY,
  normalizeRecord,
  REVIEWER_ID,
} from "./coding-rules-v1.1.mjs";
import { canonicalTrackAWorkbookPath } from "./track-a-workbook-path.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const defaultWorkbookPath = canonicalTrackAWorkbookPath;
const defaultSnapshotId = "track-a-itchio-v1.1-knowledge-v1";
const annotationReleaseId = "track-a-itchio-v1.1";
const sourceRecordCount = 606;
const expectedKnowledgeCardCount = 122;

function parseArguments(argv) {
  const args = [...argv];
  const command = args.shift();
  if (command !== "apply") {
    throw new Error("Usage: build-track-a-knowledge-v1.1.mjs apply --confirm-workbook-write [--workbook <path>] [--snapshot-id <id>]");
  }
  const options = { command };
  while (args.length) {
    const token = args.shift();
    if (!token?.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (key === "confirm-workbook-write") options[key] = true;
    else {
      const value = args.shift();
      if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
      options[key] = value;
    }
  }
  if (!options["confirm-workbook-write"]) {
    throw new Error("Refusing to edit the canonical workbook without --confirm-workbook-write.");
  }
  return options;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safeSnapshotId(value) {
  if (!/^[a-z][a-z0-9._-]*$/.test(value)) throw new Error(`Invalid snapshot ID: ${value}`);
  return value;
}

function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fileSha256(filePath) {
  return sha256(await readFile(filePath));
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeAtomic(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, filePath);
}

function ndjson(items) {
  return `${items.map((item) => JSON.stringify(item)).join("\n")}\n`;
}

function headerIndex(headers) {
  return Object.fromEntries(headers.map((header, index) => [String(header), index]));
}

function countBy(items, keyOf) {
  const counts = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])));
}

function labelText(labels) {
  return labels.map((label) => label.replaceAll("_", " ")).join(", ");
}

function dimensionStatus(coverageStatus) {
  if (coverageStatus === "explicit") return "explicit";
  if (coverageStatus === "interpreted") return "normalized";
  if (coverageStatus === "uncertain") return "uncertain";
  return "not_stated";
}

function dimension(coded, name, displayName) {
  const labels = coded.labels[name] ?? [];
  const status = dimensionStatus(coded.information_coverage[name]);
  let summary;
  if (labels.length) summary = `${displayName}: ${labelText(labels)}.`;
  else if (status === "uncertain") summary = `${displayName} could not be coded confidently from the available creator description.`;
  else summary = `${displayName} was not stated by the available creator description.`;
  return { status, labels, summary };
}

function sourceWordCount(excerpt) {
  return excerpt
    .replace(/\b(?:purpose|audience|setting|form|relationship):/gi, "")
    .replace(/\|/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function missingCoreDimensions(coded) {
  return [
    ["educational_purpose", "educational purpose"],
    ["intended_audience", "intended audience"],
    ["application_setting", "application setting"],
    ["interactive_narrative_form", "interactive narrative form"],
  ]
    .filter(([name]) => coded.information_coverage[name] !== "explicit")
    .map(([, display]) => display);
}

function makeScreeningDecision(coded, runAt) {
  return {
    schema_version: "screening-decision/v1",
    project_id: coded.project_id,
    review_status: coded.review_status,
    language: {
      value: coded.language.value,
      method: coded.language.method,
      reviewed: coded.language.reviewed,
    },
    information_coverage: coded.information_coverage,
    quality_tier: coded.quality_tier,
    coverage_profile: coded.coverage_profile,
    exclusion_reasons: coded.exclusion_reasons,
    reviewer_id: REVIEWER_ID,
    reviewed_at: runAt,
    review_notes: coded.review_status === "uncertain"
      ? "The v1.1 deterministic audit retained this row for in-workbook human revision; it is not in the knowledge pool."
      : "The v1.1 deterministic audit applied the scoped substantive-OR policy; independent human double-coding is pending.",
  };
}

function makeAnnotation(coded, rowNumber, runAt) {
  const missing = missingCoreDimensions(coded);
  const limitations = [
    "The coding represents creator positioning, not measured learning effectiveness.",
    "The deterministic audit has not been independently replicated by a human coder.",
  ];
  if (missing.length) limitations.push(`Core dimensions not stated: ${missing.join(", ")}.`);
  if (!coded.labels.if_mechanics.length) {
    limitations.push("No specific interaction mechanic was stated; only the interactive narrative form was coded.");
  }
  return {
    schema_version: "coding-annotation/v1",
    annotation_id: `ann-${coded.project_id}-v1-1`,
    project_id: coded.project_id,
    coding_rules_version: CODING_RULES_VERSION,
    coder_id: CODER_ID,
    reviewer_id: REVIEWER_ID,
    review_status: "reviewed",
    coverage_profile: coded.coverage_profile,
    coded_at: runAt,
    reviewed_at: runAt,
    evidence: {
      workbook_reference: `cases!E${rowNumber}`,
      source_url: coded.url,
      source_fields: ["description_clean", "genres_raw", "tags_raw", "languages_raw", "quality_status"],
      minimal_excerpt: coded.evidence_excerpt,
      source_word_count: sourceWordCount(coded.evidence_excerpt),
    },
    educational_purpose: dimension(coded, "educational_purpose", "Educational purpose"),
    intended_audience: dimension(coded, "intended_audience", "Intended audience"),
    application_setting: dimension(coded, "application_setting", "Application setting"),
    interactive_narrative_form: dimension(coded, "interactive_narrative_form", "Interactive narrative form"),
    if_mechanics: coded.labels.if_mechanics,
    interaction_education_relationship: dimension(
      coded,
      "interaction_education_relationship",
      "Interaction–education relationship",
    ),
    limitations,
  };
}

function makeKnowledgeCard(coded, annotation) {
  const purposes = labelText(coded.labels.educational_purpose);
  const audiences = labelText(coded.labels.intended_audience);
  const settings = labelText(coded.labels.application_setting);
  const forms = labelText(coded.labels.interactive_narrative_form);
  const mechanics = labelText(coded.labels.if_mechanics);
  const relationships = labelText(coded.labels.interaction_education_relationship);
  const statedParts = [];
  if (purposes) statedParts.push(`educational purpose ${purposes}`);
  if (audiences) statedParts.push(`audience ${audiences}`);
  if (settings) statedParts.push(`setting ${settings}`);
  if (relationships) statedParts.push(`interaction–education relationship ${relationships}`);
  const mechanismPhrase = mechanics ? ` with mechanics ${mechanics}` : "";
  const designPattern = `This creator-described precedent uses ${forms}${mechanismPhrase} and provides stated or conservatively normalized knowledge about ${statedParts.join("; ")}.`;
  const missing = missingCoreDimensions(coded);

  const applicabilityConditions = [`The proposed design can use the interactive form ${forms}.`];
  if (purposes) applicabilityConditions.push(`The intended educational direction overlaps with ${purposes}.`);
  if (audiences) applicabilityConditions.push(`The intended audience overlaps with ${audiences}.`);
  if (settings) applicabilityConditions.push(`The design can be situated in ${settings}.`);
  if (mechanics) applicabilityConditions.push(`The implementation can support the mechanics ${mechanics}.`);

  const transferableQuestions = [];
  if (purposes) transferableQuestions.push(`Which aspects of ${purposes} should the learner encounter through action rather than exposition?`);
  else transferableQuestions.push("What educational purpose should be defined before adapting this precedent?");
  if (audiences) transferableQuestions.push(`What prior knowledge and accessibility needs follow from the audience ${audiences}?`);
  else transferableQuestions.push("Which learner group is this design for, and what does that imply for language and challenge?");
  if (settings) transferableQuestions.push(`What facilitation, time, and technology constraints apply in ${settings}?`);
  else transferableQuestions.push("In what learning setting will the design be used, and what support will that setting provide?");
  transferableQuestions.push(mechanics
    ? `How should ${mechanics} change what the learner notices, considers, or reflects on?`
    : "Which interaction mechanic should connect the narrative form to the intended learning experience?");

  const limitations = [
    "The card is derived from a creator description and does not demonstrate learning effectiveness.",
    "Automatic rule coding passed a deterministic audit but not independent human double-coding.",
  ];
  if (missing.length) limitations.push(`The creator description did not state: ${missing.join(", ")}.`);
  if (!mechanics) limitations.push("No specific mechanic was stated; mechanic selection remains an open design decision.");
  if (coded.information_coverage.interaction_education_relationship === "interpreted") {
    limitations.push("Interaction and education were co-described; their relationship was normalized rather than explicitly established.");
  } else if (coded.information_coverage.interaction_education_relationship === "not_stated") {
    limitations.push("The relationship between interaction and educational intent was not stated.");
  }

  const retrievalParts = [
    `Interactive narrative form: ${forms}.`,
    purposes ? `Educational purpose: ${purposes}.` : "",
    audiences ? `Intended audience: ${audiences}.` : "",
    settings ? `Application setting: ${settings}.` : "",
    mechanics ? `Mechanics: ${mechanics}.` : "",
    relationships ? `Interaction–education relationship: ${relationships}.` : "",
    designPattern,
  ].filter(Boolean);

  return {
    schema_version: "knowledge-card/v1",
    knowledge_id: `kc-${coded.project_id}-v1-1`,
    knowledge_type: "case_precedent",
    quality_tier: coded.quality_tier,
    coverage_profile: coded.coverage_profile,
    source_ids: [coded.project_id],
    annotation_ids: [annotation.annotation_id],
    educational_purpose: dimension(coded, "educational_purpose", "Educational purpose"),
    intended_audience: dimension(coded, "intended_audience", "Intended audience"),
    application_setting: dimension(coded, "application_setting", "Application setting"),
    interactive_narrative_form: dimension(coded, "interactive_narrative_form", "Interactive narrative form"),
    if_mechanics: coded.labels.if_mechanics,
    interaction_education_relationship: dimension(
      coded,
      "interaction_education_relationship",
      "Interaction–education relationship",
    ),
    design_pattern: designPattern,
    applicability_conditions: applicabilityConditions,
    transferable_design_questions: transferableQuestions,
    limitations,
    confidence: coded.quality_tier === "A" ? "high" : coded.quality_tier === "B" ? "medium" : "low",
    retrieval_text: retrievalParts.join(" "),
    model_facing: true,
  };
}

function makeCodingRow(coded, audit, runAt) {
  const included = coded.review_status === "included" && audit.passed;
  const uncertain = coded.review_status === "uncertain" || !audit.passed;
  const writeEvidence = included || uncertain;
  const dimensionValue = (name) => {
    const value = coded.labels[name].join(" | ");
    return writeEvidence && value ? value : null;
  };
  const reasons = coded.exclusion_reasons.join(",") || "none";
  const notes = [
    `screening=${included ? "included" : uncertain ? "uncertain" : "excluded"}`,
    `coverage_profile=${included ? coded.coverage_profile : "unassigned"}`,
    `quality_tier=${included ? coded.quality_tier : "unassigned"}`,
    `rules=${CODING_RULES_VERSION}`,
    `inclusion_policy=${INCLUSION_POLICY}`,
    "review=deterministic_second_pass_rule_audit",
    "human_double_coding=pending",
    `reasons=${reasons}`,
  ].join("; ");
  return [
    dimensionValue("educational_purpose"),
    dimensionValue("intended_audience"),
    dimensionValue("application_setting"),
    dimensionValue("interactive_narrative_form"),
    dimensionValue("if_mechanics"),
    writeEvidence && coded.evidence_excerpt ? coded.evidence_excerpt : null,
    writeEvidence && coded.evidence_location_or_url ? coded.evidence_location_or_url : null,
    included ? "coded" : uncertain ? "uncertain" : "not_applicable",
    included ? coded.quality_tier === "A" ? "low" : "medium" : uncertain ? "high" : "low",
    CODER_ID,
    runAt,
    REVIEWER_ID,
    included || !uncertain ? "reviewed" : "needs_revision",
    notes,
  ];
}

function isV10MachineRow(row) {
  return String(row[12]) === "track-a-local-rules-v1"
    && String(row[14]) === "track-a-rule-audit-v1"
    && String(row[16]).includes("rules=itchio-track-a-coding-rules/v1.0")
    && String(row[16]).includes("human_double_coding=pending");
}

function validateObjects(schema, items, label) {
  for (const [index, item] of items.entries()) {
    const errors = validateFixture(schema, item);
    if (errors.length) throw new Error(`${label} ${index + 1} failed schema validation: ${errors.join("; ")}`);
  }
}

async function readSchema(name) {
  return JSON.parse(await readFile(path.join(repositoryRoot, "corpus", "schemas", name), "utf8"));
}

async function renderVerification(workbook, workDirectory) {
  const requests = [
    ["README", "A1:B40", "preview-readme-v1.1.png", 1],
    ["cases", "A1:Q8", "preview-cases-v1.1.png", 0.72],
    ["engagement", "A1:J33", "preview-engagement-v1.1.png", 1],
    ["field_coverage", "A1:H60", "preview-field-coverage-v1.1.png", 0.78],
    ["manual_review", "A1:M12", "preview-manual-review-v1.1.png", 1],
    ["coding", "A1:Q14", "preview-coding-v1.1.png", 0.82],
    ["provenance", "A1:U8", "preview-provenance-v1.1.png", 0.72],
  ];
  for (const [sheetName, range, fileName, scale] of requests) {
    const preview = await workbook.render({ sheetName, range, scale, format: "png" });
    await writeFile(path.join(workDirectory, fileName), new Uint8Array(await preview.arrayBuffer()));
  }
  return requests.map(([sheetName, range, fileName]) => ({ sheet_name: sheetName, range, file_name: fileName }));
}

async function run(options) {
  const workbookPath = path.resolve(options.workbook ?? defaultWorkbookPath);
  const snapshotId = safeSnapshotId(options["snapshot-id"] ?? defaultSnapshotId);
  const workbookDirectory = path.dirname(workbookPath);
  const workDirectory = path.join(workbookDirectory, ".work");
  const pendingWorkbookPath = path.join(workDirectory, `${snapshotId}.pending.xlsx`);
  const backupPath = path.join(workDirectory, "itchio-educational-if-candidates-v1.0.pre-v1.1-coding.bak");
  const annotationDirectory = path.join(repositoryRoot, "corpus", "annotations", annotationReleaseId);
  const snapshotDirectory = path.join(repositoryRoot, "corpus", "derived-knowledge", snapshotId);
  const runReportPath = path.join(workbookDirectory, `${snapshotId}-run-report.json`);

  assert(workbookPath === path.resolve(defaultWorkbookPath), "This v1.1 tool may edit only the canonical Track A workbook.");
  assert(await pathExists(workbookPath), `Workbook does not exist: ${workbookPath}`);
  assert(!(await pathExists(annotationDirectory)), `Annotation release already exists: ${annotationDirectory}`);
  assert(!(await pathExists(snapshotDirectory)), `Knowledge snapshot already exists: ${snapshotDirectory}`);

  const workbookHashBefore = await fileSha256(workbookPath);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
  const cases = workbook.worksheets.getItem("cases");
  const coding = workbook.worksheets.getItem("coding");
  const fieldCoverage = workbook.worksheets.getItem("field_coverage");
  const provenance = workbook.worksheets.getItem("provenance");
  const manualReview = workbook.worksheets.getItem("manual_review");
  const caseHeaders = cases.getRange("A1:AY1").values[0].map(String);
  const codingHeaders = coding.getRange("A1:Q1").values[0].map(String);
  const provenanceHeaders = provenance.getRange("A1:U1").values[0].map(String);
  const caseRows = cases.getRange("A2:AY607").values;
  const codingRows = coding.getRange("A2:Q607").values;
  const provenanceRows = provenance.getRange("A2:U607").values;
  const manualRows = manualReview.getRange("A1:M22").values;

  assert(caseRows.length === sourceRecordCount, `Expected ${sourceRecordCount} case rows.`);
  assert(codingRows.length === sourceRecordCount, `Expected ${sourceRecordCount} coding rows.`);
  assert(provenanceRows.length === sourceRecordCount, `Expected ${sourceRecordCount} provenance rows.`);
  assert(codingHeaders.join("|") === "project_id|title|url|educational_purpose|target_audience|application_setting|interactive_narrative_form|if_mechanics|evidence_excerpt|evidence_location_or_url|coding_status|uncertainty|coder|coded_at|reviewer|review_status|notes", "Unexpected coding headers.");
  assert(codingRows.every(isV10MachineRow), "Coding sheet is not the exact v1.0 machine-coded baseline; refusing to overwrite possible human edits.");

  const caseIds = caseRows.map((row) => String(row[0]));
  const codingIds = codingRows.map((row) => String(row[0]));
  const provenanceIndex = headerIndex(provenanceHeaders);
  const provenanceIds = provenanceRows.map((row) => String(row[provenanceIndex.project_id]));
  assert(caseIds.every((id, index) => id === codingIds[index] && id === provenanceIds[index]), "cases, coding, and provenance project IDs are misaligned.");
  assert(new Set(caseIds).size === sourceRecordCount, "Project IDs are not unique.");

  const runAt = utcNow();
  const codedCases = caseRows.map((row) => codeCase(normalizeRecord(caseHeaders, row)));
  const audits = codedCases.map(auditCodedCase);
  const promoted = codedCases
    .map((coded, index) => ({ coded, audit: audits[index], rowNumber: index + 2 }))
    .filter(({ coded, audit }) => coded.review_status === "included" && audit.passed);
  assert(promoted.length === expectedKnowledgeCardCount, `Expected ${expectedKnowledgeCardCount} promoted records, found ${promoted.length}.`);

  const screeningDecisions = codedCases.map((coded) => makeScreeningDecision(coded, runAt));
  const annotations = promoted.map(({ coded, rowNumber }) => makeAnnotation(coded, rowNumber, runAt));
  const knowledgeCards = promoted.map(({ coded }, index) => makeKnowledgeCard(coded, annotations[index]));
  const codingValues = codedCases.map((coded, index) => makeCodingRow(coded, audits[index], runAt));

  validateObjects(await readSchema("screening-decision.schema.json"), screeningDecisions, "screening decision");
  validateObjects(await readSchema("coding-annotation.schema.json"), annotations, "coding annotation");
  validateObjects(await readSchema("knowledge-card.schema.json"), knowledgeCards, "knowledge card");

  const forbiddenModelFacingKeys = ["description_clean", "evidence_excerpt", "record_path", "description_path", "source_url"];
  const serializedCards = JSON.stringify(knowledgeCards);
  for (const forbidden of forbiddenModelFacingKeys) {
    assert(!serializedCards.includes(forbidden), `Model-facing cards contain forbidden source field: ${forbidden}`);
  }

  const preservedHashes = {
    cases: sha256(JSON.stringify([caseHeaders, ...caseRows])),
    provenance: sha256(JSON.stringify([provenanceHeaders, ...provenanceRows])),
    manual_review: sha256(JSON.stringify(manualRows)),
  };
  coding.getRange("D2:Q607").values = codingValues;
  fieldCoverage.getRange("E56:E60").formulas = ["D", "E", "F", "G", "H"].map((column) => [`=COUNTA('coding'!$${column}$2:$${column}$607)`]);
  fieldCoverage.getRange("F56:F60").formulas = [56, 57, 58, 59, 60].map((row) => [`=E${row}/'README'!$B$10`]);

  await mkdir(workDirectory, { recursive: true });
  const exported = await SpreadsheetFile.exportXlsx(workbook);
  await exported.save(pendingWorkbookPath);
  const pending = await SpreadsheetFile.importXlsx(await FileBlob.load(pendingWorkbookPath));
  const pendingCases = pending.worksheets.getItem("cases");
  const pendingCoding = pending.worksheets.getItem("coding");
  const pendingCoverage = pending.worksheets.getItem("field_coverage");
  const pendingProvenance = pending.worksheets.getItem("provenance");
  const pendingManual = pending.worksheets.getItem("manual_review");
  assert(sha256(JSON.stringify(pendingCases.getRange("A1:AY607").values)) === preservedHashes.cases, "cases changed during workbook edit.");
  assert(sha256(JSON.stringify(pendingProvenance.getRange("A1:U607").values)) === preservedHashes.provenance, "provenance changed during workbook edit.");
  assert(sha256(JSON.stringify(pendingManual.getRange("A1:M22").values)) === preservedHashes.manual_review, "manual_review changed during workbook edit.");

  const writtenStatuses = pendingCoding.getRange("K2:K607").values.flat().map(String);
  const writtenReviews = pendingCoding.getRange("P2:P607").values.flat().map(String);
  const decisionCounts = countBy(codedCases, (coded) => coded.review_status);
  assert(countBy(writtenStatuses, (value) => value).coded === expectedKnowledgeCardCount, "Written coded count does not match the 122-record pool.");
  assert((countBy(writtenReviews, (value) => value).needs_revision ?? 0) === (decisionCounts.uncertain ?? 0), "Written needs_revision count does not match uncertain records.");

  const expectedCoverageCounts = [0, 1, 2, 3, 4].map((column) => codingValues.filter((row) => String(row[column] ?? "").trim()).length);
  const actualCoverageCounts = pendingCoverage.getRange("E56:E60").values.flat();
  assert(actualCoverageCounts.every((value, index) => value === expectedCoverageCounts[index]), `Coverage counts did not recalculate: ${actualCoverageCounts.join(", ")} expected ${expectedCoverageCounts.join(", ")}`);
  const formulaErrors = await pending.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "Track A v1.1 post-coding formula error scan",
  });
  assert(String(formulaErrors.ndjson).includes("matched 0 entries"), `Formula errors found: ${formulaErrors.ndjson}`);
  const previews = await renderVerification(pending, workDirectory);

  const screeningText = ndjson(screeningDecisions);
  const annotationText = ndjson(annotations);
  const cardText = ndjson(knowledgeCards);
  const tierCounts = countBy(promoted, ({ coded }) => coded.quality_tier);
  const coverageProfileCounts = countBy(promoted, ({ coded }) => coded.coverage_profile);
  const manifest = {
    schema_version: "knowledge-snapshot/v1",
    snapshot_id: snapshotId,
    created_at: runAt,
    source: {
      workbook_version: "1.0",
      source_derivation_id: "itchio-page-cleaning-full-001",
      workbook_sha256_before: workbookHashBefore,
      workbook_sha256_after: "0".repeat(64),
    },
    coding_rules_version: CODING_RULES_VERSION,
    inclusion_policy: INCLUSION_POLICY,
    annotation_release_id: annotationReleaseId,
    review: {
      method: "deterministic_second_pass_rule_audit",
      human_double_coding_complete: false,
    },
    counts: {
      source_records: sourceRecordCount,
      included: decisionCounts.included ?? 0,
      excluded: decisionCounts.excluded ?? 0,
      uncertain: decisionCounts.uncertain ?? 0,
      knowledge_cards: knowledgeCards.length,
      tier_a: tierCounts.A ?? 0,
      tier_b: tierCounts.B ?? 0,
      tier_c: tierCounts.C ?? 0,
      complete_core: coverageProfileCounts.complete_core ?? 0,
      partial_substantive: coverageProfileCounts.partial_substantive ?? 0,
    },
    files: {
      knowledge_cards: "knowledge-cards.ndjson",
      knowledge_cards_sha256: sha256(cardText),
      screening_decisions_sha256: sha256(screeningText),
      coding_annotations_sha256: sha256(annotationText),
    },
    limitations: [
      "The snapshot covers public itch.io creator descriptions, not the broader educational Interactive Fiction population.",
      "The scoped substantive-OR policy admits partial records and preserves unstated fields rather than inferring them.",
      "Deterministic review is complete, but independent human double-coding is not.",
      "Creator-described educational purpose is not evidence of learning effectiveness.",
    ],
    model_facing: true,
  };

  if (!(await pathExists(backupPath))) await copyFile(workbookPath, backupPath);
  assert(await fileSha256(backupPath) === workbookHashBefore, "Pre-v1.1 workbook backup hash mismatch.");
  await copyFile(pendingWorkbookPath, workbookPath);
  const workbookHashAfter = await fileSha256(workbookPath);
  manifest.source.workbook_sha256_after = workbookHashAfter;
  validateObjects(await readSchema("knowledge-snapshot.schema.json"), [manifest], "knowledge snapshot manifest");

  await mkdir(annotationDirectory, { recursive: false });
  await mkdir(snapshotDirectory, { recursive: false });
  await writeAtomic(path.join(annotationDirectory, "screening-decisions.ndjson"), screeningText);
  await writeAtomic(path.join(annotationDirectory, "coding-annotations.ndjson"), annotationText);
  await writeAtomic(path.join(snapshotDirectory, "knowledge-cards.ndjson"), cardText);
  await writeAtomic(path.join(snapshotDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const runReport = {
    schema_version: "track-a-knowledge-build-run/v1",
    snapshot_id: snapshotId,
    completed_at: runAt,
    workbook_path: path.relative(repositoryRoot, workbookPath).replaceAll("\\", "/"),
    workbook_sha256_before: workbookHashBefore,
    workbook_sha256_after: workbookHashAfter,
    backup_path: path.relative(repositoryRoot, backupPath).replaceAll("\\", "/"),
    coding_rules_version: CODING_RULES_VERSION,
    inclusion_policy: INCLUSION_POLICY,
    decision_counts: decisionCounts,
    quality_tier_counts: tierCounts,
    coverage_profile_counts: coverageProfileCounts,
    coding_status_counts: countBy(writtenStatuses, (value) => value),
    review_status_counts: countBy(writtenReviews, (value) => value),
    coding_field_coverage_counts: expectedCoverageCounts,
    artifact_hashes: manifest.files,
    formula_error_scan: formulaErrors.ndjson,
    visual_previews: previews,
    human_double_coding_complete: false,
  };
  await writeAtomic(runReportPath, `${JSON.stringify(runReport, null, 2)}\n`);
  await rm(pendingWorkbookPath, { force: true });

  console.log(JSON.stringify({
    snapshot_id: snapshotId,
    workbook_path: workbookPath,
    workbook_sha256_before: workbookHashBefore,
    workbook_sha256_after: workbookHashAfter,
    decision_counts: decisionCounts,
    quality_tier_counts: tierCounts,
    coverage_profile_counts: coverageProfileCounts,
    knowledge_card_count: knowledgeCards.length,
    coding_field_coverage_counts: expectedCoverageCounts,
    annotation_directory: annotationDirectory,
    snapshot_directory: snapshotDirectory,
    run_report_path: runReportPath,
    formula_error_scan: formulaErrors.ndjson,
  }, null, 2));
}

export async function main(argv = process.argv.slice(2)) {
  await run(parseArguments(argv));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  });
}

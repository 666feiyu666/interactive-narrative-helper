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
  normalizeRecord,
  REVIEWER_ID,
} from "./coding-rules.mjs";
import { canonicalTrackAWorkbookPath } from "./track-a-workbook-path.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const defaultWorkbookPath = canonicalTrackAWorkbookPath;
const defaultSnapshotId = "track-a-itchio-v1.0-knowledge-v1";
const sourceRecordCount = 606;

function parseArguments(argv) {
  const args = [...argv];
  const command = args.shift();
  if (!["apply", "repair-coverage"].includes(command)) {
    throw new Error("Usage: build-track-a-knowledge.mjs <apply|repair-coverage> --confirm-workbook-write [--workbook <path>] [--snapshot-id <id>]");
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

function safeSnapshotId(value) {
  if (!/^[a-z][a-z0-9._-]*$/.test(value)) {
    throw new Error(`Invalid snapshot ID: ${value}`);
  }
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function dimension(status, labels, name) {
  return {
    status,
    labels,
    summary: labels.length
      ? `${name}: ${labelText(labels)}.`
      : `${name} was not stated by the available creator description.`,
  };
}

function sourceWordCount(excerpt) {
  return excerpt
    .replace(/\b(?:purpose|audience|setting|form):/gi, "")
    .replace(/\|/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
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
    exclusion_reasons: coded.exclusion_reasons,
    reviewer_id: REVIEWER_ID,
    reviewed_at: runAt,
    review_notes: coded.review_status === "uncertain"
      ? "Deterministic rule review requires human revision before promotion."
      : "Deterministic second-pass rule audit; independent human double-coding is pending.",
  };
}

function makeAnnotation(coded, rowNumber, runAt) {
  const relationshipStatus = coded.information_coverage.interaction_education_relationship === "explicit"
    ? "explicit"
    : "normalized";
  return {
    schema_version: "coding-annotation/v1",
    annotation_id: `ann-${coded.project_id}-v1`,
    project_id: coded.project_id,
    coding_rules_version: CODING_RULES_VERSION,
    coder_id: CODER_ID,
    reviewer_id: REVIEWER_ID,
    review_status: "reviewed",
    coded_at: runAt,
    reviewed_at: runAt,
    evidence: {
      workbook_reference: `cases!E${rowNumber}`,
      source_url: coded.url,
      source_fields: ["description_clean", "genres_raw", "tags_raw", "languages_raw", "quality_status"],
      minimal_excerpt: coded.evidence_excerpt,
      source_word_count: sourceWordCount(coded.evidence_excerpt),
    },
    educational_purpose: dimension("explicit", coded.labels.educational_purpose, "Educational purpose"),
    intended_audience: dimension("explicit", coded.labels.intended_audience, "Intended audience"),
    application_setting: dimension("explicit", coded.labels.application_setting, "Application setting"),
    interactive_narrative_form: dimension("explicit", coded.labels.interactive_narrative_form, "Interactive narrative form"),
    if_mechanics: coded.labels.if_mechanics,
    interaction_education_relationship: dimension(
      relationshipStatus,
      coded.labels.interaction_education_relationship,
      "Interaction–education relationship",
    ),
    limitations: [
      "The coding represents creator positioning, not measured learning effectiveness.",
      "The deterministic audit has not been independently replicated by a human coder.",
    ],
  };
}

function makeKnowledgeCard(coded, annotation) {
  const purposes = labelText(coded.labels.educational_purpose);
  const audiences = labelText(coded.labels.intended_audience);
  const settings = labelText(coded.labels.application_setting);
  const forms = labelText(coded.labels.interactive_narrative_form);
  const mechanics = labelText(coded.labels.if_mechanics);
  const relationshipStatus = coded.information_coverage.interaction_education_relationship === "explicit"
    ? "explicit"
    : "normalized";
  const designPattern = coded.quality_tier === "A"
    ? `Use ${forms} with ${mechanics} to make ${purposes} explorable for ${audiences} in ${settings}.`
    : `This precedent combines ${forms} and ${mechanics} with ${purposes} for ${audiences} in ${settings}; the pedagogical mechanism remains a transfer hypothesis.`;
  const limitations = [
    "The card is derived from a creator description and does not demonstrate learning effectiveness.",
    "Automatic rule coding passed a deterministic audit but not independent human double-coding.",
  ];
  if (coded.quality_tier === "B") {
    limitations.push("Interaction and education were co-described; their relationship was normalized rather than explicitly established.");
  }
  return {
    schema_version: "knowledge-card/v1",
    knowledge_id: `kc-${coded.project_id}-v1`,
    knowledge_type: "case_precedent",
    quality_tier: coded.quality_tier,
    source_ids: [coded.project_id],
    annotation_ids: [annotation.annotation_id],
    educational_purpose: dimension("explicit", coded.labels.educational_purpose, "Educational purpose"),
    intended_audience: dimension("explicit", coded.labels.intended_audience, "Intended audience"),
    application_setting: dimension("explicit", coded.labels.application_setting, "Application setting"),
    interactive_narrative_form: dimension("explicit", coded.labels.interactive_narrative_form, "Interactive narrative form"),
    interaction_education_relationship: dimension(
      relationshipStatus,
      coded.labels.interaction_education_relationship,
      "Interaction–education relationship",
    ),
    design_pattern: designPattern,
    applicability_conditions: [
      `The intended audience overlaps with ${audiences}.`,
      `The design can be situated in ${settings}.`,
      `The implementation can support ${forms} and the mechanics ${mechanics}.`,
    ],
    transferable_design_questions: [
      `Which aspects of ${purposes} should the audience encounter through action rather than exposition?`,
      `How should ${mechanics} change what the learner notices, considers, or reflects on?`,
      `What evidence would be needed before claiming that the design is educationally effective?`,
    ],
    limitations,
    confidence: coded.quality_tier === "A" ? "high" : "medium",
    retrieval_text: [
      `Educational purpose: ${purposes}.`,
      `Intended audience: ${audiences}.`,
      `Application setting: ${settings}.`,
      `Interactive narrative form: ${forms}.`,
      `Mechanics: ${mechanics}.`,
      designPattern,
    ].join(" "),
    model_facing: true,
  };
}

function makeCodingRow(coded, audit, runAt) {
  const included = coded.review_status === "included" && audit.passed;
  const uncertain = coded.review_status === "uncertain" || !audit.passed;
  const dimensionValue = (name) => included || uncertain ? coded.labels[name].join(" | ") : "";
  const reasons = coded.exclusion_reasons.join(",") || "none";
  const notes = [
    `screening=${included ? "included" : uncertain ? "uncertain" : "excluded"}`,
    `quality_tier=${included ? coded.quality_tier : "unassigned"}`,
    `rules=${CODING_RULES_VERSION}`,
    `review=deterministic_second_pass_rule_audit`,
    `human_double_coding=pending`,
    `reasons=${reasons}`,
  ].join("; ");
  return [
    dimensionValue("educational_purpose"),
    dimensionValue("intended_audience"),
    dimensionValue("application_setting"),
    dimensionValue("interactive_narrative_form"),
    dimensionValue("if_mechanics"),
    included || uncertain ? coded.evidence_excerpt : "",
    included || uncertain ? coded.evidence_location_or_url : "",
    included ? "coded" : uncertain ? "uncertain" : "not_applicable",
    included ? coded.quality_tier === "A" ? "low" : "medium" : uncertain ? "high" : "low",
    CODER_ID,
    runAt,
    REVIEWER_ID,
    included || !uncertain ? "reviewed" : "needs_revision",
    notes,
  ];
}

function pristineCodingRow(row) {
  const editable = row.slice(3);
  return editable.slice(0, 7).every((value) => value === "" || value === null)
    && editable[7] === "not_started"
    && (editable[8] === "" || editable[8] === null)
    && editable.slice(9, 12).every((value) => value === "" || value === null)
    && editable[12] === "not_reviewed"
    && (editable[13] === "" || editable[13] === null);
}

function validateObjects(schema, items, label) {
  for (const [index, item] of items.entries()) {
    const errors = validateFixture(schema, item);
    if (errors.length) {
      throw new Error(`${label} ${index + 1} failed schema validation: ${errors.join("; ")}`);
    }
  }
}

async function readSchema(name) {
  return JSON.parse(await readFile(path.join(repositoryRoot, "corpus", "schemas", name), "utf8"));
}

async function renderVerification(workbook, workDirectory) {
  const requests = [
    ["README", "A1:B40", "preview-readme-after.png", 1],
    ["cases", "A1:Q8", "preview-cases-after.png", 0.72],
    ["engagement", "A1:J33", "preview-engagement-after.png", 1],
    ["field_coverage", "A1:H60", "preview-field-coverage-after.png", 0.78],
    ["manual_review", "A1:M12", "preview-manual-review-after.png", 1],
    ["coding", "A1:Q12", "preview-coding-after.png", 0.82],
    ["provenance", "A1:U8", "preview-provenance-after.png", 0.72],
  ];
  for (const [sheetName, range, fileName, scale] of requests) {
    const preview = await workbook.render({ sheetName, range, scale, format: "png" });
    await writeFile(path.join(workDirectory, fileName), new Uint8Array(await preview.arrayBuffer()));
  }
  return requests.map(([sheetName, range, fileName]) => ({ sheet_name: sheetName, range, file_name: fileName }));
}

async function repairCoverage(options) {
  const workbookPath = path.resolve(options.workbook ?? defaultWorkbookPath);
  const snapshotId = safeSnapshotId(options["snapshot-id"] ?? defaultSnapshotId);
  const workbookDirectory = path.dirname(workbookPath);
  const workDirectory = path.join(workbookDirectory, ".work");
  const pendingWorkbookPath = path.join(workDirectory, `${snapshotId}.coverage-repair.pending.xlsx`);
  const repairBackupPath = path.join(workDirectory, "itchio-educational-if-candidates-v1.0.pre-coverage-repair.bak");
  const snapshotManifestPath = path.join(repositoryRoot, "corpus", "derived-knowledge", snapshotId, "manifest.json");
  const runReportPath = path.join(workbookDirectory, `${snapshotId}-run-report.json`);
  assert(workbookPath === path.resolve(defaultWorkbookPath), "This v1.0 tool may edit only the canonical Track A workbook.");
  assert(await pathExists(workbookPath), `Workbook does not exist: ${workbookPath}`);
  assert(await pathExists(snapshotManifestPath), `Snapshot manifest does not exist: ${snapshotManifestPath}`);
  assert(await pathExists(runReportPath), `Run report does not exist: ${runReportPath}`);

  const workbookHashBeforeRepair = await fileSha256(workbookPath);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
  const coding = workbook.worksheets.getItem("coding");
  const fieldCoverage = workbook.worksheets.getItem("field_coverage");
  const codingRows = coding.getRange("D2:Q607").values;
  assert(codingRows.every((row) => row[9] === CODER_ID && row[11] === REVIEWER_ID && String(row[13]).includes(`rules=${CODING_RULES_VERSION}`)), "Coverage repair accepts only the exact machine-coded v1.0 workbook.");

  const expectedCounts = [0, 1, 2, 3, 4].map((column) => codingRows.filter((row) => String(row[column] ?? "").trim()).length);
  const countFormulas = ["D", "E", "F", "G", "H"].map((column) => [`=COUNTA('coding'!$${column}$2:$${column}$607)`]);
  const pctFormulas = [56, 57, 58, 59, 60].map((row) => [`=E${row}/'README'!$B$10`]);
  fieldCoverage.getRange("E56:E60").formulas = countFormulas;
  fieldCoverage.getRange("F56:F60").formulas = pctFormulas;

  const exported = await SpreadsheetFile.exportXlsx(workbook);
  await exported.save(pendingWorkbookPath);
  const pending = await SpreadsheetFile.importXlsx(await FileBlob.load(pendingWorkbookPath));
  const pendingCoverage = pending.worksheets.getItem("field_coverage");
  const actualCounts = pendingCoverage.getRange("E56:E60").values.flat();
  const actualRatios = pendingCoverage.getRange("F56:F60").values.flat();
  assert(actualCounts.every((value, index) => value === expectedCounts[index]), `Coverage counts did not recalculate: ${actualCounts.join(", ")} expected ${expectedCounts.join(", ")}`);
  assert(actualRatios.every((value, index) => Math.abs(value - expectedCounts[index] / sourceRecordCount) < 1e-10), "Coverage percentages did not recalculate.");
  const formulaErrors = await pending.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "Track A coverage repair formula error scan",
  });
  assert(String(formulaErrors.ndjson).includes("matched 0 entries"), `Formula errors found: ${formulaErrors.ndjson}`);
  const preview = await pending.render({ sheetName: "field_coverage", range: "A1:H60", scale: 0.78, format: "png" });
  const previewPath = path.join(workDirectory, "preview-field-coverage-after.png");
  await writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

  if (!(await pathExists(repairBackupPath))) await copyFile(workbookPath, repairBackupPath);
  assert(await fileSha256(repairBackupPath) === workbookHashBeforeRepair, "Coverage-repair backup hash mismatch.");
  await copyFile(pendingWorkbookPath, workbookPath);
  const workbookHashAfterRepair = await fileSha256(workbookPath);

  const manifest = JSON.parse(await readFile(snapshotManifestPath, "utf8"));
  assert(manifest.snapshot_id === snapshotId, "Snapshot ID mismatch during coverage repair.");
  manifest.source.workbook_sha256_after = workbookHashAfterRepair;
  validateObjects(await readSchema("knowledge-snapshot.schema.json"), [manifest], "knowledge snapshot manifest");
  await writeAtomic(snapshotManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const report = JSON.parse(await readFile(runReportPath, "utf8"));
  report.workbook_sha256_after = workbookHashAfterRepair;
  report.repairs = [
    ...(report.repairs ?? []),
    {
      repaired_at: utcNow(),
      issue: "Imported field_coverage formulas retained pre-coding cached values.",
      action: "Replaced five coverage formulas with bounded COUNTA formulas and verified counts and percentages.",
      workbook_sha256_before_repair: workbookHashBeforeRepair,
      workbook_sha256_after_repair: workbookHashAfterRepair,
      coverage_counts: expectedCounts,
    },
  ];
  await writeAtomic(runReportPath, `${JSON.stringify(report, null, 2)}\n`);
  await rm(pendingWorkbookPath, { force: true });

  console.log(JSON.stringify({
    workbook_path: workbookPath,
    workbook_sha256_before_repair: workbookHashBeforeRepair,
    workbook_sha256_after_repair: workbookHashAfterRepair,
    coverage_counts: expectedCounts,
    coverage_ratios: expectedCounts.map((count) => count / sourceRecordCount),
    formula_error_scan: formulaErrors.ndjson,
    preview_path: previewPath,
  }, null, 2));
}

async function run(options) {
  const workbookPath = path.resolve(options.workbook ?? defaultWorkbookPath);
  const snapshotId = safeSnapshotId(options["snapshot-id"] ?? defaultSnapshotId);
  const workbookDirectory = path.dirname(workbookPath);
  const workDirectory = path.join(workbookDirectory, ".work");
  const pendingWorkbookPath = path.join(workDirectory, `${snapshotId}.pending.xlsx`);
  const backupPath = path.join(workDirectory, "itchio-educational-if-candidates-v1.0.pre-track-a-coding.bak");
  const annotationDirectory = path.join(repositoryRoot, "corpus", "annotations", "track-a-itchio-v1.0");
  const snapshotDirectory = path.join(repositoryRoot, "corpus", "derived-knowledge", snapshotId);
  const runReportPath = path.join(workbookDirectory, `${snapshotId}-run-report.json`);
  assert(workbookPath === path.resolve(defaultWorkbookPath), "This v1.0 tool may edit only the canonical Track A workbook.");
  assert(await pathExists(workbookPath), `Workbook does not exist: ${workbookPath}`);
  assert(!(await pathExists(annotationDirectory)), `Annotation release already exists: ${annotationDirectory}`);
  assert(!(await pathExists(snapshotDirectory)), `Knowledge snapshot already exists: ${snapshotDirectory}`);

  const workbookHashBefore = await fileSha256(workbookPath);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
  const cases = workbook.worksheets.getItem("cases");
  const coding = workbook.worksheets.getItem("coding");
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
  assert(codingRows.every(pristineCodingRow), "Coding sheet contains existing edits; refusing to overwrite them.");

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
  const screeningDecisions = codedCases.map((coded) => makeScreeningDecision(coded, runAt));
  const annotations = promoted.map(({ coded, rowNumber }) => makeAnnotation(coded, rowNumber, runAt));
  const knowledgeCards = promoted.map(({ coded }, index) => makeKnowledgeCard(coded, annotations[index]));
  const codingValues = codedCases.map((coded, index) => makeCodingRow(coded, audits[index], runAt));

  validateObjects(await readSchema("screening-decision.schema.json"), screeningDecisions, "screening decision");
  validateObjects(await readSchema("coding-annotation.schema.json"), annotations, "coding annotation");
  validateObjects(await readSchema("knowledge-card.schema.json"), knowledgeCards, "knowledge card");
  assert(knowledgeCards.length > 0, "No records passed promotion; refusing to create an empty snapshot.");
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
  const exported = await SpreadsheetFile.exportXlsx(workbook);
  await exported.save(pendingWorkbookPath);

  const pending = await SpreadsheetFile.importXlsx(await FileBlob.load(pendingWorkbookPath));
  const pendingCases = pending.worksheets.getItem("cases");
  const pendingCoding = pending.worksheets.getItem("coding");
  const pendingProvenance = pending.worksheets.getItem("provenance");
  const pendingManual = pending.worksheets.getItem("manual_review");
  assert(sha256(JSON.stringify(pendingCases.getRange("A1:AY607").values)) === preservedHashes.cases, "cases changed during workbook edit.");
  assert(sha256(JSON.stringify(pendingProvenance.getRange("A1:U607").values)) === preservedHashes.provenance, "provenance changed during workbook edit.");
  assert(sha256(JSON.stringify(pendingManual.getRange("A1:M22").values)) === preservedHashes.manual_review, "manual_review changed during workbook edit.");
  const writtenStatuses = pendingCoding.getRange("K2:K607").values.flat().map(String);
  const writtenReviews = pendingCoding.getRange("P2:P607").values.flat().map(String);
  assert(countBy(writtenStatuses, (value) => value).coded === promoted.length, "Written coded count does not match promoted records.");
  assert((countBy(writtenReviews, (value) => value).needs_revision ?? 0) === codedCases.filter((coded) => coded.review_status === "uncertain").length, "Written needs_revision count does not match uncertain records.");
  const formulaErrors = await pending.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "Track A post-coding formula error scan",
  });
  assert(String(formulaErrors.ndjson).includes("matched 0 entries"), `Formula errors found: ${formulaErrors.ndjson}`);
  const previews = await renderVerification(pending, workDirectory);

  if (!(await pathExists(backupPath))) await copyFile(workbookPath, backupPath);
  assert(await fileSha256(backupPath) === workbookHashBefore, "Workbook backup hash mismatch.");
  await copyFile(pendingWorkbookPath, workbookPath);
  const workbookHashAfter = await fileSha256(workbookPath);

  const screeningText = ndjson(screeningDecisions);
  const annotationText = ndjson(annotations);
  const cardText = ndjson(knowledgeCards);
  const counts = countBy(codedCases, (coded) => coded.review_status);
  const tierCounts = countBy(promoted, ({ coded }) => coded.quality_tier);
  const manifest = {
    schema_version: "knowledge-snapshot/v1",
    snapshot_id: snapshotId,
    created_at: runAt,
    source: {
      workbook_version: "1.0",
      source_derivation_id: "itchio-page-cleaning-full-001",
      workbook_sha256_before: workbookHashBefore,
      workbook_sha256_after: workbookHashAfter,
    },
    coding_rules_version: CODING_RULES_VERSION,
    review: {
      method: "deterministic_second_pass_rule_audit",
      human_double_coding_complete: false,
    },
    counts: {
      source_records: sourceRecordCount,
      included: counts.included ?? 0,
      excluded: counts.excluded ?? 0,
      uncertain: counts.uncertain ?? 0,
      knowledge_cards: knowledgeCards.length,
      tier_a: tierCounts.A ?? 0,
      tier_b: tierCounts.B ?? 0,
    },
    files: {
      knowledge_cards: "knowledge-cards.ndjson",
      knowledge_cards_sha256: sha256(cardText),
      screening_decisions_sha256: sha256(screeningText),
      coding_annotations_sha256: sha256(annotationText),
    },
    limitations: [
      "The snapshot covers public itch.io creator descriptions, not the broader educational Interactive Fiction population.",
      "The strict rules omit implicit or differently worded evidence and may contain local language-detection error.",
      "Deterministic review is complete, but independent human double-coding is not.",
      "Creator-described educational purpose is not evidence of learning effectiveness.",
    ],
    model_facing: true,
  };
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
    decision_counts: counts,
    quality_tier_counts: tierCounts,
    coding_status_counts: countBy(writtenStatuses, (value) => value),
    review_status_counts: countBy(writtenReviews, (value) => value),
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
    decision_counts: counts,
    quality_tier_counts: tierCounts,
    knowledge_card_count: knowledgeCards.length,
    annotation_directory: annotationDirectory,
    snapshot_directory: snapshotDirectory,
    run_report_path: runReportPath,
    formula_error_scan: formulaErrors.ndjson,
  }, null, 2));
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.command === "repair-coverage") await repairCoverage(options);
  else await run(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  });
}

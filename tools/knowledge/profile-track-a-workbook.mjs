import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import { auditCodedCase, codeCase, normalizeRecord } from "./coding-rules.mjs";

const workbookPath = process.argv[2];
if (!workbookPath) {
  throw new Error("Usage: node tools/knowledge/profile-track-a-workbook.mjs <workbook-path>");
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const cases = workbook.worksheets.getItem("cases");
const coding = workbook.worksheets.getItem("coding");
const fieldCoverage = workbook.worksheets.getItem("field_coverage");
const headers = cases.getRange("A1:AY1").values[0].map(String);
const rows = cases.getRange("A2:AY607").values;
const codingHeaders = coding.getRange("A1:Q1").values[0].map(String);
const codingRows = coding.getRange("A2:Q607").values;
const index = Object.fromEntries(headers.map((header, column) => [header, column]));

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const countMatches = (patterns) => rows.filter((row) => {
  const text = normalize(row[index.description_clean]);
  return patterns.some((pattern) => pattern.test(text));
}).length;
const frequency = (field) => {
  const counts = new Map();
  for (const row of rows) {
    const value = normalize(row[index[field]]) || "(blank)";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([value, count]) => ({ value, count }));
};
const splitFrequency = (field) => {
  const counts = new Map();
  for (const row of rows) {
    const values = normalize(row[index[field]])
      .split(/[|,;]/)
      .map((value) => value.trim())
      .filter(Boolean);
    for (const value of new Set(values)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([value, count]) => ({ value, count }));
};

const familyPatterns = {
  education_action: [
    /\bteach(?:es|ing)?\b/i,
    /\blearn(?:s|ed|ing)?\b/i,
    /\beducat(?:e|es|ed|ing|ion|ional)\b/i,
    /\bpractice\b/i,
    /\bunderstand(?:ing)?\b/i,
    /\braise(?:s|d|ing)? awareness\b/i,
  ],
  audience: [
    /\bchildren\b|\bkids?\b|\byoung people\b/i,
    /\bstudents?\b|\blearners?\b|\bpupils?\b/i,
    /\bteachers?\b|\beducators?\b/i,
    /\bteens?\b|\badolescents?\b|\byoung adults?\b/i,
    /\bparents?\b|\bfamil(?:y|ies)\b/i,
    /\bprofessionals?\b|\btrainees?\b/i,
    /\bages?\s+\d/i,
  ],
  application_setting: [
    /\bclassrooms?\b|\bschools?\b/i,
    /\blessons?\b|\bcurriculum\b|\bcourses?\b/i,
    /\bworkshops?\b|\btraining\b/i,
    /\bmuseums?\b|\bexhibitions?\b|\bgaller(?:y|ies)\b/i,
    /\bhome\b|\bself[- ](?:guided|directed|paced)\b/i,
    /\buniversit(?:y|ies)\b|\bcollege\b|\bhigher education\b/i,
  ],
  narrative_form: [
    /\binteractive fiction\b|\binteractive stor(?:y|ies)\b/i,
    /\bvisual novel\b/i,
    /\bchoose your own adventure\b|\bchoice[- ]based\b/i,
    /\bbranch(?:ing|ed)\b|\bmultiple endings?\b/i,
    /\btext adventure\b|\btext[- ]based\b/i,
    /\brole[- ]?play(?:ing)?\b|\brpg\b/i,
  ],
  interaction_learning_link: [
    /\bchoices?\b.{0,80}\bconsequences?\b|\bconsequences?\b.{0,80}\bchoices?\b/i,
    /\brole[- ]?play\b.{0,80}\b(?:learn|understand|explore|experience)\b/i,
    /\bsimulat(?:e|es|ed|ing|ion)\b.{0,80}\b(?:learn|practice|understand|experience)\b/i,
    /\breflection\b|\breflect on\b|\bperspective[- ]taking\b/i,
  ],
};

const descriptionWordCounts = rows.map((row) => normalize(row[index.description_clean]).split(/\s+/).filter(Boolean).length);
descriptionWordCounts.sort((a, b) => a - b);
const quantile = (p) => descriptionWordCounts[Math.floor((descriptionWordCounts.length - 1) * p)];
const codingStatusIndex = codingHeaders.indexOf("coding_status");
const reviewStatusIndex = codingHeaders.indexOf("review_status");
const codedCases = rows.map((row) => codeCase(normalizeRecord(headers, row)));
const auditedCases = codedCases.map((coded) => ({ coded, audit: auditCodedCase(coded) }));
const groupCount = (items, keyOf) => {
  const counts = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])));
};
const includedPilot = auditedCases
  .filter(({ coded, audit }) => coded.review_status === "included" && audit.passed)
  .slice(0, 30)
  .map(({ coded }) => ({
    project_id: coded.project_id,
    title: coded.title,
    quality_tier: coded.quality_tier,
    labels: coded.labels,
    evidence_excerpt: coded.evidence_excerpt,
  }));

console.log(JSON.stringify({
  workbook_path: workbookPath,
  case_headers: headers,
  coding_headers: codingHeaders,
  row_count: rows.length,
  coding_status_counts: Object.fromEntries(Object.entries(Object.groupBy(codingRows, (row) => normalize(row[codingStatusIndex]) || "(blank)")).map(([key, group]) => [key, group.length])),
  review_status_counts: Object.fromEntries(Object.entries(Object.groupBy(codingRows, (row) => normalize(row[reviewStatusIndex]) || "(blank)")).map(([key, group]) => [key, group.length])),
  description_words: {
    min: descriptionWordCounts[0],
    p25: quantile(0.25),
    median: quantile(0.5),
    p75: quantile(0.75),
    max: descriptionWordCounts.at(-1),
  },
  languages_raw: frequency("languages_raw"),
  genres_raw: splitFrequency("genres_raw"),
  tags_raw: splitFrequency("tags_raw"),
  keyword_family_coverage: Object.fromEntries(Object.entries(familyPatterns).map(([name, patterns]) => [name, countMatches(patterns)])),
  proposed_screening: {
    decision_counts: groupCount(codedCases, (coded) => coded.review_status),
    quality_tier_counts: groupCount(codedCases, (coded) => coded.quality_tier),
    audit_counts: groupCount(auditedCases, ({ audit }) => audit.review_status),
    audit_failure_counts: groupCount(auditedCases.flatMap(({ audit }) => audit.failures), (failure) => failure),
    exclusion_reason_counts: groupCount(codedCases.flatMap((coded) => coded.exclusion_reasons), (reason) => reason),
    exclusion_reason_combinations: groupCount(
      codedCases,
      (coded) => coded.exclusion_reasons.slice().sort().join(" + ") || "none",
    ),
    included_label_counts: Object.fromEntries([
      "educational_purpose",
      "intended_audience",
      "application_setting",
      "interactive_narrative_form",
      "if_mechanics",
      "interaction_education_relationship",
    ].map((dimension) => [
      dimension,
      groupCount(
        codedCases.filter((coded) => coded.review_status === "included").flatMap((coded) => coded.labels[dimension]),
        (label) => label,
      ),
    ])),
    included_pilot: includedPilot,
  },
  coding_field_coverage: {
    values: fieldCoverage.getRange("E56:F60").values,
    formulas: fieldCoverage.getRange("E56:F60").formulas,
  },
}, null, 2));

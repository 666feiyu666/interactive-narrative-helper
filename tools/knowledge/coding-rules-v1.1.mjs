import { codeCase as codeCaseV10 } from "./coding-rules.mjs";

export const CODING_RULES_VERSION = "itchio-track-a-coding-rules/v1.1";
export const CODER_ID = "track-a-local-rules-v1-1";
export const REVIEWER_ID = "track-a-rule-audit-v1-1";
export const INCLUSION_POLICY = "scoped-substantive-or/v1";

const substantiveDimensions = [
  "educational_purpose",
  "intended_audience",
  "application_setting",
  "interaction_education_relationship",
];

const relationshipEvidencePattern = /\bchoices?\b.{0,100}\b(?:learn|understand|awareness|reflect|consequences?)\b|\b(?:learn|understand|awareness|reflect)\b.{0,100}\bchoices?\b|\brole[- ]?play(?:ing)?\b.{0,100}\b(?:learn|understand|explore|experience|empathy)\b|\bsimulat(?:e|es|ed|ing|ion)\b.{0,100}\b(?:learn|practice|understand|experience|train)\b|\b(?:learn|practice|understand|train)\b.{0,100}\bsimulat(?:e|es|ed|ing|ion)\b|\b(?:reflection|reflect on|perspective[- ]taking)\b|\bpuzzles?\b.{0,100}\b(?:learn|practice|understand|knowledge)\b/i;

function isSupported(status) {
  return status === "explicit" || status === "interpreted";
}

function evidenceWordCount(excerpt) {
  return String(excerpt ?? "")
    .replace(/\b(?:purpose|audience|setting|form):/gi, "")
    .replace(/\|/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function unique(values) {
  return [...new Set(values)];
}

function evidenceFragment(text, pattern, wordLimit = 7) {
  const match = pattern.exec(String(text ?? ""));
  if (!match) return null;
  const before = String(text).slice(0, match.index).split(/\s+/).filter(Boolean).slice(-2);
  const hit = match[0].split(/\s+/).filter(Boolean);
  const after = String(text).slice(match.index + match[0].length).split(/\s+/).filter(Boolean).slice(0, 2);
  return [...before, ...hit, ...after]
    .slice(0, wordLimit)
    .join(" ")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function relationshipOnlyEvidence(record, coded) {
  const description = String(record.description_clean ?? "").replace(/\s+/g, " ").trim();
  const relationship = evidenceFragment(description, relationshipEvidencePattern);
  if (!relationship) return coded.evidence_excerpt;
  const formMatch = /(?:^|\|\s*)form:\s*([^|]+)/i.exec(coded.evidence_excerpt);
  const form = formMatch?.[1]?.trim();
  return [`relationship: ${relationship}`, form ? `form: ${form}` : ""].filter(Boolean).join(" | ");
}

export function codeCase(record) {
  const coded = codeCaseV10(record);
  const coverage = coded.information_coverage;
  const hasDescription = !coded.exclusion_reasons.includes("missing_description");
  const englishHighConfidence = coded.language.isEnglish && coded.language.confidence === "high";
  const qualityOk = !coded.diagnostics.qualityException;
  const formExplicit = coverage.interactive_narrative_form === "explicit";
  const substantiveSupported = substantiveDimensions.filter((name) => isSupported(coverage[name]));
  const scopeEligible = hasDescription && englishHighConfidence && qualityOk && formExplicit;
  const completeCore = [
    "educational_purpose",
    "intended_audience",
    "application_setting",
    "interactive_narrative_form",
  ].every((name) => coverage[name] === "explicit");

  let reviewStatus = "excluded";
  if (scopeEligible && substantiveSupported.length > 0) {
    reviewStatus = "included";
  } else if (
    hasDescription
    && (coded.language.isEnglish || coded.language.uncertain)
    && (
      coded.language.uncertain
      || (coded.diagnostics.qualityException && (formExplicit || substantiveSupported.length > 0))
      || (!formExplicit && substantiveSupported.length > 0)
      || (scopeEligible && coverage.educational_purpose === "uncertain")
    )
  ) {
    reviewStatus = "uncertain";
  }

  const exclusionReasons = [];
  if (!hasDescription) exclusionReasons.push("missing_description");
  if (!coded.language.isEnglish && !coded.language.uncertain) exclusionReasons.push("not_english");
  if (coded.language.uncertain) exclusionReasons.push("language_uncertain");
  if (!qualityOk) exclusionReasons.push("cleaning_exception_requires_review");
  if (!formExplicit) exclusionReasons.push("missing_explicit_interactive_narrative_form");
  if (substantiveSupported.length === 0) exclusionReasons.push("no_substantive_knowledge_dimension");

  const coverageProfile = reviewStatus === "included"
    ? completeCore ? "complete_core" : "partial_substantive"
    : scopeEligible ? "form_only" : "outside_scope_or_unresolved";
  const qualityTier = reviewStatus !== "included"
    ? "unassigned"
    : completeCore
      ? coverage.interaction_education_relationship === "explicit" ? "A" : "B"
      : "C";

  const evidenceExcerpt = substantiveSupported.length === 1
    && substantiveSupported[0] === "interaction_education_relationship"
    ? relationshipOnlyEvidence(record, coded)
    : coded.evidence_excerpt;

  return {
    ...coded,
    review_status: reviewStatus,
    quality_tier: qualityTier,
    exclusion_reasons: reviewStatus === "included" ? [] : unique(exclusionReasons),
    coverage_profile: coverageProfile,
    evidence_excerpt: evidenceExcerpt,
    diagnostics: {
      ...coded.diagnostics,
      inclusionPolicy: INCLUSION_POLICY,
      scopeEligible,
      substantiveSupported,
      substantiveDimensionCount: substantiveSupported.length,
      completeCore,
    },
  };
}

export function auditCodedCase(coded) {
  const failures = [];
  const coverage = coded.information_coverage;
  const substantiveSupported = substantiveDimensions.filter((name) => isSupported(coverage[name]));

  if (coded.review_status === "included") {
    if (!coded.language.isEnglish || coded.language.confidence !== "high") {
      failures.push("english_not_high_confidence");
    }
    if (coded.diagnostics.qualityException) failures.push("cleaning_exception_not_resolved");
    if (coverage.interactive_narrative_form !== "explicit") {
      failures.push("interactive_narrative_form_not_explicit");
    }
    if (substantiveSupported.length === 0) failures.push("no_substantive_knowledge_dimension");
    if (!coded.evidence_excerpt) failures.push("missing_minimal_evidence");
    if (coded.coverage_profile === "complete_core" && coded.quality_tier === "C") {
      failures.push("complete_core_misclassified_as_tier_c");
    }
    if (coded.coverage_profile === "partial_substantive" && coded.quality_tier !== "C") {
      failures.push("partial_substantive_not_tier_c");
    }
  }

  if (evidenceWordCount(coded.evidence_excerpt) > 24) {
    failures.push("evidence_excerpt_over_24_words");
  }

  return {
    passed: failures.length === 0,
    failures,
    review_status: failures.length || coded.review_status === "uncertain"
      ? "needs_revision"
      : "reviewed",
  };
}

export function normalizeRecord(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
}

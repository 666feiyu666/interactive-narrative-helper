export const CODING_RULES_VERSION = "itchio-track-a-coding-rules/v1.0";
export const CODER_ID = "track-a-local-rules-v1";
export const REVIEWER_ID = "track-a-rule-audit-v1";

const englishWords = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "been", "by", "can", "for",
  "from", "game", "has", "have", "in", "into", "is", "it", "of", "on", "or", "play",
  "player", "players", "story", "that", "the", "their", "this", "through", "to", "was",
  "were", "will", "with", "you", "your",
]);

const purposeTopics = [
  ["history_and_cultural_learning", /\bhistor(?:y|ic|ical)\b|\bheritage\b|\bcultur(?:e|al)\b|\barchaeolog(?:y|ical)\b/i],
  ["language_and_literacy", /\blanguage\b|\bvocabulary\b|\bgrammar\b|\bliteracy\b|\bread(?:ing)?\b|\bwrit(?:e|ing)\b|\bspelling\b/i],
  ["health_and_wellbeing", /\bmental health\b|\bwell[- ]?being\b|\bhealth\b|\banxiety\b|\bdepression\b|\bself[- ]care\b|\bmedical\b/i],
  ["social_emotional_learning", /\bempathy\b|\bemotions?\b|\bfeelings?\b|\bbullying\b|\brelationships?\b|\bsocial[- ]emotional\b/i],
  ["science_and_environment", /\bscience\b|\bbiology\b|\bchemistry\b|\bphysics\b|\becolog(?:y|ical)\b|\benvironment(?:al)?\b|\bclimate\b/i],
  ["civic_and_social_issues", /\bcivics?\b|\bpolitic(?:s|al)\b|\bjustice\b|\bhuman rights?\b|\bactivis[mt]\b|\bdiscrimination\b|\bsocial issues?\b/i],
  ["professional_skills_and_training", /\bprofessional\b|\bworkplace\b|\btraining\b|\bcareer\b|\bjob skills?\b|\bclinical\b/i],
  ["digital_and_media_literacy", /\bmedia literacy\b|\bdigital literacy\b|\bmisinformation\b|\bdisinformation\b|\bcyber(?:security| safety)\b|\bonline safety\b/i],
  ["mathematics_and_logic", /\bmath(?:s|ematics)?\b|\barithmetic\b|\bgeometry\b|\balgebra\b|\blogic\b/i],
  ["arts_and_creative_practice", /\barts? education\b|\bmusic education\b|\bcreative writing\b|\btheat(?:er|re) education\b/i],
  ["religion_and_philosophy", /\breligion\b|\btheology\b|\bphilosoph(?:y|ical)\b|\bethics\b/i],
  ["safety_and_risk_awareness", /\bsafety\b|\brisk awareness\b|\bdisaster preparedness\b|\bfirst aid\b/i],
];

const educationalIntent = /\b(?:teach(?:es|ing)?|learn(?:s|ed|ing)?|educat(?:e|es|ed|ing|ion|ional)|practice|understand(?:ing)?|raise(?:s|d|ing)? awareness|build awareness|develop skills?|improve knowledge|introduce(?:s|d|ing)?|train(?:s|ed|ing)?)\b/i;

const audienceRules = [
  ["children", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:young\s+)?(?:children|kids)\b/i],
  ["adolescents", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:teens?|adolescents?|young people)\b/i],
  ["young_adults", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+young adults?\b/i],
  ["school_students", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:primary|elementary|middle|secondary|high school) students?\b/i],
  ["students", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:the\s+)?(?:students?|learners?|pupils?)\b|\bstudents? (?:can|will|are invited to|use this)\b/i],
  ["educators", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:teachers?|educators?|instructors?)\b|\bteacher(?:'s)? (?:guide|resource|edition)\b/i],
  ["parents_and_families", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:parents?|families|caregivers?)\b/i],
  ["higher_education_students", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:college|university) students?\b|\bfor undergraduates?\b/i],
  ["professionals", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+(?:professionals?|practitioners?|trainees?|employees?)\b/i],
  ["adults", /\b(?:for|aimed at|intended for|designed for|suitable for|helps?)\s+adults?\b/i],
  ["age_specified_learners", /\b(?:for|aimed at|intended for|designed for|suitable for)\s+(?:players?|learners?|children|students?)?\s*ages?\s+\d{1,2}(?:\s*(?:-|to|and)\s*\d{1,2})?\b|\bfor\s+\d{1,2}(?:\s*(?:-|to)\s*\d{1,2})?[- ]year[- ]olds?\b/i],
];

// These expressions intentionally describe intended use. Production contexts such as
// "made for a class" or "student project" do not satisfy an application setting.
const settingRules = [
  ["classroom_or_school", /\b(?:for use|used|designed|intended)\s+(?:in|for)\s+(?:the\s+)?(?:classrooms?|schools?)\b|\bclassroom (?:activity|resource|lesson|tool|use)\b/i],
  ["lesson_or_curriculum", /\b(?:part of|for use in|designed for|supports?)\s+(?:a\s+)?(?:lesson|curriculum|course|module)\b|\bcurriculum[- ]aligned\b/i],
  ["workshop_or_training", /\b(?:for use|used|designed|intended)\s+(?:in|for)\s+(?:a\s+)?(?:workshop|training|professional development)\b|\btraining (?:activity|simulation|scenario|tool)\b/i],
  ["museum_or_exhibition", /\b(?:for|in|as part of)\s+(?:a\s+)?(?:museum|exhibition|gallery|heritage site)\b|\bmuseum (?:installation|experience|exhibit)\b/i],
  ["higher_education", /\b(?:for use|used|designed|intended)\s+(?:in|for)\s+(?:a\s+)?(?:university|college|higher education)\b|\buniversity (?:course|class|teaching)\b/i],
  ["home_or_self_directed", /\b(?:for|supports?)\s+(?:home use|self[- ]guided learning|self[- ]directed learning|independent learning)\b|\bat home learning\b/i],
  ["community_or_public_program", /\b(?:for use|used|designed|intended)\s+(?:in|for)\s+(?:a\s+)?(?:community program|public program|library program)\b/i],
];

const formRules = [
  ["interactive_fiction", /\binteractive fiction\b/i],
  ["visual_novel", /\bvisual novel\b/i],
  ["choice_based_story", /\bchoose your own adventure\b|\bchoice[- ]based\b|\bmeaningful choices?\b/i],
  ["branching_narrative", /\bbranch(?:ing|ed)\b|\bmultiple endings?\b/i],
  ["text_adventure", /\btext adventure\b|\btext[- ]based\b/i],
  ["narrative_simulation", /\bnarrative simulation\b|\binteractive simulation\b/i],
  ["role_playing_narrative", /\brole[- ]?playing\b|\brpg\b/i],
];

const mechanicsRules = [
  ["choices", /\bchoices?\b|\bdecisions?\b|\bchoose\b/i],
  ["branching", /\bbranch(?:ing|ed)\b/i],
  ["multiple_endings", /\bmultiple endings?\b|\bdifferent endings?\b/i],
  ["dialogue", /\bdialogue\b|\bconversation\b/i],
  ["role_play", /\brole[- ]?play(?:ing)?\b|\btake(?:s|n)? the role\b|\bplay as\b/i],
  ["simulation", /\bsimulat(?:e|es|ed|ing|ion)\b/i],
  ["exploration", /\bexplor(?:e|es|ed|ing|ation)\b/i],
  ["puzzles", /\bpuzzles?\b|\bproblem[- ]solving\b/i],
  ["reflection", /\breflect(?:s|ed|ing|ion)?\b|\bjournaling\b|\bdiary\b/i],
  ["resource_management", /\bresource management\b|\bmanage resources?\b/i],
];

const explicitRelationshipPatterns = [
  /\bchoices?\b.{0,100}\b(?:learn|understand|awareness|reflect|consequences?)\b/i,
  /\b(?:learn|understand|awareness|reflect)\b.{0,100}\bchoices?\b/i,
  /\brole[- ]?play(?:ing)?\b.{0,100}\b(?:learn|understand|explore|experience|empathy)\b/i,
  /\bsimulat(?:e|es|ed|ing|ion)\b.{0,100}\b(?:learn|practice|understand|experience|train)\b/i,
  /\b(?:learn|practice|understand|train)\b.{0,100}\bsimulat(?:e|es|ed|ing|ion)\b/i,
  /\b(?:reflection|reflect on|perspective[- ]taking)\b/i,
  /\bpuzzles?\b.{0,100}\b(?:learn|practice|understand|knowledge)\b/i,
];

function normalized(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

function normalizedLower(value) {
  return normalized(value).toLocaleLowerCase("en-US");
}

function splitMetadata(value) {
  return normalized(value).split(/\s*[|;,]\s*/).filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function matchingLabels(text, rules) {
  return rules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function contextSegments(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function matchingPurposeLabels(description) {
  const contexts = contextSegments(description).filter((segment) => educationalIntent.test(segment));
  return unique(contexts.flatMap((segment) => matchingLabels(segment, purposeTopics)));
}

function isProductionContext(segment) {
  return /\b(?:made|created|developed|built|submitted)\s+(?:this\s+)?(?:for|as)\b|\b(?:my|our)\s+(?:university|college)\s+course\b|\bstudent project\b|\bclass assignment\b/i.test(segment);
}

function matchingSettingLabels(description) {
  const labels = [];
  for (const segment of contextSegments(description)) {
    if (isProductionContext(segment)) continue;
    labels.push(...matchingLabels(segment, settingRules));
  }
  return unique(labels);
}

function firstSettingEvidence(description) {
  for (const segment of contextSegments(description)) {
    if (isProductionContext(segment)) continue;
    const evidence = firstEvidence(segment, settingRules);
    if (evidence) return evidence;
  }
  return null;
}

function firstPurposeEvidence(description) {
  for (const segment of contextSegments(description)) {
    if (!educationalIntent.test(segment) || !matchingLabels(segment, purposeTopics).length) continue;
    return evidenceFragment(segment, educationalIntent);
  }
  return null;
}

function evidenceFragment(text, pattern, wordLimit = 7) {
  const match = pattern.exec(text);
  if (!match) return null;
  const before = text.slice(0, match.index).split(/\s+/).filter(Boolean).slice(-2);
  const hit = match[0].split(/\s+/).filter(Boolean);
  const after = text.slice(match.index + match[0].length).split(/\s+/).filter(Boolean).slice(0, 2);
  return [...before, ...hit, ...after]
    .slice(0, wordLimit)
    .join(" ")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function dimensionEvidence(text, rules) {
  const fragments = [];
  for (const [, pattern] of rules) {
    const fragment = evidenceFragment(text, pattern);
    if (fragment) fragments.push(fragment);
  }
  return unique(fragments);
}

function describeLanguage(description, languagesRaw) {
  const declared = splitMetadata(languagesRaw).map((value) => value.toLocaleLowerCase("en-US"));
  if (declared.length) {
    const english = declared.includes("english");
    return {
      value: english ? "English" : declared.join(" | "),
      method: "platform_metadata",
      reviewed: true,
      confidence: "high",
      isEnglish: english,
      uncertain: false,
    };
  }

  const letters = [...description].filter((character) => /\p{L}/u.test(character));
  const latinAscii = letters.filter((character) => /[A-Za-z]/.test(character)).length;
  const asciiRatio = letters.length ? latinAscii / letters.length : 0;
  const tokens = normalizedLower(description).match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const commonRatio = tokens.length
    ? tokens.filter((token) => englishWords.has(token)).length / tokens.length
    : 0;
  const isEnglish = tokens.length >= 20 && asciiRatio >= 0.94 && commonRatio >= 0.09;
  const uncertain = !isEnglish && tokens.length >= 12 && asciiRatio >= 0.82 && commonRatio >= 0.045;
  return {
    value: isEnglish ? "English" : uncertain ? "undetermined_latin_script" : "not_english_or_insufficient",
    method: "local_detection",
    reviewed: false,
    confidence: isEnglish ? "high" : uncertain ? "medium" : "low",
    isEnglish,
    uncertain,
    diagnostics: { tokenCount: tokens.length, asciiRatio, commonRatio },
  };
}

function firstEvidence(text, rules) {
  for (const [, pattern] of rules) {
    const fragment = evidenceFragment(text, pattern);
    if (fragment) return fragment;
  }
  return null;
}

function compactEvidence(parts, maxWords = 24) {
  const output = [];
  let used = 0;
  for (const [label, fragment] of parts) {
    if (!fragment) continue;
    const prefix = `${label}:`;
    const words = fragment.split(/\s+/).filter(Boolean);
    const remaining = maxWords - used - 1;
    if (remaining <= 0) break;
    const clipped = words.slice(0, remaining);
    output.push(`${prefix} ${clipped.join(" ")}`);
    used += clipped.length + 1;
  }
  return output.join(" | ");
}

export function codeCase(record) {
  const description = normalized(record.description_clean);
  const tags = splitMetadata(record.tags_raw);
  const genres = splitMetadata(record.genres_raw);
  const metadataText = normalized([...genres, ...tags].join(" | "));
  const language = describeLanguage(description, record.languages_raw);

  const topicLabels = matchingPurposeLabels(description);
  const hasEducationalIntent = educationalIntent.test(description);
  const purposeLabels = hasEducationalIntent ? topicLabels : [];
  const audienceLabels = matchingLabels(description, audienceRules);
  const settingLabels = matchingSettingLabels(description);
  const formLabels = unique([
    ...matchingLabels(metadataText, formRules),
    ...matchingLabels(description, formRules),
  ]);
  const mechanicsLabels = unique([
    ...matchingLabels(metadataText, mechanicsRules),
    ...matchingLabels(description, mechanicsRules),
  ]);
  const relationshipExplicit = explicitRelationshipPatterns.some((pattern) => pattern.test(description));
  const relationshipLabels = relationshipExplicit
    ? mechanicsLabels.map((label) => `${label}_supports_learning`)
    : mechanicsLabels.length && purposeLabels.length
      ? ["interaction_and_education_co_described"]
      : [];

  const coverage = {
    educational_purpose: purposeLabels.length ? "explicit" : hasEducationalIntent ? "uncertain" : "not_stated",
    intended_audience: audienceLabels.length ? "explicit" : "not_stated",
    application_setting: settingLabels.length ? "explicit" : "not_stated",
    interactive_narrative_form: formLabels.length ? "explicit" : "not_stated",
    interaction_education_relationship: relationshipExplicit
      ? "explicit"
      : relationshipLabels.length
        ? "interpreted"
        : "not_stated",
  };

  const missingCore = Object.entries(coverage)
    .filter(([key, value]) => key !== "interaction_education_relationship" && value !== "explicit")
    .map(([key]) => key);
  const qualityException = normalizedLower(record.quality_status) !== "ok";
  const exclusionReasons = [];
  if (!description) exclusionReasons.push("missing_description");
  if (!language.isEnglish && !language.uncertain) exclusionReasons.push("not_english");
  if (language.uncertain) exclusionReasons.push("language_uncertain");
  if (qualityException) exclusionReasons.push("cleaning_exception_requires_review");
  exclusionReasons.push(...missingCore.map((dimension) => `missing_explicit_${dimension}`));

  let reviewStatus;
  if (
    description && language.isEnglish && !qualityException && missingCore.length === 0
  ) {
    reviewStatus = "included";
  } else if (
    description && (language.isEnglish || language.uncertain) &&
    (qualityException || missingCore.length <= 1 || language.uncertain)
  ) {
    reviewStatus = "uncertain";
  } else {
    reviewStatus = "excluded";
  }
  const qualityTier = reviewStatus === "included"
    ? relationshipExplicit ? "A" : "B"
    : "unassigned";

  const evidenceExcerpt = compactEvidence([
    ["purpose", firstPurposeEvidence(description)],
    ["audience", firstEvidence(description, audienceRules)],
    ["setting", firstSettingEvidence(description)],
    ["form", firstEvidence(metadataText, formRules) ?? firstEvidence(description, formRules)],
  ]);

  return {
    project_id: record.project_id,
    title: record.title,
    url: record.url,
    review_status: reviewStatus,
    language,
    information_coverage: coverage,
    quality_tier: qualityTier,
    exclusion_reasons: unique(exclusionReasons),
    labels: {
      educational_purpose: purposeLabels,
      intended_audience: audienceLabels,
      application_setting: settingLabels,
      interactive_narrative_form: formLabels,
      if_mechanics: mechanicsLabels,
      interaction_education_relationship: relationshipLabels,
    },
    evidence_excerpt: evidenceExcerpt,
    evidence_location_or_url: `${record.url} [cases.description_clean; cases.genres_raw; cases.tags_raw]`,
    diagnostics: {
      hasEducationalIntent,
      topicEvidence: dimensionEvidence(description, purposeTopics),
      audienceEvidence: dimensionEvidence(description, audienceRules),
      settingEvidence: dimensionEvidence(description, settingRules),
      relationshipExplicit,
      qualityException,
    },
  };
}

export function auditCodedCase(coded) {
  const failures = [];
  if (coded.review_status === "included") {
    if (!coded.language.isEnglish || coded.language.confidence !== "high") failures.push("english_not_high_confidence");
    for (const [dimension, status] of Object.entries(coded.information_coverage)) {
      if (dimension === "interaction_education_relationship") continue;
      if (status !== "explicit") failures.push(`${dimension}_not_explicit`);
    }
    if (!coded.evidence_excerpt) failures.push("missing_minimal_evidence");
    if (!coded.labels.if_mechanics.length) failures.push("missing_interaction_mechanics");
  }
  const sourceEvidenceWords = coded.evidence_excerpt
    .replace(/\b(?:purpose|audience|setting|form):/gi, "")
    .replace(/\|/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  if (sourceEvidenceWords > 24) {
    failures.push("evidence_excerpt_over_24_words");
  }
  return {
    passed: failures.length === 0,
    failures,
    review_status: failures.length ? "needs_revision" : coded.review_status === "uncertain" ? "needs_revision" : "reviewed",
  };
}

export function normalizeRecord(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
}

# itch.io Track A screening and coding protocol v1.1

## Revision decision

Version 1.1 replaces the v1.0 conjunctive promotion rule for the maintained
knowledge pool. The v1.0 rule required educational purpose, intended audience,
application setting, and interactive narrative form to all be explicit. That
rule remains preserved as the definition of a complete-core precedent, but it
incorrectly treated record completeness as a prerequisite for any reusable
knowledge.

The confirmed v1.1 decision separates scope eligibility from knowledge
completeness. It admits partial precedents when at least one substantive
educational-design dimension is supported, while keeping every unstated field
explicitly missing. The frozen v1.0 annotations and two-card snapshot are not
overwritten.

## Purpose and evidence boundary

This protocol derives a model-facing knowledge pool from the accepted 606-row
workbook. It supports comparison of how public itch.io creator descriptions
position educational purpose, intended audience, application setting,
interactive narrative form, and the relationship between interaction and
education. It does not test learning effectiveness and does not represent the
population of all educational Interactive Fiction.

The observation unit remains one itch.io project page represented by one
`project_id`. Screening and coding remain in the canonical workbook identified
by the repository-level `AGENTS.md`; no parallel review queue or replacement
cleaning dataset is created.

## Two-stage inclusion rule

### Stage 1 — scope gate (conjunctive)

A record must satisfy all of the following:

1. a usable cleaned description is present;
2. English is explicitly listed in platform metadata or detected locally with
   high confidence;
3. deterministic cleaning has `quality_status = ok`; and
4. creator-controlled metadata or description text explicitly identifies an
   interactive narrative form.

### Stage 2 — substantive knowledge gate (disjunctive)

An in-scope record enters the knowledge pool when at least one of the following
is supported:

- educational purpose;
- intended audience;
- application setting; or
- an explicit or conservatively normalized interaction–education relationship.

In compact form:

```text
English
AND usable description
AND quality_status = ok
AND explicit interactive narrative form
AND (
  educational purpose
  OR intended audience
  OR application setting
  OR interaction–education relationship
)
```

An Interactive Fiction form alone is not substantive educational-design
knowledge and therefore does not enter the default pool.

## Missingness and completeness

Knowledge inclusion does not authorize filling absent fields. Each dimension
retains one of `explicit`, `normalized`, `not_stated`, or `uncertain` in the
annotation or knowledge card. Missing dimensions are included in card
limitations and converted into design questions rather than factual claims.

- `complete_core`: educational purpose, audience, setting, and form are all
  explicit.
- `partial_substantive`: the scope gate passes and at least one substantive
  dimension is supported, but one or more core dimensions are not explicit.
- `form_only`: the scope gate passes but none of the four substantive
  dimensions is supported; the record stays in screening and is excluded from
  the model-facing pool.
- `outside_scope_or_unresolved`: one or more scope conditions fail or require
  review.

## Quality tiers

Version 1.1 preserves the strict v1.0 meanings of Tier A and Tier B and adds a
partial tier:

- Tier A: `complete_core` with an explicit interaction–education relationship.
- Tier B: `complete_core` with a conservatively normalized or unstated
  relationship.
- Tier C: `partial_substantive`. The supported fields may be useful for
  retrieval, but missing fields must not be inferred.

Tier is a coverage and evidence-handling category, not a score of educational
quality or effectiveness.

## Coding and evidence

Normalized label vocabularies are defined in
[`itchio-track-a-codebook-v1.1.md`](itchio-track-a-codebook-v1.1.md). A specific
mechanic is coded when stated, but it is not required when an interactive form
and another substantive dimension are supported.

The internal workbook and annotation projection retain a minimal source
excerpt of at most 24 source words, a workbook cell reference, and the public
page URL. Model-facing cards contain only normalized knowledge, identifiers,
limitations, and retrieval text. They contain no source description, evidence
excerpt, URL, raw HTML, or retained local path.

## Decision and review states

- `included`: both gates pass and the deterministic second-pass audit passes.
- `uncertain`: potentially relevant evidence is present, but language,
  cleaning quality, or form evidence requires human revision.
- `excluded`: the scope gate fails without a reviewable boundary condition, or
  the record is `form_only`.

The corresponding `coding` row remains the only review surface. `uncertain`
and `needs_revision` do not create another review queue.

The second-pass audit verifies high-confidence English, clean source status,
explicit form, at least one substantive dimension, bounded evidence, and the
complete/partial tier assignment. It does not require every core field or a
named mechanic. In this release, `reviewed` still means deterministic rule
audit, not independent human double-coding.

## Documented comparison with v1.0

The read-only policy review over the same 606 workbook rows produced:

- 433 records with high-confidence English and `quality_status = ok`;
- 432 of those with an explicit interactive narrative form;
- 122 records passing the substantive OR gate;
- 2 `complete_core` records retained from the strict v1.0 pool;
- 120 `partial_substantive` records newly eligible; and
- 310 in-scope form-only records excluded from the model-facing pool.

These are deterministic rule outputs over creator descriptions. They are not
human agreement statistics or estimates of the prevalence of educational IF.

## Reproducibility and limitations

The v1.1 build records the workbook hash before and after the in-place coding
revision, rule and inclusion-policy versions, decision and coverage counts,
artifact hashes, formula checks, and visual workbook checks. A pre-v1.1 backup
remains in ignored working storage.

Known limitations include finite vocabulary coverage, possible local language
detection error, sparse partial records, no independent human coder,
itch.io-only source coverage, and reliance on creator positioning rather than
observed learning outcomes.


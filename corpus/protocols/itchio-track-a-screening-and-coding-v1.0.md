# itch.io Track A screening and coding protocol v1.0

## Purpose and evidence boundary

This protocol turns the accepted 606-row workbook into the first reviewable
Track A knowledge snapshot. It supports the short-term question about how
itch.io creators describe educational purpose, intended audience, application
setting, interactive narrative form, and the relationship between interaction
and education. It does not test learning effectiveness or represent all
educational Interactive Fiction.

The observation unit is one itch.io project page represented by one
`project_id`. Screening and coding begin from the canonical workbook identified
in the repository-level `AGENTS.md`. No new cleaned dataset or general review
queue is created.

## Inclusion rule

A project is included in the first knowledge snapshot only when all of the
following are supported:

1. English is explicitly listed in platform metadata or is identified by the
   local conservative language check with high confidence.
2. `description_clean` contains an educational action and a topic in the same
   local statement.
3. `description_clean` explicitly directs the work to an intended audience.
   Merely mentioning a demographic as a character or subject is insufficient.
4. `description_clean` explicitly describes an intended application setting,
   such as classroom, curriculum, training, museum, higher education, home
   learning, or a community program.
5. Creator-controlled page metadata or `description_clean` explicitly names an
   interactive narrative form.
6. The deterministic cleaning record has `quality_status = ok`.

All six conditions are conjunctive. Platform `Educational` and `Interactive
Fiction` genres remain candidate-discovery evidence; on their own they do not
establish educational purpose, audience, or setting.

## Decision states

- `included`: every inclusion condition passes.
- `uncertain`: the description is plausibly English and otherwise near the
  boundary, exactly one required substantive dimension is missing, or a
  cleaning exception requires human resolution.
- `excluded`: two or more required substantive dimensions are absent, the page
  is explicitly non-English, or no usable description is available.

The corresponding workbook row is the only review surface. `uncertain` and
`needs_revision` identify future work in place; they do not create a parallel
queue.

## Coding and evidence

Included records receive normalized labels for educational purpose, intended
audience, application setting, interactive narrative form, Interactive Fiction
mechanics, and the described or normalized interaction–education relationship.

Evidence in the workbook and annotation projection is a minimal excerpt of no
more than 24 source words, plus the public page URL and workbook-field location.
Model-facing cards contain normalized summaries, identifiers, and limitations
only; they do not contain excerpts, raw descriptions, or retained local paths.

## Quality tiers

- Tier A: all four core dimensions are explicit and the description also
  explicitly links an interaction or mechanic to learning, reflection,
  awareness, practice, or understanding.
- Tier B: all four core dimensions are explicit, while the interaction and
  educational intent are co-described but their relationship is normalized
  conservatively rather than stated causally.

Both tiers can enter the first snapshot. Tier B cards must state that the
relationship is normalized and must not claim effectiveness.

## Review procedure

The first pass applies versioned local rules. A separate audit function checks
every proposed inclusion for high-confidence English, explicit coverage of all
four core dimensions, a named mechanic, and bounded evidence. It also checks
that production contexts such as “made for my university course” are not coded
as educational application settings.

In this first release, `reviewed` means that the rule-based second-pass audit
passed. It does **not** mean independent human double-coding. This limitation is
recorded in every run report and snapshot manifest. `needs_revision` records
cases that the automatic procedure must not promote.

## Pilot and frozen rule revision

The v1.0 pilot was run over the 606-row workbook without writing it. Initial
patterns incorrectly treated a production context as a higher-education use
setting and treated narrative characters as intended audiences. The rules were
revised to require intended-use and audience-directing language. A numeric age
span also had to be explicitly introduced as an audience age rather than merely
appearing after the word “for.” These revisions reduced false inclusion and are
frozen in `itchio-track-a-coding-rules/v1.0`.

Any later relaxation or taxonomy change requires a new protocol and rules
version, followed by a documented comparison of affected decisions.

## Reproducibility and limitations

The run records workbook hashes before and after coding, rule version, counts,
artifact hashes, timestamp, and software validation results. The source
workbook remains the editable authority; NDJSON screening and annotation files
are downstream projections.

Known limitations include rule vocabulary coverage, conservative loss of
implicit descriptions, local language-detection error, no independent human
coder, itch.io-only coverage, and reliance on creator positioning rather than
observed learning outcomes.

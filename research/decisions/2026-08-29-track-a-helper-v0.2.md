# Decision: Make the formal-knowledge v0.2 profile the Track A Helper default

> **Superseded on 2026-08-31.** The implementation is now a display-only MVP;
> its former release/version/acceptance claims are not current research state.
> See 2026-08-31-reset-to-source-preparation-and-display-mvp.md.

- **Date:** 2026-08-29
- **Status:** accepted on 2026-08-29 after one rejected output and in-place
  remediation
- **Scope:** Track A runtime knowledge organization, output contracts,
  retrieval, validation, compatibility, and evidence claims

## Decision

The maintained Educational Interactive Narrative Design Helper advances to
output profile `0.2`. The profile remains the configured development default,
and its revised response behavior passed user acceptance on 2026-08-29.
Profile `0.1` remains independently runnable and testable as a compatibility
contract.

Profile v0.2 consumes the formal knowledge release
`track-a-educational-design-knowledge-v1`. That release is a deterministic
organization of the accepted `track-a-itchio-v1.1-knowledge-v1` snapshot into:

- six domain syntheses, one for each confirmed Track A design dimension;
- cross-case single-label and confirmed two-field co-occurrence patterns with
  at least two supporting case design cards; and
- all 122 source case design cards.

The formal release preserves source counts, eligible denominators,
not-stated and uncertain counts, supporting IDs, limitations, per-file hashes,
and an aggregate model-facing hash. It does not reopen restricted records,
write the canonical workbook, or expand the accepted source population.

Retrieval remains typed, but the first four-pattern/four-card response contract
failed output-quality acceptance. The in-place remediation now supplies all six
compact domain summaries plus eight ranked pattern and eight ranked card
candidates, penalizes patterns dominated by near-universal labels, and asks the
model to select one to three supplied cards it actually used. The public
response is organized as `设计诊断`, `三个设计方向`, and `参考案例与下一步`; it no
longer exposes the internal domain-synthesis, pattern, and design-card
organization as its visible outline. Deterministic validation still allows at
most one targeted repair.

The model returns structured JSON rather than formatted Markdown. Public game
titles and URLs are resolved after generation through a local 122-card catalog
built read-only from the canonical workbook and accepted annotations. That
catalog is validated against the formal release and is not included in provider
requests or repair calls.

The v0.2 run trace, rather than the visible answer, carries retrieval types and
IDs, index and release hashes, provider-call metadata, validation metrics, and
repair count. Markdown and JSON export filenames include the output version.

## Evidence and claim boundary

This decision establishes implemented software behavior, versioned contracts,
and a reproducible development knowledge layer. It does not establish that the
short-term research question has been answered, that the 122 cases represent
educational IF, that automation-reviewed coding is independently valid, that
retrieval is semantically optimal, or that the Helper improves design or
learning outcomes.

The original implementation has local fixture, contract, HTTP, export, and
browser regression evidence, but its first real external-model Journaling run
failed human output-quality acceptance. The sanitized rejected run is retained
as a regression fixture. After the in-place remediation and repeated local
verification, the user accepted the revised v0.2 behavior on 2026-08-29.

## Acceptance history and remediation

The rejected Journaling run exposed three coupled defects:

- the public outline made the assistant report its knowledge organization
  instead of advancing the designer's task;
- repeated evidence caveats and co-occurrence counts displaced diagnosis,
  alternatives, tradeoffs, and prototype decisions; and
- the learning-effect validator treated a negated boundary statement as a
  positive claim, triggered a repair call, and degraded the final answer.

The revised v0.2 contract therefore requires one diagnosis with consequential
open decisions, exactly three materially distinct directions, and locally
resolved public case references. Knowledge remains the reasoning substrate and
is recorded in the trace; internal evidence-management language, retrieval
metadata, and repeated disclaimers are not part of the visible answer.

## Local remediation verification

The revised implementation has local evidence for schema isolation, formal-
release and reference-catalog integrity, typed 6 + 8 + 8 candidate retrieval,
provider-field exclusions, material direction difference, local reference
resolution, positive-effect-claim handling, a one-repair maximum, HTTP and
versioned export behavior, six deterministic scenarios, and retention of the
rejected Journaling output. The final local run passed 21 component tests and
17 repository contract tests. The browser result was inspected at 820 × 720,
1280 × 720, and 1720 × 950 with no horizontal overflow or console error.

These checks made the remediation executable and reviewable. The user's
2026-08-29 acceptance closes the v0.2 software-output remediation. It does not
establish corpus validity, general semantic performance, author utility,
learning effects, or a confirmatory research result.

## Alternatives considered

### Replace v0.1 in place

Rejected because silently changing its schemas and response shape would make
saved fixtures, run traces, and exports ambiguous and would remove a useful
compatibility reference.

### Send all case cards without a formal organization layer

Rejected because it would make domain coverage and cross-case combinations
implicit, increase provider payload size, and weaken traceability between
aggregate statements and supporting cases.

### Use one mixed retrieval index for every knowledge type

Rejected because domain syntheses, cross-case patterns, and individual case
precedents answer different design questions and should remain inspectable in
retrieval and run traces.

### Formal release plus typed retrieval and versioned output — selected

Selected because it keeps the accepted source snapshot stable while adding a
deterministic, testable organization layer and a smaller author-facing result.

## Consequences

- `config/output-profiles-v1.json` is the authoritative version-to-contract
  mapping, and v0.2 is its default.
- v0.1 and v0.2 requests, responses, traces, prompts, knowledge sources, and
  export names must not be mixed.
- Provider serializers must keep restricted source fields, provenance paths,
  annotation IDs, review metadata, quality tiers, confidence labels,
  limitations, public titles, URLs, and retrieval scores outside the
  model-facing payload.
- Visible answers must not assert unsupported positive learning effects,
  display corpus or retrieval administration, present unsupported counts, or
  expose unsupplied knowledge IDs.
- Fixture and software tests remain distinct from research evaluation.

## Reversibility

The default profile, provider, embedding model, ranking algorithm, Top-K
values, and web presentation are replaceable through later versioned decisions.
The durable constraints are explicit output-version selection, v0.1 artifact
interpretability, deterministic formal-release provenance, typed traceability,
and the local-evidence/model-facing-knowledge boundary.

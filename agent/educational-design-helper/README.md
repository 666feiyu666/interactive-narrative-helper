# Educational Interactive Narrative Design Helper

This component owns Track A's macro-level, design-time assistant. It helps an
educator or narrative designer compare creator-grounded educational
interactive-narrative directions before a full story or runtime implementation
is authored.

This is the first implementation line of the maintained system, not a separate
throwaway prototype. Early releases may use a small reviewed knowledge
snapshot, but they keep the same versioned contracts and component boundaries
used by later releases.

## Run locally

From this directory:

```powershell
npm install
npm start
```

Then open `http://127.0.0.1:3000/`. The server loads the repository-root `.env`,
validates the frozen knowledge snapshot, builds or reuses the ignored embedding
index, and serves both the API and browser client.

Do not use `web/index.html` as the running application. Directly opening that
file now renders a styled preview with a launch explanation, but model calls
and prompt submission require the local HTTP runtime.

## Inputs and outputs

The Helper accepts a design request describing an educational intent, audience,
setting, preferred interaction, and constraints when known. It retrieves
approved model-facing knowledge cards and returns multiple design directions
with their applicability conditions, transfer assumptions, risks, and
supporting knowledge identifiers.

The initial contracts are:

- [`schemas/design-request.schema.json`](schemas/design-request.schema.json)
- [`schemas/design-response.schema.json`](schemas/design-response.schema.json)
- [`schemas/run-trace.schema.json`](schemas/run-trace.schema.json)
- [`../../corpus/schemas/knowledge-card.schema.json`](../../corpus/schemas/knowledge-card.schema.json)
- [`../../corpus/schemas/screening-decision.schema.json`](../../corpus/schemas/screening-decision.schema.json)
- [`../../corpus/schemas/coding-annotation.schema.json`](../../corpus/schemas/coding-annotation.schema.json)
- [`../../corpus/schemas/knowledge-snapshot.schema.json`](../../corpus/schemas/knowledge-snapshot.schema.json)

## Trust boundary

The current upstream screening and coding surface is the canonical Track A
workbook identified in the repository-level `AGENTS.md`. Knowledge-card
generation consumes reviewed workbook coding; it does not rebuild source
cleaning or create a parallel review queue.

Runtime code in this component may consume only approved knowledge snapshots
under `corpus/derived-knowledge/`. It must not read descriptions, HTML,
evidence excerpts, or review workspaces under `corpus/restricted-sources/`.

Provider requests must be assembled through an allowlisted model-facing
serializer. Source evidence remains local and is reattached by identifier for
review or display after generation.

The current loadable candidate snapshot is
`corpus/derived-knowledge/track-a-itchio-v1.1-knowledge-v1/`. It contains 122
case precedents that passed the v1.1 scoped substantive-OR rule audit: 2
complete-core Tier B cards and 120 partial-substantive Tier C cards. Its
manifest marks independent human double-coding as incomplete, so runtime and
evaluation must retain that limitation. The strict v1.0 two-card snapshot is
preserved for rule comparison, not used as the default pool.

## Separation from Track B

This component does not propose alternative actions for a bounded source story,
project consequence chains, or import schemas from
`../counterfactual-design-partner/`. A future author-reviewed design brief may
connect the components, but no bridge schema is frozen yet.

## Structure

- `schemas/` owns public request, response, and run-trace contracts.
- `prompts/` owns versioned prompt conditions.
- `src/` owns knowledge loading, retrieval, Harness, provider adapters,
  validation, and the HTTP service.
- `web/` owns the single-turn browser interface.
- `tests/` owns automated software verification. Knowledge quality and author
  utility remain research-evaluation questions under `experiments/`.

Generated embedding indexes are written below `outputs/indexes/`. Every prompt
run writes its request, retrieved IDs, provider-call metadata, validated
response, and final trace below `outputs/agent-runs/`. Both locations are
ignored by default.

# Educational Interactive Narrative Design Helper

This component owns Track A's macro-level, design-time assistant. It helps an
educator or narrative designer explore creator-grounded combinations of
educational purpose, audience, setting, interactive form, and interaction
mechanism before a full story or runtime implementation is authored.

Version `0.2` is the default maintained output profile. Version `0.1` remains
available as an explicit compatibility profile; its schemas, prompt, frozen
fixtures, structured response, and export names are preserved.

## Current release profiles

| Output profile | Runtime knowledge | Retrieval | User-facing result |
| --- | --- | --- | --- |
| `0.2` (default, accepted) | `track-a-educational-design-knowledge-v1` | all 6 domain syntheses plus Top-8 cross-case-pattern and Top-8 case-card candidates | structured Chinese diagnosis, exactly three materially different design directions, 1–3 locally resolved public case references, a prototype next step, and at most one follow-up question |
| `0.1` (compatibility) | `track-a-itchio-v1.1-knowledge-v1` | Top-5 case precedents | the original structured multi-direction response |

The formal v0.2 release is deterministically derived from the existing 122
automation-reviewed case precedents. It contains 6 domain syntheses, 194
cross-case patterns with `support_n >= 2`, and all 122 case design cards.
Missing and uncertain values remain explicit. These are development knowledge
artifacts, not evidence of prevalence, recommendation quality, or learning
effectiveness.

## Run locally

Install dependencies once, then start the maintained runtime:

```powershell
npm install
npm start
```

Open `http://127.0.0.1:3000/`. The default runtime requires the ignored
repository-root `.env` to contain `OPENAI_API_KEY`; it validates the formal
knowledge release and local reference catalog, then builds or reuses ignored
embedding indexes. The first real external-model Journaling run failed human
output-quality acceptance. Its sanitized output is retained as a rejected
fixture. After the in-place repair and local regression pass, the user accepted
the revised v0.2 behavior on 2026-08-29. A later confirmatory external-model
evaluation remains separate from this software acceptance.

For a completely local, deterministic browser demonstration with no API key or
external model request:

```powershell
npm run start:fixture
```

To exercise the preserved v0.1 profile in the same fixture runtime:

```powershell
$env:TRACK_A_OUTPUT_VERSION = "0.1"
npm run start:fixture
Remove-Item Env:TRACK_A_OUTPUT_VERSION
```

Do not use `web/index.html` as the running application. Directly opening it
shows a styled launch explanation, but submission requires the local HTTP
runtime.

## Contracts and configuration

`config/output-profiles-v1.json` is the authoritative mapping from output
version to request, response, trace, prompt, and knowledge contracts.

| Contract | v0.1 | v0.2 |
| --- | --- | --- |
| Request | `schemas/design-request.schema.json` | `schemas/design-request-v2.schema.json` |
| Response | `schemas/design-response.schema.json` | `schemas/design-response-v2.schema.json` |
| Run trace | `schemas/run-trace.schema.json` | `schemas/run-trace-v2.schema.json` |
| Prompt | `prompts/design-advisor-v1.md` | `prompts/design-advisor-v2.md` |

The formal knowledge contracts are:

- `../../corpus/schemas/track-a-knowledge-item.schema.json`
- `../../corpus/schemas/track-a-knowledge-release.schema.json`

The v0.2 request contains only the server-generated identifiers, the output
version, and the user's question. The provider returns a structured draft with
one diagnosis, exactly three directions, selected card IDs, a next step, and an
optional follow-up question. The server validates that draft, resolves selected
cards through `config/reference-catalog-v1.json`, and returns public titles and
links in the final response. Retrieval records, supplied and selected knowledge
IDs, index hashes, validation metrics, repair count, and provider metadata stay
in the v0.2 run trace rather than in the visible advice.

## Trust boundary

The canonical upstream screening and coding surface remains the workbook named
in the repository-level `AGENTS.md`. The formal v0.2 release is built only from
the accepted v1.1 model-facing snapshot; the builder does not write the
workbook, reopen the 606 source records, or create a parallel review queue.

Runtime code may consume only approved model-facing knowledge under
`corpus/derived-knowledge/`. Provider payloads exclude descriptions, evidence
excerpts, URLs, public titles, local paths, source IDs, annotation IDs, quality
tiers, confidence labels, limitations, and retrieval scores. The prompt treats
knowledge as background reasoning material rather than a public answer outline.
The validator rejects internal evidence-management language, duplicate design
directions, unsupported positive learning-effect claims, unsupplied reference
IDs, and model-generated titles or URLs. A negated statement about learning
effects no longer triggers the positive-claim rule.

## Verification

```powershell
npm run test:all
```

The automated suite covers both output profiles, formal-release and reference-
catalog integrity, 6 + 8 + 8 typed retrieval, provider-boundary exclusions,
the structured diagnosis and three-direction contract, material-difference and
public-style checks, one targeted repair maximum, HTTP and export behavior, six
local scenario fixtures, and the retained rejected Journaling output. The
revised browser interface was checked at 820 × 720, 1280 × 720, and 1720 × 950
without horizontal overflow or console errors.

Passing software tests and fixture demonstrations do not establish corpus
coverage, independent coding agreement, design-advice quality, author utility,
or learning effectiveness.

## Separation from Track B

This component does not perform story-level narrative-technique exploration,
propose alternative actions for a bounded source story, or import schemas from
`../narrative-technique-design-partner/`. A future author-reviewed design brief
may connect the components, but no bridge schema is frozen.

## Structure

- `schemas/` owns versioned public request, response, and run-trace contracts.
- `prompts/` owns versioned prompt conditions.
- `src/` owns knowledge loading, retrieval, Harness behavior, provider
  adapters, validation, and the HTTP service.
- `web/` owns the single-turn browser interface.
- `tests/` owns automated software verification and frozen compatibility
  fixtures.

Generated embedding indexes are written below `outputs/indexes/`. Prompt runs
write requests, retrieval records, provider payloads, responses, and traces
below `outputs/agent-runs/`. Both locations are ignored by default.

# itch.io offline project-page cleaning 1.0

- **Protocol ID:** `itchio-offline-page-cleaning/v1.0`
- **Status:** stable deterministic transformation; 606-entry derivation completed
- **Source contract:** `itchio-public-page-capture/v1.0`
- **Output schema:** `itchio-cleaned-project/v1.0`
- **Parser version:** `1.0.0`
- **Unit:** one captured itch.io project page
- **Processing boundary:** local parsing with browser networking disabled

## Objective

Transform the retained candidate-page bundles into reviewable source records
without deciding educational relevance, Interactive Fiction mechanics,
inclusion, quality, audience, learning effect, or downstream Agent use.

## Inputs and outputs

For each manifest project, the cleaner reads a successful `capture.json` and
its `rendered-page.html`, verifies the HTML SHA-256, and parses the saved HTML in
a local browser with all network requests blocked. The source run is never
modified.

```text
derived/<derivation-id>/
  run.json
  summary.json
  review-summary.md
  projects/<project-id>/
    record.json
    description-clean.txt   # only when source text exists
```

Each `record.json` preserves source run, capture time, URLs, HTML and structure
hashes, page identity, description source, raw information-panel rows,
normalized source terms, delivery evidence, and deterministic review flags.
All derived payloads remain under the Git-ignored restricted-source tree.

## Cleaning rules

1. Prefer `.formatted_description` body text.
2. Normalize Unicode to NFC, convert non-breaking spaces, trim horizontal
   whitespace, preserve paragraph boundaries, and collapse repeated blank lines.
3. Do not mix page controls, downloads, comments, footer text, or whole-page
   visible text into the cleaned description.
4. When body text is absent, retain a source meta description as `meta_only` and
   flag it for review; when no source exists, record `missing` without inventing
   text.
5. Treat only rows under `.game_info_panel_widget` as platform metadata. Keep
   raw labels and values, and flag unmapped labels rather than discarding them.
6. Keep page UI language separate from work-language metadata.
7. Flag very short descriptions and possible duplicate groups for review; do
   not remove or merge candidates automatically.

## Explicit non-goals

This protocol does not perform research coding, decide corpus inclusion,
inspect playable artifacts, call a model, create CSV/XLSX, publish copied text,
or move restricted material outside its controlled storage.

## Execution

```powershell
node tools/itchio/clean-page-bundles.mjs clean `
  --source-run-id itchio-page-bundle-full-001 `
  --derivation-id itchio-page-cleaning-full-001
```

## Acceptance conditions

- every selected page produces a validated record or an explicit error;
- every source HTML hash matches before parsing;
- parsing performs no network requests;
- descriptions and metadata follow the source-selection rules above;
- missing, meta-only, very short, unmapped, and possible duplicate cases remain
  visible in a finite review queue;
- record and description hashes match the derivation index;
- a full resume reuses every compatible record;
- all outputs remain ignored by Git.

This transformation establishes a reproducible source-evidence layer only. It
does not establish the relevance or quality of any candidate.

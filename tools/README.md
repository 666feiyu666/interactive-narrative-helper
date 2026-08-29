# Research tools

Reusable corpus, validation, evaluation, and reporting utilities belong here.
Tools must preserve provenance and distinguish deterministic transformations
from model-generated or researcher-interpreted data.

The itch.io collector freezes a full listing and saves a rendered project-page
bundle—visible text, generic DOM structure, and sanitized rendered HTML—with
hashes, status records, and resumable completion markers.
Validate it without network access by running:

```powershell
pwsh -File tools/itchio/validate.ps1
```

Discover the current full manifest after reviewing platform policy:

```powershell
node tools/itchio/capture-visible-text.mjs discover --confirm-policy-review
```

After explicit authorization, the full frozen manifest was captured with:

```powershell
node tools/itchio/capture-visible-text.mjs capture `
  --confirm-policy-review `
  --run-id itchio-page-bundle-full-001 `
  --delay-seconds 5
```

Its aggregate result is recorded under
`corpus/catalog/itchio-public-text/acquisition-run-full-001.md`. The stored page
bundles remain restricted source material; analytical transformations belong
in a later, separately defined offline mining step.

The first offline mining step is deterministic source cleaning. It verifies
each retained HTML hash, disables browser networking, extracts only the main
description and platform information panel, preserves raw source values, and
records missing, conflicting, or unmapped fields. It does not perform research
coding or create a spreadsheet:

```powershell
node tools/itchio/clean-page-bundles.mjs clean `
  --source-run-id itchio-page-bundle-full-001 `
  --derivation-id itchio-page-cleaning-full-001
```

The stable contract is documented in
`corpus/protocols/itchio-offline-page-cleaning-v1.0.md`. Its derived records and
cleaned descriptions remain under the Git-ignored restricted-source tree.

The Agent contract validation checks the active Track A component, the static
Track B narrative-technique boundary, Track A schemas, model-facing knowledge
exclusions, and compatibility of the preserved Track B1 counterfactual case
contract:

```powershell
pwsh -File tools/agent/validate.ps1
```

Track A screening and knowledge construction starts from the canonical
workbook. The strict v1.0 builder remains reproducible for its preserved
two-card release. The current v1.1 builder implements the confirmed scoped
substantive-OR policy and writes only to the existing `coding` rows.

Profile the workbook without writing it with:

```powershell
node tools/knowledge/profile-track-a-workbook.mjs `
  outputs/itchio-sheet/itchio-educational-if-candidates-v1.0.xlsx
```

The v1.1 write command requires an explicit confirmation flag, refuses a
different workbook path or a non-v1.0 machine-coded baseline, preserves a
pre-write backup, and validates the workbook and generated schemas before
promotion:

```powershell
node tools/knowledge/build-track-a-knowledge-v1.1.mjs apply `
  --confirm-workbook-write
```

Validate the local coding rules and tool syntax with:

```powershell
pwsh -File tools/knowledge/validate.ps1
```

## Formal Track A runtime knowledge

Build or verify the deterministic formal knowledge release used by the default
Helper v0.2 profile with:

```powershell
node tools/knowledge/build-track-a-educational-design-knowledge-v1.mjs
```

The builder reads only the accepted
`track-a-itchio-v1.1-knowledge-v1` model-facing snapshot. It writes 6 domain
syntheses, support-filtered cross-case patterns, all 122 case design cards, a
hash-bearing manifest, and a build report to
`corpus/derived-knowledge/track-a-educational-design-knowledge-v1/`. Repeating
the command is byte-stable; a divergent existing release is rejected rather
than overwritten. The command does not write the workbook, read restricted
HTML, or call an external model.

Build or verify the local public-reference catalog used to attach game titles
and public itch.io links after v0.2 model generation with:

```powershell
node tools/knowledge/build-track-a-reference-catalog.mjs
```

This builder reads the canonical workbook and accepted v1.1 annotations
without writing either source. It joins their public title and URL fields to
the 122 formal case design cards, writes
`agent/educational-design-helper/config/reference-catalog-v1.json`, and
validates exact card coverage. Descriptions and evidence excerpts are not
copied into the catalog, and the catalog is never sent to the model provider.

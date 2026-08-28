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
Track B boundary, Track A schemas, model-facing knowledge exclusions, and
compatibility of the preserved Track B case contract:

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

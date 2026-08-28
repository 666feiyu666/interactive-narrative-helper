# Corpus schemas

Add formal schemas here only when downstream annotation or experiment contracts
need independent validation. The current itch.io acquisition deliberately uses
a minimal manifest plus per-page `capture.json` completion records; their
version and runtime invariants are enforced by the collector and automated
tests instead of separate field-heavy observation and annotation schemas.

The stable offline cleaner uses the code-validated, source-fact-only
`itchio-cleaned-project/v1.0` record. A standalone JSON Schema should be added
only when another component needs independent validation rather than merely
because the current implementation has reached 1.0.

Track A maintained development now creates that downstream validation need:

- `screening-decision.schema.json` is a downstream machine-readable projection
  of reviewed `coding` workbook rows. It does not define a second review queue
  or replace the canonical workbook editing surface.
- `knowledge-card.schema.json` defines approved model-facing knowledge. It
  intentionally excludes raw descriptions, verbatim evidence, and restricted
  source paths.
- `coding-annotation.schema.json` defines the reviewed internal annotation that
  connects a knowledge card to bounded evidence in the canonical workbook.
- `knowledge-snapshot.schema.json` defines the versioned manifest, input and
  artifact hashes, review method, counts, and limitations for a frozen
  model-facing snapshot.

The schemas accept both the strict v1.0 release and the current v1.1 release.
Version 1.1 adds an explicit coverage profile, Tier C partial precedents,
optional empty mechanic lists when no mechanic is stated, and a versioned
inclusion policy without changing the local-evidence/model-facing boundary.

# Corpus

Corpus mining is the current Track A method for understanding how creators
describe Interactive Fiction in educational contexts. It now supports the
first traceable case precedents and model-facing snapshot for the macro
Educational Interactive Narrative Design Helper. Retrieval and evaluation
remain downstream work.

- `catalog/` records candidate works, provenance, discovery method, and rights.
- `annotations/` connects creator statements to normalized purpose, audience,
  setting, interaction, and educational–interaction codes.
- `derived-knowledge/` contains reviewable patterns derived from annotated
  evidence.
- `protocols/` contains versioned collection and coding procedures.
- `schemas/` contains corpus-specific machine-readable contracts.
- `restricted-sources/` is ignored by Git except for its policy README.

Do not collect or process external works until inclusion criteria, access
method, rights handling, and intended analysis have been documented.

The current stable acquisition procedure is
[`protocols/itchio-public-page-bundle-v1.0.md`](protocols/itchio-public-page-bundle-v1.0.md).
An explicitly authorized full run captured all 606 manifest entries. The frozen
manifest remains a platform-tag candidate inventory, not a confirmed
educational-IF corpus.

The Git-safe URL inventory and run guidance live under
[`catalog/itchio-public-text/`](catalog/itchio-public-text/). Copied page
payloads and the dedicated browser profile remain under the ignored
`restricted-sources/itchio-public-text/` path.

Future acquisition should separate source preservation from offline mining;
raw HTML is not intended to be passed directly to either future Helper
direction. Initial knowledge contracts are now implemented; retrieval details
and broader pattern synthesis remain open to later evidence.

The stable first offline transformation is
[`protocols/itchio-offline-page-cleaning-v1.0.md`](protocols/itchio-offline-page-cleaning-v1.0.md).
It produces restricted, rebuildable source records and cleaned descriptions
without making inclusion or research-coding decisions.

The accepted working interface over that derivation is
`outputs/itchio-sheet/itchio-educational-if-candidates-v1.0.xlsx`.
Its `cases` sheet contains the 606 cleaned source rows, its `coding` sheet is the
606-row screening and research-coding surface, and its `provenance` sheet
preserves the source joins. Current analysis must continue from that workbook
rather than recreate another cleaned dataset or general review queue. The
workbook remains ignored working data; its existence is not evidence that
Track A human screening or coding is complete. The confirmed v1.1 scoped
substantive-OR pass records all 606 decisions and promotes 122 records: 2
complete-core Tier B cards and 120 partial-substantive Tier C cards. Another
122 uncertain rows still require human revision. The current frozen
model-facing release is
[`derived-knowledge/track-a-itchio-v1.1-knowledge-v1/`](derived-knowledge/track-a-itchio-v1.1-knowledge-v1/).
The strict v1.0 two-card release remains preserved for comparison.

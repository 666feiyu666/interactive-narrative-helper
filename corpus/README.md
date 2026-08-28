# Corpus

Corpus mining is the current Track A method for understanding how creators
describe Interactive Fiction in educational contexts. It may later support
traceable design precedents, retrieval, and a macro Educational Interactive
Narrative Design Helper, but those downstream contracts are not yet defined.

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
direction. The detailed knowledge, retrieval, and Helper contracts will be
designed after coding establishes which creator-described patterns are reliable
and useful.

The stable first offline transformation is
[`protocols/itchio-offline-page-cleaning-v1.0.md`](protocols/itchio-offline-page-cleaning-v1.0.md).
It produces restricted, rebuildable source records and cleaned descriptions
without making inclusion or research-coding decisions. A generated review
workbook may expose those source facts and a blank coding surface under ignored
`outputs/`; its existence is not evidence that Track A coding is complete.

# Track A itch.io annotations v1.1

This directory is the machine-readable projection of the canonical workbook's
scoped substantive-OR screening and coding run.

- `screening-decisions.ndjson` contains one decision for each of the 606
  `project_id` values: 122 included, 362 excluded, and 122 uncertain.
- `coding-annotations.ndjson` contains 122 evidence-bearing annotations that
  passed the deterministic v1.1 audit.
- Of the included annotations, 2 are `complete_core` and 120 are
  `partial_substantive`.

The workbook remains the editable authority and the existing `coding` rows
remain the review surface. These files do not create another review queue.
Minimal excerpts and source URLs remain in this internal annotation layer; they
are not copied into model-facing cards. Independent human double-coding remains
incomplete.

Protocol: [`../../protocols/itchio-track-a-screening-and-coding-v1.1.md`](../../protocols/itchio-track-a-screening-and-coding-v1.1.md)

Codebook: [`../../protocols/itchio-track-a-codebook-v1.1.md`](../../protocols/itchio-track-a-codebook-v1.1.md)

The strict v1.0 two-record projection remains preserved under
[`../track-a-itchio-v1.0/`](../track-a-itchio-v1.0/).


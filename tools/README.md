# Research tools

Only the source-acquisition and deterministic cleaning utilities are current.

## Acquisition

The itch.io collector freezes listing order and saves a rendered page bundle
with hashes, status records, and resumable completion markers. The accepted
full run is already complete. Any new network collection requires explicit
authorization and a fresh policy/rights review.

Offline validation:

    pwsh -File tools/itchio/validate.ps1

## Cleaning

The offline cleaner verifies retained HTML hashes, disables browser networking,
extracts the main description and platform information panel, preserves raw
source values, and records missing, conflicting, or unmapped fields.

    node tools/itchio/clean-page-bundles.mjs clean \
      --source-run-id itchio-page-bundle-full-001 \
      --derivation-id itchio-page-cleaning-full-001

The accepted derivation is already complete and should not be recreated unless
the user explicitly requests it.

No current tool defines Track A screening, coding, synthesis, knowledge
construction, retrieval research, or Agent evaluation. Those methods have not
yet been designed.

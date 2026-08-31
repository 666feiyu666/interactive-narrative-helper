# Corpus and source preparation

Track A currently has source-preparation evidence, not a screened corpus or
data-mining result.

## Retained current material

- catalog/itchio-public-text/manifest.json is the frozen 606-item candidate
  inventory.
- catalog/itchio-public-text/acquisition-run-full-001.md records the authorized
  606-page acquisition.
- catalog/itchio-public-text/cleaning-run-full-001.md records the deterministic
  606-record offline cleaning derivation.
- protocols/itchio-public-page-bundle-v1.0.md and
  protocols/itchio-offline-page-cleaning-v1.0.md define those operations.
- restricted-sources/ retains ignored raw bundles and cleaned source records.

These materials establish acquisition, transformation, hashing, and provenance
only. The platform-tag inventory is not a confirmed educational-IF corpus.

Formal screening, research coding, analysis, synthesis, validation, and
knowledge design have not started. Earlier annotations, workbooks, schemas,
coding protocols, and derived-knowledge releases are superseded development
artifacts and are not authoritative inputs.

Future data mining should begin from the retained raw acquisition and cleaning
derivation, define its terminology, population, observation unit,
inclusion/exclusion criteria, coding procedure, quality checks, bias, validity,
and supported claims, and preserve the stable project_id joins.

Raw HTML and cleaned restricted records must remain out of Git and must not be
passed directly to an application or external model.

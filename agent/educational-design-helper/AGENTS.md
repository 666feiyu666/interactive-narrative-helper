# Educational Design Helper guidance

This file applies only to `agent/educational-design-helper/`.

- This component owns Track A runtime behavior. Do not add story-level
  counterfactual generation here.
- Knowledge construction begins from the canonical workbook identified by the
  repository-level `AGENTS.md`, especially its `cases`, `coding`, and
  `provenance` sheets. Do not create another cleaned dataset or full-corpus
  review queue inside this component.
- Runtime code may read only approved model-facing knowledge snapshots. It must
  not read from `corpus/restricted-sources/` or accept source-page records as
  provider input.
- Keep provider adapters behind explicit interfaces. Prompts and model
  configuration must remain separately versioned.
- Validate public inputs and outputs against the component schemas. Validate
  knowledge against `corpus/schemas/knowledge-card.schema.json`.
- Preserve knowledge IDs and the exact retrieved set in every run trace.
- Do not claim that creator-described educational intent demonstrates learning
  effectiveness.
- Do not import internal files from `agent/counterfactual-design-partner/`.
  Shared code requires an independently documented, stable cross-component
  contract.
- Add automated tests for schema, retrieval, citation, provider-boundary, and
  failure-handling changes. Software tests do not establish knowledge quality
  or author utility.

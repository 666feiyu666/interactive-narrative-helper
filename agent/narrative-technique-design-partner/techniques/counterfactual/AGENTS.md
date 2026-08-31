# Track B1 Counterfactual Design Partner guidance

This file applies only to
`agent/narrative-technique-design-partner/techniques/counterfactual/`.

- This directory preserves the inactive Track B1 counterfactual research
  module.
  Do not add runtime code, prompts, Harness behavior, provider integration,
  interface code, or component-local test scaffolding without explicit user
  authorization to begin Track B development.
- Do not add corpus screening, macro educational-design retrieval, or Track A
  knowledge construction here.
- Preserve the explicit case invariants, mutable assumptions, and structured
  consequence-projection contract.
- Treat the schemas as preserved contracts. Change their semantics only after
  an explicit Track B research or development decision; repository-level
  compatibility checks may continue to validate them read-only.
- Do not import implementation files from the display MVP under `app/`. A
  future author-reviewed design brief is the only planned bridge and is not yet
  a frozen schema.
- Keep this design-time Partner separate from the Fox-and-Crow runtime Story
  Agent.

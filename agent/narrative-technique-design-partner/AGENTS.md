# Story-level Narrative Technique Design Partner guidance

This file applies to `agent/narrative-technique-design-partner/`.

- This directory preserves the inactive, long-term Track B research boundary.
  Do not add runtime code, prompts, Harness behavior, provider integration,
  interface code, evaluation implementation, or component-local test
  scaffolding without explicit user authorization to begin Track B
  development.
- Track B is a family of author-framed, technique-specific story explorations;
  it is not a generic full-story generator. Preserve the distinction between
  shared research boundaries and technique-specific contracts.
- Do not create generic narrative-technique case, proposal, or evaluation
  schemas until an explicit later decision confirms a shared contract.
- Counterfactual action and consequence is the only currently specified
  technique module. Perspective, focalization, temporal, information, role,
  and agency transformations are conceptual examples, not existing modules or
  authorized development work.
- Do not add corpus screening, macro educational-design retrieval, or Track A
  knowledge construction here.
- Do not import implementation files from the display MVP under `app/`. A
  future author-reviewed design brief is the only planned bridge and is not yet
  a frozen schema.
- Preserve author authority over technique framing, source constraints,
  interpretation, selection, revision, and final design.
- Keep this design-time Partner separate from downstream runtime Story Agents.

More deeply nested technique guidance may protect module-specific contracts but
must not redefine the shared Track B role or silently authorize implementation.

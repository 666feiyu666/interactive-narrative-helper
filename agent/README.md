# Design-time agents

`agent/` contains one active development component and one preserved long-term
research boundary under the Interactive Narrative Helper umbrella. The
directory itself does not own component schemas, prompts, runtime code, or
tests.

## Educational Interactive Narrative Design Helper

[`educational-design-helper/`](educational-design-helper/) owns Track A's
macro-level design assistant. It consumes reviewed, model-facing knowledge
derived from the educational Interactive Fiction corpus and helps educators or
narrative designers compare traceable design directions.

Its default v0.2 profile now has an executable local runtime and web interface,
a formal three-type knowledge release, typed retrieval, structured design
diagnosis, three comparable directions, locally resolved public references,
and typed run traces. The first real Journaling output was rejected; the
revised behavior passed local verification and user acceptance on 2026-08-29.
The v0.1 structured profile remains available for compatibility. This
implementation status is not research evidence of advice quality or author
utility.

It does not read restricted source pages, claim that creator-described intent
is learning-effect evidence, or generate a complete interactive story.

## Story-level Narrative Technique Design Partner (preserved boundary only)

[`narrative-technique-design-partner/`](narrative-technique-design-partner/)
owns Track B's story-level technique-family boundary. It frames inspectable,
technique-specific transformations of a concrete story under author-declared
constraints and authority.

Track B is not part of the current development scope. Its directory contains
only boundary documentation and the existing counterfactual schemas nested
under its only specified technique module. Do not implement a runtime, prompts,
Harness, interface, evaluation, generic schema, or additional technique module
here without a new explicit user decision.

[`narrative-technique-design-partner/techniques/counterfactual/`](narrative-technique-design-partner/techniques/counterfactual/)
preserves Track B1's Counterfactual Narrative Design Partner. Its contracts
remain specific to alternative character actions, causal developments, later
choices, endings, and supported meaning projections.

It does not perform corpus mining, select a macro educational direction, or
operate the runtime Story Agent in the Fox-and-Crow testbed.

## Bridge and ownership rule

The active Track A component and preserved Track B boundary may eventually be
connected through a future, author-reviewed design brief. That bridge is not
yet a frozen machine-readable contract. Until it is, Track A must not import
Track B schemas or treat a future Track B output as automatically approved
input.

Every component-specific file belongs below the component that owns it. Shared
code may be introduced only after both components need the same stable
behavior; speculative shared abstractions do not belong at the `agent/` root.

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

It does not read restricted source pages, claim that creator-described intent
is learning-effect evidence, or generate a complete interactive story.

## Counterfactual Narrative Design Partner (preserved boundary only)

[`counterfactual-design-partner/`](counterfactual-design-partner/) owns Track
B's story-level partner. It accepts a bounded story case and proposes
inspectable alternative actions and consequence projections.

Track B is not part of the current development scope. Its directory contains
only boundary documentation and existing schemas; implementation scaffolding
has deliberately been removed. Do not implement a runtime, prompts, Harness,
interface, or evaluation here without a new explicit user decision.

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

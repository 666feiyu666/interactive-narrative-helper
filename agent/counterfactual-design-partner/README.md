# Counterfactual Narrative Design Partner

This directory preserves the long-term Track B boundary of the Interactive
Narrative Helper: the author-facing, story-level Counterfactual Narrative
Design Partner. Track B is not part of the current development scope.

## Input and output

The Partner accepts a bounded story case with a canonical action, character
goal, invariants, and mutable assumptions. It proposes inspectable alternative
actions, consequence chains, further choices, possible endings, and supported
meaning projections.

Its stable existing contracts live under [`schemas/`](schemas/). They are
retained for research continuity and repository-level compatibility checking,
not as an instruction to implement the Partner in the current Track A work.
There are deliberately no `src/`, `prompts/`, `tests/`, Harness, provider, or
interface directories in this boundary.

## Boundary

This component does not:

- mine or retrieve Track A corpus knowledge;
- choose the educator's educational purpose, audience, setting, or interaction
  pattern;
- write an entire finished story;
- operate the Fox-and-Crow runtime Story Agent; or
- treat thematic or educational interpretations as uniquely correct.

A future author-reviewed design brief may carry a selected Track A direction
into this component. No such bridge schema is frozen yet.

Do not add runtime code, Harness behavior, provider integration, an interface,
or evaluation for this component without explicit later authorization.

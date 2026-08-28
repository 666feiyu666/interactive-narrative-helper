# Story-level Narrative Technique Design Partner

This directory preserves Track B of the Interactive Narrative Helper: the
author-facing, design-time boundary for story-level narrative technique
exploration. Track B is not part of the current development scope.

## Shared role

The prospective Partner operates on a concrete story or story situation after
an educator or author has reviewed the relevant design direction. A task may
declare source and provenance, audience, design intention, invariants,
permitted changes, technique framing, and exploration bounds. The Partner
should expose inspectable proposals, source compatibility, possible
interactive and meaning implications, assumptions, risks, and required
changes. The author controls the technique, constraints, interpretation, and
final design.

The conceptual story-level space may include transformations of events and
consequences, perspective and information, time and sequence, or role and
agency. These examples do not assert implemented modules, a common schema, or
technique-general Agent capability.

## Current specified technique

[`techniques/counterfactual/`](techniques/counterfactual/) preserves
**Track B1 — Counterfactual Action and Consequence Exploration**. It is the only
currently specified technique module and owns the existing case and proposal
schemas.

There are deliberately no generic `schemas/`, `src/`, `prompts/`, `tests/`,
Harness, provider, interface, or evaluation directories in this boundary.

## Boundary

This component does not:

- mine or retrieve Track A corpus knowledge;
- choose the educator's educational purpose, audience, setting, interaction
  pattern, or story technique;
- write an entire finished story;
- operate the Fox-and-Crow runtime Story Agent;
- claim that named example techniques are implemented or evaluated; or
- treat thematic or educational interpretations as uniquely correct.

A future author-reviewed design brief may carry a selected Track A direction
into this component. No such bridge schema is frozen yet.

# Story-Level Narrative Technique Partner Role and Scope

This document defines Track B of the umbrella
[Interactive Narrative Helper architecture](helper-architecture.md). Track A
data mining and Agent building have not started; the runnable app prototype is
not a Track A Agent. This document specifies only the preserved Track B role.

## Shared Track B role

The prospective research artifact is an author-facing, design-time
**Story-level Narrative Technique Design Partner**.

It participates after the author or researcher has identified a concrete story
or story situation and reviewed design direction, but before full branch
writing and runtime implementation.

When a macro educational design direction exists, the Partner may also receive
an educator- or author-reviewed design brief. It must treat that brief as an
editable constraint set, not infer one automatically from raw corpus material.

```text
concrete story + reviewed design direction
  -> author frames a narrative-technique task
  -> Agent proposes inspectable technique-specific transformations
  -> author compares, revises, combines, or rejects proposals
  -> selected direction enters branch, scene, or interaction development
```

## Required input

The Partner should not infer an unconstrained task from a story title alone. A
case should supply:

- source and provenance;
- target audience when known;
- selected educational purpose, setting, or interaction direction when the
  author has confirmed one;
- story facts and invariants to preserve;
- premises the author permits the design to change;
- narrative-technique framing and technique-specific task fields;
- requested output bounds when relevant.

## Shared output behavior

For every proposal, the Partner should expose as appropriate to the selected
technique:

1. the proposed story-level transformation and its rationale;
2. compatibility with preserved source constraints;
3. implications for player experience, information, interaction, or narrative
   development;
4. possible thematic shifts supported by narrative evidence;
5. possible educational implications supported by narrative evidence; and
6. assumptions, risks, and source changes required by the proposal.

Different techniques require different contracts and evaluation criteria. The
shared role does not imply a generic machine-readable schema.

## Track B1 — Counterfactual role

The existing Counterfactual Narrative Design Partner is the only currently
specified technique module. Its input additionally requires a canonical
character action and goal, a counterfactual question, invariants, and mutable
assumptions. For every alternative it exposes the action and motivation,
immediate and intermediate consequences, transformed conflict, further player
choices, possible endings, supported meaning projections, required source
changes, assumptions, and risks.

## Authority boundary

The Partner produces design hypotheses. It does not decide the correct theme,
educational purpose, or final branch. The author may accept, edit, combine, or
reject every proposal.

The Partner must remain distinct from:

- a runtime narrator responding to player input;
- a full-story generator producing finished prose;
- an automated evaluator declaring narrative quality;
- a moral authority prescribing a single lesson for children.

Examples such as perspective or focalization, temporal or information
restructuring, and role or agency changes define the broader conceptual space.
They are not current modules, implemented behavior, or evaluated capability.

# Interactive Narrative Helper Architecture

Status: program-level structure confirmed on 2026-08-28. Maintained Track A
development now includes knowledge, request, response, run-trace, annotation,
and snapshot contracts plus the widened 122-card v1.1 model-facing snapshot.
Retrieval implementation, independent human double-coding, and the design-brief
contract remain future work. Track B is a long-term research boundary and is
not part of the current development scope.

## Umbrella goal

Interactive Narrative Helper supports educators and narrative authors before
full branch writing and runtime implementation. It helps them first understand
the available educational interactive-narrative design space and then expand a
selected concrete story direction.

The umbrella contains two connected, independently evaluable tracks.

![Full Interactive Narrative Helper research framework](figures/full-program-framework.svg)

## Track A — Macro educational design exploration

### User and problem

An educator or narrative designer has an educational topic, audience, or
context but may not know which interactive narrative forms and design patterns
have been used for comparable purposes.

### Current evidence

The full evidence landscape may include IF distributed through itch.io, Steam,
and other platforms, with source layers chosen to match each claim. The active
study currently mines public itch.io creator project pages. Its knowledge
claims are about how creators describe their educational purposes, intended
audiences, application settings, interactive forms, and
educational–interaction relationships.

### Confirmed Helper direction

The macro Helper should:

1. accept an educational topic, audience, context, intent, and constraints;
2. retrieve traceable creator-described precedents and reusable patterns;
3. present substantively different design directions rather than one answer;
4. explain how each direction connects interaction to educational intent;
5. expose source cases, applicability conditions, assumptions, and open
   decisions; and
6. let the educator or author select, revise, combine, or reject every
   direction.

It should not autonomously decide the correct pedagogy, generate a complete
story, or claim that a creator-described pattern is an effectiveness result.

## Track B — Story-level counterfactual exploration

### User and problem

An author or educator-author has selected a design direction and identified a
concrete story, character goal, and pivotal action, but wants to expand the
space of story-compatible alternatives and consequences.

### Confirmed Partner behavior

The Counterfactual Narrative Design Partner should propose inspectable
alternative actions and project each through reactions, conflicts, later
choices, possible endings, and supported thematic or educational shifts. The
author retains authority over constraints, interpretation, and final design.

It is a concrete story-design Partner, not a runtime narrator, full-story prose
generator, or implementation tool.

## Human-reviewed bridge

The tracks may connect through an Educational Interactive Narrative Design
Brief. At the program level, that brief may contain:

- educational topic and purpose;
- intended audience;
- application setting;
- selected interaction patterns;
- creator-described rationale and supporting precedents;
- author choices, constraints, and risks;
- source story or original story situation;
- pivotal or canonical action and character goal;
- invariants and permitted changes; and
- requested exploration bounds.

Track A can propose the first set of fields. The educator or author reviews and
changes them before they become constraints. Track B consumes only the reviewed
direction together with the concrete story case.

This list remains a conceptual cross-track interface, not a frozen schema. The
Track A runtime can develop independently while mining establishes which macro
fields and relationships can be coded reliably.

## Shared authority boundary

Both tracks expand a human-controlled design space. Neither track selects a
single correct educational purpose, interpretation, interaction pattern,
branch, or ending. More generated material is not automatically more useful;
outputs should remain structured, traceable, comparable, and editable.

## Separate evaluation

Track A may later be evaluated for relevance, diversity, traceability,
comprehensibility, and usefulness in selecting a design direction. Track B
retains its separate dimensions of action-space diversity, source
compatibility, causal coherence, interactive potential, meaning projection,
and author control.

Learning-effect claims and runtime quality require different evidence and are
not required to determine whether either design-time Helper expands an
educator's or author's design process.

## Current implementation state

- Track A: source acquisition and cleaning are complete for the frozen itch.io
  candidate inventory. The v1.1 scoped substantive-OR run records 606
  decisions, promotes 122 precedents (2 complete-core Tier B and 120
  partial-substantive Tier C), and leaves 122 uncertain records for human
  review. The maintained Helper component, public contracts, annotations, and
  frozen model-facing snapshot now exist; no executable runtime, independent
  human double-coding, or research evidence of Helper quality is claimed yet.
- Track B: case and proposal schemas are preserved under
  `agent/counterfactual-design-partner/schemas/` as a long-term research
  boundary. Track B is not part of the current development scope, and no
  executable Counterfactual Narrative Design Partner is implemented.
- Bridge: the Design Brief is a confirmed program concept but has no fixed
  machine-readable contract.
- Runtime: the Fox-and-Crow testbed remains an independent research instrument,
  not either design-time Helper.

# Interactive Narrative Helper Architecture

Status: program-level structure confirmed on 2026-08-28 and Track B broadened
to a story-level narrative-technique family later that day. Maintained Track A
development includes knowledge, request, response, run-trace, annotation, and
snapshot contracts plus the widened 122-card v1.1 model-facing snapshot. The
design-brief contract remains future work. Track B is a long-term research
boundary and is not part of the current development scope.

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

## Track B — Story-level narrative technique exploration

### User and problem

An author or educator-author has selected a design direction and identified a
concrete story or story situation, but wants to explore how a story-level
narrative technique could transform player experience, interaction,
development, or interpretation without surrendering source constraints or
creative authority.

### Shared Partner boundary

The prospective Story-level Narrative Technique Design Partner should accept a
reviewed design intention, a concrete story, declared invariants and permitted
changes, and technique-specific exploration bounds. It should return
inspectable proposals that expose source compatibility, assumptions, risks,
interactive potential, and possible thematic or educational implications. The
author retains authority over technique framing, constraints, interpretation,
selection, revision, and final design.

It is a concrete story-design Partner, not a runtime narrator, full-story prose
generator, or implementation tool.

Technique-specific transformations may concern events and consequences,
perspective and information, time and sequence, or role and agency. These
examples locate the program's story-level possibility space; they are not
implemented capabilities or a commitment to build additional modules.

### Track B1 — Counterfactual action and consequence

The existing Counterfactual Narrative Design Partner is retained as the only
currently specified Track B technique module. It accepts a pivotal canonical
action, character goal, counterfactual question, invariants, and mutable
assumptions. It proposes substantively different character actions and projects
each through reactions, conflicts, later choices, possible endings, and
supported thematic or educational shifts.

Its case and proposal schemas remain technique-specific. They are not the
generic input or output contract for all of Track B.

## Human-reviewed bridge

The tracks may connect through an Educational Interactive Narrative Design
Brief. At the program level, that brief may contain:

- educational topic and purpose;
- intended audience;
- application setting;
- selected interaction patterns;
- creator-described rationale and supporting precedents;
- author choices, constraints, and risks;
- concrete source story or original story situation;
- invariants, permitted changes, and technique framing; and
- requested exploration bounds.

Track A can propose the first set of fields. The educator or author reviews and
changes them before they become constraints. Track B consumes only the reviewed
direction together with a concrete story case and a technique-specific task.
For Track B1, that task additionally includes the pivotal canonical action,
character goal, and counterfactual question.

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
comprehensibility, and usefulness in selecting a design direction. Shared Track
B concerns include source compatibility, substantive transformation,
interactive potential, inspectability, meaning projection, and author utility
and control. Each technique needs its own operational criteria and evidence.
Track B1 retains action-space diversity, causal coherence, consequence
projection, ending differentiation, and supported meaning projection as
counterfactual-specific dimensions.

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
- Track B: the program boundary is preserved under
  `agent/narrative-technique-design-partner/`. The counterfactual case and
  proposal schemas remain under its `techniques/counterfactual/` module. Track
  B is not part of the current development scope, and no executable
  Story-level Narrative Technique Design Partner is implemented.
- Bridge: the Design Brief is a confirmed program concept but has no fixed
  machine-readable contract.
- Runtime: the Fox-and-Crow testbed remains an independent research instrument,
  not either design-time Helper.

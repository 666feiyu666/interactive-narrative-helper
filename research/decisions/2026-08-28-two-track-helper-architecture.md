# Decision: Two-track Interactive Narrative Helper architecture

- **Date:** 2026-08-28
- **Status:** confirmed by the user in project discussion
- **Scope:** program identity, target users, evidence interpretation, and Agent
  relationship

## Decision

`interactive-narrative-helper` is the umbrella research program for two
connected design-time directions:

1. **Track A — macro educational design exploration:** mine creator-described
   educational IF purposes, audiences, application settings, interaction forms,
   and educational–interaction relationships to support a future Educational
   Interactive Narrative Design Helper for educators and narrative designers.
2. **Track B — story-level counterfactual exploration:** retain the confirmed
   Counterfactual Narrative Design Partner for expanding alternative character
   actions and consequences in a concrete story.

The tracks may connect through a human-reviewed Educational Interactive
Narrative Design Brief. The program relationship is confirmed. The later
decision in
[`2026-08-28-initial-helper-development.md`](2026-08-28-initial-helper-development.md)
starts maintained Track A implementation while keeping the brief schema
deferred.

## Context

The repository previously documented the short-term educational-IF mining study
and the long-term Counterfactual Narrative Design Partner as deliberately
separate. Discussion clarified that they address two levels of the same design
problem: Track A opens the macro space of educational narrative forms, while
Track B opens the possibility space of a selected concrete story.

The current short-term evidence target was also refined. Public creator project
pages are studied as primary evidence of how creators describe and position
their works. The broader source universe is educational IF distributed through
game platforms such as itch.io and Steam; the current accepted acquisition is
an itch.io-specific first source layer, not the definition of that universe.
Learning-effect evidence is not required before creator descriptions can answer
that descriptive question.

## Alternatives considered

### Keep the studies unrelated

This preserved the earlier boundary but did not explain how mined educational
design knowledge could support later concrete narrative work.

### Merge everything into a generic story-writing Agent

This obscured the different users, inputs, evidence, outputs, and evaluation
criteria, and risked broadening the research into autonomous full-story
generation.

### Use one umbrella with two separable tracks — selected

This preserves both confirmed research questions while giving them a coherent
workflow and an explicit human decision boundary.

## Consequences

- The current mining study is Track A evidence work, not an implemented Helper.
- The source universe is broader than the current itch.io creator-page
  acquisition; later platform or source layers require explicit protocols.
- The existing counterfactual schemas remain owned by Track B and are not
  repurposed for macro knowledge extraction. They now live under
  `agent/counterfactual-design-partner/`.
- Derived knowledge should represent traceable creator-described precedents and
  relationships suitable for comparison and retrieval.
- A macro recommendation becomes a Track B constraint only after educator or
  author review.
- The two tracks require separate future evaluation; neither is a runtime Story
  Agent or full-story generator.
- Existing short-term and long-term research questions remain distinct, with
  the short-term wording refined to match the creator-description evidence
  target.

## Reversibility

Track names, interface wording, and future technical architecture are
reversible. The durable decision is to preserve macro design exploration and
story-level counterfactual exploration as separable capabilities under one
human-controlled program rather than collapse them into a generic Agent.

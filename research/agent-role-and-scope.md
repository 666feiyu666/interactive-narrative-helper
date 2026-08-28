# Story-Level Agent Role and Scope

This document defines Track B of the umbrella
[Interactive Narrative Helper architecture](helper-architecture.md). Track A's
future macro design Helper is grounded in corpus-derived creator descriptions;
it is not implemented or specified in this directory.

## Role

The research artifact is an author-facing, design-time **Counterfactual
Narrative Design Partner**.

It participates after the author or researcher has identified a source story
and pivotal canonical action, but before full branch writing and runtime
implementation.

When a macro educational design direction exists, the Partner may also receive
an educator- or author-reviewed design brief. It must treat that brief as an
editable constraint set, not infer one automatically from raw corpus material.

```text
source story
  -> pivotal canonical action
  -> counterfactual question
  -> Agent proposes action/consequence hypotheses
  -> author reviews and develops selected hypotheses
  -> branch and runtime design
```

## Required input

The Agent should not infer an unconstrained task from a story title alone. A
case should supply:

- source and provenance;
- target audience when known;
- selected educational purpose, setting, or interaction direction when the
  author has confirmed one;
- canonical character action and its goal;
- counterfactual question;
- story facts and invariants to preserve;
- premises the author permits the design to change;
- requested output bounds when relevant.

## Required output behavior

For every alternative, the Agent should expose:

1. the alternative action and character motivation;
2. compatibility with preserved source constraints;
3. immediate consequences and reactions;
4. intermediate causal developments and a new or transformed conflict;
5. further opportunities for player choice;
6. one or more possible endings;
7. possible thematic shifts supported by narrative evidence;
8. possible educational implications supported by narrative evidence;
9. assumptions, risks, and source changes required by the proposal.

## Authority boundary

The Agent produces design hypotheses. It does not decide the correct theme,
educational purpose, or final branch. The author may accept, edit, combine, or
reject every proposal.

The Agent must remain distinct from:

- a runtime narrator responding to player input;
- a full-story generator producing finished prose;
- an automated evaluator declaring narrative quality;
- a moral authority prescribing a single lesson for children.

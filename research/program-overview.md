# Interactive Narrative Helper Research Program

This workspace studies evidence-grounded, design-time support for educators and
narrative authors. **Interactive Narrative Helper** is the umbrella program;
its current and long-term work form two connected but independently evaluable
directions.

## Program architecture

### Track A — Macro educational design exploration

Track A asks how creators publicly describe educational purposes, intended
audiences, application settings, interactive narrative forms, and the
relationships between interaction and educational intent. Its possible future
artifact is an **Educational Interactive Narrative Design Helper** that helps an
educator or designer compare traceable design precedents and alternative
directions before committing to a specific story.

### Track B — Story-level counterfactual exploration

Track B retains the confirmed **Counterfactual Narrative Design Partner**. It
helps an author who already has a source story, pivotal action, and constraints
explore substantively different character actions and their consequences for
later choices, endings, themes, and educational meaning.

The two tracks can connect through a human-reviewed design brief:

```text
educational intent
  -> Track A surfaces creator-grounded design directions
  -> educator or author selects and revises a direction
  -> reviewed design brief plus a concrete story case
  -> Track B expands alternative actions and causal branches
  -> author develops selected directions into branches and runtime design
```

The bridge does not make the two tracks one undifferentiated Agent. Track A and
Track B have different inputs, outputs, evidence, and evaluation criteria.
Their current division and conceptual interface are detailed in
[`helper-architecture.md`](helper-architecture.md).

## Current research stage

The active stage supports Track A through data mining. It studies how creators
position educational IF on public project pages and currently focuses on
terminology, candidate coverage, source acquisition, inclusion, and the kinds
of creator-described design information that can be derived traceably.

The findings may later support design knowledge, retrieval, and the macro
Helper. Their detailed contracts are deliberately deferred until mining
establishes what knowledge is reliable and useful. Raw HTML is source material
for mining, not direct input to either future Helper direction.

## Long-term research direction

The program retains the confirmed Track B question of whether a generative
agent can act as a counterfactual narrative design partner when authors adapt
classic children's stories into multi-ending interactive narratives. Track A
provides a compatible macro design direction but does not replace, validate, or
claim to implement the story-level Partner.

## Existing research instrument

The independently versioned `Fox-and-Crow` application is the first playable
testbed. It remains a research instrument and demonstrator rather than the
definition of the whole research program.

## Program boundary

The project distinguishes macro design exploration, concrete story-level
exploration, full branch authoring, and runtime narration. The two Helper tracks
cover only the first two. General media generation and interactive-runtime
tools remain outside this repository unless they are brought in through an
explicit project contract.

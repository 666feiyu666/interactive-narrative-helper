# Interactive Narrative Helper Research Program

This workspace studies evidence-grounded, design-time support for educators and
narrative authors. **Interactive Narrative Helper** is the umbrella program;
its planned work forms two connected but independently evaluable
directions.

## Program architecture

### Track A — Macro educational design exploration

Track A asks how creators publicly describe educational purposes, intended
audiences, application settings, interactive narrative forms, and the
relationships between interaction and educational intent. A future
**Educational Interactive Narrative Design Helper** may help an educator or
designer compare traceable design precedents and alternative directions before
committing to a specific story, but that Agent has not been modeled or
implemented.

### Track B — Story-level narrative technique exploration

Track B defines the prospective **Story-level Narrative Technique Design
Partner**. It helps an author who already has a concrete story and reviewed
design direction explore inspectable, technique-specific transformations while
retaining authority over source constraints, interpretation, and final design.
Its conceptual space may concern events and consequences, perspective and
information, time and sequence, or role and agency.

The only currently specified technique is **Track B1 — Counterfactual Action
and Consequence Exploration**. It preserves the existing Counterfactual
Narrative Design Partner question and contracts for alternative character
actions, causal developments, later choices, endings, and supported meaning
projections. The broader examples are not implemented modules or evidence of a
technique-general Agent.

![Full Interactive Narrative Helper research framework](figures/full-program-framework.svg)

The bridge does not make the two tracks one undifferentiated Agent. Track A and
Track B have different inputs, outputs, evidence, and evaluation criteria.
Their current division and conceptual interface are detailed in
[`helper-architecture.md`](helper-architecture.md).

## Current research stage

The active stage prepares sources for future Track A data mining. The broader
source universe is educational IF distributed across platforms such as itch.io
and Steam. Current work has completed one public itch.io candidate inventory,
its authorized page acquisition, and deterministic offline cleaning. The
inventory remains unscreened. Formal terminology work, inclusion, coding,
analysis, synthesis, and evaluation have not started.

No Track A findings or reviewed model-facing knowledge currently exist. Agent
role and capability modeling must wait for research evidence. Raw HTML and
cleaned records remain local source material, not runtime input to either
Helper direction. The separate app display is an MVP with legacy demo fixtures,
not a research result.

## Long-term research direction

The program asks whether a generative agent can act as an author-controlled,
story-level narrative technique design partner when authors adapt classic
children's stories into interactive narratives. Track B1 retains the focused
question of counterfactual action and consequence in multi-ending adaptation.
Track A provides a compatible macro design direction but does not replace,
validate, or claim to implement either the story-level Partner or its B1
module.

## Existing research instrument

The independently versioned `Fox-and-Crow` application is the first playable
testbed. It remains a research instrument and demonstrator rather than the
definition of the whole research program.

## Program boundary

The project distinguishes macro design exploration, concrete story-level
technique exploration, full branch authoring, and runtime narration. The two
Helper tracks cover only the first two. General media generation and
interactive-runtime tools remain outside this repository unless they are
brought in through an explicit project contract.

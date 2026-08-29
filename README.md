# Interactive Narrative Helper

Interactive Narrative Helper is a research program about evidence-grounded,
design-time AI support for educators and narrative authors.

The program now treats its current and long-term work as two connected
directions:

1. **Macro educational design exploration:** identify how creators describe
   educational purposes, intended audiences, application settings, interactive
   narrative forms, and the relationships among them.
2. **Story-level narrative technique exploration:** help an author apply a
   bounded narrative technique to a concrete story and inspect possible changes
   in experience, interaction, development, interpretation, and educational
   meaning.

These directions belong to the same umbrella Helper but remain separable for
research and evaluation. See
[`research/helper-architecture.md`](research/helper-architecture.md).

## Research frameworks

### Full program framework

![Full Interactive Narrative Helper research framework](research/figures/full-program-framework.svg)

The full program begins with educational Interactive Fiction distributed across
game platforms such as itch.io and Steam. Public project records, creator
descriptions, playable artifacts, and supporting documents may contribute
different evidence when a claim requires them. No single platform or source
layer defines the field.

### Track A iterative research framework

![Track A iterative research framework](research/figures/current-study-framework.svg)

Track A follows a recurring research cycle: evidence acquisition and corpus
construction; knowledge discovery, construction, and validation; knowledge
organization, access, and grounding; Agent system design and orchestration; and
scenario-based evaluation and reflection. Research questions, scope, and
evidence boundaries anchor every phase. Concrete platforms, methods, and
project status are documented separately from this method-independent
framework.

## Current research and development stage

The current short-term goal is to understand how creators describe Interactive
Fiction (IF) for educational and learning contexts. Current work focuses on
population and terminology, source acquisition, inclusion, and the
creator-described educational and interaction characteristics that the
available source material can support.

Creator-description screening and coding remain active research work. The
confirmed v1.1 scoped substantive-OR pass records all 606 decisions in the
canonical workbook and freezes 122 model-facing case precedents: 2
complete-core Tier B cards and 120 partial-substantive Tier C cards. Another
122 uncertain records remain for human revision. This snapshot passed a
deterministic second-pass audit but not independent human double-coding.

Maintained Track A development now includes an executable Educational
Interactive Narrative Design Helper. Its default v0.2 profile consumes a
deterministic formal release containing 6 domain syntheses, 194 cross-case
patterns with at least two supporting cases, and all 122 case design cards. It
uses separate pattern and card retrieval indexes to build a 6 + 8 + 8
candidate pool, then asks the model for a structured diagnosis and exactly
three comparable design directions. The server resolves one to three selected
case references to public titles and game-page links locally, so those details
never enter the provider payload. The v0.1 structured profile remains runnable
for compatibility.

The first real external-model Journaling run failed human output-quality
acceptance because the answer exposed internal knowledge organization and
repeated evidence caveats instead of advancing the design task. The in-place
v0.2 remediation has passed local fixture, contract, HTTP, export, and
browser-interface regression checks. The user accepted the remediated v0.2
behavior on 2026-08-29. The failed run remains preserved as regression history;
this acceptance does not establish research effectiveness or replace a later
confirmatory external-model evaluation.

This software progress does not mean human coding is complete, that the
short-term research question has been answered, or that Helper advice quality,
author utility, or learning effectiveness has been established. The
cross-track design-brief schema remains deferred.

Raw project-page HTML and verbatim evidence remain local mining inputs, not
runtime Helper inputs.

## Story-level long-term research goals

The Track B program-level question is:

> To what extent can a generative agent act as an author-controlled,
> story-level narrative technique design partner in adapting classic
> children's stories into interactive narratives, by proposing inspectable
> technique-specific transformations and explaining their implications for
> player experience, interaction, narrative development, thematic meaning,
> and educational purpose?

Its only currently specified technique is **Track B1 — Counterfactual Action
and Consequence Exploration**, which retains the earlier focused question:

> To what extent can a generative agent act as a counterfactual narrative
> design partner in adapting classic children's stories into multi-ending
> interactive narratives, by proposing distinct yet story-compatible character
> actions and projecting their consequences for plot development, possible
> endings, thematic meaning, and educational purpose?

The prospective **Story-level Narrative Technique Design Partner** remains
outside the current development scope. Counterfactual action and consequence
is its only specified module. Perspective and information, time and sequence,
or role and agency identify a broader conceptual space; they are not
implemented modules or evidence of technique-general capability. Track A's
implementation and evidence status remain independent of this scope change.

## Repository map

| Path | Responsibility |
|---|---|
| `research/` | Research question, constructs, scope, methods, ethics, and decisions |
| `agent/` | Separate Track A Helper and Track B narrative-technique boundaries |
| `cases/` | Stable story inputs, technique-specific tasks, invariants, and design briefs |
| `corpus/` | Catalogs, annotations, schemas, derived knowledge, and rights records |
| `experiments/` | Reproducible protocols, conditions, evaluations, and analyses |
| `testbeds/` | Runnable research instruments used across experiments |
| `tools/` | Corpus, evaluation, and reporting utilities |
| `outputs/` | Deliberately selected generated figures, tables, and reports |
| `legacy/` | Preserved predecessor implementations(theory-driven narrative ai, credits to ML.Ryan)  |

## Current components and evidence boundary

- `corpus/catalog/itchio-public-text/manifest.json` is a frozen platform-tag
  candidate inventory, not a confirmed educational-IF corpus.
- The explicitly authorized stable 1.0 full-manifest acquisition captured all
  606 candidate project pages, and the stable 1.0 offline cleaner produced 606
  source records. This establishes acquisition and transformation completeness
  for the frozen manifest only. The current v1.1 rule run screened all 606
  rows, promoted 122 records, left 122 uncertain, and excluded 362; it does not
  complete human coding or establish broader corpus coverage. The v1.0 strict
  counts remain preserved as a rule-version comparison.
- Current Track A screening and coding begin from
  `outputs/itchio-sheet/itchio-educational-if-candidates-v1.0.xlsx`.
  Its `cases`, `coding`, and `provenance` sheets already align all 606 project
  IDs; do not create another cleaned dataset before knowledge extraction.
- `corpus/derived-knowledge/track-a-itchio-v1.1-knowledge-v1/` is the current
  frozen model-facing snapshot. Its manifest records the 122-card pool, exact
  workbook and artifact hashes, rule-audit status, counts, and limitations.
  The strict v1.0 two-card snapshot remains preserved for comparison.
- `cases/fox-and-crow/` defines the first Track B1 counterfactual adaptation
  case without prescribing the Agent's answers.
- `testbeds/fox-and-crow/` is the independently versioned playable
  Fox-and-Crow application, included as a Git submodule.
- `legacy/theory-guided-story-generator/` preserves the earlier five-section,
  theory- and Prompt-guided DeepSeek generator. It is prior work, not yet a
  validated baseline for the current research question.

The Story-level Narrative Technique Design Partner remains unimplemented and is
not part of the current development plan. Its Track B boundary is preserved
under `agent/narrative-technique-design-partner/`; the existing counterfactual
contracts remain technique-specific under
`techniques/counterfactual/schemas/`. Track A's request, response, run-trace,
screening, and knowledge-card contracts do not repurpose Track B.

The confirmed two-direction program structure is recorded in
[`research/decisions/2026-08-28-two-track-helper-architecture.md`](research/decisions/2026-08-28-two-track-helper-architecture.md).
The later Track B technique-family scope is recorded in
[`research/decisions/2026-08-28-track-b-narrative-technique-scope.md`](research/decisions/2026-08-28-track-b-narrative-technique-scope.md).
The maintained development and component-boundary decision is recorded in
[`research/decisions/2026-08-28-initial-helper-development.md`](research/decisions/2026-08-28-initial-helper-development.md).

## Clone

Clone the research repository and its testbed together:

```powershell
git clone --recurse-submodules https://github.com/666feiyu666/interactive-narrative-helper.git
```

Existing clones can initialize the testbed with:

```powershell
git submodule update --init --recursive
```

Each executable component owns its own environment and verification commands.
Read its README before running or changing it.

## Working rules

Read `AGENTS.md` before changing research scope, repository structure, data, or
executable behavior. In particular, keep confirmed goals, implemented behavior,
experimental evidence, and interpretation separate; do not commit restricted
source material, secrets, participant data, or unreviewed external corpus
content.

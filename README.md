# Interactive Narrative Helper

Interactive Narrative Helper is a research program about evidence-grounded,
design-time AI support for educators and narrative authors.

The program now treats its current and long-term work as two connected
directions:

1. **Macro educational design exploration:** identify how creators describe
   educational purposes, intended audiences, application settings, interactive
   narrative forms, and the relationships among them.
2. **Story-level counterfactual exploration:** help an author expand a concrete
   story by proposing alternative character actions and projecting their
   consequences for later choices, endings, themes, and educational meaning.

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

### Current study framework

![Current itch.io creator-description mining framework](research/figures/current-study-framework.svg)

The current operational study is narrower than the full framework. It uses the
frozen itch.io candidate inventory and public creator project pages as its first
source layer. Steam and other platforms are possible future coverage, not part
of the accepted current acquisition.

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
122 uncertain records remain for human revision. In parallel, maintained
development has begun on the Track A Educational
Interactive Narrative Design Helper. Its initial contracts separate local
source evidence from model-facing knowledge cards so the first
knowledge snapshot can run through the same Harness that later releases will
use. This snapshot passed a deterministic second-pass audit but not independent
human double-coding. The cross-track design-brief schema remains deferred.

Raw project-page HTML and verbatim evidence remain local mining inputs, not
runtime Helper inputs.

## Story-level long-term research goal

> To what extent can a generative agent act as a counterfactual narrative
> design partner in adapting classic children's stories into multi-ending
> interactive narratives, by proposing distinct yet story-compatible character
> actions and projecting their consequences for plot development, possible
> endings, thematic meaning, and educational purpose?

The long-term story-level track retains the design-time **Counterfactual
Narrative Design Partner** as an ambitious future research goal, but it is not
part of the current development scope. Track A's initial contracts and
component boundary now exist. A 122-card automation-reviewed knowledge
snapshot exists, but no executable Helper, independently human-reviewed
snapshot, or research evidence of Helper quality is claimed yet.

## Repository map

| Path | Responsibility |
|---|---|
| `research/` | Research question, constructs, scope, methods, ethics, and decisions |
| `agent/` | Separate Track A Educational Design Helper and Track B Counterfactual Partner components |
| `cases/` | Stable story analyses, pivotal actions, invariants, and design briefs |
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
- `cases/fox-and-crow/` defines the first counterfactual adaptation case without
  prescribing the Agent's answers.
- `testbeds/fox-and-crow/` is the independently versioned playable
  Fox-and-Crow application, included as a Git submodule.
- `legacy/theory-guided-story-generator/` preserves the earlier five-section,
  theory- and Prompt-guided DeepSeek generator. It is prior work, not yet a
  validated baseline for the current research question.

The counterfactual design Partner remains unimplemented and is not part of the
current development plan. Its existing machine-readable contracts are
preserved under `agent/counterfactual-design-partner/schemas/` only to maintain
the long-term research boundary. Track A's request, response, run-trace,
screening, and knowledge-card contracts do not repurpose Track B.

The confirmed two-direction program structure is recorded in
[`research/decisions/2026-08-28-two-track-helper-architecture.md`](research/decisions/2026-08-28-two-track-helper-architecture.md).
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

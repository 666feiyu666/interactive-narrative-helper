# Interactive Narrative Helper

Interactive Narrative Helper is a research program about author-facing AI
support for adapting classic children's stories into multi-ending interactive
narratives.

## Research question

> 在将经典儿童故事改编为多结局互动叙事的过程中，生成式 Agent 在多大程度上能够作为反事实叙事设计伙伴，提出与原作相容且具有实质差异的角色行动，并推演这些行动对情节发展、可能结局、故事主题与教育意义的影响？

The central artifact is a design-time **Counterfactual Narrative Design
Partner**. It helps an author explore what a character could do differently and
what those choices might change. It is not a generic full-story generator and
is distinct from a runtime narrator that responds to players.

## Repository map

| Path | Responsibility |
|---|---|
| `research/` | Research question, constructs, scope, methods, ethics, and decisions |
| `agent/` | Reusable counterfactual design agent contracts and future implementation |
| `cases/` | Stable story analyses, pivotal actions, invariants, and design briefs |
| `corpus/` | Catalogs, annotations, schemas, derived knowledge, and rights records |
| `experiments/` | Reproducible protocols, conditions, evaluations, and analyses |
| `testbeds/` | Runnable research instruments used across experiments |
| `tools/` | Corpus, evaluation, and reporting utilities |
| `outputs/` | Deliberately selected generated figures, tables, and reports |
| `legacy/` | Preserved predecessor implementations that are not current research artifacts |

## Current components

- `cases/fox-and-crow/` defines the first counterfactual adaptation case without
  prescribing the Agent's answers.
- `testbeds/fox-and-crow/` is the independently versioned playable
  Fox-and-Crow application, included as a Git submodule.
- `legacy/theory-guided-story-generator/` preserves the earlier five-section,
  theory- and Prompt-guided DeepSeek generator. It is prior work, not yet a
  validated baseline for the current research question.

The counterfactual design Agent itself has not yet been implemented. Its first
machine-readable input and output contracts live under `agent/` so future
experiments can evaluate separate capabilities instead of treating fluent prose
as sufficient evidence.

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

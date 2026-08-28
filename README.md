# Interactive Narrative Helper

Interactive Narrative Helper is a research program about evidence-grounded,
author-facing AI support for interactive narrative design.

## Current research stage

The current short-term goal is to understand how Interactive Fiction (IF) is
used in educational and learning contexts through data mining. Current work is
limited to defining the relevant population and terminology, acquiring usable
source material, and identifying what the available evidence can support.

The broader direction is intentionally stated only at a high level:

```text
source material -> data mining -> design knowledge -> retrieval-supported Agent
```

The knowledge representation, retrieval method, Agent contract, and evaluation
design are deferred until the mining work shows what reliable knowledge can
actually be obtained. Raw project-page HTML is source material for mining, not
direct input to the future Agent.

## Long-term research goal

> 在将经典儿童故事改编为多结局互动叙事的过程中，生成式 Agent 在多大程度上能够作为反事实叙事设计伙伴，提出与原作相容且具有实质差异的角色行动，并推演这些行动对情节发展、可能结局、故事主题与教育意义的影响？

The long-term program retains the design-time **Counterfactual Narrative Design
Partner** as an ambitious future goal. The current educational-IF mining stage
does not claim that this Agent, an educational-IF Agent, or a knowledge base has
been implemented.

## Repository map

| Path | Responsibility |
|---|---|
| `research/` | Research question, constructs, scope, methods, ethics, and decisions |
| `agent/` | Preserved counterfactual design-agent contracts and future implementation |
| `cases/` | Stable story analyses, pivotal actions, invariants, and design briefs |
| `corpus/` | Catalogs, annotations, schemas, derived knowledge, and rights records |
| `experiments/` | Reproducible protocols, conditions, evaluations, and analyses |
| `testbeds/` | Runnable research instruments used across experiments |
| `tools/` | Corpus, evaluation, and reporting utilities |
| `outputs/` | Deliberately selected generated figures, tables, and reports |
| `legacy/` | Preserved predecessor implementations that are not current research artifacts |

## Current components and evidence boundary

- `corpus/catalog/itchio-public-text/manifest.json` is a frozen platform-tag
  candidate inventory, not a confirmed educational-IF corpus.
- The explicitly authorized stable 1.0 full-manifest acquisition captured all
  606 candidate project pages, and the stable 1.0 offline cleaner produced 606
  source records. This establishes acquisition and transformation completeness
  for the frozen manifest only; it does not establish educational relevance or
  IF status.
- `cases/fox-and-crow/` defines the first counterfactual adaptation case without
  prescribing the Agent's answers.
- `testbeds/fox-and-crow/` is the independently versioned playable
  Fox-and-Crow application, included as a Git submodule.
- `legacy/theory-guided-story-generator/` preserves the earlier five-section,
  theory- and Prompt-guided DeepSeek generator. It is prior work, not yet a
  validated baseline for the current research question.

The counterfactual design Agent remains unimplemented. Its existing
machine-readable contracts are preserved under `agent/schemas/` as long-term
work rather than being silently repurposed for the current mining stage.

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

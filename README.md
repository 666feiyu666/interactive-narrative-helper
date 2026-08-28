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

## Current research stage

The current short-term goal is to understand how creators publicly describe
Interactive Fiction (IF) for educational and learning contexts. Current work
focuses on population and terminology, source acquisition, inclusion, and the
creator-described educational and interaction characteristics that project
pages can support.

The broader direction is intentionally stated only at a high level:

```text
creator pages -> data mining -> traceable design precedents -> macro design Helper
                                                         -> reviewed design brief
                                                         -> story-level Partner
```

The detailed knowledge representation, retrieval method, macro Helper contract,
and design-brief schema are deferred until mining shows what can be derived
reliably. Raw project-page HTML is source material for mining, not direct input
to either future Helper capability.

## Story-level long-term research goal

> 在将经典儿童故事改编为多结局互动叙事的过程中，生成式 Agent 在多大程度上能够作为反事实叙事设计伙伴，提出与原作相容且具有实质差异的角色行动，并推演这些行动对情节发展、可能结局、故事主题与教育意义的影响？

The long-term story-level track retains the design-time **Counterfactual
Narrative Design Partner** as an ambitious future goal. The current mining stage
does not claim that either Helper direction or a design knowledge base has been
implemented.

## Repository map

| Path | Responsibility |
|---|---|
| `research/` | Research question, constructs, scope, methods, ethics, and decisions |
| `agent/` | Story-level counterfactual Partner contracts and future implementation |
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
  for the frozen manifest only; research coding of creator-described purposes,
  audiences, settings, forms, and design relationships has not yet been
  completed.
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

The confirmed two-direction program structure is recorded in
[`research/decisions/2026-08-28-two-track-helper-architecture.md`](research/decisions/2026-08-28-two-track-helper-architecture.md).

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

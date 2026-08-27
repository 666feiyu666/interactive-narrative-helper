# Repository Guidance

## Scope

This file applies to the entire `interactive-narrative-helper` research repository. A
more deeply nested `AGENTS.md` may add component-specific instructions, but it
must not silently redefine the project-level research question or the role of the
research agent.

## Project identity and repositories

- Canonical project remote for future work:
  `https://github.com/666feiyu666/interactive-narrative-helper`.
- The remote's default branch is `main`. Its earlier theory- and prompt-guided
  story generator is preserved under `legacy/theory-guided-story-generator/`.
  Treat it as prior work, not as the current research definition or an already
  validated experimental baseline.
- `testbeds/fox-and-crow/` is an independently versioned, runnable Git submodule
  whose remote is
  `https://github.com/666feiyu666/Fox-and-Crow.git`.
- Preserve the histories and deployment assumptions of both repositories. Do
  not rewrite history, change submodule provenance, or push without explicit
  authorization.

## Current research question

The project currently asks:

> 在将经典儿童故事改编为多结局互动叙事的过程中，生成式 Agent 在多大程度上能够作为反事实叙事设计伙伴，提出与原作相容且具有实质差异的角色行动，并推演这些行动对情节发展、可能结局、故事主题与教育意义的影响？

Working English formulation:

> To what extent can a generative agent act as a counterfactual narrative
> design partner in adapting classic children's stories into multi-ending
> interactive narratives, by proposing distinct yet story-compatible character
> actions and projecting their consequences for plot development, possible
> endings, thematic meaning, and educational purpose?

Do not broaden this into the generic question of whether an agent can write an
entire interactive story. Changes to the research question, target user, or
agent role require explicit user confirmation.

## Role of the research agent

The research artifact is an author-facing, design-time **Counterfactual
Narrative Design Partner**. It operates after a source story and a pivotal
canonical action have been identified, and before full branch authoring or
runtime implementation.

Its core responsibilities are to:

1. preserve explicitly declared invariants of the source story;
2. propose substantively different alternative character actions rather than
   superficial paraphrases;
3. project an inspectable causal chain from each action through reactions, new
   conflicts, further choices, and possible endings;
4. propose supported interpretations of thematic and educational shifts;
5. expose assumptions, risks, and required changes for author review.

The agent must not present a theme or educational purpose as the single correct
interpretation. These are reasoned possibilities for the author to accept,
revise, combine, or reject. The author retains creative and interpretive
authority.

Keep this design-time agent distinct from the runtime `Story Agent` inside the
Fox-and-Crow testbed. The runtime agent reacts to player input and narrates
visible prose; it is not the primary research artifact defined above.

## Core capability dimensions

Research designs and implementations should keep these dimensions separable:

- **Action-space generation:** diversity and substantive difference among
  alternative strategies.
- **Source compatibility:** consistency with preserved character goals, world
  rules, and story identity.
- **Consequence projection:** causal coherence across immediate effects,
  intermediate conflicts, further choices, and endings.
- **Meaning projection:** traceable relationships between changed events and
  possible thematic or educational shifts.
- **Author utility and control:** whether authors can understand, select, edit,
  and develop the proposals without losing creative authority.

Fluent prose is not evidence that these capabilities have been achieved. Prefer
structured, inspectable outputs and evaluate the dimensions independently.

## Target repository structure

Maintain the following repository boundaries:

```text
interactive-narrative-helper/
  README.md
  AGENTS.md
  research/       # RQ, constructs, scope, methods, ethics, decisions
  agent/          # reusable counterfactual narrative design agent
  cases/          # stable source-story analyses and research task definitions
  corpus/         # catalog, annotations, schemas, derived knowledge, rights data
  experiments/    # protocols, conditions, runs, evaluations, analyses
  testbeds/       # runnable research instruments such as Fox-and-Crow
  tools/          # corpus, evaluation, and reporting utilities
  outputs/        # generated figures, tables, and reports
  legacy/         # preserved predecessor implementations when needed
```

Use these terms consistently:

- `tests/` means automated software verification.
- `experiments/` means reproducible research comparisons with protocols and
  results.
- `testbeds/` means runnable artifacts used across multiple experiments.
- `cases/` means stable story inputs, pivotal actions, invariants, and design
  briefs; a case does not require a runnable application.
- `legacy/` preserves predecessor code that has not yet been adapted into a
  valid baseline for the current RQ.

The Fox-and-Crow application belongs at `testbeds/fox-and-crow/` as a Git
submodule. Preserve its independent history and deployment assumptions. Changes
inside it must be committed in its own repository before the parent repository
updates the recorded submodule commit.

## Research artifact contracts

Each case should make the following explicit in a machine-readable form where
practical:

- source and rights/provenance;
- target audience;
- canonical action and character goal;
- counterfactual question;
- story facts and invariants that must be preserved;
- facts or premises that may change;
- requested number and type of alternative actions.

Each agent proposal should expose at least:

- alternative action and motivation;
- compatibility with source constraints;
- immediate consequence;
- subsequent causal developments and new conflict;
- further interactive choices;
- one or more possible endings;
- possible thematic shift and its narrative evidence;
- possible educational implications and their narrative evidence;
- required source changes, assumptions, and risks.

Define schemas before building elaborate interfaces. Store prompts, model
configuration, and evaluation criteria separately so experiments can vary one
condition without silently changing others.

## Experiment requirements

Every numbered experiment should record:

- the research question or capability it tests;
- cases and exact input versions;
- agent, prompt, model, provider, and knowledge condition;
- sampling parameters and run date;
- raw output location and any transformation steps;
- evaluator instructions and criteria;
- results, exclusions, limitations, and source commit identifiers.

Do not use a handful of persuasive examples as evidence of capability. Preserve
failed and rejected outputs where permissions allow, distinguish exploratory
runs from confirmatory evaluations, and avoid changing prompts or criteria
after seeing results without documenting the change.

## Corpus, copyright, and privacy

- Corpus collection is a method serving the RQ, not the project goal by itself.
- Do not commit copyrighted full texts, downloaded game packages, personal
  information, or third-party assets without a documented right to do so.
- Keep restricted raw sources out of Git by default. Prefer provenance records,
  derived structural annotations, and minimal evidence excerpts.
- Do not scrape external services, send corpus material to an external model,
  or publish a dataset without explicit authorization and a rights review.
- Never commit API keys, `.env` files, private URLs, credentials, or participant
  data.
- Work involving children or recruited participants requires an explicit ethics,
  consent, privacy, and data-management plan before data collection.

## Development and documentation rules

- Before changing a component, read its README, configuration, tests, and any
  nested `AGENTS.md`.
- Preserve user changes and the history of both existing repositories. Do not
  treat a clean local checkout as permission to rewrite or publish it.
- Keep confirmed research goals, implemented behavior, experimental evidence,
  interpretation, and future plans clearly separated.
- A planning document is not implementation evidence; passing unit tests are not
  evidence of author utility or narrative quality.
- Prefer small, reversible changes and the narrowest meaningful verification.
- Add or update automated tests when changing executable behavior or schemas.
- Keep generated runs and large outputs out of source directories. Track only
  deliberately selected fixtures or reproducibility artifacts.
- Update path-sensitive documentation, notebook bootstrap URLs, deployment
  assumptions, and tests together when repository paths change.
- Do not deploy, push, publish, rewrite Git history, or migrate external data
  unless the user explicitly requests it.

## Current implementation boundary

- The repository structure and schemas define intended research behavior; they
  do not prove that the counterfactual design Agent has been implemented.
- `legacy/theory-guided-story-generator/` remains runnable prior work. Do not
  silently modify it into the new Agent or call it a baseline until a comparable
  experimental condition is specified.
- `testbeds/fox-and-crow/` is a runtime research instrument, not the design-time
  Agent defined by the RQ.
- New implementation should begin from the contracts under `agent/` and stable
  task definitions under `cases/`, with experiments added separately.

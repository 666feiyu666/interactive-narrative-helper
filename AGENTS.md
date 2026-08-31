# Repository Guidance

## Scope

This file applies to the entire `interactive-narrative-helper` research
repository. Nested `AGENTS.md` files may add component-specific rules, but
must not redefine the research questions or human-authority boundaries.

## Project identity and repositories

- Canonical remote:
  `https://github.com/666feiyu666/interactive-narrative-helper`.
- The default branch is `main`.
- `legacy/theory-guided-story-generator/` is prior work, not a current
  baseline.
- `testbeds/fox-and-crow/` is the independently versioned
  `https://github.com/666feiyu666/Fox-and-Crow.git` submodule.
- Do not rewrite history, change submodule provenance, push, deploy, or publish
  without explicit authorization.

## Research program

The current short-term Track A question is:

> How do creators of educational Interactive Fiction distributed through game
> platforms describe their educational purposes, intended audiences,
> application settings, and interactive narrative forms, and what identifiable,
> reusable types, characteristics, and design combinations appear in those
> descriptions?

The broader source universe may include itch.io, Steam, other game platforms,
and related catalogues. The accepted acquisition currently covers only public
itch.io project pages. Creator descriptions are primary evidence for how
creators position a work; they are not evidence of learning effectiveness.

The Track B program question is:

> To what extent can a generative agent act as an author-controlled,
> story-level narrative technique design partner in adapting classic
> children's stories into interactive narratives, by proposing inspectable
> technique-specific transformations and explaining their implications for
> player experience, interaction, narrative development, thematic meaning,
> and educational purpose?

Track B1 retains the narrower counterfactual question:

> To what extent can a generative agent act as a counterfactual narrative
> design partner in adapting classic children's stories into multi-ending
> interactive narratives, by proposing distinct yet story-compatible character
> actions and projecting their consequences for plot development, possible
> endings, thematic meaning, and educational purpose?

Do not broaden either Track B question into whether an Agent can write a whole
interactive story. Changes to the research level, target user, evidence
standard, or Agent role require explicit user confirmation.

## Confirmed current state

Track A is at the source-preparation boundary:

- The frozen itch.io manifest contains 606 candidates. It is a discovery
  inventory, not a screened educational-IF corpus.
- The authorized raw acquisition
  `itchio-page-bundle-full-001` contains 606 successful page bundles under
  the ignored restricted-source tree.
- The deterministic offline derivation
  `itchio-page-cleaning-full-001` contains 606 source records. Cleaning
  establishes reproducible source preparation only.
- Formal screening, research coding, synthesis, data-mining analysis, and
  evaluation have not started.
- Track A Agent role/capability modeling, knowledge design, retrieval research,
  Agent evaluation, and maintained Agent implementation have not started.
- Track B remains a preserved research boundary; no Track B runtime is in the
  current scope.

The earlier workbook, annotations, coding rules, knowledge snapshots, formal
release, compatibility profiles, and claimed acceptance history are
superseded development artifacts. They are not authoritative research inputs
or evidence and must not be used to resume Track A. Their eventual deletion is
a cleanup operation, not loss of a research version; Git history remains the
historical record.

## Display MVP

`app/educational-design-helper-mvp/` is a runnable presentation prototype. It
demonstrates a possible interface and response shape.

- `npm run start` must start a deterministic offline display without an API
  key.
- `npm run start:live` may use an external model through an app-local ignored
  `.env`.
- Bundled `demo-data/` records are legacy-generated display fixtures. They
  are not formal data-mining findings, a validated knowledge base, or evidence
  of Agent capability, recommendation quality, author utility, or educational
  effectiveness.
- The MVP must not read raw or cleaned restricted-source records at runtime.
- Do not describe this app as the implemented Track A Agent.

## Track B boundaries

The prospective Story-level Narrative Technique Design Partner operates after
a concrete story and reviewed design direction have been identified and before
full branch authoring or runtime implementation. It preserves author-declared
invariants, works within a framed technique, proposes inspectable
transformations, exposes assumptions and risks, and leaves selection,
interpretation, revision, and final design to the author.

Track B1 is the only specified technique module. It keeps action-space
generation, source compatibility, consequence projection, meaning projection,
and author utility/control separable. Fluent prose is not evidence of these
capabilities.

The design-time Partner is distinct from the runtime `Story Agent` in the
Fox-and-Crow testbed.

## Project-local skill routing

Project-specific Codex methods live under `.agents/skills/`. Keep this layer
separate from `agent/`, which contains research-defined Agent boundaries.

- Use `research-data-mining` for terminology, population and source coverage,
  acquisition, screening, coding, analysis, data quality, bias, validity, and
  the scripts or notebooks required for those tasks.
- Use `research-agent-building` only when research findings are being
  translated into an Agent role, capability model, knowledge boundary,
  human-control relationship, minimal prototype, probe, or Agent evaluation.
- Use `guided-software-development` only after the user explicitly decides to
  productize a researched Agent or research tool as a complete application.
  Do not route data-mining utilities or minimal Agent prototypes through it.
- Use `research-through-design` only if the user explicitly adopts that
  methodology.

A skill may organize work inside confirmed scope but may not invent a research
question, corpus decision, evidence standard, Agent role, or evaluation
finding.

## Target repository structure

```text
interactive-narrative-helper/
  README.md
  AGENTS.md
  .agents/       # project-local research skills
  research/      # RQs, constructs, methods, ethics, decisions
  app/           # runnable presentation/product prototypes
  agent/         # research-defined Agent roles and boundaries
  cases/         # stable story inputs and technique-specific tasks
  corpus/        # source catalog, restricted sources, and future research data
  experiments/   # research protocols, runs, evaluations, and analyses
  testbeds/      # runnable research instruments
  tools/         # acquisition, cleaning, analysis, and reporting utilities
  outputs/       # generated, disposable working output
  legacy/        # preserved predecessor implementations
```

Use these terms consistently:

- `tests/`: automated software verification.
- `experiments/`: reproducible research comparisons and results.
- `testbeds/`: runnable instruments used across experiments.
- `cases/`: stable story inputs, invariants, task definitions, and reviewed
  design briefs.
- `app/`: runnable presentation or product prototypes, not research evidence.
- `agent/`: Agent roles, capabilities, contracts, and research boundaries.
- `outputs/`: generated workspace; never an authoritative source-data or
  research-version store.
- `legacy/`: predecessor code preserved when needed.

## Authoritative acquisition and cleaning evidence

Git-safe provenance and contracts:

```text
corpus/catalog/itchio-public-text/manifest.json
corpus/catalog/itchio-public-text/acquisition-run-full-001.md
corpus/catalog/itchio-public-text/cleaning-run-full-001.md
corpus/protocols/itchio-public-page-bundle-v1.0.md
corpus/protocols/itchio-offline-page-cleaning-v1.0.md
```

Ignored restricted payloads:

```text
corpus/restricted-sources/itchio-public-text/
  runs/itchio-page-bundle-full-001/
  derived/itchio-page-cleaning-full-001/
```

Preserve the raw run, cleaning derivation, hashes, stable `project_id` joins,
and provenance. Do not recreate cleaning unless the user explicitly requests
it. Future Track A research must begin by designing the actual screening,
coding, and analysis method over these retained source-preparation outputs.

## Corpus, rights, and privacy

- Do not commit copyrighted full texts, downloaded games, personal
  information, or third-party assets without documented rights.
- Keep raw pages and cleaned source records out of Git.
- Do not scrape, contact external services, send corpus material to an external
  model, or publish a dataset without explicit authorization and a rights
  review.
- Raw HTML is not runtime input to either Helper direction.
- Never commit secrets, `.env` files, private URLs, credentials, participant
  data, or identifiable interaction logs.
- Work involving participants, especially children, requires an explicit
  ethics, consent, privacy, and data-management plan.

## Research and development rules

- Before changing a component, read its README, configuration, tests, and any
  nested `AGENTS.md`.
- Keep confirmed goals, current evidence, implementation, interpretation, and
  future plans distinct.
- Acquisition and cleaning completion are not screening, coding, analysis, or
  a research result.
- A display MVP is not an Agent capability model or evaluation.
- Passing tests establish software behavior only.
- Define research protocols before numbered experiments. Record cases and
  exact inputs, conditions, prompts/models/providers, run dates, raw outputs,
  transformations, evaluator instructions, results, limitations, and source
  commits.
- Preserve failures where research permissions require it, but do not treat
  obsolete development fixtures as research versions.
- Prefer small reversible changes and update path-sensitive documentation and
  tests together.
- Preserve user changes and both repository histories.

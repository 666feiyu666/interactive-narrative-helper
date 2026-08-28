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

## Research program and active study

The project retains this long-term research question:

> To what extent can a generative agent act as a counterfactual narrative
> design partner in adapting classic children's stories into multi-ending
> interactive narratives, by proposing distinct yet story-compatible character
> actions and projecting their consequences for plot development, possible
> endings, thematic meaning, and educational purpose?

Do not broaden the long-term question into the generic question of whether an
agent can write an entire interactive story.

The confirmed short-term study is narrower and precedes that goal:

> How do creators of educational Interactive Fiction distributed through game
> platforms describe their educational purposes, intended audiences,
> application settings, and interactive narrative forms, and what identifiable,
> reusable types, characteristics, and design combinations appear in those
> descriptions?

Current work is data mining: clarify terminology and population coverage,
acquire usable source material, define inclusion, and determine what
creator-described application and design characteristics the available source
layers can support. The broader source universe may include educational IF
distributed through itch.io, Steam, other game platforms, and related
catalogues. The current accepted acquisition is limited to public itch.io
project pages. Public creator descriptions are the primary evidence for claims
about how creators position their work; they are not required to establish
learning effectiveness before they can be analyzed for that purpose.

The program-level relationship between the current study and the long-term
counterfactual work is confirmed: they are two connected design-time
directions of the umbrella **Interactive Narrative Helper**. The current study
supports the maintained macro-level Educational Interactive Narrative Design
Helper; the long-term question supports the story-level Counterfactual
Narrative Design Partner. They should connect through an author-reviewed design
brief rather than by passing raw source material directly between systems.
Initial Track A knowledge, request, response, and run-trace contracts are now
confirmed for maintained development. Retrieval implementation and the bridge
schema remain open to evidence and later decisions. Raw source HTML is not
runtime input to either Helper capability.

Changes to either research level, target user, or Agent role require explicit
user confirmation.

## Current work and two design-time directions

The current research artifact is the collected and analyzed evidence needed to
answer the short-term creator-description question. This is **Track A — macro
educational design exploration**. Its maintained Helper is intended to help
educators and narrative designers compare creator-grounded combinations of
educational purpose, intended audience, application setting, interactive form,
and the described relationship between interaction and educational intent. It
should provide traceable design precedents and alternatives, not prescribe one
correct educational design. Its initial maintained component, public contracts,
and first widened automation-reviewed knowledge snapshot are now specified. An
executable runtime, independent human double-coding, and research evaluation
are not yet complete.

**Track B — story-level counterfactual exploration** retains the confirmed
long-term research artifact: the author-facing, design-time
**Counterfactual Narrative Design Partner**. It operates after a source story
and pivotal canonical action have been identified, and before full branch
authoring or runtime implementation.

Track B is not part of the current development scope. Preserve its research
definition, stable case/proposal contracts, and component boundary, but do not
implement its runtime, Harness, interface, or evaluation unless the user later
authorizes that work explicitly.

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

The two tracks may share a human-reviewed design brief. Track A can propose the
educational topic, audience, setting, interaction pattern, rationale, and
supporting precedents; the educator or author selects and revises them. Track B
can then consume the confirmed direction together with a concrete story,
canonical action, character goal, invariants, and permitted changes. This
bridge is a program concept, not yet a fixed machine-readable contract.

Keep the design-time agent distinct from the runtime `Story Agent` inside the
Fox-and-Crow testbed. The runtime agent reacts to player input and narrates
visible prose; it is not the long-term research artifact defined above.

## Long-term counterfactual capability dimensions

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
  agent/          # separate Track A Helper and Track B Partner components
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

- Corpus collection and data mining serve the short-term RQ; acquisition alone
  is not the research result.
- Do not commit copyrighted full texts, downloaded game packages, personal
  information, or third-party assets without a documented right to do so.
- Keep restricted raw sources out of Git by default. Prefer provenance records,
  derived structural annotations, and minimal evidence excerpts.
- Do not pass restricted raw HTML directly to a future Agent. Detailed
  knowledge and retrieval handling remain undecided until the mining stage
  establishes what can be derived reliably.
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

## Current authoritative Track A working data

The current canonical working dataset for screening, research coding, and the
first knowledge extraction is:

```text
outputs/itchio-sheet/
  itchio-educational-if-candidates-v1.0.xlsx
```

This workbook is the accepted working interface over
`itchio-page-cleaning-full-001`. Do not recreate another cleaned dataset,
review queue, or 606-row coding surface from the restricted source records.
Begin current Track A work from this workbook unless the user explicitly
confirms a newer canonical workbook.

Workbook responsibilities are fixed as follows:

- `README` records workbook version, source derivation, counts, and evidence
  boundaries.
- `cases` contains the 606 flat cleaned source records. `description_clean` is
  the current text used for screening and coding; `project_id` is the stable
  join key.
- `coding` contains 606 project rows and is the current surface for
  educational purpose, target audience, application setting, interactive
  narrative form, IF mechanics, evidence, coding status, uncertainty, and
  review fields. The confirmed v1.1 scoped substantive-OR run records 122
  `coded`, 122 `uncertain`, and 362 `not_applicable` rows. `uncertain` rows
  remain the next human-review layer in this same sheet.
- `manual_review` contains only the 21 deterministic cleaning exceptions. It is
  not a general screening or knowledge-extraction queue.
- `field_coverage` defines workbook columns, coverage, missing-value meaning,
  and research role.
- `provenance` connects all 606 project IDs to source runs, hashes, and retained
  local paths.
- `engagement` is an exploratory public-rating view and is not an inclusion or
  knowledge-quality signal.

The adjacent `.xlsx.inspect.ndjson` and `.work/` files are generated inspection
and workbook-build artifacts, not alternate analytical inputs. They may contain
sampled source text and remain ignored output material.

Current workflow begins with screening and coding in the existing workbook:

```text
cases + field_coverage + provenance
  -> screening decisions recorded through coding status and notes
  -> evidence-grounded coding in coding
  -> reviewed model-facing knowledge cards
  -> versioned knowledge snapshot
  -> retrieval and Harness
```

Use `record_path` or `description_path` only to verify provenance, resolve one
of the 21 `manual_review` exceptions, or inspect evidence that the workbook
cannot represent. Do not bypass the workbook to repeat full-manifest cleaning.
Preserve any human edits in `coding` and `manual_review`; never regenerate or
overwrite the workbook without first verifying the preservation behavior and
receiving authorization for that exact write.

If a later workbook replaces version 1.0, update this section,
`outputs/README.md`, `corpus/README.md`, and all path-sensitive tools and tests
together.

## Current implementation boundary

- The repository structure and documents define intended research behavior.
  The frozen v1.1 knowledge snapshot is an implemented development input, but
  it does not prove that data mining has answered the short-term RQ, that human
  coding is complete, or that the Track A Agent runtime is implemented or
  effective.
- The frozen itch.io manifest is a candidate discovery snapshot, not a confirmed
  educational-IF corpus. The stable 1.0 acquisition contains 606 successful page
  bundles, and the stable 1.0 offline cleaning contains 606 source records;
  neither result is terminology, relevance, inclusion, or quality evidence.
- Preserve the accepted full acquisition and cleaning outputs unless a later
  cleanup is explicitly authorized. Superseded implementation drafts,
  diagnostic runs, and protocol trials do not require retention once the
  current contract, tests, and full-run evidence contain the necessary
  constraints.
- The current Track A development snapshot is
  `corpus/derived-knowledge/track-a-itchio-v1.1-knowledge-v1/`. It contains 122
  model-facing case precedents promoted by the scoped substantive-OR policy: 2
  complete-core Tier B cards and 120 partial-substantive Tier C cards. The
  strict v1.0 two-card snapshot remains preserved for comparison. Neither is
  evidence of corpus representativeness, human coding agreement, learning
  effectiveness, or Helper quality.
- `legacy/theory-guided-story-generator/` remains runnable prior work. Do not
  silently modify it into the new Agent or call it a baseline until a comparable
  experimental condition is specified.
- `testbeds/fox-and-crow/` is a runtime research instrument, not the design-time
  Agent defined by the long-term RQ.
- Current implementation should connect the minimum collection and analysis
  needed for the short-term RQ to the maintained Track A component under
  `agent/educational-design-helper/`. Track B is not currently being developed;
  its contracts under `agent/counterfactual-design-partner/schemas/` and stable
  task definitions under `cases/` are retained only as long-term research
  boundaries.

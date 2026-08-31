# Interactive Narrative Helper

Interactive Narrative Helper is a research program about evidence-grounded,
human-controlled support for educational interactive narrative design.

## Research directions

Track A studies macro educational design descriptions:

> How do creators of educational Interactive Fiction distributed through game
> platforms describe their educational purposes, intended audiences,
> application settings, and interactive narrative forms, and what identifiable,
> reusable types, characteristics, and design combinations appear in those
> descriptions?

Track B studies an author-controlled Story-level Narrative Technique Design
Partner. Its only specified module is Track B1, counterfactual action and
consequence exploration. Track B is a long-term research boundary and is not
currently being implemented.

The tracks may eventually connect through a human-reviewed design brief. No
bridge contract has been fixed.

## Current state

The repository has completed only the source-preparation work needed before
formal Track A data mining:

- a frozen itch.io tag-intersection inventory of 606 candidate pages;
- an authorized raw acquisition with 606 successful page bundles;
- a deterministic offline cleaning derivation with 606 source records; and
- provenance, rights boundaries, acquisition tooling, cleaning tooling, and
  software checks for those two stages.

The inventory is not a screened corpus. Formal screening, research coding,
analysis, synthesis, and evaluation have not started. Track A Agent modeling
and Agent evaluation have also not started.

Earlier workbook-based coding, derived-knowledge releases, versioned runtime
contracts, and acceptance claims are superseded development artifacts, not
research evidence or current project state.

Raw project-page material remains under the ignored restricted-source tree and
is never runtime input to either Helper direction.

## Display MVP

[Display MVP](app/educational-design-helper-mvp/) contains the existing
interface prototype, reclassified as display-only. Its bundled records are
legacy-generated demo fixtures and must not be read as formal mining findings
or a validated Agent knowledge base.

Run the deterministic offline display from
app/educational-design-helper-mvp:

    npm install
    npm run start

Then open http://127.0.0.1:3000/. This mode does not require an API key.
The separate external-model path is npm run start:live and is documented in the
app README.

## Repository map

| Path | Responsibility |
| --- | --- |
| .agents/skills/ | Project-local methods for data-mining research and Agent modeling |
| research/ | Research questions, concepts, methods, ethics, architecture, and decisions |
| app/ | Runnable presentation or product prototypes; not research evidence by default |
| agent/ | Research-defined Agent roles and Track B boundaries |
| cases/ | Stable story inputs, invariants, and technique-specific tasks |
| corpus/ | Candidate catalog, restricted raw/cleaned sources, provenance, and future research data |
| experiments/ | Research protocols, runs, evaluations, and analyses |
| testbeds/ | Independently runnable research instruments |
| tools/ | Acquisition, cleaning, analysis, and reporting utilities |
| outputs/ | Generated, disposable working output |
| legacy/ | Preserved predecessor implementations |

The Fox-and-Crow application remains an independently versioned Git submodule
at testbeds/fox-and-crow/. The earlier theory-guided generator remains prior
work under legacy/; neither is the current design-time Agent.

## Research frameworks

![Full Interactive Narrative Helper research framework](research/figures/full-program-framework.svg)

![Track A iterative research framework](research/figures/current-study-framework.svg)

These diagrams describe program relationships and a possible research cycle,
not implementation progress.

## Working rules

Read [AGENTS.md](AGENTS.md) before changing scope, data, repository boundaries,
or executable behavior. Use the project-local research-data-mining method for
Track A evidence work and research-agent-building only after research findings
are ready to inform an Agent model.

Do not commit restricted source material, secrets, participant data, or
unreviewed third-party content. Do not infer research findings from a working
application, generated fixture, or passing software test.

## Clone

    git clone --recurse-submodules https://github.com/666feiyu666/interactive-narrative-helper.git

For an existing clone:

    git submodule update --init --recursive

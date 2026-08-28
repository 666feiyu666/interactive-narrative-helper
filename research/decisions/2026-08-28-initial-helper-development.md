# Decision: Begin maintained Track A Helper development

- **Date:** 2026-08-28
- **Status:** confirmed by the user in project discussion
- **Scope:** software lifecycle, Agent component ownership, knowledge boundary,
  and first release architecture

## Decision

Development begins on the Educational Interactive Narrative Design Helper as a
maintained Track A system. The first end-to-end release is an early version of
that system, not a separate throwaway prototype. Later improvements to corpus
coverage, knowledge quality, retrieval, Harness behavior, and interface design
will evolve the same versioned contracts and component boundaries.

The `agent/` directory contains two explicit sibling components:

1. `agent/educational-design-helper/` owns Track A macro educational-design
   requests, retrieval, Harness behavior, model adapters, responses, run
   traces, and its user interface.
2. `agent/counterfactual-design-partner/` owns Track B bounded story cases,
   alternative actions, and consequence projections.

This ownership map does not mean both components are under active development.
The user subsequently confirmed that the current development scope is Track A
only. Track B keeps its directory boundary and existing contracts for research
continuity, but no Track B runtime, Harness, interface, provider integration,
or evaluation is planned in this development phase.

The `agent/` root is an ownership map only. Neither component imports the
other's internal schemas. A future author-reviewed design brief remains the
only planned bridge and is not yet a frozen contract.

Track A keeps local evidence and model-facing knowledge separate. Restricted
source descriptions, HTML, and verbatim evidence remain local. Reviewed,
structured knowledge cards are the canonical runtime knowledge and may be
embedded, retrieved, and sent to an external generation model. Vector or future
graph representations are rebuildable indexes over those cards rather than the
canonical knowledge itself.

## First release boundary

The first release will establish:

- screening and reviewed knowledge promotion from the accepted Track A
  workbook rather than a parallel cleaned dataset or review queue;
- a versioned model-facing knowledge-card contract;
- design request, response, and run-trace contracts;
- replaceable retrieval and model-provider interfaces;
- a Harness that distinguishes direct, partial, analogical, and insufficient
  evidence;
- deterministic schema and citation validation; and
- a simple interface over the maintained runtime API.

The first knowledge snapshot may be deliberately small. Increasing its size or
quality does not create a separate product or require a different Harness
contract.

## Alternatives considered

### Separate prototype and production implementations

Rejected because it would duplicate schemas and Harness behavior and encourage
throwaway integration decisions.

### Keep implementation deferred until all corpus coding is complete

Rejected because a complete vertical flow is needed for the course deliverable
and because the runtime contract can be developed against a small reviewed
knowledge snapshot without claiming that corpus mining is complete.

### One maintained system with versioned maturity — selected

This creates an immediate end-to-end release while preserving a stable path for
later knowledge, retrieval, Harness, and interface improvements.

## Consequences

- Existing Track B files move from generic `agent/` subdirectories into the
  explicit `counterfactual-design-partner/` boundary; schema semantics remain
  unchanged and no new Track B implementation is authorized.
- Track A gains independent schemas and component-level rules.
- Runtime code must not read `corpus/restricted-sources/`.
- A model-facing allowlist boundary must prevent source evidence from entering
  provider requests.
- Software implementation and tests do not establish corpus coverage,
  knowledge validity, recommendation quality, learning effect, or author
  utility.
- The design-brief bridge remains conceptual until separately confirmed.

## Reversibility

Provider, model, embedding, ranking, storage, web-framework, and index choices
remain replaceable. The durable commitments are the two-component ownership
boundary, Track A as the only currently developed system, the
local-evidence/model-facing-knowledge separation, stable identifiers, and
versioned contracts.

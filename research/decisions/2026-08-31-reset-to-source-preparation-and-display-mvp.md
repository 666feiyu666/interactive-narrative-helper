# Decision: reset Track A to source preparation and reclassify the runnable prototype

- **Date:** 2026-08-31
- **Status:** confirmed
- **Scope:** Track A project state, repository boundaries, and display artifact

## Decision

The existing runnable Educational Interactive Narrative Design Helper is
reclassified as a display-only MVP under
app/educational-design-helper-mvp/. It demonstrates a possible interface and
response shape. It is not the implemented Track A Agent and is not evidence
that the Agent role, knowledge, retrieval, or advice quality has been
established.

npm run start is the default deterministic offline display. npm run start:live
is the separate external-model path.

The MVP's bundled records are legacy-generated demo fixtures. They remain only
to operate the display and must not be cited as formal data-mining findings, a
validated knowledge base, Agent capability evidence, recommendation-quality
evidence, or educational-effect evidence.

## Retained research state

Track A retains:

1. the frozen 606-item itch.io candidate manifest;
2. the authorized 606-page raw acquisition and its provenance;
3. the deterministic 606-record offline cleaning derivation and its
   provenance; and
4. the research questions, rights constraints, Track B boundary, testbed,
   legacy implementation, and Git history.

Formal Track A screening, research coding, analysis, synthesis, and evaluation
have not started. Track A Agent building has not started.

## Superseded artifacts

The previous workbook authority, screening and coding annotations, codebooks,
derived-knowledge snapshots, formal release, compatibility profiles, versioned
runtime contracts, generated indexes and runs, and claimed software-acceptance
history are superseded development artifacts. They are not current research
versions or inputs.

Their removal is repository cleanup. The user separately authorized physical
deletion on 2026-08-31; the listed tracked artifacts and ignored generated
outputs were then removed. Git history remains the recovery path for formerly
tracked files.

## Output boundary

outputs/ is generated, disposable workspace. It may contain app indexes,
optional traces, previews, figures, tables, or reports, but it is not a
canonical data store or research-version archive.

## Consequences

- Future Track A data mining begins from the retained source-preparation
  outputs and defines a new research method before screening or coding.
- Future Track A Agent work begins only after evidence is ready to inform an
  explicit role, capability, knowledge, human-control, and evaluation model.
- The app can evolve as a presentation prototype, but its implementation and
  tests must remain clearly separated from research claims.
- Track B remains out of current development scope.

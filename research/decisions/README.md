# Research decisions

Use this directory for decisions that materially change the RQ, constructs,
system boundary, case contract, experimental comparison, or interpretation of
evidence. Each decision should record its date, alternatives, rationale,
consequences, and whether it is reversible.

Operational collection, cleaning, parser, and run choices belong with their
current corpus protocols, tools, tests, and run reports rather than in this
directory. Create a research decision only when a choice materially changes the
research question, population, constructs, evidence interpretation, ethics, or
another durable research boundary.

## Confirmed decisions

- [`2026-08-29-track-a-helper-v0.2.md`](2026-08-29-track-a-helper-v0.2.md)
  makes the formal-knowledge v0.2 profile the Track A Helper default while
  preserving v0.1 compatibility and the existing research-evidence boundary;
  its first output-quality acceptance failed, and the documented in-place
  remediation passed user acceptance on 2026-08-29.
- [`2026-08-28-track-b-narrative-technique-scope.md`](2026-08-28-track-b-narrative-technique-scope.md)
  broadens Track B's program boundary to story-level narrative technique
  exploration while retaining counterfactual action and consequence as its
  only currently specified technique module.
- [`2026-08-28-two-track-helper-architecture.md`](2026-08-28-two-track-helper-architecture.md)
  confirms the umbrella Helper, its macro and story-level tracks, their
  human-reviewed bridge, and the creator-description evidence target. Its
  counterfactual-only definition of Track B is superseded by the later
  narrative-technique-scope decision.
- [`2026-08-28-initial-helper-development.md`](2026-08-28-initial-helper-development.md)
  starts maintained Track A development, separates the two Agent components,
  and fixes the local-evidence/model-facing-knowledge runtime boundary. Its
  original Track B path is retained as historical context and superseded by
  the later narrative-technique-scope decision.

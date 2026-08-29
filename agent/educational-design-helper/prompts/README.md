# Educational Design Helper prompt conditions

`design-advisor-v1.md` preserves the structured multi-direction compatibility
condition. `design-advisor-v2.md` uses compact domain, cross-case-pattern, and
case-design-card knowledge as background material while producing a structured
diagnosis, exactly three materially distinct directions, selected case IDs, a
prototype next step, and an optional follow-up question. The local server—not
the model—adds public case titles and game-page links.

Prompts may consume only allowlisted model-facing knowledge. They must reason
from that material without narrating retrieval, evidence management, missing
proof, quality, confidence, provenance, or corpus statistics to the user. Each
direction must state its best fit, design goal, core interaction, system role,
tradeoff, and smallest prototype step.

Prompt versions must not silently change request, response, or run-trace
contracts. Their authoritative mapping is `../config/output-profiles-v1.json`.

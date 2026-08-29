# Educational Design Helper implementation

The runtime resolves an explicit output profile before loading schemas,
prompts, knowledge, retrieval indexes, or the Harness. Version `0.2` is the
default; version `0.1` remains independently runnable for compatibility.

The v0.2 path validates the formal knowledge manifest, every item, and the
local public-reference catalog. It supplies all six compact domain summaries,
independently ranks eight cross-case-pattern and eight case-card candidates,
and serializes only allowlisted model-facing fields. The Harness requests a
structured draft, validates one diagnosis plus three materially distinct
directions, resolves 1–3 selected references locally, permits at most one
failure-specific repair, and writes a typed run trace. The v0.1 path retains
Top-5 card retrieval and the original structured response contract.

Both paths share provider interfaces and the local HTTP service. The runtime
input boundary begins at approved model-facing knowledge; raw corpus
descriptions, evidence excerpts, source URLs, public titles, and local evidence
records never enter model requests. Public titles and URLs are joined only
after model generation.

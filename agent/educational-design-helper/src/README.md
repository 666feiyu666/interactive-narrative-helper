# Educational Design Helper implementation

The current vertical slice includes configuration, validated knowledge-snapshot
loading, an allowlisted model-facing serializer, OpenAI embedding retrieval,
cosine Top-5 selection, structured generation, one bounded repair attempt,
deterministic validation, run traces, and local HTTP delivery.

The runtime input boundary begins at approved model-facing knowledge cards. Raw
corpus descriptions and local evidence records are not runtime inputs.

# Corpus schemas

Add formal schemas here only when downstream annotation or experiment contracts
need independent validation. The current itch.io acquisition deliberately uses
a minimal manifest plus per-page `capture.json` completion records; their
version and runtime invariants are enforced by the collector and automated
tests instead of separate field-heavy observation and annotation schemas.

The stable offline cleaner uses the code-validated, source-fact-only
`itchio-cleaned-project/v1.0` record. A standalone JSON Schema should be added
only when another component needs independent validation rather than merely
because the current implementation has reached 1.0.

# Display MVP implementation

The runtime loads the app-local demo manifest, validates each display record,
builds or reuses two generated embedding indexes, and retrieves six domain
summaries plus eight pattern examples and eight case examples. It requests one
structured diagnosis and three design directions, resolves public case links
locally, validates the response, and permits at most one repair attempt.

`npm run start` injects a deterministic fixture response and disables run
persistence. `npm run start:live` uses the configured external generation and
embedding models. With `SAVE_RUNS=1`, optional traces are written below
`outputs/app/educational-design-helper-mvp/`.

The runtime excludes raw source records, local evidence paths, excerpts, public
titles, and URLs from provider payloads. These safeguards make the prototype
safer to demonstrate; they do not turn its legacy demo data into research
evidence or prove the proposed Agent role.

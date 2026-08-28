# Educational Design Helper web interface

This browser client runs over the component's local HTTP API. It displays
request interpretation, evidence sufficiency, design directions, supporting
knowledge identifiers, transfer assumptions, limitations, and recoverable
errors. Retrieved Knowledge Card IDs open a local, model-facing card view. A
completed result can be downloaded as a readable Markdown report or as the
complete structured JSON response wrapper.

The web client must not call model providers directly or load restricted corpus
material.

Use `npm start` from the component directory and open
`http://127.0.0.1:3000/`. Directly opening `index.html` is supported only as a
styled launch preview; the preview disables prompt submission and points to the
HTTP address.

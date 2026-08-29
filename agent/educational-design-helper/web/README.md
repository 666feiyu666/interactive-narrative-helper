# Educational Design Helper web interface

The default v0.2 interface is a single-turn Chinese design workbench: one
question field, a design diagnosis, three comparable direction cards, public
reference links, a prototype next step, an optional follow-up question, and
versioned Markdown or JSON export. Internal knowledge categories, retrieval
IDs, evidence disclaimers, and source-management details are not displayed.
It keeps loading, error, ready, and complete states visually distinct and was
verified from an 820-pixel desktop window to a 1720-pixel-wide display without
horizontal overflow.

When the server selects v0.1, the same client renders the preserved structured
directions and local Knowledge Card dialog. Exports include the output version
in their filenames so v0.1 and v0.2 artifacts cannot be confused.

The client calls only the local HTTP API. It never calls a model provider or
loads restricted corpus material directly. Use `npm start` or the no-network
`npm run start:fixture` command and open `http://127.0.0.1:3000/`. Opening
`index.html` directly provides only a launch preview and disables submission.

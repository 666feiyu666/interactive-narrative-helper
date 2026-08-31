# Educational Design Helper — display MVP

This directory contains the runnable presentation prototype for the proposed
macro-level Educational Interactive Narrative Design Helper. It demonstrates
one possible interaction and response shape; it is not the implemented result
of the Track A research program.

The bundled records in `demo-data/` are retained legacy-generated derivatives.
They exist only to make the interface demonstrable. They are not a formal
data-mining result, a validated knowledge base, evidence of Agent capability,
or evidence of educational effectiveness.

## Run

Install dependencies once:

```powershell
npm install
```

Start the deterministic offline display:

```powershell
npm run start
```

Open `http://127.0.0.1:3000/`. This mode needs no API key and does not save run
payloads.

To exercise the same interface with an external model, copy `.env.example` to
the ignored `.env`, set `OPENAI_API_KEY`, then run:

```powershell
npm run start:live
```

Set `SAVE_RUNS=1` only when local run traces are intentionally needed. Generated
indexes and optional traces go to
`../../outputs/app/educational-design-helper-mvp/` and may be deleted.

## Boundaries

- `schemas/` defines the single display request, response, demo-data, reference,
  and optional trace shapes. These are application contracts, not research
  releases.
- `demo-data/` is frozen only for a stable demonstration. Its internal legacy
  fields do not define the future data-mining or Agent model.
- `prompts/`, `src/`, and `web/` implement the local demonstration.
- `tests/` verifies that the display runs. Passing tests do not validate the
  research, the example data, advice quality, author utility, or learning
  effects.

Formal Track A data mining and Track A Agent building have not started. When
they do, their methods, evidence, contracts, and evaluation must be defined
independently rather than inferred from this MVP.

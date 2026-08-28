# Selected outputs

Generated output is ignored by default. Commit only deliberately selected
figures, tables, or reports needed for review or reproducibility, together with
their source experiment and generation method.

Generated corpus review workbooks may contain source facts, quality queues, and
coding surfaces. They are working interfaces: their presence does not by itself
mean research screening, human review, derived knowledge, or either Helper
capability has been completed.

## Current canonical Track A workbook

Current screening, research coding, and first knowledge extraction begin from:

```text
outputs/itchio-sheet/
  itchio-educational-if-candidates-v1.0.xlsx
```

The workbook contains 606 joined rows in `cases`, `coding`, and `provenance`.
Use `cases` as the cleaned source-fact table and `coding` as the editable
screening and coding surface. `manual_review` is limited to the 21 cleaning
exceptions and must not be repurposed as a full-corpus screening queue.

The confirmed v1.1 scoped substantive-OR run records 122 `coded`, 122
`uncertain`, and 362 `not_applicable` rows in `coding`. The adjacent
`track-a-itchio-v1.1-knowledge-v1-run-report.json` records input/output hashes,
decision counts, formula validation, and the explicit lack of independent human
double-coding. The current frozen Git-safe knowledge snapshot is stored under
`corpus/derived-knowledge/track-a-itchio-v1.1-knowledge-v1/`. The earlier v1.0
strict run and two-card snapshot remain preserved for comparison.

The stable `itchio-sheet/` directory name replaces the earlier generated UUID
directory name. This relocation does not change workbook contents, frozen
knowledge-card hashes, or the runtime embedding index.

The companion `.xlsx.inspect.ndjson` and `.work/` directory are generated
inspection and build artifacts, not alternate analytical inputs. Do not commit
or send their sampled source content to an external model.

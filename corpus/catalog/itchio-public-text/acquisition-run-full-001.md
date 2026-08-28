# itch.io public page-bundle full run 001

- **Protocol:** `itchio-public-page-bundle/v1.0`
- **Run ID:** `itchio-page-bundle-full-001`
- **Capture date:** 2026-08-27
- **Stable metadata normalization:** 2026-08-28
- **Repository base commit at capture:** `78b202ccc97eaedff178a99e6947e95308e51f31`
- **Implementation state:** current workspace change set
- **Restricted output:**
  `corpus/restricted-sources/itchio-public-text/runs/itchio-page-bundle-full-001/`
- **Manifest SHA-256:**
  `c177620e54e2af24f5ddd22c78d97ad5898f834366b0a7d5d5c0ffbabba27d0a`

## Result

The collector processed the frozen 606-entry manifest sequentially in one
dedicated rendered-browser profile with a five-second minimum navigation delay.
It started at `2026-08-27T13:17:02Z`, completed at
`2026-08-27T14:07:36Z`, and ran for 50.57 minutes.

| Result | Count |
|---|---:|
| Successful page bundles | 606 |
| Access challenges | 0 |
| Browser errors | 0 |
| Redirects out of scope | 0 |
| Empty text payloads | 0 |

| Artifact | Files | Bytes |
|---|---:|---:|
| Visible text | 606 | 720,500 |
| Generic page structure | 606 | 11,448,126 |
| Sanitized rendered HTML | 606 | 13,324,077 |
| Per-project capture metadata | 606 | 623,826 |
| Run index | 1 | 700,604 |
| Event log | 1 | 560,802 |
| **Total** | **2,426** | **27,377,935** |

## Stable metadata normalization

The retained run metadata was normalized locally to the 1.0 manifest, capture,
page-structure, and method identifiers with zero network requests. Original
capture timestamps, visible-text bytes and hashes, rendered-HTML bytes and
hashes, source URLs, and page evidence were preserved. Page-structure hashes
were recomputed only because the embedded schema identifier changed.

## Verification

- all 606 project directories and four expected per-project files exist;
- all visible-text and rendered-HTML files are byte-identical to the accepted
  captures before metadata normalization;
- all 1,818 content-file hashes and byte lengths match their completion records;
- all 606 completion records match the run index and event log;
- the current manifest hash matches the run's frozen manifest hash;
- acquisition and cleaning syntax checks and all 14 automated tests pass;
- the restricted payload path is ignored by Git.

## Evidence boundary

This run establishes complete acquisition of the 606 URLs in one frozen
platform-tag candidate inventory at the capture date. It does not establish
educational relevance, Interactive Fiction status, publication or training
rights, learning quality, or any downstream knowledge-base or Agent design.

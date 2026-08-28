# itch.io offline page-cleaning full run 001

- **Protocol:** `itchio-offline-page-cleaning/v1.0`
- **Derivation ID:** `itchio-page-cleaning-full-001`
- **Parser version:** `1.0.0`
- **Source run:** `itchio-page-bundle-full-001`
- **Run date:** 2026-08-28
- **Implementation state:** current workspace change set
- **Restricted output:**
  `corpus/restricted-sources/itchio-public-text/derived/itchio-page-cleaning-full-001/`

## Result

The offline cleaner processed all 606 retained HTML files with browser
networking disabled and every page request blocked.

| Result | Count |
|---|---:|
| Cleaned source records | 606 |
| Parse errors | 0 |
| Standard body descriptions | 590 |
| Meta-description-only records | 12 |
| Records with no description | 4 |
| Very short body descriptions flagged | 5 |
| Records requiring deterministic-source review | 21 |

The output contains 606 `record.json` files, 602
`description-clean.txt` files, and three derivation-level control/report files.
The total restricted size is 4,986,751 bytes.

## Source-field coverage

| Field | Records |
|---|---:|
| Title | 606 |
| Creator | 606 |
| Delivery mode | 606 |
| Status | 606 |
| Genre | 606 |
| Tags | 589 |
| Platforms | 543 |
| Short description | 511 |
| Made with | 305 |
| Rating | 165 |
| Average session | 148 |
| Content / no-generative-AI statement | 142 |
| Languages | 133 |
| Inputs | 129 |
| AI disclosure | 63 |
| Accessibility | 57 |

Less frequent source rows remain available in the records without being
promoted into research interpretations.

## Review-only findings

- 12 pages have no standard body description but expose a meta description;
- 4 pages expose neither a body nor meta description;
- 5 body descriptions contain fewer than 20 characters;
- one normalized title-and-creator group and two cleaned-description-hash
  groups are possible related or duplicate candidates only.

No candidate was removed, merged, or classified by these deterministic flags.

## Verification

- all 606 input HTML hashes matched their capture records before parsing;
- all 606 record hashes and all 602 description hashes match their files;
- every project ID and source URL remains unique;
- a full resume reused all 606 records with zero errors;
- all record content and cleaned descriptions are equivalent to the accepted
  source-grounded output apart from the 1.0 schema, parser, source-run, and
  page-structure hash identities;
- syntax validation and all 14 automated tests pass;
- the restricted derived path is ignored by Git.

## Evidence boundary

This run establishes a deterministic source-evidence layer. It does not decide
whether a candidate is educational, exhibits Interactive Fiction mechanics,
belongs in the confirmed corpus, or supports claims about learning effects.

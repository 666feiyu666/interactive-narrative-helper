# itch.io public project page-bundle acquisition 1.0

- **Protocol ID:** `itchio-public-page-bundle/v1.0`
- **Status:** stable acquisition contract; 606-entry full run completed
- **Manifest schema:** `itchio-public-text/v1.0`
- **Capture schema:** `itchio-public-page-capture/v1.0`
- **Page-structure schema:** `itchio-page-structure/v1.0`
- **Implementation version:** `1.0.0`
- **Unit:** one public itch.io project page

## Objective

Freeze every project URL returned by the public itch.io `Educational +
Interactive Fiction` listing, then retain the rendered page evidence needed for
later relevance screening and research coding. The frozen listing is a
platform-tag candidate inventory, not a confirmed educational-IF corpus.

## Page-bundle contract

Each successful project produces:

```text
projects/<project-id>/
  raw-visible-text.txt
  page-structure.json
  rendered-page.html
  capture.json
```

- `raw-visible-text.txt` contains rendered `document.body.innerText` after the
  on-page comment widget is removed.
- `page-structure.json` records document identity, meta elements, JSON-LD,
  headings, breadcrumbs, tables, links, and media references without requiring
  a fixed set of itch.io fields.
- `rendered-page.html` is a sanitized DOM snapshot with comments, forms,
  iframes, executable scripts, inline event handlers, and nonce attributes
  removed. JSON-LD remains as data.
- `capture.json` records source identity, status, file names, byte counts, and
  SHA-256 hashes. A successful completion record is the resume marker.

## Access, load, and rights boundary

- Follow only the public listing pagination and the frozen public project URLs.
- Use one browser and one top-level navigation at a time, separated by at least
  five seconds.
- Do not authenticate, run or download games, follow creator profiles or
  external links, collect comments, rotate identities, disguise automation, or
  bypass a human-verification page.
- Store copied page payloads and the browser profile only under the Git-ignored
  `corpus/restricted-sources/itchio-public-text/` tree.
- Do not publish copied payloads or send them to an external model under this
  protocol. Public availability is not permission to redistribute or train on
  a work.
- Review current platform robots and terms before any new network run. A new
  manifest or network run requires explicit authorization.

## Commands

Discover and freeze a new listing after policy review:

```powershell
node tools/itchio/capture-visible-text.mjs discover --confirm-policy-review
```

Capture the current frozen manifest after explicit authorization:

```powershell
node tools/itchio/capture-visible-text.mjs capture `
  --confirm-policy-review `
  --run-id itchio-page-bundle-full-001 `
  --delay-seconds 5
```

## Acceptance conditions

- every selected manifest entry has a successful completion record or an
  explicit failure status;
- text, structure, and HTML hashes and byte lengths match their files;
- source URLs match the frozen manifest and out-of-scope redirects stop rather
  than silently entering the run;
- challenge detection, sanitization, URL boundaries, and resume behavior pass
  automated verification;
- all copied payloads remain ignored by Git.

These checks establish acquisition integrity only. They do not establish
educational relevance, Interactive Fiction mechanics, publication rights,
learning value, or any downstream Agent capability.

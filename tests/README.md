# Automated verification

This directory contains software verification, not research experiments.

The itch.io tests verify URL boundaries, challenge detection, the generic page
structure contract, deterministic source-field normalization, conservative
description fallbacks, and that a limited run is a slice of the same full
manifest. They make no network requests and contain no copied project-page
content. Run them with:

```powershell
pwsh -File tools/itchio/validate.ps1
```

The Agent contract tests verify that Track A files remain inside the active
component, that the preserved Track B boundary contains only documentation and
existing schemas, that Track A fixtures satisfy their public schemas, that the
Track B case contract remains compatible, and that model-facing knowledge
rejects restricted evidence fields. Run them with:

```powershell
pwsh -File tools/agent/validate.ps1
```

The Track A knowledge tests verify the preserved strict v1.0 rule, the current
v1.1 scoped substantive-OR rule, production-context and audience false-positive
guards, explicit language exclusion, bounded evidence, both frozen release
hashes, the 122-card count, missingness preservation, and the model-facing
source boundary. Run them with:

```powershell
pwsh -File tools/knowledge/validate.ps1
```

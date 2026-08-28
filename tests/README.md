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

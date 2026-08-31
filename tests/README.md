# Automated verification

This directory contains software verification, not research evidence.

Current tests cover the itch.io acquisition and deterministic cleaning tools:
URL boundaries, challenge detection, generic page structure, conservative
description extraction, source-field normalization, and offline behavior.

Run:

    pwsh -File tools/itchio/validate.ps1

The display MVP owns its focused tests under
app/educational-design-helper-mvp/tests/ and runs them with npm test.

There are no current tests for Track A screening, coding, knowledge
construction, retrieval quality, or Agent capability because those research
stages have not started. Passing acquisition, cleaning, or app tests does not
answer the research question.

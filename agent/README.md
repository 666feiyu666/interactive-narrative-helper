# Story-Level Counterfactual Narrative Design Partner

This directory owns Track B of the umbrella Interactive Narrative Helper: the
author-facing, design-time Counterfactual Narrative Design Partner. It is
currently at the contract stage; no executable Agent is claimed to exist yet.

Track A's future macro Educational Interactive Narrative Design Helper is
grounded in `corpus/` annotations and derived knowledge. Its contract must not
be inferred from or added to this directory before the mining results justify
one.

## Boundary

The Agent accepts a bounded story case and proposes inspectable
action–consequence hypotheses. It does not write an entire finished story,
operate the playable testbed, or decide the correct theme or educational
purpose.

When available, it may consume an educator- or author-reviewed design brief
that carries a selected macro educational direction into a concrete story
task. Raw corpus pages are not direct Agent input.

## Structure

- `schemas/` defines stable case input and proposal output contracts.
- `prompts/` will hold versioned prompting conditions used by experiments.
- `src/` will hold reusable implementation after the first vertical slice is
specified.
- `tests/` will verify contracts and executable behavior; research evaluation
  remains under `experiments/`.

The first implementation should validate one case, produce multiple structured
alternatives, save the exact prompt/model configuration, and validate the output
before any user-interface work begins.

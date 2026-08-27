# Counterfactual Narrative Design Agent

This directory defines the author-facing, design-time Agent studied by the
project. It is currently at the contract stage; no executable Agent is claimed
to exist yet.

## Boundary

The Agent accepts a bounded story case and proposes inspectable
action–consequence hypotheses. It does not write an entire finished story,
operate the playable testbed, or decide the correct theme or educational
purpose.

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

# Methodology

Status: provisional program framework. The current short-term method is still
being scoped; numbered experiments require separate fixed protocols.

## Current short-term method

![Current itch.io creator-description mining framework](figures/current-study-framework.svg)

The current source unit is a public creator project page; the analytical unit
is a distinct creator-described educational-IF case after any documented series
or duplicate handling. The page description and source metadata are primary
evidence for how the creator positions the work.

Current coding should extract or normalize:

- creator-described educational purpose and subject matter;
- creator-described intended learner or audience;
- creator-described or explicitly presented application setting;
- creator-described interactive narrative form and mechanics; and
- the relationship the creator describes between an interaction and an
  intended educational or reflective experience.

Each normalized code should retain a source excerpt or location. `not stated`
is a valid result. Platform metadata, creator language, researcher
normalization, and later artifact observation should remain distinguishable,
but creator descriptions do not need external learning-effect evidence before
they can answer the current descriptive RQ.

Source records may be structurally separated into fields, but field location
does not guarantee a consistent semantic role across projects. A piloted
codebook should therefore define how creator statements are compared and how
ambiguous or missing information is handled across cases.

Computational text methods such as phrase frequencies, TF-IDF, similarity, or
clustering may help discover vocabulary, retrieve related cases, and audit
coverage. They do not by themselves determine which textual role a phrase
plays. Stemming or lemmatization is optional for lexical exploration rather
than a prerequisite for coding; any such preprocessing should preserve the
original text and be reported with its parameters.

The 606-entry itch.io manifest is one candidate inventory. Its complete stable
acquisition and deterministic cleaning establish source-processing behavior
only. They do not by themselves answer the short-term RQ; creator-description
screening, coding, and synthesis remain required.

Any later knowledge or retrieval method for the macro Helper will be specified
after mining establishes what creator-described patterns can be derived
reliably. A selected macro direction may later enter Track B through a
human-reviewed design brief, but that bridge is not yet a fixed schema.

## Long-term counterfactual capability dimensions

- substantive diversity of alternative actions;
- compatibility with declared source constraints;
- causal coherence of consequence projections;
- interactive potential of subsequent choices;
- differentiation among possible endings;
- traceability of thematic interpretations;
- traceability and age-appropriateness of educational implications;
- author utility and author control.

## Long-term counterfactual evidence layers

1. **Contract validation:** the output has the required structure and preserves
   declared input identifiers.
2. **Artifact evaluation:** trained evaluators assess action, causality,
   interactivity, and meaning dimensions.
3. **Author study:** authors use the Agent during an actual adaptation task and
   report or demonstrate how proposals affect their process.
4. **Audience study:** any claims about children require a separately approved
   ethics and data-management process.

## Long-term experimental comparisons

Potential conditions include an unstructured model, a structured
counterfactual prompt, a theory-guided condition, a corpus-derived knowledge
condition, and a hybrid condition. These are possible study designs, not yet
confirmed experiments. A valid comparison must keep the case, output contract,
and evaluation criteria stable across conditions.

## Reproducibility

Every experiment records case and schema versions, prompts, model/provider,
sampling settings, run date, output transformations, evaluator instructions,
exclusions, and source commits. Exploratory prompt changes must not be reported
as confirmatory evaluation without a new fixed protocol.

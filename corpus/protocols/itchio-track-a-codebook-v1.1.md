# itch.io Track A codebook v1.1

Version 1.1 uses the educational-purpose, audience, setting, interactive-form,
mechanic, and interaction–education label vocabularies defined in
[`itchio-track-a-codebook-v1.0.md`](itchio-track-a-codebook-v1.0.md). The label
meanings and false-positive guards are unchanged. This revision changes how
field-level codes are promoted into a knowledge pool.

## Field status

- `explicit`: the creator description or creator-controlled page metadata
  directly supports the field.
- `normalized`: the source supports a conservative combination, such as
  interaction and education being co-described without a causal claim.
- `not_stated`: the available creator description does not state the field.
- `uncertain`: potentially relevant language is present but cannot be coded
  confidently under the local rule.

`not_stated` is retained as missingness. It must not be rewritten as a generic
audience, setting, purpose, or mechanic.

## Coverage profiles

- `complete_core`: purpose, audience, setting, and interactive narrative form
  are explicit.
- `partial_substantive`: an explicit form is present together with at least one
  supported substantive field: purpose, audience, setting, or
  interaction–education relationship.
- `form_only`: an explicit form is present but no substantive field is
  supported.
- `outside_scope_or_unresolved`: the record fails or cannot yet resolve the
  English, description, cleaning-quality, or form scope gate.

## Quality tiers

- `A`: complete core plus an explicit interaction–education relationship.
- `B`: complete core without an explicit relationship.
- `C`: partial substantive precedent.
- `unassigned`: excluded or unresolved screening record.

These tiers describe evidence coverage for transfer and retrieval. They do not
rank educational quality and do not establish effectiveness.

## Mechanics in partial precedents

The `if_mechanics` list may be empty in v1.1 when the interactive narrative
form and another substantive field are explicit but the creator description
does not name a mechanic. A model-facing card must then state that mechanic
selection remains open and may ask the designer to choose how interaction will
connect to the intended experience.


# Legacy: The Fox and the Crow Fan-Fiction Story Generator

> This theory- and prompt-guided implementation predates the current
> counterfactual narrative design study. It is preserved in full but has not
> been defined as a formal experimental baseline for the current research
> question.

This interactive story-generation experiment runs with DeepSeek in Google
Colab. It reimagines *The Fox and the Crow* as a time-loop story: every day the
fox returns to the morning when the crow is standing in a tree with cheese in
its beak, and only the fox remembers the previous loops. The fox repeatedly
tries to control the crow and escape the loop, eventually learning through
failure to observe, listen, and trust.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/666feiyu666/interactive-narrative-helper/blob/main/legacy/theory-guided-story-generator/notebooks/story_generator_deepseek.ipynb)

## Implementation concept

The story draws on Aristotle's basic account of plot in the *Poetics*: a story
should represent a complete action with a beginning, middle, and end, and its
events should develop through causal relationships rather than accumulate as
unconnected incidents.

The project translates this idea into five consecutive sections:

1. **Cause:** the fox discovers that it is trapped in a time loop.
2. **Development:** the fox repeatedly tries to control the crow and leave the
   forest but continues to fail.
3. **Turning point:** the fox begins to notice the crow's own needs and learns
   that merely completing a task will not break the loop.
4. **Climax:** the fox abandons manipulation and tells the crow the truth about
   the loop; they begin to face the problem together.
5. **Resolution:** the loop ends, the crow finds people to repair the bridge,
   and the fox can leave the forest.

These sections are a generative adaptation of the beginning–middle–end model,
not a mechanical conversion of the *Poetics* into five acts. Each section must
follow from the actions and consequences of the preceding section: failure
changes what the fox understands, that understanding changes its next choice,
and the sequence ultimately forms a complete movement from manipulation to
trust.

The notebook generates one section at a time. The user reviews each candidate,
and only human-approved material moves into the next section together with
established facts, character knowledge, and unresolved threads. The language
model proposes story material; the human judges plot continuity, causal logic,
and the credibility of character change.

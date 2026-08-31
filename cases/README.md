# Research cases

`cases/` stores stable, bounded scenario settings used to test Agent behavior. 

A case may specify the target user, task goal, available context, design knowledge provided to the Agent, relevant constraints, human-control points, permitted actions, required outputs, and the aspects of behavior to be observed. It may also preserve stable inputs and invariants needed to compare Agent behavior across different prompts, knowledge conditions, models, or interaction designs.

Cases may be created for both Track A and Track B. They should be organized according to the Agent direction and research question they support, without assuming that every Agent or technique requires the same fields.

A case is not an experiment or a research result. The exact prompt, model, tools, knowledge condition, run output, evaluation, and interpretation belong under `experiments/`. Reusable instruments used to run cases belong under `testbeds/`.

Cases must record the provenance and rights status of any included source material. They must not contain copyrighted text, personal information, participant data, or third-party assets unless their use has been explicitly authorized and documented.
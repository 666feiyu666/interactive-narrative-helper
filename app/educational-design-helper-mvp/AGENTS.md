# Display MVP guidance

This file applies only to `app/educational-design-helper-mvp/`.

- Treat this directory as a display-only application prototype, not the Track A
  research artifact or a validated Agent.
- Keep `npm run start` deterministic, offline, and free of API-key
  requirements. Keep external-model use behind `npm run start:live`.
- The bundled `demo-data/` records are legacy-generated display fixtures.
  Never cite their counts or content as formal data-mining results, prevalence,
  recommendation quality, Agent capability, or educational effectiveness.
- Do not read restricted raw sources at runtime or send them to a model.
- Keep generated indexes and optional run traces under the repository
  `outputs/` directory.
- Do not add version compatibility layers. Change the one current MVP contract
  directly when the display changes.
- Add software tests for executable changes. Software tests do not establish
  research validity, knowledge quality, author utility, or learning effects.
- Do not import implementation files from the Track B boundary under
  `agent/narrative-technique-design-partner/`.

# Display web interface

The browser UI is a single-turn Chinese design workbench. It shows a design
diagnosis, three comparable directions, public example links, a prototype next
step, and an optional follow-up question. Results can be exported as Markdown
or JSON with an explicit display-MVP disclaimer.

The client calls only the local HTTP API. It never calls a model provider or
loads restricted source material directly.

Run npm run start and open http://127.0.0.1:3000/. Opening index.html directly
shows only a launch preview and disables submission.

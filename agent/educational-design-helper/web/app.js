const exampleQuestion =
  "I want to design an interactive fiction that raises people's awareness of narrative consciousness. What design directions could I explore?";

const isFilePreview = window.location.protocol === "file:";

const elements = {
  status: document.querySelector("#runtime-status"),
  facts: document.querySelector("#runtime-facts"),
  form: document.querySelector("#prompt-form"),
  input: document.querySelector("#prompt-input"),
  send: document.querySelector("#send-button"),
  example: document.querySelector("#example-button"),
  log: document.querySelector("#conversation-log"),
  scroll: document.querySelector("#conversation-scroll"),
  welcome: document.querySelector("#welcome"),
  dialog: document.querySelector("#knowledge-dialog"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogContent: document.querySelector("#dialog-content"),
  dialogClose: document.querySelector("#dialog-close"),
  launchNotice: document.querySelector("#launch-notice"),
};

const dimensionLabels = {
  educational_purpose: "Educational purpose",
  intended_audience: "Intended audience",
  application_setting: "Application setting",
  interactive_narrative_form: "Interactive narrative form",
  interaction_education_relationship: "Interaction → education",
};

const evidenceLabels = {
  sufficient_direct: "Direct support",
  sufficient_analogical: "Analogical support",
  limited: "Limited evidence",
  insufficient: "Insufficient evidence",
};

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setRuntimeStatus(state, message) {
  elements.status.dataset.state = state;
  elements.status.lastElementChild.textContent = message;
}

function setFacts(meta) {
  const values = [
    meta.snapshot_id,
    String(meta.knowledge_cards),
    meta.generation_model,
    meta.embedding_model,
  ];
  [...elements.facts.querySelectorAll("dd")].forEach((node, index) => {
    node.textContent = values[index];
  });
}

async function loadMeta() {
  try {
    const response = await fetch("/api/meta");
    if (!response.ok) throw new Error("Local runtime did not return metadata.");
    const meta = await response.json();
    setFacts(meta);
    setRuntimeStatus("ready", "Local runtime ready");
  } catch (error) {
    setRuntimeStatus("error", error.message);
  }
}

function createMessage(role, content) {
  const message = element("article", `message ${role.toLowerCase()}-message`);
  message.append(element("div", "message-role", role));
  const body = element("div", "message-content");
  if (typeof content === "string") body.textContent = content;
  else body.append(content);
  message.append(body);
  return message;
}

function createLoadingMessage() {
  const loading = element("div", "loading-card");
  loading.setAttribute("role", "status");
  loading.setAttribute("aria-label", "Retrieving knowledge and generating design directions");
  loading.append(element("div", "loading-line"));
  loading.append(element("div", "loading-line"));
  loading.append(element("div", "loading-line"));
  return createMessage("Helper", loading);
}

function createKnowledgeButton(knowledgeId, suffix = "") {
  const button = element("button", "knowledge-button", `${knowledgeId}${suffix}`);
  button.type = "button";
  button.addEventListener("click", () => openKnowledgeCard(knowledgeId));
  return button;
}

function appendList(parent, title, items) {
  const section = element("section", "detail-section");
  section.append(element("h4", "", title));
  const list = element("ul");
  for (const item of items) list.append(element("li", "", item));
  section.append(list);
  parent.append(section);
}

function renderDirection(direction, index) {
  const card = element("article", "direction-card");
  card.append(element("div", "direction-number", String(index + 1).padStart(2, "0")));
  card.append(element("h3", "", direction.title));
  card.append(element("p", "direction-concept", direction.concept));

  const mechanism = element("div", "mechanism-block");
  const interaction = element("div");
  interaction.append(element("strong", "", "Interaction mechanism"));
  interaction.append(document.createTextNode(direction.interaction_mechanism));
  const relationship = element("div");
  relationship.append(element("strong", "", "Educational relationship"));
  relationship.append(document.createTextNode(direction.educational_relationship));
  mechanism.append(interaction, relationship);
  card.append(mechanism);

  const dimensions = element("dl", "dimension-grid");
  for (const [name, dimension] of Object.entries(direction.design_dimensions)) {
    const wrapper = element("div");
    wrapper.append(element("dt", "", dimensionLabels[name] ?? name));
    wrapper.append(element("dd", "", dimension.value));
    const basis = element("div", "basis-list");
    for (const value of dimension.basis) {
      basis.append(element("span", "basis-tag", value.replaceAll("_", " ")));
    }
    wrapper.append(basis);
    dimensions.append(wrapper);
  }
  card.append(dimensions);

  const details = element("div", "detail-columns");
  appendList(details, "Applicability", direction.applicability_conditions);
  appendList(details, "Transfer assumptions", direction.transfer_assumptions);
  appendList(details, "Risks", direction.risks);
  card.append(details);

  const support = element("div", "support-row");
  support.append(element("span", "", "Knowledge support"));
  for (const item of direction.knowledge_support) {
    support.append(createKnowledgeButton(item.knowledge_id, ` · ${item.match_kind}`));
  }
  card.append(support);
  return card;
}

function renderAssistantResult(result) {
  const response = result.response;
  const fragment = document.createDocumentFragment();

  const header = element("div", "assistant-header");
  const title = element("div");
  title.append(element("div", "eyebrow", "Design exploration"));
  title.append(element("h2", "", "Directions to inspect, adapt, or reject"));
  header.append(title);
  header.append(
    element("span", "evidence-pill", evidenceLabels[response.evidence_status] ?? response.evidence_status),
  );
  fragment.append(header);
  fragment.append(element("p", "interpretation", response.request_interpretation));

  const retrieval = element("div", "retrieval-strip");
  retrieval.append(element("span", "", "Retrieved top 5"));
  for (const item of result.retrieval) {
    retrieval.append(createKnowledgeButton(item.knowledge_id, ` · ${item.score.toFixed(3)}`));
  }
  fragment.append(retrieval);

  const directions = element("div", "directions");
  response.design_directions.forEach((direction, index) => {
    directions.append(renderDirection(direction, index));
  });
  fragment.append(directions);

  const closing = element("div", "closing-grid");
  const limitations = element("section", "closing-section");
  limitations.append(element("h3", "", "Limitations"));
  const limitationList = element("ul");
  response.limitations.forEach((item) => limitationList.append(element("li", "", item)));
  limitations.append(limitationList);
  const questions = element("section", "closing-section");
  questions.append(element("h3", "", "Questions for the next design pass"));
  const questionList = element("ul");
  response.follow_up_questions.forEach((item) => questionList.append(element("li", "", item)));
  questions.append(questionList);
  closing.append(limitations, questions);
  fragment.append(closing);
  fragment.append(createExportBar(result));
  fragment.append(element("p", "run-footnote", `Local run trace · ${result.run_id}`));

  const wrapper = element("div");
  wrapper.append(fragment);
  return createMessage("Helper", wrapper);
}

function downloadArtifact(artifact) {
  const blob = new Blob([artifact.content], { type: artifact.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = artifact.fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function createExportButton(label, className, createArtifact, result, status) {
  const button = element("button", `export-button ${className}`, label);
  button.type = "button";
  button.addEventListener("click", () => {
    try {
      const artifact = createArtifact(result);
      downloadArtifact(artifact);
      status.textContent = `${label} download started.`;
    } catch (error) {
      status.textContent = `${label} could not be created: ${error.message}`;
    }
  });
  return button;
}

function createExportBar(result) {
  const bar = element("section", "export-bar");
  bar.setAttribute("aria-labelledby", `export-title-${result.run_id}`);

  const copy = element("div", "export-copy");
  const title = element("h3", "", "Keep this design run");
  title.id = `export-title-${result.run_id}`;
  copy.append(title);
  copy.append(
    element(
      "p",
      "",
      "Markdown is ready for reading and annotation. JSON preserves the complete structured result.",
    ),
  );

  const actions = element("div", "export-actions");
  const status = element("span", "export-status", "");
  status.setAttribute("role", "status");
  actions.append(
    createExportButton(
      "Export Markdown",
      "export-button-primary",
      window.TrackAExport.createMarkdownExport,
      result,
      status,
    ),
    createExportButton(
      "Export JSON",
      "export-button-secondary",
      window.TrackAExport.createJsonExport,
      result,
      status,
    ),
    status,
  );
  bar.append(copy, actions);
  return bar;
}

function renderError(error, runId) {
  const card = element("div", "error-card");
  card.append(element("strong", "", "This run could not be completed"));
  card.append(document.createTextNode(error));
  if (runId) card.append(element("small", "", ` Run trace: ${runId}`));
  return createMessage("Helper", card);
}

async function submitPrompt() {
  const message = elements.input.value;
  if (!message.trim() || elements.send.disabled) return;

  elements.welcome?.remove();
  elements.log.append(createMessage("You", message));
  const loading = createLoadingMessage();
  elements.log.append(loading);
  elements.send.disabled = true;
  elements.input.disabled = true;
  elements.form.setAttribute("aria-busy", "true");
  elements.scroll.scrollTo({ top: elements.scroll.scrollHeight, behavior: "smooth" });

  try {
    const response = await fetch("/api/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, requested_direction_count: 3 }),
    });
    const payload = await response.json();
    loading.replaceWith(
      response.ok
        ? renderAssistantResult(payload)
        : renderError(payload.error ?? "Unknown local runtime error.", payload.run_id),
    );
  } catch (error) {
    loading.replaceWith(renderError(error.message));
  } finally {
    elements.send.disabled = false;
    elements.input.disabled = false;
    elements.form.removeAttribute("aria-busy");
    elements.input.focus();
    elements.scroll.scrollTo({ top: elements.scroll.scrollHeight, behavior: "smooth" });
  }
}

function addCardField(parent, title, value, status = "") {
  const section = element("section", "card-field");
  section.append(element("h3", "", title));
  if (status) section.append(element("small", "", status.replaceAll("_", " ")));
  section.append(element("p", "", value || "Not stated"));
  parent.append(section);
}

async function openKnowledgeCard(knowledgeId) {
  elements.dialogTitle.textContent = knowledgeId;
  elements.dialogContent.replaceChildren(element("p", "", "Loading Knowledge Card…"));
  elements.dialog.showModal();
  try {
    const response = await fetch(`/api/knowledge/${encodeURIComponent(knowledgeId)}`);
    if (!response.ok) throw new Error("Knowledge Card could not be loaded.");
    const card = await response.json();
    const content = document.createDocumentFragment();
    const meta = element("div", "card-meta");
    [card.knowledge_type, `Tier ${card.quality_tier}`, card.coverage_profile, card.confidence].forEach(
      (value) => meta.append(element("span", "", value)),
    );
    content.append(meta);
    addCardField(content, "Design pattern", card.design_pattern);
    addCardField(
      content,
      "Educational purpose",
      card.educational_purpose.summary || card.educational_purpose.labels.join(", "),
      card.educational_purpose.status,
    );
    addCardField(
      content,
      "Intended audience",
      card.intended_audience.summary || card.intended_audience.labels.join(", "),
      card.intended_audience.status,
    );
    addCardField(
      content,
      "Application setting",
      card.application_setting.summary || card.application_setting.labels.join(", "),
      card.application_setting.status,
    );
    addCardField(
      content,
      "Interactive narrative form",
      card.interactive_narrative_form.summary || card.interactive_narrative_form.labels.join(", "),
      card.interactive_narrative_form.status,
    );
    addCardField(
      content,
      "Interaction → education",
      card.interaction_education_relationship.summary ||
        card.interaction_education_relationship.labels.join(", "),
      card.interaction_education_relationship.status,
    );
    addCardField(content, "Mechanics", card.if_mechanics?.join(", ") || "Not stated");
    addCardField(content, "Applicability", card.applicability_conditions.join(" · "));
    addCardField(content, "Limitations", card.limitations.join(" · "));
    elements.dialogContent.replaceChildren(content);
  } catch (error) {
    elements.dialogContent.replaceChildren(element("p", "error-card", error.message));
  }
}

elements.example.addEventListener("click", () => {
  elements.input.value = exampleQuestion;
  elements.input.focus();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitPrompt();
});

elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    submitPrompt();
  }
});

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

if (isFilePreview) {
  elements.launchNotice.hidden = false;
  elements.welcome.hidden = true;
  elements.input.disabled = true;
  elements.send.disabled = true;
  elements.example.disabled = true;
  elements.input.placeholder = "Start the local runtime, then open http://127.0.0.1:3000";
  setRuntimeStatus("error", "Preview only · open the local runtime");
} else {
  loadMeta();
}

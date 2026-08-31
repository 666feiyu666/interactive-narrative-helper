const exampleQuestion =
  "我想设计一个 Journaling 类应用，帮助使用者通过回看和改写日记反思自己的叙述方式。";
const isFilePreview = window.location.protocol === "file:";

const elements = {
  status: document.querySelector("#runtime-status"),
  facts: document.querySelector("#runtime-facts"),
  form: document.querySelector("#prompt-form"),
  input: document.querySelector("#prompt-input"),
  send: document.querySelector("#send-button"),
  example: document.querySelector("#example-button"),
  log: document.querySelector("#conversation-log"),
  scroll: document.querySelector("#desk-scroll"),
  welcome: document.querySelector("#welcome"),
  launchNotice: document.querySelector("#launch-notice"),
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
  const isOffline = String(meta.generation_model).startsWith("fixture-");
  const values = [
    "展示 MVP",
    "未验证",
    String(meta.demo_counts?.case_examples ?? "—"),
    isOffline ? "离线演示" : "外部模型",
  ];
  [...elements.facts.querySelectorAll("dd")].forEach((node, index) => {
    node.textContent = values[index] ?? "—";
  });
}

async function loadMeta() {
  try {
    const response = await fetch("/api/meta");
    if (!response.ok) throw new Error("本地运行时没有返回元数据。");
    const meta = await response.json();
    setFacts(meta);
    setRuntimeStatus("ready", "展示 MVP 已就绪");
  } catch (error) {
    setRuntimeStatus("error", error.message);
  }
}

function createMessage(role, content) {
  const message = element(
    "article",
    `message ${role === "Helper" ? "assistant" : "user"}-message`,
  );
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
  loading.setAttribute("aria-label", "正在生成设计诊断与三个设计方向");
  loading.append(element("p", "loading-label", "正在整理设计诊断与三个方向…"));
  loading.append(
    element("div", "loading-line"),
    element("div", "loading-line"),
    element("div", "loading-line"),
  );
  return createMessage("Helper", loading);
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

function createExportButton(label, artifactFactory, result, status) {
  const button = element("button", "export-button", label);
  button.type = "button";
  button.addEventListener("click", () => {
    try {
      downloadArtifact(artifactFactory(result));
      status.textContent = `${label} 已开始下载。`;
    } catch (error) {
      status.textContent = `${label} 创建失败：${error.message}`;
    }
  });
  return button;
}

function createExportBar(result) {
  const bar = element("section", "export-bar");
  const copy = element("div");
  copy.append(element("strong", "", "保留这次展示结果"));
  copy.append(element("p", "", "Markdown 便于修改，JSON 保留完整机器结果。"));
  const actions = element("div", "export-actions");
  const status = element("span", "export-status", "");
  status.setAttribute("role", "status");
  actions.append(
    createExportButton(
      "导出 Markdown",
      window.DisplayMvpExport.createMarkdownExport,
      result,
      status,
    ),
    createExportButton("导出 JSON", window.DisplayMvpExport.createJsonExport, result, status),
    status,
  );
  bar.append(copy, actions);
  return bar;
}

const dimensionLabels = Object.freeze({
  educational_purpose: "教育目的",
  intended_audience: "目标使用者",
  application_setting: "使用场景",
  interactive_narrative_form: "叙事形式",
  if_mechanics: "互动机制",
  interaction_education_relationship: "互动与目的的关系",
});

function numberedSection(index, title) {
  const header = element("header", "answer-section-header");
  header.append(
    element("span", "answer-section-number", String(index).padStart(2, "0")),
    element("h3", "", title),
  );
  return header;
}

function labelledValue(label, value) {
  const row = element("div", "direction-field");
  row.append(element("dt", "", label), element("dd", "", value));
  return row;
}

function appendTagList(parent, values, className = "tag-list") {
  const list = element("ul", className);
  values.forEach((value) => list.append(element("li", "", value)));
  parent.append(list);
}

function renderAssistantResult(result) {
  const response = result.response;
  const wrapper = element("div", "compact-result");
  const header = element("header", "result-header");
  const heading = element("div");
  heading.append(element("div", "eyebrow", "Display exploration"));
  heading.append(element("h2", "", "从构想到三个可试方向"));
  header.append(heading, element("span", "version-chip", "展示用途"));
  wrapper.append(header);

  const diagnosis = element("section", "answer-section diagnosis-section");
  diagnosis.append(numberedSection(1, "设计诊断"));
  const diagnosisBody = element("div", "answer-section-body");
  diagnosisBody.append(element("p", "diagnosis-summary", response.diagnosis.concept_summary));
  const confirmed = element("div", "diagnosis-confirmed");
  confirmed.append(element("h4", "", "你已经说清楚的部分"));
  appendTagList(confirmed, response.diagnosis.confirmed_elements);
  diagnosisBody.append(confirmed);
  const decisions = element("div", "decision-list");
  decisions.append(element("h4", "", "下一步会改变方案的决定"));
  response.diagnosis.design_decisions.forEach((decision) => {
    const item = element("article", "decision-item");
    item.append(
      element("h5", "", decision.decision),
      element("p", "", decision.why_it_matters),
    );
    appendTagList(item, decision.options, "option-list");
    decisions.append(item);
  });
  diagnosisBody.append(decisions);
  diagnosis.append(diagnosisBody);
  wrapper.append(diagnosis);

  const directions = element("section", "answer-section directions-section");
  directions.append(numberedSection(2, "三个设计方向"));
  const directionGrid = element("div", "direction-grid");
  response.directions.forEach((direction, index) => {
    const card = element("article", "direction-card");
    const cardHeader = element("header", "direction-card-header");
    cardHeader.append(
      element("span", "direction-number", String(index + 1).padStart(2, "0")),
      element("h4", "", direction.title),
    );
    const fields = element("dl", "direction-fields");
    fields.append(
      labelledValue("适合", direction.best_fit),
      labelledValue("设计目标", direction.design_goal),
      labelledValue("核心互动", direction.core_interaction),
      labelledValue("系统角色", direction.system_role),
      labelledValue("关键取舍", direction.key_tradeoff),
      labelledValue("先做原型", direction.prototype_step),
    );
    card.append(cardHeader, fields);
    directionGrid.append(card);
  });
  directions.append(directionGrid);
  wrapper.append(directions);

  const references = element("section", "answer-section references-section");
  references.append(numberedSection(3, "参考案例与下一步"));
  const referenceGrid = element("div", "reference-grid");
  response.references.forEach((reference) => {
    const card = element("article", "reference-card");
    const title = element("a", "reference-link", reference.display_title);
    title.href = reference.public_url;
    title.target = "_blank";
    title.rel = "noreferrer";
    title.append(element("span", "", " ↗"));
    const known = reference.known_dimensions.map((name) => dimensionLabels[name] ?? name);
    const missing = reference.missing_dimensions.map((name) => dimensionLabels[name] ?? name);
    card.append(title, element("p", "reference-meta", `${reference.platform} · 公开游戏页面`));
    const facts = element("dl", "reference-fields");
    facts.append(labelledValue("相关原因", reference.why_relevant));
    facts.append(labelledValue("查看重点", reference.inspect_for));
    if (known.length > 0) facts.append(labelledValue("示例数据已有", known.join("、")));
    if (missing.length > 0) facts.append(labelledValue("页面可补看", missing.join("、")));
    card.append(facts);
    referenceGrid.append(card);
  });
  references.append(referenceGrid);
  const nextStep = element("div", "next-step");
  nextStep.append(
    element("span", "next-step-label", "建议下一步"),
    element("p", "", response.recommended_next_step),
  );
  references.append(nextStep);
  if (response.follow_up_question) {
    references.append(element("p", "follow-up", `下一轮问题：${response.follow_up_question}`));
  }
  wrapper.append(references);
  wrapper.append(createExportBar(result));
  wrapper.append(element("p", "run-footnote", `Display run ${result.run_id}`));
  return createMessage("Helper", wrapper);
}

function renderError(message, runId) {
  const card = element("div", "error-card");
  card.append(element("strong", "", "这次运行没有完成"), element("p", "", message));
  if (runId) card.append(element("small", "", `Run：${runId}`));
  return createMessage("Helper", card);
}

async function submitPrompt() {
  const message = elements.input.value;
  if (!message.trim() || elements.send.disabled) return;
  elements.welcome?.remove();
  elements.log.append(createMessage("你的问题", message));
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
      body: JSON.stringify({ message }),
    });
    const payload = await response.json();
    loading.replaceWith(
      response.ok
        ? renderAssistantResult(payload)
        : renderError(payload.error ?? "未知的本地运行错误。", payload.run_id),
    );
  } catch {
    setRuntimeStatus("error", "本地运行时连接中断");
    loading.replaceWith(renderError("无法连接本地运行时，请确认服务仍在运行后重试。"));
  } finally {
    elements.send.disabled = false;
    elements.input.disabled = false;
    elements.form.removeAttribute("aria-busy");
    elements.input.focus();
    elements.scroll.scrollTo({ top: elements.scroll.scrollHeight, behavior: "smooth" });
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

if (isFilePreview) {
  elements.launchNotice.hidden = false;
  elements.welcome.hidden = true;
  elements.input.disabled = true;
  elements.send.disabled = true;
  elements.example.disabled = true;
  elements.input.placeholder = "请启动本地运行时，再打开 http://127.0.0.1:3000";
  setRuntimeStatus("error", "仅预览 · 请打开本地运行时");
} else {
  loadMeta();
}

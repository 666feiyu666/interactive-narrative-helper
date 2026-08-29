(function installTrackAExport(scope) {
  const dimensionOrder = [
    ["educational_purpose", "Educational purpose"],
    ["intended_audience", "Intended audience"],
    ["application_setting", "Application setting"],
    ["interactive_narrative_form", "Interactive narrative form"],
    ["interaction_education_relationship", "Interaction → education"],
  ];

  function requireResult(result) {
    if (!result?.run_id || !result?.request || !result?.response) {
      throw new Error("A complete design result is required for export.");
    }
  }

  function outputVersion(result) {
    if (result.output_version) return result.output_version;
    return result.response?.schema_version === "educational-design-response/v2" ? "0.2" : "0.1";
  }

  function inline(value) {
    return String(value ?? "").replace(/\r?\n/gu, " ").replaceAll("|", "\\|").trim();
  }

  function readable(value) {
    return inline(value).replaceAll("_", " ");
  }

  function appendList(lines, items) {
    if (!Array.isArray(items) || items.length === 0) {
      lines.push("- None recorded.");
      return;
    }
    items.forEach((item) => lines.push(`- ${inline(item)}`));
  }

  function createCompactMarkdown(result) {
    const { response } = result;
    const lines = [
      "# Educational Interactive Narrative Design Export",
      "",
      `- **Output version:** v${outputVersion(result)}`,
      `- **Run ID:** \`${result.run_id}\``,
      "",
      "## 设计问题",
      "",
      result.request.raw_question.trim(),
      "",
      "## 01 设计诊断",
      "",
      inline(response.diagnosis.concept_summary),
      "",
      "### 已确认",
      "",
    ];
    appendList(lines, response.diagnosis.confirmed_elements);
    lines.push("", "### 需要决定", "");
    response.diagnosis.design_decisions.forEach((decision) => {
      lines.push(`- **${inline(decision.decision)}：** ${inline(decision.why_it_matters)}`);
      lines.push(`  - 可选：${decision.options.map(inline).join(" / ")}`);
    });

    lines.push("", "## 02 三个设计方向");
    response.directions.forEach((direction, index) => {
      lines.push(
        "",
        `### ${index + 1}. ${inline(direction.title)}`,
        "",
        `- **适合：** ${inline(direction.best_fit)}`,
        `- **设计目标：** ${inline(direction.design_goal)}`,
        `- **核心互动：** ${inline(direction.core_interaction)}`,
        `- **系统角色：** ${inline(direction.system_role)}`,
        `- **关键取舍：** ${inline(direction.key_tradeoff)}`,
        `- **先做原型：** ${inline(direction.prototype_step)}`,
      );
    });

    lines.push("", "## 03 参考案例与下一步", "");
    response.references.forEach((reference) => {
      lines.push(
        `### [${inline(reference.display_title)}](${reference.public_url})`,
        "",
        `- **相关原因：** ${inline(reference.why_relevant)}`,
        `- **查看重点：** ${inline(reference.inspect_for)}`,
        "",
      );
    });
    lines.push("### 建议下一步", "", inline(response.recommended_next_step));
    if (response.follow_up_question) {
      lines.push("", `**下一轮问题：** ${inline(response.follow_up_question)}`);
    }
    return lines;
  }

  function createLegacyMarkdown(result) {
    const { request, response } = result;
    const lines = [
      "# Educational Interactive Narrative Design Export",
      "",
      "- **Output version:** v0.1",
      `- **Run ID:** \`${result.run_id}\``,
      `- **Knowledge snapshot:** \`${response.knowledge_snapshot_id}\``,
      `- **Evidence status:** ${readable(response.evidence_status)}`,
      "",
      "## Design question",
      "",
      inline(request.raw_question),
      "",
      "## Request interpretation",
      "",
      inline(response.request_interpretation),
    ];
    response.design_directions.forEach((direction, index) => {
      lines.push("", `## ${index + 1}. ${inline(direction.title)}`, "", inline(direction.concept));
      lines.push("", "### Design dimensions", "", "| Dimension | Proposed value | Basis |", "| --- | --- | --- |");
      dimensionOrder.forEach(([key, label]) => {
        const dimension = direction.design_dimensions[key];
        lines.push(`| ${label} | ${inline(dimension?.value)} | ${(dimension?.basis ?? []).map(readable).join(", ")} |`);
      });
      lines.push("", "### Interaction mechanism", "", inline(direction.interaction_mechanism));
      lines.push("", "### Educational relationship", "", inline(direction.educational_relationship));
      lines.push("", "### Applicability conditions", "");
      appendList(lines, direction.applicability_conditions);
      lines.push("", "### Transfer assumptions", "");
      appendList(lines, direction.transfer_assumptions);
      lines.push("", "### Risks", "");
      appendList(lines, direction.risks);
    });
    lines.push("", "## Retrieved Knowledge Cards", "");
    if (Array.isArray(result.retrieval) && result.retrieval.length > 0) {
      result.retrieval.forEach((item) => {
        const identifier = item.knowledge_id ?? item.id ?? "unknown";
        const score = Number.isFinite(item.score) ? ` (score ${item.score.toFixed(3)})` : "";
        lines.push(`- \`${inline(identifier)}\`${score}`);
      });
    } else {
      lines.push("- None recorded.");
    }
    lines.push("", "## Limitations", "");
    appendList(lines, response.limitations);
    lines.push("", "## Questions for the next design pass", "");
    appendList(lines, response.follow_up_questions);
    return lines;
  }

  function createMarkdownExport(result) {
    requireResult(result);
    const version = outputVersion(result);
    const lines = version === "0.2" ? createCompactMarkdown(result) : createLegacyMarkdown(result);
    return {
      fileName: `${result.run_id}-educational-design-v${version}.md`,
      mimeType: "text/markdown;charset=utf-8",
      content: `${lines.join("\n").trim()}\n`,
    };
  }

  function createJsonExport(result) {
    requireResult(result);
    const version = outputVersion(result);
    return {
      fileName: `${result.run_id}-educational-design-v${version}.json`,
      mimeType: "application/json;charset=utf-8",
      content: `${JSON.stringify(result, null, 2)}\n`,
    };
  }

  scope.TrackAExport = Object.freeze({ createMarkdownExport, createJsonExport });
})(globalThis);

(function installDisplayMvpExport(scope) {
  function requireResult(result) {
    if (!result?.run_id || !result?.request || !result?.response) {
      throw new Error("A complete display result is required for export.");
    }
  }

  function inline(value) {
    return String(value ?? "").replace(/\r?\n/gu, " ").replaceAll("|", "\\|").trim();
  }

  function appendList(lines, items) {
    (items ?? []).forEach((item) => lines.push(`- ${inline(item)}`));
  }

  function createMarkdownExport(result) {
    requireResult(result);
    const { response } = result;
    const lines = [
      "# Educational Interactive Narrative Design — Display MVP Export",
      "",
      "> 展示用途：本结果不代表正式数据挖掘结论、Agent 能力验证或教育效果证据。",
      "",
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
    return {
      fileName: `${result.run_id}-educational-design-display-mvp.md`,
      mimeType: "text/markdown;charset=utf-8",
      content: `${lines.join("\n").trim()}\n`,
    };
  }

  function createJsonExport(result) {
    requireResult(result);
    return {
      fileName: `${result.run_id}-educational-design-display-mvp.json`,
      mimeType: "application/json;charset=utf-8",
      content: `${JSON.stringify(result, null, 2)}\n`,
    };
  }

  scope.DisplayMvpExport = Object.freeze({ createMarkdownExport, createJsonExport });
})(globalThis);

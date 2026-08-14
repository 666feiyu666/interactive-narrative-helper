# Story Generator

这是一个通过 DeepSeek 逐段生成故事的可配置 Notebook，同时支持 Google Colab 和本地 Jupyter/IPython。故事固定拆为起因、发展、转折、高潮、结局五个 section；每个 section 生成三个故事日。

[![在 Colab 中打开](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/666feiyu666/story-generator/blob/main/notebooks/story_generator_deepseek.ipynb)

## Google Colab：推荐给初次使用者

1. 点击上方“在 Colab 中打开”。
2. 先依次运行“环境初始化”下的三个单元格；首次运行时等待项目下载和依赖安装完成。
3. 按提示输入 DeepSeek API Key。输入内容不会显示在 Notebook 中。
4. 按照起因、发展、转折、高潮、结局的顺序生成并确认文本。
5. 每一段先运行候选生成单元格，检查满意后再运行确认单元格。
6. 运行最后的导出单元格，浏览器会下载 Markdown 和 JSON 文件。

不要选择“全部运行”：这会跳过逐段检查并连续调用 API。

也可以在 Colab 左侧的钥匙图标中添加名为 `DEEPSEEK_API_KEY` 的 Secret；Notebook 会优先读取它。不要把真实 API Key 写入 Notebook、配置文件或 Git 提交。

## 初始化本地环境

项目使用 `uv` 管理 Python 3.13、依赖和 `.venv`。首次运行：

```bash
git clone https://github.com/666feiyu666/story-generator.git
cd story-generator
/opt/homebrew/bin/uv sync --locked
cp .env.example .env
```

然后在 `.env` 中填写：

```dotenv
DEEPSEEK_API_KEY=your-key
```

`.env` 和 `.venv` 已被 Git 忽略。

## 启动 Notebook

从当前目录启动 JupyterLab：

```bash
/opt/homebrew/bin/uv run jupyter lab notebooks/story_generator_deepseek.ipynb
```

Notebook 使用项目 `.venv` 中的 IPython kernel，并直接加载：

- `src/story_generator/` 中的本地代码；
- `configs/fox_and_crow/` 中的多文件故事配置；
- `.env` 中的 DeepSeek API key。

Notebook 界面明确分为起因、发展、转折、高潮、结局五个操作块。每块都有 Prompt 预览、候选生成和人工确认单元。若提前运行后面的块，会明确提示当前配置缺失、前一 section 配置缺失，或前一 section 尚无已确认文本。

本地运行不需要上传 ZIP 或复制项目目录。如果只想进入本地 IPython，也可以运行：

```bash
/opt/homebrew/bin/uv run ipython
```

## 故事约束结构

故事配置固定分为五层：

1. `plot_structure`：起因、发展、转折、高潮、结局，以及每段的三个目标故事日。
2. `story_world`：角色、信念、知识、关系、地点、物品、规则和障碍。
3. `generation_context`：已生成文本、已确立事实、未解决线索、角色累积知识和当前生成位置。
4. `narrative_constraints`：全局限制与禁区，包括角色和支线、情节节奏、时间循环、视角信息、人物关系、语言对话、连续性和结局。
5. `discourse`：语言、风格、长度、形式、视角和时态。

每个已配置 section 的 `days` 必须恰好包含三个不同的正整数，日期不要求连续。例如起因可以使用 Day 1–3，而发展可以选择 Day 8、Day 12、Day 15。五段必须按照叙事顺序逐步配置。

每次调用只生成一个包含三天的 section，并返回：

- `story_text`：本次故事正文；
- `context_update`：本次文本实际建立的事实、线索、知识、信念、关系变化、尝试和结果。

候选文本不会自动进入上下文。只有调用 `accept_section(...)` 人工确认后，文本及其上下文更新才会传给下一段。因此可以反复重写“起因”，直到满意，再开始生成“发展”。

世界可以按照 `reset_rules` 重置，而狐狸的知识仍可按照 `persistence_rules` 保留并约束后续行动。

## 目录结构

```text
story-generator/
├── .python-version
├── .env.example
├── pyproject.toml
├── requirements-colab.txt
├── uv.lock
├── notebooks/story_generator_deepseek.ipynb
├── src/story_generator/
│   ├── config.py
│   ├── context.py
│   ├── prompt.py
│   ├── generator.py
│   └── exports.py
├── configs/fox_and_crow/
│   ├── story.json
│   ├── story_world.json
│   ├── generation_context.json
│   ├── narrative_constraints.json
│   ├── discourse.json
│   └── plot_structure/
│       ├── cause.json
│       ├── development.json
│       ├── turning_point.json
│       ├── climax.json
│       ├── resolution.json
│       └── constraints.json
├── tests/
└── runs/
```

同一个 Notebook 会自动检测运行环境：在 Colab 中克隆公开仓库并安装最小依赖；在本地则直接加载当前项目的 `src/` 和 `configs/`。

## 填写生成计划

配置由 `load_story_config(...)` 自动组合，不需要手工合并 JSON：

- `story.json`：标题与核心情境；
- `story_world.json`：角色、地点、物品、规则和障碍；
- `generation_context.json`：故事开始前的初始上下文；
- `narrative_constraints.json`：角色数量、支线范围、情节手段、循环规则、信息边界、人物关系、语言表达和结局方式等全局限制；
- `discourse.json`：语言、风格、长度、形式、视角和时态；
- `plot_structure/*.json`：五个 section 各自的配置及跨段约束。

五个 section 文件都必须保留，但可以先只填写 `plot_structure/cause.json`：

```json
{
  "purpose": "填写起因这三个故事日需要完成的功能",
  "days": [1, 2, 3],
  "requirements": ["填写起因 section 的具体约束"]
}
```

起因确认后，再依次填写 `development.json`、`turning_point.json`、`climax.json` 和 `resolution.json`。Notebook 中的 `working_context` 保存已经确认的文本；重新加载后续配置时不要重置它。

如果五段配置都已经稳定，可以使用 `generate_story(...)` 一次生成全部五段；默认 Notebook 工作流使用 `generate_next_section(...)` 和 `accept_section(...)` 保留人工检查点。

## 本地测试

测试不会调用 DeepSeek：

```bash
PYTHONPATH=src /opt/homebrew/bin/uv run python -m unittest discover -s tests -v
```

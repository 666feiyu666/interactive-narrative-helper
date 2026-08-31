---
name: research-agent-building
description: "规划、实现与审阅以研究问题为导向的 Agent 建模，包括用 ipynb 或最小脚本建立可运行原型、运行 cases、评价行为并修订角色、能力、知识和人类控制模型。用于 Agent 的思路与模式仍在形成的研究；不用于数据挖掘方法、机器学习训练、默认的 Research through Design，或完整前后端应用的产品化开发。"
---

# 研究型 Agent 建模

## 明确研究任务

- 本 skill 负责从研究问题和可用证据建立、实现、检验并修订 Agent 模型。Agent 原型是形成和验证思路的研究工具，不是需要提前冻结契约的早期产品版本。
- 先判断任务是在界定 Agent 角色、提出能力模型、实现最小原型、运行探索性 probe、评价行为，还是综合结果并修订模型。
- 区分数据研究发现、Agent 设计判断、可运行 artifact、直接观察、研究者解释和能力主张。代码存在、测试通过或少量输出令人满意都不等于 Agent 能力成立。
- 本 skill 可以直接创建与修改 `.ipynb`、简短脚本、prompt、配置和评价材料，并运行形成性原型。不要因为这些产物包含代码就转交软件开发。
- 只有用户明确决定把已经研究过的 Agent 原型产品化为完整前后端应用时，才使用 `guided-software-development`。
- Research through Design 不是本项目的默认方法。除非用户明确改变研究方法，不要把制作与反思 artifact 本身表述为 RtD 贡献，也不要用 RtD 记录结构重组项目。

## 建立可检验的 Agent 模型

开始原型实现前，明确当前能够明确的内容，并把仍在形成的部分标为开放问题：

1. 该 Agent 服务的研究问题；
2. 目标使用者、真实任务与介入工作流的位置；
3. Agent 的角色和人类保留的决定权；
4. 待检验的能力构念及其可观察行为；
5. 输入、输出、状态和交互边界；
6. 可以使用的知识、证据成熟度和禁止传递的材料；
7. 当前假设、未知项、失败风险和本轮不试图证明的内容。

不要为了开始实现而假装这些内容已经稳定。原型的目的可以正是比较不同角色、知识条件、交互方式或能力解释。

## 接收数据挖掘证据

- 使用 `research-data-mining` 已明确来源、含义、范围和成熟状态的发现。保留 `supported`、`suggestive`、`contested` 或 `currently_unsupported` 等状态，不把探索性模式改写成事实。
- 区分可供原型使用的派生知识与不得发送给模型的原始或受限材料。遵守项目的 provenance、版权、隐私和外部模型边界。
- 当 Agent 需要的分类、关系或案例覆盖尚不存在时，提出明确的数据问题并退回数据挖掘；不要用生成内容补齐 corpus 证据。

## 实现最小可运行原型

- 选择能够回答当前 probe question 的最小形式。探索阶段优先考虑 `.ipynb`，因为它可以并置问题、输入、prompt、配置、代码、原始输出、观察和初步评价；批量运行或复用确有需要时可使用简短脚本。
- 只实现本轮需要观察的 Agent 行为。不要默认建设前端、后端、数据库、稳定 API、账号系统、部署、兼容层或完整 Harness。
- 允许原型快速改变 prompt、知识表示、tool flow、输出结构和交互方式，但每次运行必须能识别当时实际使用的条件。
- 对外部模型调用，记录 provider、model、prompt、sampling、knowledge condition、case、日期和原始输出；发送材料前确认项目权利边界和用户授权。
- 原型可以失败。保留会改变能力解释、设计方向或后续 probe 的失败、反例和不确定输出；无需把普通编码诊断包装成研究发现。

## 运行 Agent probe

每次形成性 probe 至少连接：

- `probe_question`：本轮想了解什么；
- `agent_model`：当前角色、能力和控制假设；
- `case_or_input`：使用的案例或任务；
- `conditions`：prompt、model、knowledge、tools 和 sampling；
- `expected_observation`：什么现象能区分候选解释；
- `raw_outputs`：未经美化的实际结果；
- `evaluation`：依据预先说明的维度检查行为；
- `counterevidence`：失败、反例和替代解释；
- `revision`：对 Agent 模型、下一次 probe 或数据需求的影响。

少量 probe 用于形成和排除思路，不用于确认一般能力。进入固定比较或 confirmatory evaluation 前，应冻结 cases、conditions、评价标准和排除规则，并将 exploratory 与 confirmatory 结果分开。

## 评价而不是演示

- 分开检查结构或 contract compliance、目标能力行为、知识 grounding、人类控制、跨 case 稳定性和失败模式。
- 用能力构念所要求的证据评价输出，不把流畅度、长度、界面完整度或研究者偏好当作替代指标。
- 记录实际观察，再说明解释。一次用户接受可以帮助修订交互，但不能单独证明 Agent 能力、普遍效用或教育效果。
- 当结果有多种解释时，设计下一次能区分解释的 probe，而不是立即增加更多架构或验证规则。

## 用状态管理认识

使用 `open`、`exploratory`、`needs_review`、`supported`、`contested` 和 `frozen_for_evaluation` 等状态描述 Agent 模型或能力主张。probe、run、prompt、case 和数据快照可以使用稳定标识或 hash 以便追溯，但不要用 `v0.1`、`v0.2` 等产品版本暗示研究认识沿既定目标成熟。

## 产品化交接

完整前后端应用不属于本 skill。只有用户明确要求将已研究的 Agent 原型产品化，并确认目标使用者、稳定行为、系统边界和验收条件后，才交给 `guided-software-development`。交接应说明：

- 已得到支持和仍未解决的 Agent 行为；
- 原型中需要保留的研究约束与人类控制；
- 稳定输入、输出和知识边界；
- 产品化不得改变的评价条件；
- 不应被包装成产品能力的探索性结果。

在此之前，notebook、脚本、CLI probe、prompt flow、case runs 和原型评价都由本 skill 负责。

## 完成检查

说明当前 Agent 模型、已实现的最小原型、运行条件、直接观察、失败与反例、得到支持或被削弱的解释、仍缺的数据证据，以及下一条最有区分力的 probe。不要用原型完成度、软件测试或展示效果替代研究判断。

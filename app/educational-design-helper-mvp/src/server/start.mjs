import { loadRuntimeConfig } from "../config/load-config.mjs";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { FixtureProvider } from "../model/fixture-provider.mjs";
import { createRuntime } from "../runtime/create-runtime.mjs";
import { createHttpServer } from "./app.mjs";

export function createFixtureResponse(payload) {
  const [firstReference, secondReference = firstReference] =
    payload.response_contract.allowed_reference_knowledge_ids;
  return {
    schema_version: "educational-design-response",
    request_id: payload.request.request_id,
    diagnosis: {
      concept_summary:
        "这个构想把记录当作入口，把重新阅读、辨认叙述选择、主动改写和比较版本作为主要互动。原型首先需要确定由谁在什么情境下使用，以及系统应当只提供中性提示、给出结构，还是生成候选文本。日记可能涉及敏感经历，因此跳过、删除和保存方式也应当成为核心流程的一部分。",
      confirmed_elements: ["回看既有记录", "通过改写反思叙述方式", "比较改写前后的差异"],
      design_decisions: [
        {
          decision: "主要使用者与使用时刻",
          why_it_matters: "独处复盘、课堂写作和辅导对话需要不同的提示语、隐私默认值与单次使用时长。",
          options: ["成人日常自省", "学生写作练习", "由带领者主持的活动"],
        },
        {
          decision: "反思要落到什么变化",
          why_it_matters: "若目标是看见归因、练习表达或理解视角，系统标注的对象和改写规则都会不同。",
          options: ["区分事实与解释", "尝试另一叙述视角", "调整语气与因果连接"],
        },
        {
          decision: "系统介入深度",
          why_it_matters: "自动代写较省力，却可能让使用者只挑选答案；逐步提问更慢，但能保留思考过程。",
          options: ["只提问不代写", "给出改写骨架", "生成候选后逐句确认"],
        },
        {
          decision: "内容安全与保存方式",
          why_it_matters: "记录可能包含第三方信息或敏感经历，跳过、删除、导出与同步必须在原型阶段确定。",
          options: ["默认仅本地保存", "可选择加密同步", "一次性会话不留存"],
        },
      ],
    },
    directions: [
      {
        direction_id: "direction_1",
        title: "双版本叙述镜",
        best_fit: "适合希望定期独自复盘一两件具体经历的成人使用者。",
        design_goal: "帮助使用者看见事实、推测、情绪和他人意图判断如何被写进同一段叙述。",
        core_interaction: "选取一段旧记录，先自行标注叙述层，再保留事件事实重写一个版本；系统并列高亮删改并追问改变理由。",
        system_role: "系统充当安静的比较镜，只标示差异、保存版本和提出中性问题，不判断哪个版本正确。",
        key_tradeoff: "结构清楚且私密，但反复标注可能像作业，需要把一次流程压缩到可完成的长度。",
        prototype_step: "用三篇虚构记录做纸面流程，测试四类标注是否易懂，以及使用者能否在十分钟内完成一次改写。",
      },
      {
        direction_id: "direction_2",
        title: "视角交换写作室",
        best_fit: "适合中学或大学的小组写作课，由教师提供安全、非私密的共同事件素材。",
        design_goal: "训练学习者识别叙述者位置，并比较第一人称、旁观者与另一角色视角如何改变信息和语气。",
        core_interaction: "全班阅读同一短事件，各自选择角色改写，匿名交换版本后指出新增、遗漏与推断，最后修订自己的写法。",
        system_role: "系统负责分发材料、匿名配对、对齐版本和收集讨论问题，教师负责设定边界与主持解释。",
        key_tradeoff: "多版本对照容易形成讨论，但若使用私人记录会放大暴露风险，因此首轮应使用虚构材料。",
        prototype_step: "制作一个二十分钟课堂脚本，只实现角色选择、两栏改写和匿名评论三步，观察讨论是否围绕叙述选择展开。",
      },
      {
        direction_id: "direction_3",
        title: "长期叙述轨迹",
        best_fit: "适合持续记录数月、想观察自己反复使用哪些故事框架的长期日记者。",
        design_goal: "把单次改写扩展为时间上的自我观察，让使用者发现某类事件如何被反复归因、命名和收束。",
        core_interaction: "使用者给每次改写选择一个自定义主题，月末查看原文与修订版本组成的时间线，再挑一个反复模式写总结。",
        system_role: "系统是私人档案管理员，组织版本和主题并生成可追溯索引，不作心理诊断，也不替代专业支持。",
        key_tradeoff: "长期变化更容易被看见，但需要稳定留存敏感内容，也可能因为回看量太大而增加负担。",
        prototype_step: "先用六周合成数据做时间线原型，检查主题筛选、版本定位和删除整条记录是否明确。",
      },
    ],
    reference_selections: [
      {
        knowledge_id: firstReference,
        direction_ids: ["direction_1", "direction_3"],
        why_relevant: "这个公开案例把反思放进互动叙事过程，可帮助检查停下来思考的时机和呈现节奏。",
        inspect_for: "查看它如何邀请玩家反思，以及反思之后的互动是否发生可见变化。",
      },
      {
        knowledge_id: secondReference,
        direction_ids: ["direction_2"],
        why_relevant: "这个公开案例可作为文字叙事与回应动作结合的界面参照，适合比较阅读、行动和回看之间的切换。",
        inspect_for: "查看玩家先接收哪些信息、何时需要回应，以及页面如何提示下一步。",
      },
    ],
    recommended_next_step:
      "先选定一个主要使用者和一个十分钟使用时刻，再从“双版本叙述镜”制作无账号原型；只用虚构内容跑通选择旧文、标注、改写、比较和删除五个动作。",
    follow_up_question: "你更希望先服务成人的私人自省，还是课堂中的写作练习？",
  };
}

export function fixtureVector(text) {
  const normalized = String(text).toLowerCase();
  let left = 17;
  let right = 31;
  for (const character of normalized) {
    const code = character.codePointAt(0);
    left = (left * 33 + code) % 997;
    right = (right * 37 + code) % 991;
  }
  const feature = (...terms) => (terms.some((term) => normalized.includes(term)) ? 4 : 0.15);
  return [
    1,
    feature("反思", "日记", "改写", "reflection", "journal"),
    feature("视角", "叙述", "perspective", "narrat"),
    feature("课堂", "学生", "classroom", "student"),
    feature("博物馆", "展品", "museum", "exhibition"),
    feature("欺凌", "网络", "bully", "cyber"),
    feature("历史", "见证", "history", "witness"),
    0.1 + left / 9970,
    0.1 + right / 9910,
  ];
}

async function start() {
  const baseConfig = await loadRuntimeConfig({ requireApiKey: false });
  const config = Object.freeze({
    ...baseConfig,
    save_runs: false,
    openai: Object.freeze({
      ...baseConfig.openai,
      generationModel: "fixture-generation",
      embeddingModel: "fixture-embedding",
    }),
  });
  const provider = new FixtureProvider({
    embeddingFactory: fixtureVector,
    responseFactory: ({ payload }) => createFixtureResponse(payload),
  });
  const runtime = await createRuntime({ config, provider });
  const server = createHttpServer(runtime);
  server.listen(config.server.port, config.server.host, () => {
    console.log(
      `Educational Design Helper display MVP is ready at http://${config.server.host}:${config.server.port}`,
    );
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    console.error(`Display MVP startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

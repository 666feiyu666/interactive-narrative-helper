import { createId } from "../utils/ids.mjs";

export function createDesignRequest(rawQuestion) {
  if (typeof rawQuestion !== "string" || rawQuestion.trim().length === 0) {
    throw new Error("请输入教育互动叙事设计问题。");
  }
  if (rawQuestion.length > 4000) {
    throw new Error("设计问题不能超过 4,000 个字符。");
  }

  return {
    schema_version: "educational-design-request",
    request_id: createId("request"),
    raw_question: rawQuestion,
  };
}

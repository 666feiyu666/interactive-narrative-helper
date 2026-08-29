import { createId } from "../utils/ids.mjs";

export function createDesignRequest(rawQuestion, requestedDirectionCount = 3) {
  if (typeof rawQuestion !== "string" || rawQuestion.trim().length === 0) {
    throw new Error("Enter an English educational interactive-narrative design question.");
  }
  if (rawQuestion.length > 4000) {
    throw new Error("The design question must be 4,000 characters or fewer.");
  }
  if (!Number.isInteger(requestedDirectionCount) || requestedDirectionCount < 1 || requestedDirectionCount > 5) {
    throw new Error("requestedDirectionCount must be an integer from 1 to 5.");
  }

  return {
    schema_version: "educational-design-request/v1",
    request_id: createId("request"),
    raw_question: rawQuestion,
    educational_intent: [],
    target_audience: { status: "not_stated", description: "" },
    application_setting: { status: "not_stated", description: "" },
    preferred_interactions: [],
    constraints: [],
    requested_direction_count: requestedDirectionCount,
  };
}

export function createCompactDesignRequest(rawQuestion) {
  if (typeof rawQuestion !== "string" || rawQuestion.trim().length === 0) {
    throw new Error("请输入教育互动叙事设计问题。");
  }
  if (rawQuestion.length > 4000) {
    throw new Error("设计问题不能超过 4,000 个字符。");
  }

  return {
    schema_version: "educational-design-request/v2",
    output_version: "0.2",
    request_id: createId("request"),
    raw_question: rawQuestion,
  };
}

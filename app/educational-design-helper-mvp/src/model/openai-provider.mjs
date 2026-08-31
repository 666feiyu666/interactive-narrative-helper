import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

function normalizeUsage(usage) {
  if (!usage) return null;
  const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: usage.total_tokens ?? inputTokens + outputTokens,
  };
}

export class OpenAIProvider {
  name = "openai";

  constructor({ apiKey, generationModel, embeddingModel, generationConfig }) {
    this.client = new OpenAI({ apiKey });
    this.generationModel = generationModel;
    this.embeddingModel = embeddingModel;
    this.generationConfig = generationConfig;
  }

  async embed(texts) {
    const started = performance.now();
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
      encoding_format: "float",
    });

    const vectors = [...response.data]
      .sort((left, right) => left.index - right.index)
      .map((entry) => entry.embedding);

    return {
      vectors,
      provider: this.name,
      model: response.model ?? this.embeddingModel,
      usage: normalizeUsage(response.usage),
      latencyMs: Math.max(0, Math.round(performance.now() - started)),
    };
  }

  async generateDesign({ format, systemPrompt, payload, attempt }) {
    const started = performance.now();
    const response = await this.client.responses.parse({
      model: this.generationModel,
      store: this.generationConfig.store,
      reasoning: { effort: this.generationConfig.reasoning_effort },
      max_output_tokens: this.generationConfig.max_output_tokens,
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({ ...payload, attempt }, null, 2),
        },
      ],
      text: {
        format: zodTextFormat(format, "educational_design_response"),
      },
    });

    if (!response.output_parsed) {
      const refusal = response.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === "refusal");
      throw new Error(refusal?.refusal || "The generation model returned no parsed response.");
    }

    return {
      parsed: response.output_parsed,
      raw: response,
      provider: this.name,
      model: response.model ?? this.generationModel,
      usage: normalizeUsage(response.usage),
      latencyMs: Math.max(0, Math.round(performance.now() - started)),
    };
  }
}

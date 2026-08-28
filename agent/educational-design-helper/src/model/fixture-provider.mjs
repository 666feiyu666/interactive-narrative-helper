export class FixtureProvider {
  name = "fixture";

  constructor({ vectorsByText = new Map(), responseFactory = null } = {}) {
    this.vectorsByText = vectorsByText;
    this.responseFactory = responseFactory;
    this.embeddingModel = "fixture-embedding-v1";
    this.generationModel = "fixture-generation-v1";
  }

  async embed(texts) {
    const vectors = texts.map((text) => {
      const vector = this.vectorsByText.get(text);
      if (!vector) throw new Error(`No fixture embedding exists for: ${text}`);
      return vector;
    });
    return {
      vectors,
      provider: this.name,
      model: this.embeddingModel,
      usage: { input_tokens: texts.length, output_tokens: 0, total_tokens: texts.length },
      latencyMs: 0,
    };
  }

  async generateDesign(input) {
    if (!this.responseFactory) throw new Error("No fixture response factory was configured.");
    const parsed = await this.responseFactory(input);
    return {
      parsed,
      raw: { fixture: true, parsed },
      provider: this.name,
      model: this.generationModel,
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      latencyMs: 0,
    };
  }
}

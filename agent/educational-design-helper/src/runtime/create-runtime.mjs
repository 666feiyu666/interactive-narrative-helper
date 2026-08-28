import { loadRuntimeConfig } from "../config/load-config.mjs";
import { loadKnowledgeSnapshot } from "../knowledge/load-snapshot.mjs";
import { OpenAIProvider } from "../model/openai-provider.mjs";
import { ensureEmbeddingIndex } from "../retrieval/embedding-index.mjs";
import { createDesignAdvisor } from "../harness/design-advisor.mjs";
import { createSchemaValidators } from "../validation/public-schemas.mjs";

export async function createRuntime({ config = null, provider = null } = {}) {
  const runtimeConfig = config ?? (await loadRuntimeConfig());
  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  const activeProvider =
    provider ??
    new OpenAIProvider({
      apiKey: runtimeConfig.openai.apiKey,
      generationModel: runtimeConfig.openai.generationModel,
      embeddingModel: runtimeConfig.openai.embeddingModel,
      generationConfig: runtimeConfig.generation,
    });
  const indexResult = await ensureEmbeddingIndex(snapshot, activeProvider, runtimeConfig);
  const runDesign = createDesignAdvisor({
    snapshot,
    indexResult,
    provider: activeProvider,
    runtimeConfig,
    validators,
  });

  return Object.freeze({
    config: runtimeConfig,
    validators,
    snapshot,
    provider: activeProvider,
    indexResult,
    runDesign,
  });
}

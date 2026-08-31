import { loadRuntimeConfig } from "../config/load-config.mjs";
import { createDesignAdvisor } from "../harness/design-advisor.mjs";
import { loadDemoData } from "../knowledge/load-demo-data.mjs";
import { OpenAIProvider } from "../model/openai-provider.mjs";
import { loadReferenceCatalog } from "../references/reference-catalog.mjs";
import { ensureEmbeddingIndexes } from "../retrieval/embedding-index.mjs";
import { createSchemaValidators } from "../validation/public-schemas.mjs";

export async function createRuntime({
  config = null,
  provider = null,
  indexRoot = null,
  runOutputRoot = null,
} = {}) {
  const runtimeConfig = config ?? (await loadRuntimeConfig());
  const validators = await createSchemaValidators();
  const activeProvider =
    provider ??
    new OpenAIProvider({
      apiKey: runtimeConfig.openai.apiKey,
      generationModel: runtimeConfig.openai.generationModel,
      embeddingModel: runtimeConfig.openai.embeddingModel,
      generationConfig: runtimeConfig.generation,
    });
  const demoData = await loadDemoData(validators);
  const referenceCatalog = await loadReferenceCatalog(validators, demoData);
  const indexes = await ensureEmbeddingIndexes(demoData, activeProvider, runtimeConfig, {
    indexRoot,
  });
  const runDesign = createDesignAdvisor({
    demoData,
    indexes,
    provider: activeProvider,
    runtimeConfig,
    validators,
    referenceCatalog,
    ...(runOutputRoot ? { runOutputRoot } : {}),
  });

  return Object.freeze({
    config: runtimeConfig,
    validators,
    demoData,
    referenceCatalog,
    provider: activeProvider,
    indexes,
    runDesign,
  });
}

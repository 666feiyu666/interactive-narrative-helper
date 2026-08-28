import { loadRuntimeConfig } from "../config/load-config.mjs";
import { loadKnowledgeSnapshot } from "../knowledge/load-snapshot.mjs";
import { OpenAIProvider } from "../model/openai-provider.mjs";
import { buildEmbeddingIndex } from "../retrieval/embedding-index.mjs";
import { createSchemaValidators } from "../validation/public-schemas.mjs";

async function build() {
  const config = await loadRuntimeConfig();
  const validators = await createSchemaValidators();
  const snapshot = await loadKnowledgeSnapshot(validators);
  const provider = new OpenAIProvider({
    apiKey: config.openai.apiKey,
    generationModel: config.openai.generationModel,
    embeddingModel: config.openai.embeddingModel,
    generationConfig: config.generation,
  });
  const result = await buildEmbeddingIndex(snapshot, provider, config);
  console.log(
    `Built ${result.index.model} index with ${result.index.entries.length} Knowledge Cards at ${result.index.dimensions} dimensions.`,
  );
}

build().catch((error) => {
  console.error(`Index build failed: ${error.message}`);
  process.exitCode = 1;
});

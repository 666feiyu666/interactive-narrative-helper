import path from "node:path";

import { loadRuntimeConfig } from "../config/load-config.mjs";
import { paths } from "../config/paths.mjs";
import { loadKnowledgeSnapshot } from "../knowledge/load-snapshot.mjs";
import { loadKnowledgeRelease } from "../knowledge/load-release.mjs";
import { OpenAIProvider } from "../model/openai-provider.mjs";
import { buildEmbeddingIndex } from "../retrieval/embedding-index.mjs";
import {
  buildTypedEmbeddingIndex,
} from "../retrieval/embedding-index-v2.mjs";
import { createSchemaValidators } from "../validation/public-schemas.mjs";

async function build() {
  const config = await loadRuntimeConfig();
  const validators = await createSchemaValidators({ profile: config.outputProfile });
  const provider = new OpenAIProvider({
    apiKey: config.openai.apiKey,
    generationModel: config.openai.generationModel,
    embeddingModel: config.openai.embeddingModel,
    generationConfig: config.generation,
  });
  if (config.output_version === "0.2") {
    const release = await loadKnowledgeRelease(validators, config.outputProfile);
    for (const [knowledgeType, items, fileName] of [
      ["cross_case_pattern", release.crossCasePatterns, "cross-case-patterns.json"],
      ["case_design_card", release.designCards, "design-cards.json"],
    ]) {
      const filePath = path.join(
        paths.repositoryRoot,
        "outputs",
        "indexes",
        release.manifest.knowledge_release_id,
        fileName,
      );
      const result = await buildTypedEmbeddingIndex({
        release,
        knowledgeType,
        items,
        knowledgeSha256: release.fileHashes[knowledgeType],
        provider,
        runtimeConfig: config,
        filePath,
      });
      console.log(
        `Built ${result.index.model} ${knowledgeType} index with ${result.index.entries.length} items at ${result.index.dimensions} dimensions.`,
      );
    }
    return;
  }
  const snapshot = await loadKnowledgeSnapshot(validators);
  const result = await buildEmbeddingIndex(snapshot, provider, config);
  console.log(
    `Built ${result.index.model} index with ${result.index.entries.length} Knowledge Cards at ${result.index.dimensions} dimensions.`,
  );
}

build().catch((error) => {
  console.error(`Index build failed: ${error.message}`);
  process.exitCode = 1;
});

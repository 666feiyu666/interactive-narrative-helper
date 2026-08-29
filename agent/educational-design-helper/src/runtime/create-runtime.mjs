import { loadRuntimeConfig } from "../config/load-config.mjs";
import { loadOutputProfiles, resolveOutputProfile } from "../config/output-profiles.mjs";
import { loadKnowledgeSnapshot } from "../knowledge/load-snapshot.mjs";
import { loadKnowledgeRelease } from "../knowledge/load-release.mjs";
import { OpenAIProvider } from "../model/openai-provider.mjs";
import { ensureEmbeddingIndex } from "../retrieval/embedding-index.mjs";
import { ensureTypedEmbeddingIndexes } from "../retrieval/embedding-index-v2.mjs";
import { createDesignAdvisor } from "../harness/design-advisor.mjs";
import { createCompactDesignAdvisor } from "../harness/compact-design-advisor.mjs";
import { loadReferenceCatalog } from "../references/reference-catalog.mjs";
import { createSchemaValidators } from "../validation/public-schemas.mjs";

export async function createRuntime({
  config = null,
  provider = null,
  indexRoot = null,
  runOutputRoot = null,
} = {}) {
  const runtimeConfig = config ?? (await loadRuntimeConfig());
  const outputVersion = runtimeConfig.output_version ?? "0.1";
  const outputProfile =
    runtimeConfig.outputProfile ??
    resolveOutputProfile(await loadOutputProfiles(), outputVersion);
  if (outputProfile.outputVersion !== outputVersion) {
    throw new Error(
      `Runtime output version ${outputVersion} does not match profile ${outputProfile.outputVersion}.`,
    );
  }
  const validators = await createSchemaValidators({ profile: outputProfile });
  const activeProvider =
    provider ??
    new OpenAIProvider({
      apiKey: runtimeConfig.openai.apiKey,
      generationModel: runtimeConfig.openai.generationModel,
      embeddingModel: runtimeConfig.openai.embeddingModel,
      generationConfig: runtimeConfig.generation,
    });

  if (outputVersion === "0.2") {
    const release = await loadKnowledgeRelease(validators, outputProfile);
    const referenceCatalog = await loadReferenceCatalog(validators, release);
    const indexes = await ensureTypedEmbeddingIndexes(release, activeProvider, runtimeConfig, {
      indexRoot,
    });
    const runDesign = createCompactDesignAdvisor({
      release,
      indexes,
      provider: activeProvider,
      runtimeConfig: { ...runtimeConfig, outputProfile },
      validators,
      referenceCatalog,
      ...(runOutputRoot ? { runOutputRoot } : {}),
    });
    return Object.freeze({
      outputVersion,
      outputProfile,
      config: runtimeConfig,
      validators,
      release,
      referenceCatalog,
      knowledgeSource: release,
      provider: activeProvider,
      indexes,
      runDesign,
    });
  }

  const snapshot = await loadKnowledgeSnapshot(validators);
  const indexResult = await ensureEmbeddingIndex(snapshot, activeProvider, runtimeConfig, {
    indexRoot,
  });
  const runDesign = createDesignAdvisor({
    snapshot,
    indexResult,
    provider: activeProvider,
    runtimeConfig,
    validators,
    ...(runOutputRoot ? { runOutputRoot } : {}),
  });

  return Object.freeze({
    outputVersion,
    outputProfile,
    config: runtimeConfig,
    validators,
    snapshot,
    knowledgeSource: snapshot,
    provider: activeProvider,
    indexResult,
    runDesign,
  });
}

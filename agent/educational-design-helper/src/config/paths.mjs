import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const componentRoot = path.resolve(currentDirectory, "../..");
export const repositoryRoot = path.resolve(componentRoot, "../..");

export const paths = Object.freeze({
  componentRoot,
  repositoryRoot,
  envFile: path.join(repositoryRoot, ".env"),
  modelRuntimeConfig: path.join(componentRoot, "config", "model-runtime-v1.json"),
  outputProfilesConfig: path.join(componentRoot, "config", "output-profiles-v1.json"),
  prompt: path.join(componentRoot, "prompts", "design-advisor-v1.md"),
  requestSchema: path.join(componentRoot, "schemas", "design-request.schema.json"),
  responseSchema: path.join(componentRoot, "schemas", "design-response.schema.json"),
  runTraceSchema: path.join(componentRoot, "schemas", "run-trace.schema.json"),
  knowledgeCardSchema: path.join(repositoryRoot, "corpus", "schemas", "knowledge-card.schema.json"),
  knowledgeSnapshotSchema: path.join(repositoryRoot, "corpus", "schemas", "knowledge-snapshot.schema.json"),
  knowledgeItemSchema: path.join(repositoryRoot, "corpus", "schemas", "track-a-knowledge-item.schema.json"),
  knowledgeReleaseSchema: path.join(repositoryRoot, "corpus", "schemas", "track-a-knowledge-release.schema.json"),
  referenceCatalogSchema: path.join(componentRoot, "schemas", "reference-catalog-v1.schema.json"),
  referenceCatalog: path.join(componentRoot, "config", "reference-catalog-v1.json"),
  snapshotDirectory: path.join(
    repositoryRoot,
    "corpus",
    "derived-knowledge",
    "track-a-itchio-v1.1-knowledge-v1",
  ),
  embeddingIndex: path.join(
    repositoryRoot,
    "outputs",
    "indexes",
    "track-a-itchio-v1.1-knowledge-v1",
    "index.json",
  ),
  runOutputRoot: path.join(repositoryRoot, "outputs", "agent-runs"),
  webRoot: path.join(componentRoot, "web"),
});

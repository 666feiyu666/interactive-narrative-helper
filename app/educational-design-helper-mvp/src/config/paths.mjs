import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const componentRoot = path.resolve(currentDirectory, "../..");
export const repositoryRoot = path.resolve(componentRoot, "../..");

export const paths = Object.freeze({
  componentRoot,
  repositoryRoot,
  envFile: path.join(componentRoot, ".env"),
  runtimeConfig: path.join(componentRoot, "config", "runtime.json"),
  prompt: path.join(componentRoot, "prompts", "design-advisor.md"),
  requestSchema: path.join(componentRoot, "schemas", "design-request.schema.json"),
  responseSchema: path.join(componentRoot, "schemas", "design-response.schema.json"),
  runTraceSchema: path.join(componentRoot, "schemas", "run-trace.schema.json"),
  demoItemSchema: path.join(componentRoot, "schemas", "demo-item.schema.json"),
  demoDataSchema: path.join(componentRoot, "schemas", "demo-data.schema.json"),
  referenceCatalogSchema: path.join(componentRoot, "schemas", "reference-catalog.schema.json"),
  demoDataDirectory: path.join(componentRoot, "demo-data"),
  referenceCatalog: path.join(componentRoot, "demo-data", "reference-catalog.json"),
  indexRoot: path.join(repositoryRoot, "outputs", "app", "educational-design-helper-mvp", "indexes"),
  runOutputRoot: path.join(repositoryRoot, "outputs", "app", "educational-design-helper-mvp", "runs"),
  webRoot: path.join(componentRoot, "web"),
});

import { readFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "./paths.mjs";

const supportedVersions = new Set(["0.1", "0.2"]);

export async function loadOutputProfiles() {
  const registry = JSON.parse(await readFile(paths.outputProfilesConfig, "utf8"));
  if (registry.schema_version !== "track-a-output-profiles/v1") {
    throw new Error(`Unsupported output-profile registry ${registry.schema_version}.`);
  }
  if (!supportedVersions.has(registry.default_output_version)) {
    throw new Error(`Unsupported default output version ${registry.default_output_version}.`);
  }
  for (const version of supportedVersions) {
    const profile = registry.profiles?.[version];
    if (!profile) throw new Error(`Missing output profile ${version}.`);
    if (!profile.helper_version || !profile.prompt_version || !profile.knowledge_id) {
      throw new Error(`Output profile ${version} is incomplete.`);
    }
  }
  return Object.freeze(registry);
}

export function resolveOutputProfile(registry, outputVersion) {
  if (!supportedVersions.has(outputVersion)) {
    throw new Error(`TRACK_A_OUTPUT_VERSION must be 0.1 or 0.2, got ${outputVersion}.`);
  }
  const profile = registry.profiles[outputVersion];
  const resolveComponent = (relativePath) => path.join(paths.componentRoot, relativePath);
  return Object.freeze({
    outputVersion,
    helperVersion: profile.helper_version,
    promptVersion: profile.prompt_version,
    knowledgeKind: profile.knowledge_kind,
    knowledgeId: profile.knowledge_id,
    requestSchema: resolveComponent(profile.request_schema),
    responseSchema: resolveComponent(profile.response_schema),
    runTraceSchema: resolveComponent(profile.run_trace_schema),
    prompt: resolveComponent(profile.prompt),
    knowledgeDirectory: path.join(
      paths.repositoryRoot,
      "corpus",
      "derived-knowledge",
      profile.knowledge_id,
    ),
  });
}

export function listSupportedOutputVersions() {
  return [...supportedVersions];
}

import { access, readFile } from "node:fs/promises";
import process from "node:process";

import { paths } from "./paths.mjs";
import { loadOutputProfiles, resolveOutputProfile } from "./output-profiles.mjs";

async function loadRootEnvironment() {
  try {
    await access(paths.envFile);
    process.loadEnvFile(paths.envFile);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function loadRuntimeConfig({ requireApiKey = true } = {}) {
  await loadRootEnvironment();
  const defaults = JSON.parse(await readFile(paths.modelRuntimeConfig, "utf8"));
  const outputProfiles = await loadOutputProfiles();
  const outputVersion =
    process.env.TRACK_A_OUTPUT_VERSION?.trim() ||
    defaults.output_version ||
    outputProfiles.default_output_version;
  const outputProfile = resolveOutputProfile(outputProfiles, outputVersion);
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const generationModel = process.env.OPENAI_GENERATION_MODEL?.trim() || "gpt-5.6-luna";
  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

  if (requireApiKey && !apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to the ignored repository-root .env file before starting the server.",
    );
  }

  return Object.freeze({
    ...defaults,
    output_version: outputVersion,
    outputProfile,
    openai: Object.freeze({
      apiKey,
      generationModel,
      embeddingModel,
    }),
  });
}

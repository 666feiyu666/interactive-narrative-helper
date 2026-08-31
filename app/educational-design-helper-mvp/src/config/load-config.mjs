import { access, readFile } from "node:fs/promises";
import process from "node:process";

import { paths } from "./paths.mjs";

async function loadAppEnvironment() {
  try {
    await access(paths.envFile);
    process.loadEnvFile(paths.envFile);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function loadRuntimeConfig({ requireApiKey = true } = {}) {
  await loadAppEnvironment();
  const defaults = JSON.parse(await readFile(paths.runtimeConfig, "utf8"));
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const generationModel = process.env.OPENAI_GENERATION_MODEL?.trim() || "gpt-5.6-luna";
  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  const saveRuns = process.env.SAVE_RUNS?.trim() === "1" || defaults.save_runs === true;

  if (requireApiKey && !apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to the ignored app-local .env file before starting live mode.",
    );
  }

  return Object.freeze({
    ...defaults,
    save_runs: saveRuns,
    openai: Object.freeze({ apiKey, generationModel, embeddingModel }),
  });
}

import { access, readFile } from "node:fs/promises";
import process from "node:process";

import { paths } from "./paths.mjs";

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
    openai: Object.freeze({
      apiKey,
      generationModel,
      embeddingModel,
    }),
  });
}

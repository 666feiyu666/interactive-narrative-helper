import { readFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { assertSchema } from "../validation/public-schemas.mjs";
import { sha256 } from "../utils/hash.mjs";

export async function loadKnowledgeSnapshot(validators) {
  const manifestPath = path.join(paths.snapshotDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assertSchema("Knowledge snapshot manifest", validators.knowledgeSnapshot(manifest));

  if (manifest.model_facing !== true) {
    throw new Error(`Snapshot ${manifest.snapshot_id} is not approved for model-facing use.`);
  }

  const cardsPath = path.join(paths.snapshotDirectory, manifest.files.knowledge_cards);
  const cardBytes = await readFile(cardsPath);
  const actualHash = sha256(cardBytes);
  if (actualHash !== manifest.files.knowledge_cards_sha256) {
    throw new Error(
      `Knowledge Card hash mismatch: expected ${manifest.files.knowledge_cards_sha256}, got ${actualHash}.`,
    );
  }

  const cards = cardBytes
    .toString("utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON on Knowledge Card line ${index + 1}: ${error.message}`);
      }
    });

  if (cards.length !== manifest.counts.knowledge_cards) {
    throw new Error(
      `Knowledge Card count mismatch: expected ${manifest.counts.knowledge_cards}, got ${cards.length}.`,
    );
  }

  const byId = new Map();
  for (const card of cards) {
    assertSchema(`Knowledge Card ${card.knowledge_id ?? "unknown"}`, validators.knowledgeCard(card));
    if (card.model_facing !== true) {
      throw new Error(`Knowledge Card ${card.knowledge_id} is not model-facing.`);
    }
    if (byId.has(card.knowledge_id)) {
      throw new Error(`Duplicate Knowledge Card ID ${card.knowledge_id}.`);
    }
    byId.set(card.knowledge_id, card);
  }

  return Object.freeze({
    manifest,
    cards,
    byId,
    cardsSha256: actualHash,
  });
}

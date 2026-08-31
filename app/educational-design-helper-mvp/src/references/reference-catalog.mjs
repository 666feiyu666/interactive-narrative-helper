import { readFile } from "node:fs/promises";

import { paths } from "../config/paths.mjs";
import { assertSchema } from "../validation/public-schemas.mjs";

export async function loadReferenceCatalog(validators, demoData) {
  const catalog = JSON.parse(await readFile(paths.referenceCatalog, "utf8"));
  assertSchema("Reference catalog", validators.referenceCatalog(catalog));
  if (catalog.reference_count !== catalog.references.length) {
    throw new Error("Reference catalog count does not match its entries.");
  }

  const byId = new Map();
  for (const reference of catalog.references) {
    if (byId.has(reference.knowledge_id)) {
      throw new Error(`Duplicate reference catalog ID ${reference.knowledge_id}.`);
    }
    byId.set(reference.knowledge_id, Object.freeze(structuredClone(reference)));
  }
  const designCardIds = new Set(demoData.designCards.map((card) => card.knowledge_id));
  for (const knowledgeId of designCardIds) {
    if (!byId.has(knowledgeId)) {
      throw new Error(`Reference catalog is missing ${knowledgeId}.`);
    }
  }
  for (const knowledgeId of byId.keys()) {
    if (!designCardIds.has(knowledgeId)) {
      throw new Error(`Reference catalog contains unknown design card ${knowledgeId}.`);
    }
  }

  return Object.freeze({
    ...catalog,
    references: Object.freeze([...byId.values()]),
    byId,
  });
}

export function resolveReferenceSelections(referenceSelections, referenceCatalog) {
  return referenceSelections.flatMap((selection) => {
    const reference = referenceCatalog.byId.get(selection.knowledge_id);
    if (!reference) return [];
    return [{ ...selection, ...reference }];
  });
}

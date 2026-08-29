import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

import { canonicalTrackAWorkbookPath } from "./track-a-workbook-path.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const annotationPath = path.join(
  repositoryRoot,
  "corpus",
  "annotations",
  "track-a-itchio-v1.1",
  "coding-annotations.ndjson",
);
const designCardPath = path.join(
  repositoryRoot,
  "corpus",
  "derived-knowledge",
  "track-a-educational-design-knowledge-v1",
  "design-cards.ndjson",
);
const outputPath = path.join(
  repositoryRoot,
  "agent",
  "educational-design-helper",
  "config",
  "reference-catalog-v1.json",
);

const dimensions = [
  "educational_purpose",
  "intended_audience",
  "application_setting",
  "interactive_narrative_form",
  "if_mechanics",
  "interaction_education_relationship",
];

function parseNdjson(text, label) {
  return text
    .split(/\r?\n/u)
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON in ${label} line ${index + 1}: ${error.message}`);
      }
    });
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function dimensionKnown(card, dimension) {
  if (dimension === "if_mechanics") return card.if_mechanics.length > 0;
  return ["explicit", "normalized"].includes(card[dimension].status);
}

const [workbookBytes, annotationBytes, designCardBytes] = await Promise.all([
  readFile(canonicalTrackAWorkbookPath),
  readFile(annotationPath),
  readFile(designCardPath),
]);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(canonicalTrackAWorkbookPath));
const cases = workbook.worksheets.getItem("cases");
const usedRange = cases.getUsedRange(true);
const values = usedRange.values;
const headers = values[0].map((value) => String(value ?? "").trim());
const column = Object.fromEntries(headers.map((header, index) => [header, index]));
for (const required of ["project_id", "title"]) {
  if (!Number.isInteger(column[required])) {
    throw new Error(`Canonical workbook cases sheet is missing ${required}.`);
  }
}
const titleByProject = new Map(
  values.slice(1).map((row) => [
    String(row[column.project_id] ?? "").trim(),
    String(row[column.title] ?? "").trim(),
  ]),
);

const annotations = parseNdjson(annotationBytes.toString("utf8"), "coding annotations");
const annotationByProject = new Map(annotations.map((item) => [item.project_id, item]));
const cards = parseNdjson(designCardBytes.toString("utf8"), "design cards");
const references = cards.map((card) => {
  const projectId = card.source_ids[0];
  const displayTitle = titleByProject.get(projectId);
  const annotation = annotationByProject.get(projectId);
  const publicUrl = annotation?.evidence?.source_url;
  if (!displayTitle) throw new Error(`Missing workbook title for ${projectId}.`);
  if (!/^https:\/\//u.test(publicUrl ?? "")) {
    throw new Error(`Missing public HTTPS URL for ${projectId}.`);
  }
  const knownDimensions = dimensions.filter((dimension) => dimensionKnown(card, dimension));
  const missingDimensions = dimensions.filter((dimension) => !dimensionKnown(card, dimension));
  return {
    knowledge_id: card.knowledge_id,
    project_id: projectId,
    display_title: displayTitle,
    platform: "itch.io",
    public_url: publicUrl,
    known_dimensions: knownDimensions,
    missing_dimensions: missingDimensions,
  };
});
references.sort((left, right) => left.knowledge_id.localeCompare(right.knowledge_id));

const catalog = {
  schema_version: "track-a-reference-catalog/v1",
  knowledge_release_id: "track-a-educational-design-knowledge-v1",
  source_workbook: "outputs/itchio-sheet/itchio-educational-if-candidates-v1.0.xlsx",
  source_sha256: {
    workbook: sha256(workbookBytes),
    coding_annotations: sha256(annotationBytes),
    design_cards: sha256(designCardBytes),
  },
  reference_count: references.length,
  references,
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output_path: outputPath, reference_count: references.length }));

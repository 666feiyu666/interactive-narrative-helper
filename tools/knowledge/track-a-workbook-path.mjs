import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");

export const canonicalTrackAWorkbookRelativePath =
  "outputs/itchio-sheet/itchio-educational-if-candidates-v1.0.xlsx";

export const canonicalTrackAWorkbookPath = path.join(
  repositoryRoot,
  ...canonicalTrackAWorkbookRelativePath.split("/"),
);

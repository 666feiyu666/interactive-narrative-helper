import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalTrackAWorkbookPath,
  canonicalTrackAWorkbookRelativePath,
} from "../../tools/knowledge/track-a-workbook-path.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("canonical Track A workbook path follows the stable output directory", () => {
  assert.equal(
    canonicalTrackAWorkbookRelativePath,
    "outputs/itchio-sheet/itchio-educational-if-candidates-v1.0.xlsx",
  );
  assert.equal(
    canonicalTrackAWorkbookPath,
    path.join(
      repositoryRoot,
      "outputs",
      "itchio-sheet",
      "itchio-educational-if-candidates-v1.0.xlsx",
    ),
  );
});

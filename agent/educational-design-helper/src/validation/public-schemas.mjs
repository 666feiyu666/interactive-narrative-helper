import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { paths } from "../config/paths.mjs";

function formatAjvErrors(errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || "/";
    return `${location} ${error.message ?? "is invalid"}`;
  });
}

export async function createSchemaValidators({ profile = null } = {}) {
  const schemaFiles = {
    request: profile?.requestSchema ?? paths.requestSchema,
    response: profile?.responseSchema ?? paths.responseSchema,
    trace: profile?.runTraceSchema ?? paths.runTraceSchema,
    knowledgeCard: paths.knowledgeCardSchema,
    knowledgeSnapshot: paths.knowledgeSnapshotSchema,
    knowledgeItem: paths.knowledgeItemSchema,
    knowledgeRelease: paths.knowledgeReleaseSchema,
    referenceCatalog: paths.referenceCatalogSchema,
  };

  const entries = await Promise.all(
    Object.entries(schemaFiles).map(async ([name, filePath]) => [
      name,
      JSON.parse(await readFile(filePath, "utf8")),
    ]),
  );

  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);

  return Object.fromEntries(
    entries.map(([name, schema]) => {
      const validate = ajv.compile(schema);
      return [
        name,
        (value) => {
          const valid = validate(value);
          return valid ? [] : formatAjvErrors(validate.errors);
        },
      ];
    }),
  );
}

export function assertSchema(name, errors) {
  if (errors.length === 0) return;
  throw new Error(`${name} failed schema validation: ${errors.join("; ")}`);
}

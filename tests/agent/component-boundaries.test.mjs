import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const agentRoot = path.join(repositoryRoot, "agent");

async function walkFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(path.join(directory, entry.name), relative)));
    } else {
      files.push(relative);
    }
  }
  return files;
}

test("every component-owned Agent file lives below one explicit Agent directory", async () => {
  const entries = await readdir(agentRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(directories, [
    "educational-design-helper",
    "narrative-technique-design-partner",
  ]);

  const files = await walkFiles(agentRoot);
  const unexpected = files.filter(
    (file) =>
      file !== "README.md" &&
      !file.startsWith("educational-design-helper/") &&
      !file.startsWith("narrative-technique-design-partner/"),
  );
  assert.deepEqual(unexpected, []);
});

test("active Track A and the preserved Track B boundaries declare local guidance", async () => {
  await access(path.join(agentRoot, "educational-design-helper", "AGENTS.md"));
  await access(path.join(agentRoot, "narrative-technique-design-partner", "AGENTS.md"));
  await access(
    path.join(
      agentRoot,
      "narrative-technique-design-partner",
      "techniques",
      "counterfactual",
      "AGENTS.md",
    ),
  );
});

test("the preserved Track B boundary contains no implementation scaffolding", async () => {
  const trackBRoot = path.join(agentRoot, "narrative-technique-design-partner");
  const entries = (await readdir(trackBRoot, {
    withFileTypes: true,
  })).map((entry) => entry.name).sort();
  assert.deepEqual(entries, ["AGENTS.md", "README.md", "techniques"]);

  const techniques = (await readdir(path.join(trackBRoot, "techniques"), {
    withFileTypes: true,
  })).map((entry) => entry.name).sort();
  assert.deepEqual(techniques, ["counterfactual"]);

  const counterfactualEntries = (await readdir(
    path.join(trackBRoot, "techniques", "counterfactual"),
    { withFileTypes: true },
  )).map((entry) => entry.name).sort();
  assert.deepEqual(counterfactualEntries, ["AGENTS.md", "README.md", "schemas"]);
});

test("Track B schema identifiers use the preserved boundary path", async () => {
  for (const filename of ["counterfactual-case.schema.json", "counterfactual-proposal.schema.json"]) {
    const schema = JSON.parse(
      await readFile(
        path.join(
          agentRoot,
          "narrative-technique-design-partner",
          "techniques",
          "counterfactual",
          "schemas",
          filename,
        ),
        "utf8",
      ),
    );
    assert.match(
      schema.$id,
      /agent\/narrative-technique-design-partner\/techniques\/counterfactual\/schemas\//,
    );
  }
});

test("Track A public schemas remain inside the Track A component", async () => {
  for (const filename of [
    "design-request.schema.json",
    "design-response.schema.json",
    "run-trace.schema.json",
  ]) {
    const schema = JSON.parse(
      await readFile(
        path.join(agentRoot, "educational-design-helper", "schemas", filename),
        "utf8",
      ),
    );
    assert.match(schema.$id, /agent\/educational-design-helper\/schemas\//);
  }
});

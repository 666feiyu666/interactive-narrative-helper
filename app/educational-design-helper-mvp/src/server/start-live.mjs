import { createRuntime } from "../runtime/create-runtime.mjs";
import { createHttpServer } from "./app.mjs";

async function start() {
  console.log("Loading display-only demo data and embedding indexes...");
  const runtime = await createRuntime();
  const rebuilt = Object.values(runtime.indexes).filter((result) => result.rebuilt);
  if (rebuilt.length > 0) {
    console.log(`Built ${rebuilt.length} demo-data indexes.`);
  }

  const server = createHttpServer(runtime);
  server.listen(runtime.config.server.port, runtime.config.server.host, () => {
    console.log(
      `Educational Design Helper live display is ready at http://${runtime.config.server.host}:${runtime.config.server.port}`,
    );
  });
}

start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});

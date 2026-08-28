import { createRuntime } from "../runtime/create-runtime.mjs";
import { createHttpServer } from "./app.mjs";

async function start() {
  console.log("Loading approved Track A knowledge and embedding index...");
  const runtime = await createRuntime();
  if (runtime.indexResult.rebuilt) {
    console.log(`Built a new ${runtime.indexResult.index.model} index for ${runtime.snapshot.cards.length} cards.`);
  }

  const server = createHttpServer(runtime);
  server.listen(runtime.config.server.port, runtime.config.server.host, () => {
    console.log(
      `Educational Design Helper is ready at http://${runtime.config.server.host}:${runtime.config.server.port}`,
    );
  });
}

start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { DesignRunError } from "../harness/design-advisor.mjs";
import { createDesignRequest } from "../harness/request.mjs";
import { toModelFacingKnowledgeItem } from "../knowledge/model-facing.mjs";
import { assertSchema } from "../validation/public-schemas.mjs";

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/export-format.js", ["export-format.js", "text/javascript; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
]);

function applySecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
}

function sendJson(response, statusCode, value) {
  applySecurityHeaders(response);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(value)}\n`);
}

async function readJsonBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

async function sendStatic(response, fileName, contentType) {
  const bytes = await readFile(path.join(paths.webRoot, fileName));
  applySecurityHeaders(response);
  response.writeHead(200, { "Content-Type": contentType });
  response.end(bytes);
}

export function createHttpServer(runtime) {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, {
          status: "ready",
          mode: "display_mvp",
          demo_items: runtime.demoData.byId.size,
          index_model: runtime.indexes.case_design_card.index.model,
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/meta") {
        sendJson(response, 200, {
          title: "Educational Interactive Narrative Design Helper — Display MVP",
          artifact_status: "display_only",
          research_status: "not_validated",
          demo_counts: Object.fromEntries(
            Object.entries(runtime.demoData.manifest.files).map(([key, value]) => [
              key,
              value.count,
            ]),
          ),
          generation_model: runtime.config.openai.generationModel,
          embedding_model: runtime.config.openai.embeddingModel,
          limitations: runtime.demoData.manifest.limitations,
        });
        return;
      }

      if (request.method === "GET" && url.pathname.startsWith("/api/knowledge/")) {
        const knowledgeId = decodeURIComponent(url.pathname.slice("/api/knowledge/".length));
        if (!/^[a-z][a-z0-9_-]*$/u.test(knowledgeId)) {
          sendJson(response, 400, { error: "Invalid demo item ID." });
          return;
        }
        const item = runtime.demoData.byId.get(knowledgeId);
        if (!item) {
          sendJson(response, 404, { error: "Demo item not found." });
          return;
        }
        sendJson(response, 200, toModelFacingKnowledgeItem(item));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/design") {
        const body = await readJsonBody(
          request,
          runtime.config.server?.max_request_bytes ?? 20_000,
        );
        const designRequest = createDesignRequest(body.message);
        assertSchema("Design request", runtime.validators.request(designRequest));
        sendJson(response, 200, await runtime.runDesign(designRequest));
        return;
      }

      const staticFile = staticFiles.get(url.pathname);
      if (request.method === "GET" && staticFile) {
        await sendStatic(response, staticFile[0], staticFile[1]);
        return;
      }

      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      const isDesignRunError = error instanceof DesignRunError;
      const isInputError =
        !isDesignRunError &&
        /must|enter|invalid|too large|4,000|valid JSON|请输入|不能超过/iu.test(error.message ?? "");
      sendJson(response, isInputError ? 400 : 500, {
        error: isDesignRunError
          ? "The display run could not be completed. Enable SAVE_RUNS=1 to retain a local trace."
          : error.message,
        run_id: error.runId ?? null,
      });
    }
  });
}

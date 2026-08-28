import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { paths } from "../config/paths.mjs";
import { createDesignRequest } from "../harness/request.mjs";
import { DesignRunError } from "../harness/design-advisor.mjs";
import { toModelFacingKnowledge } from "../knowledge/model-facing.mjs";
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
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text || "{}");
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
          snapshot_id: runtime.snapshot.manifest.snapshot_id,
          knowledge_cards: runtime.snapshot.cards.length,
          index_model: runtime.indexResult.index.model,
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/meta") {
        sendJson(response, 200, {
          title: "Educational Interactive Narrative Design Helper",
          snapshot_id: runtime.snapshot.manifest.snapshot_id,
          knowledge_cards: runtime.snapshot.cards.length,
          generation_model: runtime.config.openai.generationModel,
          embedding_model: runtime.config.openai.embeddingModel,
          human_double_coding_complete:
            runtime.snapshot.manifest.review.human_double_coding_complete,
          limitations: runtime.snapshot.manifest.limitations,
        });
        return;
      }

      if (request.method === "GET" && url.pathname.startsWith("/api/knowledge/")) {
        const knowledgeId = decodeURIComponent(url.pathname.slice("/api/knowledge/".length));
        if (!/^[a-z][a-z0-9_-]*$/u.test(knowledgeId)) {
          sendJson(response, 400, { error: "Invalid Knowledge Card ID." });
          return;
        }
        const card = runtime.snapshot.byId.get(knowledgeId);
        if (!card) {
          sendJson(response, 404, { error: "Knowledge Card not found." });
          return;
        }
        sendJson(response, 200, toModelFacingKnowledge(card));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/design") {
        const body = await readJsonBody(request, runtime.config.server.max_request_bytes);
        const requestObject = createDesignRequest(body.message, body.requested_direction_count ?? 3);
        assertSchema("Design request", runtime.validators.request(requestObject));
        const result = await runtime.runDesign(requestObject);
        sendJson(response, 200, result);
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
        /must|enter|invalid|too large|4,000|valid JSON/iu.test(error.message ?? "");
      sendJson(response, isInputError ? 400 : 500, {
        error: isDesignRunError
          ? "The design run could not be completed. Review the local run trace for details."
          : error.message,
        run_id: error.runId ?? null,
      });
    }
  });
}

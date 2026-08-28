#!/usr/bin/env node

import { appendFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launchBrowser, wait } from "./chrome-cdp.mjs";

export const IMPLEMENTATION_VERSION = "1.0.0";
export const MANIFEST_SCHEMA_VERSION = "itchio-public-text/v1.0";
export const SCHEMA_VERSION = "itchio-public-page-capture/v1.0";
export const PAGE_STRUCTURE_SCHEMA_VERSION = "itchio-page-structure/v1.0";
export const ACQUISITION_METHOD = "rendered-browser-page-bundle/v1.0";
export const DEFAULT_LISTING_URL =
  "https://itch.io/games/tag-educational/tag-interactive-fiction";
export const ROBOTS_URL = "https://itch.io/robots.txt";
export const TERMS_URL = "https://itch.io/docs/legal/terms";
export const API_URL = "https://itch.io/docs/api/overview";
export const USER_AGENT =
  `interactive-narrative-helper-research/${IMPLEMENTATION_VERSION} ` +
  "(+https://github.com/666feiyu666/interactive-narrative-helper)";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const defaultManifestPath = path.join(
  repositoryRoot,
  "corpus",
  "catalog",
  "itchio-public-text",
  "manifest.json",
);
const restrictedRoot = path.join(
  repositoryRoot,
  "corpus",
  "restricted-sources",
  "itchio-public-text",
);
const defaultProfileDirectory = path.join(restrictedRoot, "browser-profile");

const booleanOptions = new Set([
  "confirm-policy-review",
  "dry-run",
  "replace-manifest",
  "resume",
]);

function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

function assertWithin(childPath, parentPath, label) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must remain under ${parentPath}`);
  }
}

export function normalizeProjectUrl(input) {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  if (
    url.protocol !== "https:" ||
    host === "itch.io" ||
    !host.endsWith(".itch.io") ||
    segments.length !== 1 ||
    url.username ||
    url.password
  ) {
    throw new Error(`Not a public itch.io project URL: ${input}`);
  }
  url.hash = "";
  url.search = "";
  url.pathname = `/${segments[0]}`;
  return url.href.replace(/\/$/, "");
}

function validateListingUrl(input) {
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "itch.io" ||
    !url.pathname.startsWith("/games")
  ) {
    throw new Error(`Not an itch.io games listing URL: ${input}`);
  }
  return url.href;
}

export function isAccessChallenge(title, text) {
  const sample = `${title ?? ""}\n${text ?? ""}`.toLowerCase();
  return [
    "just a moment",
    "verify you are human",
    "checking your browser",
    "enable javascript and cookies",
    "performing security verification",
  ].some((marker) => sample.includes(marker));
}

export function selectProjects(manifest, limit, startAt) {
  let projects = manifest.projects;
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error("Manifest must contain at least one project.");
  }
  if (startAt !== undefined) {
    const startIndex = projects.findIndex((project) => project.id === startAt);
    if (startIndex < 0) throw new Error(`--start-at project ID is not in the manifest: ${startAt}`);
    projects = projects.slice(startIndex);
  }
  if (limit === undefined) return projects;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("--limit must be a positive integer.");
  }
  return projects.slice(0, limit);
}

function validateManifest(manifest) {
  if (manifest.schema_version !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(`Unsupported manifest schema: ${manifest.schema_version}`);
  }
  const ids = new Set();
  const urls = new Set();
  for (const project of manifest.projects ?? []) {
    if (!project.id || ids.has(project.id)) throw new Error("Manifest project IDs must be unique.");
    const normalized = normalizeProjectUrl(project.url);
    if (normalized !== project.url || urls.has(normalized)) {
      throw new Error(`Manifest project URL is not canonical or is duplicated: ${project.url}`);
    }
    ids.add(project.id);
    urls.add(normalized);
  }
  if (manifest.project_count !== urls.size || urls.size === 0) {
    throw new Error("Manifest project_count does not match its unique project URLs.");
  }
}

function parseArguments(argv) {
  const args = [...argv];
  const command = args.shift();
  if (!command || !["discover", "capture"].includes(command)) {
    throw new Error("Usage: capture-visible-text.mjs <discover|capture> [options]");
  }
  const options = { command };
  while (args.length) {
    const token = args.shift();
    if (!token?.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (booleanOptions.has(key)) options[key] = true;
    else {
      const value = args.shift();
      if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
      options[key] = value;
    }
  }
  return options;
}

function numericOption(options, key, fallback) {
  if (options[key] === undefined) return fallback;
  const value = Number(options[key]);
  if (!Number.isFinite(value)) throw new Error(`--${key} must be numeric.`);
  return value;
}

async function policySnapshot(confirmPolicyReview) {
  if (!confirmPolicyReview) {
    throw new Error("Network execution requires --confirm-policy-review.");
  }
  const response = await fetch(ROBOTS_URL, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/plain" },
  });
  if (!response.ok) throw new Error(`robots.txt returned HTTP ${response.status}`);
  const robotsText = await response.text();
  return {
    reviewed_at_utc: utcNow(),
    robots_url: ROBOTS_URL,
    robots_sha256: sha256(robotsText),
    terms_url: TERMS_URL,
    api_overview_url: API_URL,
    confirmation:
      "Researcher confirmed current robots, terms, access, load, rights, and retention review.",
  };
}

function listingExpression() {
  return `(() => {
    const text = document.body?.innerText || "";
    const cards = [...document.querySelectorAll(".game_cell")];
    const projects = cards.map((card, index) => {
      const link = card.querySelector("a.title");
      return link ? {
        url: link.href,
        title: (link.innerText || link.textContent || "").trim(),
        position: index + 1
      } : null;
    }).filter(Boolean);
    const next = [...document.querySelectorAll("a")].find((link) =>
      (link.innerText || "").trim().toLowerCase() === "next page"
    );
    const countMatch = text.match(/\\(([\\d,]+) results?\\)/i);
    return {
      title: document.title,
      text,
      projects,
      next_url: next?.href || null,
      reported_result_count: countMatch ? Number(countMatch[1].replace(/,/g, "")) : null
    };
  })()`;
}

function projectExpression() {
  return `(() => {
    const excludedSelector = ".game_comments_widget";
    const textOf = (element) =>
      (element?.innerText || element?.textContent || "").replace(/\\s+/g, " ").trim();
    const isExcluded = (element) => Boolean(element.closest(excludedSelector));
    const classesOf = (element) =>
      typeof element.className === "string" ? element.className.split(/\\s+/).filter(Boolean) : [];
    const linkOf = (link) => ({
      text: textOf(link),
      href: link.href || null,
      rel: link.rel || null,
      target: link.target || null,
      classes: classesOf(link)
    });
    const visible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    };

    let text = document.body?.innerText || "";
    for (const region of document.querySelectorAll(excludedSelector)) {
      const commentText = region.innerText || "";
      if (commentText) text = text.replace(commentText, "");
    }

    const meta = [...document.querySelectorAll("meta[content]")].map((element) => ({
      name: element.getAttribute("name"),
      property: element.getAttribute("property"),
      itemprop: element.getAttribute("itemprop"),
      http_equiv: element.getAttribute("http-equiv"),
      content: element.getAttribute("content")
    })).filter((item) => item.name || item.property || item.itemprop || item.http_equiv);

    const structuredData = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((element, index) => {
        const raw = element.textContent || "";
        try {
          return { index, status: "parsed", data: JSON.parse(raw) };
        } catch {
          return { index, status: "invalid_json", raw };
        }
      });

    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter((element) => !isExcluded(element))
      .map((element, index) => ({
        index,
        level: Number(element.tagName.slice(1)),
        text: textOf(element),
        id: element.id || null,
        classes: classesOf(element),
        visible: visible(element)
      }));

    const tables = [...document.querySelectorAll("table")]
      .filter((element) => !isExcluded(element))
      .map((table, tableIndex) => ({
        index: tableIndex,
        id: table.id || null,
        classes: classesOf(table),
        visible: visible(table),
        rows: [...table.querySelectorAll("tr")].map((row, rowIndex) => {
          const cells = [...row.children]
            .filter((cell) => ["TH", "TD"].includes(cell.tagName))
            .map((cell) => ({
              tag: cell.tagName.toLowerCase(),
              text: textOf(cell),
              links: [...cell.querySelectorAll("a[href]")].map(linkOf)
            }));
          return {
            index: rowIndex,
            label: cells[0]?.text || null,
            value: cells.slice(1).map((cell) => cell.text).filter(Boolean).join(" | ") || null,
            cells
          };
        })
      }));

    const domBreadcrumbs = [...document.querySelectorAll(".breadcrumbs a[href], .game_footer a[href]")]
      .map(linkOf);
    const breadcrumbData = structuredData.find((item) =>
      item.status === "parsed" && item.data?.["@type"] === "BreadcrumbList"
    )?.data;
    const dataBreadcrumbs = (breadcrumbData?.itemListElement || [])
      .slice()
      .sort((left, right) => (left.position || 0) - (right.position || 0))
      .map((item) => ({
        text: item.item?.name || null,
        href: item.item?.["@id"] || null,
        rel: null,
        target: null,
        classes: []
      }));
    const breadcrumbs = domBreadcrumbs.length ? domBreadcrumbs : dataBreadcrumbs;

    const links = [...document.querySelectorAll("a[href]")]
      .filter((element) => !isExcluded(element))
      .map((element, index) => ({ index, ...linkOf(element), visible: visible(element) }));

    const mediaReferences = [...document.querySelectorAll("img,video,audio,iframe")]
      .filter((element) => !isExcluded(element))
      .map((element, index) => ({
        index,
        tag: element.tagName.toLowerCase(),
        src: element.getAttribute("src") || element.getAttribute("data-lazy_src") || null,
        alt: element.getAttribute("alt"),
        title: element.getAttribute("title"),
        classes: classesOf(element)
      }));

    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll(".game_comments_widget, form, iframe, script:not([type='application/ld+json'])")
      .forEach((element) => element.remove());
    clone.querySelectorAll("*").forEach((element) => {
      for (const attribute of [...element.attributes]) {
        if (attribute.name.toLowerCase().startsWith("on") || attribute.name.toLowerCase() === "nonce") {
          element.removeAttribute(attribute.name);
        }
      }
    });

    return {
      title: document.title || "",
      final_url: location.href,
      canonical_url: document.querySelector('link[rel="canonical"]')?.href || null,
      text,
      rendered_html: "<!doctype html>\\n" + clone.outerHTML + "\\n",
      structure: {
        schema_version: "${PAGE_STRUCTURE_SCHEMA_VERSION}",
        document: {
          title: document.title || "",
          language: document.documentElement.lang || null,
          final_url: location.href,
          canonical_url: document.querySelector('link[rel="canonical"]')?.href || null
        },
        excluded_regions: [excludedSelector, "form", "iframe", "executable scripts"],
        meta,
        structured_data: structuredData,
        headings,
        breadcrumbs,
        tables,
        links,
        media_references: mediaReferences
      }
    };
  })()`;
}

export function validatePageStructure(structure) {
  if (structure?.schema_version !== PAGE_STRUCTURE_SCHEMA_VERSION) {
    throw new Error("Page structure has an unsupported schema version.");
  }
  if (!structure.document?.title || !structure.document?.final_url) {
    throw new Error("Page structure must identify its rendered document.");
  }
  for (const key of [
    "meta",
    "structured_data",
    "headings",
    "breadcrumbs",
    "tables",
    "links",
    "media_references",
  ]) {
    if (!Array.isArray(structure[key])) {
      throw new Error(`Page structure field must be an array: ${key}`);
    }
  }
  return structure;
}

async function runDiscovery(options) {
  const listingUrl = validateListingUrl(options["listing-url"] ?? DEFAULT_LISTING_URL);
  const manifestPath = path.resolve(options.manifest ?? defaultManifestPath);
  const profileDirectory = path.resolve(options["profile-dir"] ?? defaultProfileDirectory);
  const delaySeconds = numericOption(options, "delay-seconds", 5);
  if (delaySeconds < 5) throw new Error("--delay-seconds must be at least 5.");
  assertWithin(profileDirectory, restrictedRoot, "Browser profile");
  if ((await pathExists(manifestPath)) && !options["replace-manifest"]) {
    throw new Error(`Manifest already exists; pass --replace-manifest to replace it: ${manifestPath}`);
  }
  const policy = await policySnapshot(options["confirm-policy-review"]);
  await mkdir(profileDirectory, { recursive: true });
  const browser = await launchBrowser({
    executablePath: options["chrome-path"],
    profileDirectory,
  });
  const discovered = [];
  const seenProjects = new Set();
  const seenListings = new Set();
  let pageUrl = listingUrl;
  let pageNumber = 1;
  let reportedResultCount = null;

  try {
    while (pageUrl) {
      if (seenListings.has(pageUrl)) throw new Error(`Pagination loop detected at ${pageUrl}`);
      seenListings.add(pageUrl);
      if (pageNumber > 1) await wait(delaySeconds * 1_000);
      await browser.page.navigate(pageUrl);
      const snapshot = await browser.page.evaluate(listingExpression());
      if (isAccessChallenge(snapshot.title, snapshot.text)) {
        throw new Error(`Access challenge detected on listing page ${pageNumber}.`);
      }
      if (!snapshot.projects.length) {
        throw new Error(`No project cards found on listing page ${pageNumber}.`);
      }
      reportedResultCount ??= snapshot.reported_result_count;
      for (const project of snapshot.projects) {
        let normalized;
        try {
          normalized = normalizeProjectUrl(project.url);
        } catch {
          continue;
        }
        if (seenProjects.has(normalized)) continue;
        seenProjects.add(normalized);
        discovered.push({
          id: `itchio-${String(discovered.length + 1).padStart(4, "0")}`,
          url: normalized,
          title_at_listing: project.title,
          listing_page: pageNumber,
          listing_position: project.position,
        });
      }
      pageUrl = snapshot.next_url ? validateListingUrl(snapshot.next_url) : null;
      pageNumber += 1;
    }
  } finally {
    await browser.close();
  }

  if (reportedResultCount !== null && reportedResultCount !== discovered.length) {
    throw new Error(
      `Listing reported ${reportedResultCount} results but discovery found ${discovered.length}; manifest not written.`,
    );
  }
  const manifest = {
    schema_version: MANIFEST_SCHEMA_VERSION,
    manifest_id: `itchio-public-text-${new Date().toISOString().slice(0, 10)}`,
    generated_at_utc: utcNow(),
    source_listing_url: listingUrl,
    reported_result_count: reportedResultCount,
    project_count: discovered.length,
    acquisition_method: "rendered-browser-project-manifest",
    policy_review: policy,
    projects: discovered,
  };
  validateManifest(manifest);
  await writeJson(manifestPath, manifest);
  console.log(JSON.stringify({ manifest: manifestPath, project_count: discovered.length }, null, 2));
}

async function readCapture(capturePath) {
  try {
    return JSON.parse(await readFile(capturePath, "utf8"));
  } catch {
    return null;
  }
}

function countStatuses(items) {
  const counts = {};
  for (const item of Object.values(items)) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}

async function runCapture(options) {
  const manifestPath = path.resolve(options.manifest ?? defaultManifestPath);
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  validateManifest(manifest);
  const limitValue = options.limit === undefined ? undefined : Number(options.limit);
  const projects = selectProjects(manifest, limitValue, options["start-at"]);
  if (options["dry-run"]) {
    console.log(JSON.stringify({
      mode: "dry-run",
      manifest_project_count: manifest.project_count,
      selected_project_count: projects.length,
      first_project: projects[0],
      last_project: projects.at(-1),
      network_requests: 0,
    }, null, 2));
    return;
  }

  const delaySeconds = numericOption(options, "delay-seconds", 5);
  if (delaySeconds < 5) throw new Error("--delay-seconds must be at least 5.");
  const runId = options["run-id"] ?? `itchio-page-bundle-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error("--run-id contains unsafe characters.");
  const outputRoot = path.resolve(options["output-root"] ?? restrictedRoot);
  const profileDirectory = path.resolve(options["profile-dir"] ?? defaultProfileDirectory);
  assertWithin(outputRoot, restrictedRoot, "Capture output");
  assertWithin(profileDirectory, restrictedRoot, "Browser profile");
  const runDirectory = path.join(outputRoot, "runs", runId);
  const statePath = path.join(runDirectory, "run.json");
  const eventsPath = path.join(runDirectory, "events.jsonl");
  const runExists = await pathExists(runDirectory);
  if (runExists && !options.resume) {
    throw new Error(`Run already exists; pass --resume to continue it: ${runId}`);
  }
  await mkdir(runDirectory, { recursive: true });
  await mkdir(profileDirectory, { recursive: true });
  const policy = await policySnapshot(options["confirm-policy-review"]);
  const manifestSha256 = sha256(manifestBytes);
  const previousState = runExists ? await readCapture(statePath) : null;
  if (previousState && previousState.manifest_sha256 !== manifestSha256) {
    throw new Error("Cannot resume: the manifest changed after this run started.");
  }
  const state = previousState ?? {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    started_at_utc: utcNow(),
    manifest_path: path.relative(repositoryRoot, manifestPath).replaceAll("\\", "/"),
    manifest_sha256: manifestSha256,
    manifest_project_count: manifest.project_count,
    acquisition_method: ACQUISITION_METHOD,
    items: {},
  };
  state.last_started_at_utc = utcNow();
  state.policy_review = policy;
  state.selected_project_count = projects.length;
  state.delay_seconds = delaySeconds;
  state.status = "running";
  await writeJson(statePath, state);

  const browser = await launchBrowser({
    executablePath: options["chrome-path"],
    profileDirectory,
  });
  let lastNavigationAt = 0;
  let challengeDetected = false;
  let processedThisInvocation = 0;

  try {
    for (const project of projects) {
      const projectDirectory = path.join(runDirectory, "projects", project.id);
      const capturePath = path.join(projectDirectory, "capture.json");
      const existing = await readCapture(capturePath);
      if (
        existing?.status === "success" &&
        existing.schema_version === SCHEMA_VERSION &&
        existing.text_file &&
        existing.structure_file &&
        existing.rendered_html_file &&
        await pathExists(path.join(projectDirectory, existing.text_file)) &&
        await pathExists(path.join(projectDirectory, existing.structure_file)) &&
        await pathExists(path.join(projectDirectory, existing.rendered_html_file))
      ) {
        state.items[project.id] = existing;
        continue;
      }
      const elapsed = Date.now() - lastNavigationAt;
      if (lastNavigationAt && elapsed < delaySeconds * 1_000) {
        await wait(delaySeconds * 1_000 - elapsed);
      }
      lastNavigationAt = Date.now();
      let capture;
      try {
        await browser.page.navigate(project.url);
        const snapshot = await browser.page.evaluate(projectExpression());
        const capturedAt = utcNow();
        if (isAccessChallenge(snapshot.title, snapshot.text)) {
          capture = {
            schema_version: SCHEMA_VERSION,
            project_id: project.id,
            source_url: project.url,
            final_url: snapshot.final_url,
            title: snapshot.title,
            captured_at_utc: capturedAt,
            status: "access_challenge",
            error: "Browser displayed a human-verification or anti-automation challenge.",
          };
          challengeDetected = true;
        } else {
          let finalUrl;
          try {
            finalUrl = normalizeProjectUrl(snapshot.final_url);
          } catch {
            capture = {
              schema_version: SCHEMA_VERSION,
              project_id: project.id,
              source_url: project.url,
              final_url: snapshot.final_url,
              title: snapshot.title,
              captured_at_utc: capturedAt,
              status: "redirected_out_of_scope",
              error: "Final browser URL is not a public itch.io project page.",
            };
          }
          if (!capture) {
            const text = String(snapshot.text ?? "").replace(/\r\n/g, "\n").trimEnd() + "\n";
            const renderedHtml = String(snapshot.rendered_html ?? "");
            if (!text.trim()) {
              capture = {
                schema_version: SCHEMA_VERSION,
                project_id: project.id,
                source_url: project.url,
                final_url: finalUrl,
                title: snapshot.title,
                captured_at_utc: capturedAt,
                status: "empty_text",
                error: "Rendered page body contained no visible text.",
              };
            } else if (!renderedHtml.trim()) {
              capture = {
                schema_version: SCHEMA_VERSION,
                project_id: project.id,
                source_url: project.url,
                final_url: finalUrl,
                title: snapshot.title,
                captured_at_utc: capturedAt,
                status: "empty_html",
                error: "Rendered page produced no HTML snapshot.",
              };
            } else {
              const structure = validatePageStructure(snapshot.structure);
              await mkdir(projectDirectory, { recursive: true });
              const textPath = path.join(projectDirectory, "raw-visible-text.txt");
              const structurePath = path.join(projectDirectory, "page-structure.json");
              const renderedHtmlPath = path.join(projectDirectory, "rendered-page.html");
              const structureJson = `${JSON.stringify(structure, null, 2)}\n`;
              await writeFile(textPath, text, "utf8");
              await writeFile(structurePath, structureJson, "utf8");
              await writeFile(renderedHtmlPath, renderedHtml, "utf8");
              capture = {
                schema_version: SCHEMA_VERSION,
                project_id: project.id,
                source_url: project.url,
                final_url: finalUrl,
                canonical_url: snapshot.canonical_url,
                title: snapshot.title,
                captured_at_utc: capturedAt,
                status: "success",
                method: ACQUISITION_METHOD,
                excluded_regions: [
                  ".game_comments_widget",
                  "form",
                  "iframe",
                  "executable scripts",
                ],
                text_file: "raw-visible-text.txt",
                text_sha256: sha256(text),
                text_bytes: Buffer.byteLength(text),
                text_characters: text.length,
                structure_file: "page-structure.json",
                structure_sha256: sha256(structureJson),
                structure_bytes: Buffer.byteLength(structureJson),
                rendered_html_file: "rendered-page.html",
                rendered_html_sha256: sha256(renderedHtml),
                rendered_html_bytes: Buffer.byteLength(renderedHtml),
              };
            }
          }
        }
      } catch (error) {
        capture = {
          schema_version: SCHEMA_VERSION,
          project_id: project.id,
          source_url: project.url,
          captured_at_utc: utcNow(),
          status: "browser_error",
          error: error.message,
        };
      }

      await writeJson(capturePath, capture);
      await appendFile(eventsPath, `${JSON.stringify(capture)}\n`, "utf8");
      state.items[project.id] = capture;
      state.status_counts = countStatuses(state.items);
      state.updated_at_utc = utcNow();
      await writeJson(statePath, state);
      processedThisInvocation += 1;
      console.log(`${project.id} ${capture.status} ${project.url}`);
      if (challengeDetected) break;
    }
  } finally {
    await browser.close();
    state.status_counts = countStatuses(state.items);
    state.updated_at_utc = utcNow();
    state.last_invocation_processed = processedThisInvocation;
    state.status = challengeDetected
      ? "stopped_access_challenge"
      : Object.values(state.items).filter((item) => item.status === "success").length >= projects.length
        ? "selected_capture_complete"
        : "selected_capture_incomplete";
    await writeJson(statePath, state);
  }

  console.log(JSON.stringify({
    run_id: runId,
    run_directory: runDirectory,
    manifest_project_count: manifest.project_count,
    selected_project_count: projects.length,
    processed_this_invocation: processedThisInvocation,
    status: state.status,
    status_counts: state.status_counts,
  }, null, 2));
  if (challengeDetected) process.exitCode = 3;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.command === "discover") await runDiscovery(options);
  else await runCapture(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  });
}

#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { launchBrowser, wait } from "./chrome-cdp.mjs";

export const CLEANED_RECORD_SCHEMA_VERSION = "itchio-cleaned-project/v1.0";
export const CLEANING_RUN_SCHEMA_VERSION = "itchio-page-cleaning-run/v1.0";
export const CLEANING_SUMMARY_SCHEMA_VERSION = "itchio-page-cleaning-summary/v1.0";
export const SOURCE_CAPTURE_SCHEMA_VERSION = "itchio-public-page-capture/v1.0";
export const PARSER_VERSION = "1.0.0";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const manifestPath = path.join(
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

const booleanOptions = new Set(["dry-run", "resume"]);
const recognizedInfoLabels = new Map([
  ["Status", "status"],
  ["Genre", "genres"],
  ["Tags", "tags"],
  ["Author", "creators"],
  ["Authors", "creators"],
  ["Platforms", "platforms"],
  ["Made with", "made_with"],
  ["Rating", "rating"],
  ["Average session", "average_session"],
  ["Content", "content"],
  ["Languages", "languages"],
  ["Inputs", "inputs"],
  ["AI Disclosure", "ai_disclosure"],
  ["Accessibility", "accessibility"],
  ["Links", "links"],
  ["Release date", "release_date"],
  ["Asset license", "asset_license"],
  ["Code license", "code_license"],
  ["Published", "published"],
  ["Publisher", "publisher"],
  ["Updated", "updated"],
  ["Multiplayer", "multiplayer"],
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

async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, value, "utf8");
  await rename(temporaryPath, filePath);
}

async function writeJson(filePath, value) {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function removeTemporaryProfile(profilePath) {
  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(profilePath, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error.code)) throw error;
      await wait(250);
    }
  }
  throw new Error(`Temporary browser profile remained locked: ${lastError?.message ?? profilePath}`);
}

function assertWithin(childPath, parentPath, label) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must remain under ${parentPath}`);
  }
}

function safeIdentifier(value, optionName) {
  if (!value || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`${optionName} must contain only letters, numbers, dots, underscores, or hyphens.`);
  }
  return value;
}

export function normalizeText(value) {
  if (value === null || value === undefined) return "";
  const lines = String(value)
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[\t\f\v ]+/g, " ").trim());

  const normalized = [];
  for (const line of lines) {
    if (!line && normalized.at(-1) === "") continue;
    normalized.push(line);
  }
  return normalized.join("\n").trim();
}

export function normalizeKey(value) {
  return normalizeText(value)
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || null;
}

function parseArguments(argv) {
  const args = [...argv];
  const command = args.shift();
  if (command !== "clean") {
    throw new Error(
      "Usage: clean-page-bundles.mjs clean --source-run-id <id> --derivation-id <id> [options]",
    );
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

function numericOption(options, key) {
  if (options[key] === undefined) return undefined;
  const value = Number(options[key]);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--${key} must be a positive integer.`);
  }
  return value;
}

function selectProjects(projects, startAt, limit) {
  let selected = projects;
  if (startAt !== undefined) {
    const startIndex = selected.findIndex((project) => project.id === startAt);
    if (startIndex < 0) throw new Error(`Project ID is not in the manifest: ${startAt}`);
    selected = selected.slice(startIndex);
  }
  return limit === undefined ? selected : selected.slice(0, limit);
}

function extractionExpression() {
  return `(() => {
    const inline = (value) => String(value || "")
      .normalize("NFC")
      .replace(/\\u00a0/g, " ")
      .replace(/\\s+/g, " ")
      .trim();
    const multiline = (value) => {
      const lines = String(value || "")
        .normalize("NFC")
        .replace(/\\r\\n?/g, "\\n")
        .replace(/\\u00a0/g, " ")
        .split("\\n")
        .map((line) => line.replace(/[\\t\\f\\v ]+/g, " ").trim());
      const output = [];
      for (const line of lines) {
        if (!line && output[output.length - 1] === "") continue;
        output.push(line);
      }
      return output.join("\\n").trim();
    };
    const linkOf = (link) => ({
      text: inline(link.innerText || link.textContent),
      href: link.getAttribute("href") || null
    });

    const titleElement = document.querySelector(".game_title");
    const descriptionElement = document.querySelector(
      ".formatted_description.user_formatted, .formatted_description"
    );
    const descriptionText = descriptionElement
      ? multiline(descriptionElement.innerText || descriptionElement.textContent)
      : "";
    const descriptionLinks = descriptionElement
      ? [...descriptionElement.querySelectorAll("a[href]")].map(linkOf)
      : [];
    const imageAlts = descriptionElement
      ? [...descriptionElement.querySelectorAll("img[alt]")]
          .map((image) => inline(image.getAttribute("alt")))
          .filter(Boolean)
      : [];

    const infoPanel = document.querySelector(".game_info_panel_widget");
    const infoRows = infoPanel
      ? [...infoPanel.querySelectorAll("table tr")].map((row, index) => {
          const cells = [...row.children].filter((cell) => ["TD", "TH"].includes(cell.tagName));
          const valueCells = cells.slice(1);
          return {
            index,
            label: inline(cells[0]?.innerText || cells[0]?.textContent),
            value: inline(valueCells.map((cell) => cell.innerText || cell.textContent).join(" | ")),
            links: valueCells.flatMap((cell) => [...cell.querySelectorAll("a[href]")].map(linkOf)),
            abbr_titles: valueCells.flatMap((cell) =>
              [...cell.querySelectorAll("abbr[title]")]
                .map((element) => inline(element.getAttribute("title")))
                .filter(Boolean)
            )
          };
        }).filter((row) => row.label)
      : [];

    const metaValue = (selector) => document.querySelector(selector)?.getAttribute("content") || null;
    const structuredData = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((element) => {
        try { return JSON.parse(element.textContent || ""); }
        catch { return null; }
      })
      .filter(Boolean);
    const product = structuredData.find((item) => item?.["@type"] === "Product") || null;
    const breadcrumbs = [...document.querySelectorAll(".breadcrumbs a[href]")].map(linkOf);
    const viewPage = document.querySelector(".view_game_page");
    const headerBuyRow = document.querySelector(".header_buy_row");

    return {
      document_title: inline(document.title),
      page_ui_language: document.documentElement.lang || null,
      canonical_url: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || null,
      title: inline(titleElement?.innerText || titleElement?.textContent),
      meta: {
        description: metaValue('meta[name="description"]'),
        og_description: metaValue('meta[property="og:description"]'),
        itch_path: metaValue('meta[name="itch:path"]')
      },
      product,
      description: {
        element_present: Boolean(descriptionElement),
        text: descriptionText,
        links: descriptionLinks,
        image_alts: imageAlts
      },
      info_panel_present: Boolean(infoPanel),
      info_rows: infoRows,
      breadcrumbs,
      delivery: {
        view_classes: viewPage ? [...viewPage.classList] : [],
        header_text: inline(headerBuyRow?.innerText || headerBuyRow?.textContent),
        has_game_frame: Boolean(document.querySelector(".game_frame")),
        has_uploads: Boolean(document.querySelector(".uploads .upload"))
      }
    };
  })()`;
}

async function setDocumentContent(page, html) {
  const frameTree = await page.send("Page.getFrameTree");
  const frameId = frameTree?.frameTree?.frame?.id;
  if (!frameId) throw new Error("Browser did not expose a document frame.");
  await page.send("Page.setDocumentContent", { frameId, html });
  return page.evaluate(extractionExpression());
}

function findRow(rows, ...labels) {
  return rows.find((row) => labels.includes(row.label)) ?? null;
}

function rowValues(row) {
  if (!row) return [];
  const linked = row.links.map((link) => link.text).filter(Boolean);
  return [...new Set(linked.length ? linked : row.value ? [row.value] : [])];
}

function termsFromRow(row) {
  if (!row) return [];
  const links = row.links.filter((link) => link.text);
  if (links.length) {
    return links.map((link) => ({
      raw: link.text,
      normalized_key: normalizeKey(link.text),
      href: link.href,
    }));
  }
  return row.value
    ? [{ raw: row.value, normalized_key: normalizeKey(row.value), href: null }]
    : [];
}

function scalarFromRow(row) {
  if (!row?.value) return null;
  return { raw: row.value, normalized_key: normalizeKey(row.value) };
}

function datedValueFromRow(row) {
  if (!row) return null;
  const timestampTitle = row.abbr_titles[0] ?? null;
  const parseCandidate = timestampTitle?.replace(/\s+@\s+/, " ") ?? row.value;
  const milliseconds = Date.parse(parseCandidate);
  return {
    raw: row.value || null,
    timestamp_title: timestampTitle,
    iso_utc: Number.isNaN(milliseconds) ? null : new Date(milliseconds).toISOString(),
  };
}

function ratingFrom(extracted, ratingRow) {
  const productRating = extracted.product?.aggregateRating;
  const value = Number(productRating?.ratingValue);
  const count = Number(productRating?.ratingCount);
  if (Number.isFinite(value) && Number.isFinite(count)) {
    return { value, count, source: "jsonld:Product.aggregateRating" };
  }
  const match = ratingRow?.value?.match(/([0-9]+(?:\.[0-9]+)?).*?\(([0-9,]+)/);
  if (!match) return null;
  return {
    value: Number(match[1]),
    count: Number(match[2].replaceAll(",", "")),
    source: "info_table:Rating",
  };
}

function normalizedTitle(value) {
  return normalizeText(value).toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function qualityStatus(flags) {
  if (flags.some((flag) => flag.severity === "error")) return "error";
  if (flags.some((flag) => flag.severity === "warning")) return "review";
  return "ok";
}

export function buildCleanedRecord({
  manifestProject,
  capture,
  extracted,
  sourceRunId,
}) {
  const flags = [];
  const addFlag = (code, severity, field, message) => {
    flags.push({ code, severity, field, message });
  };

  const infoRows = extracted.info_rows ?? [];
  const unknownLabels = [...new Set(
    infoRows.map((row) => row.label).filter((label) => !recognizedInfoLabels.has(label)),
  )];
  for (const label of unknownLabels) {
    addFlag(
      "unmapped_info_label",
      "warning",
      "platform_metadata",
      `Information-panel label is not mapped: ${label}`,
    );
  }

  if (!extracted.info_panel_present) {
    addFlag("missing_info_panel", "error", "platform_metadata", "Information panel was not found.");
  }
  if (!extracted.title) {
    addFlag("missing_title", "error", "identity.title", "Page title element was not found.");
  }

  const metaDescription = normalizeText(extracted.meta?.description ?? extracted.meta?.og_description);
  const bodyDescription = normalizeText(extracted.description?.text);
  let descriptionStatus;
  let descriptionSource;
  let descriptionText;
  if (bodyDescription) {
    descriptionStatus = "present";
    descriptionSource = "dom:.formatted_description";
    descriptionText = bodyDescription;
    if (bodyDescription.length < 20) {
      addFlag(
        "description_very_short",
        "warning",
        "description",
        "Body description contains fewer than 20 characters and should be checked for completeness.",
      );
    }
  } else if (metaDescription) {
    descriptionStatus = "meta_only";
    descriptionSource = extracted.meta?.description ? "meta:description" : "meta:og:description";
    descriptionText = metaDescription;
    addFlag(
      "description_meta_only",
      "warning",
      "description",
      "No standard body description was present; meta description is retained as the only text.",
    );
  } else if (extracted.description?.element_present) {
    descriptionStatus = "empty";
    descriptionSource = "dom:.formatted_description";
    descriptionText = "";
    addFlag("description_empty", "warning", "description", "Description element contained no text.");
  } else {
    descriptionStatus = "missing";
    descriptionSource = null;
    descriptionText = "";
    addFlag("description_missing", "warning", "description", "No body or meta description was found.");
  }

  const titleAtListing = normalizeText(manifestProject.title_at_listing);
  const title = normalizeText(extracted.title);
  const productTitle = normalizeText(extracted.product?.name);
  if (title && titleAtListing && normalizedTitle(title) !== normalizedTitle(titleAtListing)) {
    addFlag(
      "listing_title_differs",
      "warning",
      "identity.title",
      "Page title differs from the title frozen in the discovery manifest.",
    );
  }
  if (title && productTitle && normalizedTitle(title) !== normalizedTitle(productTitle)) {
    addFlag(
      "product_title_differs",
      "warning",
      "identity.title",
      "Page title differs from JSON-LD Product.name.",
    );
  }

  const creatorRow = findRow(infoRows, "Author", "Authors");
  const creators = rowValues(creatorRow);
  if (!creators.length) {
    addFlag("missing_creator", "warning", "identity.creators", "Author information was not found.");
  }

  const statusRow = findRow(infoRows, "Status");
  const genreRow = findRow(infoRows, "Genre");
  const tagsRow = findRow(infoRows, "Tags");
  const platformsRow = findRow(infoRows, "Platforms");
  const madeWithRow = findRow(infoRows, "Made with");
  const languagesRow = findRow(infoRows, "Languages");
  const ratingRow = findRow(infoRows, "Rating");
  const deliveryModes = [];
  const viewClasses = extracted.delivery?.view_classes ?? [];
  if (
    viewClasses.includes("view_html_game_page") ||
    extracted.delivery?.has_game_frame ||
    /\b(run|play)\b/i.test(extracted.delivery?.header_text ?? "")
  ) {
    deliveryModes.push("browser");
  }
  if (
    viewClasses.includes("direct_download") ||
    extracted.delivery?.has_uploads ||
    /downloadable|download/i.test(extracted.delivery?.header_text ?? "")
  ) {
    deliveryModes.push("download");
  }

  const record = {
    schema_version: CLEANED_RECORD_SCHEMA_VERSION,
    parser_version: PARSER_VERSION,
    project_id: manifestProject.id,
    source: {
      source_run_id: sourceRunId,
      capture_schema_version: capture.schema_version,
      captured_at_utc: capture.captured_at_utc,
      source_url: capture.source_url,
      final_url: capture.final_url,
      canonical_url: extracted.canonical_url ?? capture.canonical_url ?? null,
      rendered_html_sha256: capture.rendered_html_sha256,
      structure_sha256: capture.structure_sha256,
    },
    identity: {
      title,
      title_at_listing: titleAtListing,
      document_title: normalizeText(extracted.document_title),
      product_title: productTitle || null,
      creators,
      page_ui_language: extracted.page_ui_language || null,
      itch_path: extracted.meta?.itch_path || null,
    },
    description: {
      status: descriptionStatus,
      source: descriptionSource,
      text_file: descriptionText ? "description-clean.txt" : null,
      sha256: descriptionText ? sha256(`${descriptionText}\n`) : null,
      characters: descriptionText.length,
      paragraph_count: descriptionText ? descriptionText.split(/\n{2,}/).length : 0,
      short_description: metaDescription || null,
      links: extracted.description?.links ?? [],
      image_alts: extracted.description?.image_alts ?? [],
    },
    platform_metadata: {
      status: scalarFromRow(statusRow),
      genres: termsFromRow(genreRow),
      tags: termsFromRow(tagsRow),
      platforms: termsFromRow(platformsRow),
      made_with: termsFromRow(madeWithRow),
      languages: termsFromRow(languagesRow),
      average_session: scalarFromRow(findRow(infoRows, "Average session")),
      inputs: termsFromRow(findRow(infoRows, "Inputs")),
      accessibility: termsFromRow(findRow(infoRows, "Accessibility")),
      ai_disclosure: termsFromRow(findRow(infoRows, "AI Disclosure")),
      content: scalarFromRow(findRow(infoRows, "Content")),
      rating: ratingFrom(extracted, ratingRow),
      release_date: datedValueFromRow(findRow(infoRows, "Release date")),
      published: datedValueFromRow(findRow(infoRows, "Published")),
      updated: datedValueFromRow(findRow(infoRows, "Updated")),
      publisher: scalarFromRow(findRow(infoRows, "Publisher")),
      asset_license: scalarFromRow(findRow(infoRows, "Asset license")),
      code_license: scalarFromRow(findRow(infoRows, "Code license")),
      multiplayer: scalarFromRow(findRow(infoRows, "Multiplayer")),
      links: findRow(infoRows, "Links")?.links ?? [],
      source_info_rows: infoRows,
    },
    delivery: {
      modes: [...new Set(deliveryModes)],
      header_text: extracted.delivery?.header_text || null,
      view_classes: viewClasses,
      has_game_frame: Boolean(extracted.delivery?.has_game_frame),
      has_uploads: Boolean(extracted.delivery?.has_uploads),
    },
    discovery_breadcrumbs: extracted.breadcrumbs ?? [],
    quality: {
      status: qualityStatus(flags),
      flags,
      unmapped_info_labels: unknownLabels,
    },
  };

  return { record, descriptionText };
}

export function validateCleanedRecord(record) {
  if (record?.schema_version !== CLEANED_RECORD_SCHEMA_VERSION) {
    throw new Error("Cleaned record has an unsupported schema version.");
  }
  if (!record.project_id || !record.source?.source_url || !record.source?.rendered_html_sha256) {
    throw new Error("Cleaned record must preserve its source identity and HTML hash.");
  }
  for (const key of ["creators"]) {
    if (!Array.isArray(record.identity?.[key])) throw new Error(`Identity field must be an array: ${key}`);
  }
  for (const key of ["genres", "tags", "platforms", "made_with", "languages"]) {
    if (!Array.isArray(record.platform_metadata?.[key])) {
      throw new Error(`Platform metadata field must be an array: ${key}`);
    }
  }
  if (!Array.isArray(record.quality?.flags)) throw new Error("Quality flags must be an array.");
  return record;
}

function increment(counts, key) {
  const normalized = key || "(missing)";
  counts[normalized] = (counts[normalized] ?? 0) + 1;
}

function coverageValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Boolean(value.raw ?? value.value ?? value.count);
  return value !== null && value !== undefined && value !== "";
}

export function buildSummary(records, metadata = {}) {
  const description_statuses = {};
  const quality_statuses = {};
  const flag_counts = {};
  const field_coverage = {};
  const term_counts = {};
  const coverageFields = [
    "status",
    "genres",
    "tags",
    "platforms",
    "made_with",
    "languages",
    "average_session",
    "inputs",
    "accessibility",
    "ai_disclosure",
    "content",
    "rating",
    "release_date",
    "published",
    "updated",
    "publisher",
    "asset_license",
    "code_license",
    "multiplayer",
    "links",
  ];
  const termFields = ["genres", "tags", "platforms", "made_with", "languages"];

  for (const record of records) {
    increment(description_statuses, record.description.status);
    increment(quality_statuses, record.quality.status);
    for (const flag of record.quality.flags) increment(flag_counts, flag.code);
    if (record.identity.title) field_coverage.title = (field_coverage.title ?? 0) + 1;
    if (record.identity.creators.length) field_coverage.creators = (field_coverage.creators ?? 0) + 1;
    if (record.description.short_description) {
      field_coverage.short_description = (field_coverage.short_description ?? 0) + 1;
    }
    if (record.delivery.modes.length) {
      field_coverage.delivery_modes = (field_coverage.delivery_modes ?? 0) + 1;
    }
    for (const field of coverageFields) {
      if (coverageValue(record.platform_metadata[field])) {
        field_coverage[field] = (field_coverage[field] ?? 0) + 1;
      }
    }
    for (const field of termFields) {
      term_counts[field] ??= {};
      for (const term of record.platform_metadata[field]) increment(term_counts[field], term.raw);
    }
  }

  const duplicateGroups = (keyOf) => {
    const groups = new Map();
    for (const record of records) {
      const key = keyOf(record);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    }
    return [...groups.values()]
      .filter((group) => group.length > 1)
      .map((group) => ({
        project_ids: group.map((record) => record.project_id),
        titles: [...new Set(group.map((record) => record.identity.title))],
      }))
      .sort((left, right) => right.project_ids.length - left.project_ids.length);
  };
  const titleCreatorGroups = duplicateGroups((record) => {
    if (!record.identity.title || !record.identity.creators.length) return null;
    const creators = record.identity.creators.map(normalizedTitle).sort().join("|");
    return `${normalizedTitle(record.identity.title)}||${creators}`;
  });
  const descriptionHashGroups = duplicateGroups((record) => record.description.sha256);

  return {
    schema_version: CLEANING_SUMMARY_SCHEMA_VERSION,
    parser_version: PARSER_VERSION,
    ...metadata,
    record_count: records.length,
    description_statuses,
    quality_statuses,
    flag_counts,
    field_coverage,
    term_counts,
    possible_duplicates: {
      title_creator_groups: titleCreatorGroups,
      description_hash_groups: descriptionHashGroups,
    },
    review_queue: records
      .filter((record) => record.quality.status !== "ok")
      .map((record) => ({
        project_id: record.project_id,
        title: record.identity.title,
        source_url: record.source.source_url,
        description_status: record.description.status,
        flags: record.quality.flags.map((flag) => flag.code),
      })),
  };
}

function markdownTable(counts, total) {
  const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  if (!entries.length) return "_None._\n";
  return [
    "| Value | Count | Coverage |",
    "|---|---:|---:|",
    ...entries.map(([key, count]) =>
      `| ${String(key).replaceAll("|", "\\|")} | ${count} | ${((count / total) * 100).toFixed(1)}% |`
    ),
    "",
  ].join("\n");
}

function renderReviewSummary(summary) {
  const lines = [
    "# itch.io offline cleaning review",
    "",
    `- **Derivation ID:** \`${summary.derivation_id}\``,
    `- **Source run:** \`${summary.source_run_id}\``,
    `- **Parser:** \`${summary.parser_version}\``,
    `- **Completed:** ${summary.completed_at_utc}`,
    `- **Records:** ${summary.record_count}`,
    "- **Research coding:** not performed",
    "- **Network access:** disabled during HTML parsing",
    "",
    "## Description status",
    "",
    markdownTable(summary.description_statuses, summary.record_count),
    "## Quality status",
    "",
    markdownTable(summary.quality_statuses, summary.record_count),
    "## Source-field coverage",
    "",
    markdownTable(summary.field_coverage, summary.record_count),
    "## Quality flags",
    "",
    markdownTable(summary.flag_counts, summary.record_count),
    "## Possible duplicate groups",
    "",
    `- Same normalized title and creator: ${summary.possible_duplicates.title_creator_groups.length}`,
    `- Same cleaned-description hash: ${summary.possible_duplicates.description_hash_groups.length}`,
    "",
  ];
  for (const [label, groups] of [
    ["Title + creator", summary.possible_duplicates.title_creator_groups],
    ["Description hash", summary.possible_duplicates.description_hash_groups],
  ]) {
    if (!groups.length) continue;
    lines.push(`### ${label}`, "", "| Projects | Titles |", "|---|---|");
    for (const group of groups) {
      lines.push(
        `| ${group.project_ids.join(", ")} | ${group.titles.join(" / ").replaceAll("|", "\\|")} |`,
      );
    }
    lines.push("");
  }
  lines.push(
    "## Manual review queue",
    "",
  );
  if (!summary.review_queue.length) {
    lines.push("_No records were flagged for review._", "");
  } else {
    lines.push("| Project | Description | Flags |", "|---|---|---|");
    for (const item of summary.review_queue) {
      const title = `${item.project_id} — ${item.title}`.replaceAll("|", "\\|");
      lines.push(`| ${title} | ${item.description_status} | ${item.flags.join(", ")} |`);
    }
    lines.push("");
  }
  lines.push(
    "This report supports source-field and parser review only. It does not establish",
    "educational relevance, Interactive Fiction mechanics, inclusion, or quality.",
    "",
  );
  return lines.join("\n");
}

async function readExistingRecord(recordPath, capture) {
  try {
    const record = JSON.parse(await readFile(recordPath, "utf8"));
    validateCleanedRecord(record);
    if (
      record.parser_version !== PARSER_VERSION ||
      record.source.rendered_html_sha256 !== capture.rendered_html_sha256
    ) {
      return null;
    }
    if (record.description.text_file) {
      const descriptionPath = path.join(path.dirname(recordPath), record.description.text_file);
      if (!(await pathExists(descriptionPath))) return null;
    }
    return record;
  } catch {
    return null;
  }
}

async function runCleaning(options) {
  const sourceRunId = safeIdentifier(options["source-run-id"], "--source-run-id");
  const derivationId = safeIdentifier(options["derivation-id"], "--derivation-id");
  const sourceRunDirectory = path.join(restrictedRoot, "runs", sourceRunId);
  const outputDirectory = path.join(restrictedRoot, "derived", derivationId);
  assertWithin(sourceRunDirectory, path.join(restrictedRoot, "runs"), "Source run");
  assertWithin(outputDirectory, path.join(restrictedRoot, "derived"), "Derived output");

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const sourceState = JSON.parse(await readFile(path.join(sourceRunDirectory, "run.json"), "utf8"));
  if (sourceState.schema_version !== SOURCE_CAPTURE_SCHEMA_VERSION) {
    throw new Error(`Unsupported source run schema: ${sourceState.schema_version}`);
  }
  const limit = numericOption(options, "limit");
  const projects = selectProjects(manifest.projects ?? [], options["start-at"], limit);
  if (options["dry-run"]) {
    console.log(JSON.stringify({
      mode: "dry-run",
      source_run_id: sourceRunId,
      derivation_id: derivationId,
      selected_project_count: projects.length,
      first_project: projects[0],
      last_project: projects.at(-1),
      network_requests: 0,
      writes: 0,
    }, null, 2));
    return;
  }

  const outputExists = await pathExists(outputDirectory);
  if (outputExists && !options.resume) {
    throw new Error(`Derivation already exists; use a new ID or pass --resume: ${derivationId}`);
  }
  await mkdir(outputDirectory, { recursive: true });
  const statePath = path.join(outputDirectory, "run.json");
  const state = outputExists
    ? JSON.parse(await readFile(statePath, "utf8"))
    : {
        schema_version: CLEANING_RUN_SCHEMA_VERSION,
        derivation_id: derivationId,
        source_run_id: sourceRunId,
        parser_version: PARSER_VERSION,
        started_at_utc: utcNow(),
        selected_project_count: projects.length,
        network_access: "disabled",
        items: {},
      };
  if (
    state.schema_version !== CLEANING_RUN_SCHEMA_VERSION ||
    state.source_run_id !== sourceRunId ||
    state.parser_version !== PARSER_VERSION
  ) {
    throw new Error("Existing derivation state is incompatible with this parser run.");
  }
  state.status = "running";
  state.last_started_at_utc = utcNow();
  await writeJson(statePath, state);

  const temporaryProfile = await mkdtemp(path.join(tmpdir(), "inh-offline-cleaner-"));
  let browser;
  const records = [];
  let errorCount = 0;
  try {
    browser = await launchBrowser({
      executablePath: options["chrome-path"],
      profileDirectory: temporaryProfile,
      headless: true,
    });
    await browser.page.send("Network.setBlockedURLs", { urls: ["*"] });
    await browser.page.send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });

    for (const project of projects) {
      const sourceProjectDirectory = path.join(sourceRunDirectory, "projects", project.id);
      const capture = JSON.parse(await readFile(path.join(sourceProjectDirectory, "capture.json"), "utf8"));
      const outputProjectDirectory = path.join(outputDirectory, "projects", project.id);
      const recordPath = path.join(outputProjectDirectory, "record.json");
      const existing = options.resume ? await readExistingRecord(recordPath, capture) : null;
      if (existing) {
        records.push(existing);
        state.items[project.id] = {
          ...(state.items[project.id] ?? {}),
          status: "success",
          record_file: `projects/${project.id}/record.json`,
          description_status: existing.description.status,
          quality_status: existing.quality.status,
          resumed: true,
        };
        continue;
      }

      try {
        if (capture.schema_version !== SOURCE_CAPTURE_SCHEMA_VERSION || capture.status !== "success") {
          throw new Error(`Source capture is not a successful ${SOURCE_CAPTURE_SCHEMA_VERSION} record: ${capture.status}`);
        }
        if (capture.source_url !== project.url) {
          throw new Error("Capture URL does not match the frozen manifest URL.");
        }
        const htmlPath = path.join(sourceProjectDirectory, capture.rendered_html_file);
        const html = await readFile(htmlPath, "utf8");
        if (sha256(html) !== capture.rendered_html_sha256) {
          throw new Error("Rendered HTML hash does not match capture.json.");
        }
        const extracted = await setDocumentContent(browser.page, html);
        const { record, descriptionText } = buildCleanedRecord({
          manifestProject: project,
          capture,
          extracted,
          sourceRunId,
        });
        validateCleanedRecord(record);
        await mkdir(outputProjectDirectory, { recursive: true });
        if (descriptionText) {
          await writeText(path.join(outputProjectDirectory, "description-clean.txt"), `${descriptionText}\n`);
        }
        const recordJson = `${JSON.stringify(record, null, 2)}\n`;
        await writeText(recordPath, recordJson);
        records.push(record);
        state.items[project.id] = {
          status: "success",
          record_file: `projects/${project.id}/record.json`,
          record_sha256: sha256(recordJson),
          description_status: record.description.status,
          quality_status: record.quality.status,
          quality_flags: record.quality.flags.map((flag) => flag.code),
        };
        console.log(`${project.id} success ${record.description.status} ${record.quality.status}`);
      } catch (error) {
        errorCount += 1;
        state.items[project.id] = { status: "error", error: error.message };
        console.error(`${project.id} error ${error.message}`);
      }
      state.updated_at_utc = utcNow();
      await writeJson(statePath, state);
    }
  } finally {
    if (browser) await browser.close();
    const resolvedTempRoot = path.resolve(tmpdir());
    const resolvedProfile = path.resolve(temporaryProfile);
    if (path.dirname(resolvedProfile) !== resolvedTempRoot || !path.basename(resolvedProfile).startsWith("inh-offline-cleaner-")) {
      throw new Error(`Refusing to remove unexpected temporary profile: ${resolvedProfile}`);
    }
    await removeTemporaryProfile(resolvedProfile);
  }

  const completedAt = utcNow();
  const summary = buildSummary(records, {
    derivation_id: derivationId,
    source_run_id: sourceRunId,
    completed_at_utc: completedAt,
    selected_project_count: projects.length,
    error_count: errorCount,
  });
  await writeJson(path.join(outputDirectory, "summary.json"), summary);
  await writeText(path.join(outputDirectory, "review-summary.md"), renderReviewSummary(summary));
  state.status = errorCount ? "completed_with_errors" : "complete";
  state.completed_at_utc = completedAt;
  state.success_count = records.length;
  state.error_count = errorCount;
  state.summary_file = "summary.json";
  state.review_summary_file = "review-summary.md";
  await writeJson(statePath, state);

  console.log(JSON.stringify({
    derivation_id: derivationId,
    source_run_id: sourceRunId,
    output_directory: outputDirectory,
    status: state.status,
    success_count: records.length,
    error_count: errorCount,
  }, null, 2));
  if (errorCount) process.exitCode = 2;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  await runCleaning(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  });
}

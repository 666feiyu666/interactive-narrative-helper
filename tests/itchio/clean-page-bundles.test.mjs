import test from "node:test";
import assert from "node:assert/strict";

import {
  CLEANED_RECORD_SCHEMA_VERSION,
  CLEANING_RUN_SCHEMA_VERSION,
  CLEANING_SUMMARY_SCHEMA_VERSION,
  PARSER_VERSION,
  SOURCE_CAPTURE_SCHEMA_VERSION,
  buildCleanedRecord,
  buildSummary,
  normalizeKey,
  normalizeText,
  validateCleanedRecord,
} from "../../tools/itchio/clean-page-bundles.mjs";

function syntheticSource(overrides = {}) {
  return {
    manifestProject: {
      id: "itchio-test-0001",
      url: "https://example-creator.itch.io/example-project",
      title_at_listing: "Example Project",
      listing_page: 1,
      listing_position: 1,
    },
    capture: {
      schema_version: SOURCE_CAPTURE_SCHEMA_VERSION,
      project_id: "itchio-test-0001",
      source_url: "https://example-creator.itch.io/example-project",
      final_url: "https://example-creator.itch.io/example-project",
      canonical_url: null,
      captured_at_utc: "2026-08-27T13:17:04Z",
      status: "success",
      rendered_html_sha256: "a".repeat(64),
      structure_sha256: "b".repeat(64),
    },
    extracted: {
      document_title: "Example Project by Example Creator",
      page_ui_language: "en",
      canonical_url: null,
      title: "Example Project",
      meta: {
        description: "A short source description.",
        og_description: "A short source description.",
        itch_path: "games/1234",
      },
      product: {
        "@type": "Product",
        name: "Example Project",
        aggregateRating: { ratingValue: "4.5", ratingCount: 12 },
      },
      description: {
        element_present: true,
        text: "First paragraph.\n\nSecond\u00a0paragraph.",
        links: [{ text: "Documentation", href: "https://example.org/docs" }],
        image_alts: ["Example screenshot"],
      },
      info_panel_present: true,
      info_rows: [
        { index: 0, label: "Status", value: "Released", links: [], abbr_titles: [] },
        {
          index: 1,
          label: "Author",
          value: "Example Creator",
          links: [{ text: "Example Creator", href: "https://example-creator.itch.io" }],
          abbr_titles: [],
        },
        {
          index: 2,
          label: "Genre",
          value: "Interactive Fiction, Educational",
          links: [
            { text: "Interactive Fiction", href: "https://itch.io/games/tag-interactive-fiction" },
            { text: "Educational", href: "https://itch.io/games/tag-educational" },
          ],
          abbr_titles: [],
        },
        {
          index: 3,
          label: "Tags",
          value: "Text based, Multiple Endings",
          links: [
            { text: "Text based", href: "https://itch.io/games/tag-text-based" },
            { text: "Multiple Endings", href: "https://itch.io/games/tag-multiple-endings" },
          ],
          abbr_titles: [],
        },
        {
          index: 4,
          label: "Languages",
          value: "English, Spanish, Spanglish",
          links: [],
          abbr_titles: [],
        },
        {
          index: 5,
          label: "Rating",
          value: "Rated 4.5 out of 5 stars (12 total ratings)",
          links: [],
          abbr_titles: [],
        },
      ],
      breadcrumbs: [
        { text: "Games", href: "https://itch.io/games" },
        { text: "Interactive Fiction", href: "https://itch.io/games/tag-interactive-fiction" },
      ],
      delivery: {
        view_classes: ["view_html_game_page", "view_game_page", "direct_download"],
        header_text: "A downloadable game that runs in the browser",
        has_game_frame: true,
        has_uploads: true,
      },
    },
    sourceRunId: "synthetic-source-run",
    ...overrides,
  };
}

test("normalizes source text without flattening paragraph boundaries", () => {
  assert.equal(
    normalizeText("  First\u00a0line.  \r\n\r\n\r\n  Second   line. "),
    "First line.\n\nSecond line.",
  );
  assert.equal(normalizeKey("User Interface (UI)"), "user-interface-ui");
  assert.equal(normalizeKey("角色 扮演"), "角色-扮演");
});

test("builds a source-grounded cleaned record without research coding", () => {
  const { record, descriptionText } = buildCleanedRecord(syntheticSource());

  assert.equal(record.schema_version, CLEANED_RECORD_SCHEMA_VERSION);
  assert.equal(record.parser_version, PARSER_VERSION);
  assert.equal(CLEANED_RECORD_SCHEMA_VERSION, "itchio-cleaned-project/v1.0");
  assert.equal(CLEANING_RUN_SCHEMA_VERSION, "itchio-page-cleaning-run/v1.0");
  assert.equal(CLEANING_SUMMARY_SCHEMA_VERSION, "itchio-page-cleaning-summary/v1.0");
  assert.equal(PARSER_VERSION, "1.0.0");
  assert.equal(record.identity.title, "Example Project");
  assert.deepEqual(record.identity.creators, ["Example Creator"]);
  assert.equal(record.identity.page_ui_language, "en");
  assert.equal(descriptionText, "First paragraph.\n\nSecond paragraph.");
  assert.equal(record.description.status, "present");
  assert.deepEqual(
    record.platform_metadata.genres.map((term) => term.normalized_key),
    ["interactive-fiction", "educational"],
  );
  assert.deepEqual(record.platform_metadata.languages, [{
    raw: "English, Spanish, Spanglish",
    normalized_key: "english-spanish-spanglish",
    href: null,
  }]);
  assert.deepEqual(record.platform_metadata.rating, {
    value: 4.5,
    count: 12,
    source: "jsonld:Product.aggregateRating",
  });
  assert.deepEqual(record.delivery.modes, ["browser", "download"]);
  assert.equal(record.quality.status, "ok");
  assert.equal("educational_purpose" in record, false);
  assert.equal(validateCleanedRecord(record), record);
});

test("uses meta text conservatively and flags unmapped source fields", () => {
  const source = syntheticSource();
  source.extracted.description = {
    element_present: false,
    text: "",
    links: [],
    image_alts: [],
  };
  source.extracted.info_rows.push({
    index: 6,
    label: "Unexpected field",
    value: "Source value",
    links: [],
    abbr_titles: [],
  });

  const { record, descriptionText } = buildCleanedRecord(source);
  assert.equal(descriptionText, "A short source description.");
  assert.equal(record.description.status, "meta_only");
  assert.equal(record.quality.status, "review");
  assert.deepEqual(
    record.quality.flags.map((flag) => flag.code),
    ["unmapped_info_label", "description_meta_only"],
  );
});

test("does not manufacture text when both body and meta descriptions are absent", () => {
  const source = syntheticSource();
  source.extracted.meta.description = null;
  source.extracted.meta.og_description = null;
  source.extracted.description = {
    element_present: false,
    text: "",
    links: [],
    image_alts: [],
  };

  const { record, descriptionText } = buildCleanedRecord(source);
  assert.equal(descriptionText, "");
  assert.equal(record.description.status, "missing");
  assert.equal(record.description.text_file, null);
  assert.equal(record.quality.flags.at(-1).code, "description_missing");
});

test("flags a very short body as reviewable without discarding its source text", () => {
  const source = syntheticSource();
  source.extracted.description.text = "Tiny";
  const { record, descriptionText } = buildCleanedRecord(source);

  assert.equal(descriptionText, "Tiny");
  assert.equal(record.description.status, "present");
  assert.equal(record.quality.status, "review");
  assert.equal(record.quality.flags.at(-1).code, "description_very_short");
});

test("summarizes coverage and creates a finite review queue", () => {
  const first = buildCleanedRecord(syntheticSource()).record;
  const secondSource = syntheticSource();
  secondSource.manifestProject = {
    ...secondSource.manifestProject,
    id: "itchio-test-0002",
  };
  secondSource.capture = {
    ...secondSource.capture,
    project_id: "itchio-test-0002",
  };
  secondSource.extracted.meta.description = null;
  secondSource.extracted.meta.og_description = null;
  secondSource.extracted.description = {
    element_present: false,
    text: "",
    links: [],
    image_alts: [],
  };
  const second = buildCleanedRecord(secondSource).record;

  const summary = buildSummary([first, second], { derivation_id: "synthetic" });
  assert.equal(summary.record_count, 2);
  assert.deepEqual(summary.description_statuses, { present: 1, missing: 1 });
  assert.equal(summary.field_coverage.genres, 2);
  assert.equal(summary.field_coverage.creators, 2);
  assert.equal(summary.term_counts.genres.Educational, 2);
  assert.deepEqual(summary.review_queue.map((item) => item.project_id), ["itchio-test-0002"]);
  assert.equal(summary.possible_duplicates.title_creator_groups.length, 1);
  assert.equal(summary.possible_duplicates.description_hash_groups.length, 0);
});

test("rejects a cleaned record that loses source identity", () => {
  assert.throws(
    () => validateCleanedRecord({ schema_version: CLEANED_RECORD_SCHEMA_VERSION }),
    /preserve its source identity/,
  );
});

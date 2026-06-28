#!/usr/bin/env node

/**
 * check-design-wiki — guardrail so a Design Reference Wiki page can't silently
 * drop out of (or be orphaned from) public/wiki-manifest.json.
 *
 * Fails when:
 *   - a served public/*-reference.html page is missing from the manifest, or
 *   - a manifest page points at a public/ file that doesn't exist, or
 *   - a backlog id collides with a real page id.
 *
 * Run via `npm run check:design-wiki` (also chained into `npm run check:process`).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ManifestPage = { id: string; file: string };
type Manifest = { home: string; pages: ManifestPage[]; backlog?: { id: string }[] };

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const MANIFEST_PATH = path.join(PUBLIC_DIR, "wiki-manifest.json");

function fail(messages: string[]): never {
  console.error("check-design-wiki: FAIL");
  for (const message of messages) console.error(`  - ${message}`);
  console.error(
    "\nFix: register the page in public/wiki-manifest.json (or remove the stale manifest entry), then run `npm run generate-design-wiki`.",
  );
  process.exit(1);
}

function main(): void {
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail([`missing manifest at ${path.relative(REPO_ROOT, MANIFEST_PATH)}`]);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  const errors: string[] = [];

  const manifestFiles = new Set(manifest.pages.map((page) => page.file));

  // Every served *-reference.html must be registered.
  const servedReferencePages = fs
    .readdirSync(PUBLIC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /-reference\.html$/.test(entry.name))
    .map((entry) => entry.name);

  for (const file of servedReferencePages) {
    if (!manifestFiles.has(file)) {
      errors.push(`served page public/${file} is not registered in wiki-manifest.json`);
    }
  }

  // Every manifest page must point at a real file.
  for (const page of manifest.pages) {
    if (!fs.existsSync(path.join(PUBLIC_DIR, page.file))) {
      errors.push(`manifest page "${page.id}" → public/${page.file} does not exist`);
    }
  }

  // Backlog ids must not collide with real page ids.
  const pageIds = new Set(manifest.pages.map((page) => page.id));
  for (const entry of manifest.backlog ?? []) {
    if (pageIds.has(entry.id)) {
      errors.push(`backlog id "${entry.id}" collides with a real page id`);
    }
  }

  if (errors.length > 0) fail(errors);

  console.log(
    `check-design-wiki: OK — ${manifest.pages.length} pages registered, ${servedReferencePages.length} served *-reference.html all accounted for.`,
  );
}

main();

/**
 * design-wiki-nav — the one nav block every served Design Reference Wiki page carries.
 *
 * Shared by `generate-design-wiki.ts` (which injects it into every manifest page) and by
 * generators that emit a wiki page of their own (`generate-world-objects.ts`), so a
 * generated page ships with the identical block and the generated-freshness diff stays
 * idempotent: re-running the page's generator produces exactly what the hub would.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ManifestPage = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  section: string;
};

export type BacklogEntry = {
  id: string;
  title: string;
  blurb: string;
  section: string;
};

export type Manifest = {
  home: string;
  title: string;
  pages: ManifestPage[];
  backlog?: BacklogEntry[];
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
export const PUBLIC_DIR = path.join(REPO_ROOT, "public");
export const MANIFEST_PATH = path.join(PUBLIC_DIR, "wiki-manifest.json");
export const NAV_START = "<!--WIKI-NAV-->";
export const NAV_END = "<!--/WIKI-NAV-->";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function readManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`generate-design-wiki: missing manifest at ${MANIFEST_PATH}`);
  }
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(raw) as Manifest;
  if (!parsed.home || !Array.isArray(parsed.pages)) {
    throw new Error("generate-design-wiki: manifest must have `home` and a `pages` array");
  }
  return parsed;
}

/**
 * The managed nav block. Self-contained (carries its own scoped <style>) so it
 * renders consistently on any page regardless of that page's own CSS. The whole
 * block is regenerated between the markers on every run, so output is idempotent
 * for a given (manifest, activeId) pair.
 *
 * @param manifest the wiki manifest
 * @param activeId  id of the page being injected into, or "__home__" for the hub
 */
export function buildNav(manifest: Manifest, activeId: string): string {
  const homeActive = activeId === "__home__";
  const homeLink = `<a class="wiki-nav__link${homeActive ? " is-active" : ""}" href="${escapeHtml(manifest.home)}"${homeActive ? ' aria-current="page"' : ""}>Design Wiki</a>`;

  const pageLinks = manifest.pages
    .map((page) => {
      const active = page.id === activeId;
      return `<a class="wiki-nav__link${active ? " is-active" : ""}" href="${escapeHtml(page.file)}"${active ? ' aria-current="page"' : ""}>${escapeHtml(page.title)}</a>`;
    })
    .join("\n      ");

  return [
    NAV_START,
    "<style>",
    "  .wiki-nav { font-family: 'Cinzel', Georgia, serif; background: #2c1810; border-bottom: 2px solid #b8860b; padding: 0.6rem 1.2rem; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4rem 1.1rem; }",
    "  .wiki-nav__brand { color: #daa520; font-weight: 700; letter-spacing: 0.04em; margin-right: 0.6rem; font-size: 0.95rem; }",
    "  .wiki-nav__link { color: #f4edd8; text-decoration: none; font-size: 0.85rem; letter-spacing: 0.02em; padding: 0.15rem 0.1rem; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; }",
    "  .wiki-nav__link:hover { color: #daa520; }",
    "  .wiki-nav__link.is-active { color: #daa520; border-bottom-color: #b8860b; font-weight: 700; }",
    "</style>",
    '<nav class="wiki-nav" aria-label="Design Reference Wiki">',
    '  <span class="wiki-nav__brand">⌖ Design Reference Wiki</span>',
    `  ${homeLink}`,
    `  ${pageLinks}`,
    "</nav>",
    NAV_END,
  ].join("\n");
}


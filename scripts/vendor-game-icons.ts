/**
 * vendor-game-icons — fetch the carved icon shapes the registry names, once, from the
 * game-icons repository at a pinned commit (THR-1904, plan
 * `Docs/plans/2026-10-14-thr-1879-type-and-icons-rollout.md` § 4).
 *
 *   npm run icons:vendor
 *
 * 1. Reads every `carved('<slug>', { author?, mirror? })` call in `src/data/icons/iconRegistry.ts`
 *    (TypeScript compiler API, so a comment or a string that merely contains the word is not read).
 * 2. Keeps every shape already in `src/data/icons/carvedShapes.generated.ts`; for each one missing,
 *    reads the pinned tree once (slug → author directory) and fetches
 *    `raw.githubusercontent.com/<repo>/<commit>/<author>/<slug>.svg`.
 * 3. Drops the black background square, keeps the one glyph path, fails on anything else.
 * 4. Mirrors left to right when the entry asks (`forward` is `return-arrow` mirrored).
 * 5. Rounds every coordinate to `ICON_PATH_DECIMALS`.
 * 6. Writes the generated file sorted by key, dropping shapes no entry uses, and prints its size.
 *
 * Never run in CI: it needs the network. Re-running on a clean tree fetches nothing and writes the
 * same file. Fails closed: on any error nothing is written.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import {
  GAME_ICONS_AUTHOR_NAMES,
  GAME_ICONS_CHANGES,
  GAME_ICONS_DRM_NOTE,
  GAME_ICONS_REPO,
  GAME_ICONS_REPO_COMMIT,
  ICON_PATH_DECIMALS,
  ICON_SHAPES_GZIP_BUDGET_KB,
  carvedShapeKey,
  type CarvedShapeRecord,
} from '../src/data/icons/gameIconsSource.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_FILE = path.join(ROOT, 'src/data/icons/iconRegistry.ts');
const GENERATED_FILE = path.join(ROOT, 'src/data/icons/carvedShapes.generated.ts');

/** The upstream grid; every file must use it. */
const UPSTREAM_GRID = 512;
const UPSTREAM_VIEWBOX = `0 0 ${UPSTREAM_GRID} ${UPSTREAM_GRID}`;
/** The background square every upstream file paints first. */
const BACKGROUND_SQUARE = 'M0 0h512v512H0z';

// ─── Registry reading ────────────────────────────────────────────────────────

export interface CarvedRequest {
  readonly slug: string;
  readonly author?: string;
  readonly mirror: boolean;
  /** The registry entry name the call sits in, when it can be read. */
  readonly entry?: string;
}

/**
 * One message per request whose shape is not vendored, naming the entry, the slug and the
 * command — the check `carvedShapes.test.ts` runs on the real registry.
 */
export function unvendoredMessages(requests: readonly CarvedRequest[], shapes: Readonly<Record<string, unknown>>): string[] {
  return requests
    .filter((r) => !(carvedShapeKey(r.slug, r.mirror) in shapes))
    .map((r) => `${r.entry ?? '(unnamed entry)'} names carved shape "${r.slug}"${r.mirror ? ' (mirrored)' : ''}, which is not vendored: run \`npm run icons:vendor\` and commit src/data/icons/carvedShapes.generated.ts`);
}

/** Vendored keys no request uses (the script would drop them). */
export function unusedVendoredKeys(requests: readonly CarvedRequest[], shapes: Readonly<Record<string, unknown>>): string[] {
  const used = new Set(requests.map((r) => carvedShapeKey(r.slug, r.mirror)));
  return Object.keys(shapes).filter((key) => !used.has(key));
}

/** Every `carved(...)` call in a source file, in source order. */
export async function readCarvedRequests(source: string): Promise<CarvedRequest[]> {
  const ts = (await import('typescript')).default;
  const file = ts.createSourceFile('iconRegistry.ts', source, ts.ScriptTarget.Latest, true);
  const requests: CarvedRequest[] = [];
  const visit = (node: import('typescript').Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'carved') {
      const [slugArg, optsArg] = node.arguments;
      if (!slugArg || !ts.isStringLiteral(slugArg)) {
        throw new Error(`carved() needs a string literal slug (${file.getLineAndCharacterOfPosition(node.pos).line + 1})`);
      }
      let author: string | undefined;
      let mirror = false;
      if (optsArg && ts.isObjectLiteralExpression(optsArg)) {
        for (const prop of optsArg.properties) {
          if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
          if (prop.name.text === 'author' && ts.isStringLiteral(prop.initializer)) author = prop.initializer.text;
          if (prop.name.text === 'mirror') mirror = prop.initializer.kind === ts.SyntaxKind.TrueKeyword;
        }
      }
      // `name: { meaning, ...carved('slug') }` — the registry entry the call belongs to.
      let entry: string | undefined;
      const owner = node.parent?.parent?.parent;
      if (owner && ts.isPropertyAssignment(owner) && (ts.isIdentifier(owner.name) || ts.isStringLiteral(owner.name))) {
        entry = owner.name.text;
      }
      requests.push({ slug: slugArg.text, author, mirror, entry });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return requests;
}

// ─── Path data ───────────────────────────────────────────────────────────────

export interface PathCommand {
  cmd: string;
  args: number[];
}

const ARITY: Readonly<Record<string, number>> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

/** Parse SVG path data, including arc flags written with no separator (`a5 5 0 011 1`). */
export function parsePath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  skip();
  while (i < d.length) {
    const ch = d[i];
    if (!/[MmLlHhVvCcSsQqTtAaZz]/.test(ch)) throw new Error(`unexpected "${ch}" at ${i} in path data`);
    i++;
    const command: PathCommand = { cmd: ch, args: [] };
    const lower = ch.toLowerCase();
    skip();
    if (lower !== 'z') {
      while (i < d.length && !/[A-Za-z]/.test(d[i])) {
        const slot = command.args.length % 7;
        if (lower === 'a' && (slot === 3 || slot === 4)) {
          if (d[i] !== '0' && d[i] !== '1') throw new Error(`bad arc flag "${d[i]}" at ${i}`);
          command.args.push(Number(d[i]));
          i++;
        } else {
          const match = NUMBER.exec(d.slice(i));
          if (!match) throw new Error(`bad number at ${i}: "${d.slice(i, i + 12)}"`);
          command.args.push(Number(match[0]));
          i += match[0].length;
        }
        skip();
      }
      if (command.args.length === 0 || command.args.length % ARITY[lower] !== 0) {
        throw new Error(`"${ch}" has ${command.args.length} arguments, not a multiple of ${ARITY[lower]}`);
      }
    }
    commands.push(command);
  }
  if (commands.length === 0 || commands[0].cmd.toLowerCase() !== 'm') throw new Error('path data must start with a moveto');
  return commands;
}

/** Which argument slots of a command are x coordinates (repeating per argument set). */
function isXSlot(lower: string, slot: number): boolean {
  switch (lower) {
    case 'm': case 'l': case 't': return slot % 2 === 0;
    case 'h': return true;
    case 'c': return slot % 6 === 0 || slot % 6 === 2 || slot % 6 === 4;
    case 's': case 'q': return slot % 4 === 0 || slot % 4 === 2;
    case 'a': return slot % 7 === 5;
    default: return false;
  }
}

/**
 * Mirror path data left to right on the upstream grid: absolute x → 512 − x, relative dx → −dx,
 * an arc's rotation negated and its sweep flag flipped. A path's opening lowercase `m` is
 * relative to the origin, so its first pair is mirrored as absolute.
 */
export function mirrorPath(commands: readonly PathCommand[], grid = UPSTREAM_GRID): PathCommand[] {
  return commands.map((command, index) => {
    const lower = command.cmd.toLowerCase();
    const relative = command.cmd === lower;
    const args = command.args.map((value, slot) => {
      if (lower === 'a' && slot % 7 === 2) return -value;
      if (lower === 'a' && slot % 7 === 4) return value === 0 ? 1 : 0;
      if (!isXSlot(lower, slot)) return value;
      const openingPair = index === 0 && slot === 0;
      return relative && !openingPair ? -value : grid - value;
    });
    return { cmd: command.cmd, args };
  });
}

function formatNumber(value: number, decimals: number): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) || rounded === 0 ? '0' : String(rounded);
}

/** Serialise commands, rounding every coordinate (arc flags stay 0/1). */
export function formatPath(commands: readonly PathCommand[], decimals = ICON_PATH_DECIMALS): string {
  return commands
    .map(({ cmd, args }) => {
      const lower = cmd.toLowerCase();
      const parts = args.map((value, slot) =>
        lower === 'a' && (slot % 7 === 3 || slot % 7 === 4) ? String(value) : formatNumber(value, decimals),
      );
      return (cmd + parts.join(' ')).replace(/ -/g, '-');
    })
    .join('');
}

/** The one glyph path of an upstream file, or an error naming what is wrong. */
export function extractGlyphPath(svg: string, label: string): string {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  if (viewBox !== UPSTREAM_VIEWBOX) throw new Error(`${label}: view box is "${viewBox}", not "${UPSTREAM_VIEWBOX}"`);
  if (/<(g|use|circle|rect|polygon|ellipse|line|polyline)\b/.test(svg)) throw new Error(`${label}: holds elements other than <path>`);
  const paths = [...svg.matchAll(/<path\b([^>]*)\/?>/g)].map((m) => /\sd="([^"]+)"/.exec(m[1])?.[1] ?? '');
  const glyphs = paths.filter((d) => d !== BACKGROUND_SQUARE);
  if (glyphs.length !== 1) throw new Error(`${label}: has ${glyphs.length} glyph paths, not exactly one`);
  return glyphs[0];
}

// ─── Fetching ────────────────────────────────────────────────────────────────

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

/** slug → the author directories that hold it at the pinned commit. */
async function readUpstreamTree(): Promise<Map<string, string[]>> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const body = JSON.parse(
    await fetchText(`https://api.github.com/repos/${GAME_ICONS_REPO}/git/trees/${GAME_ICONS_REPO_COMMIT}?recursive=1`, headers),
  ) as { tree: { path: string; type: string }[]; truncated?: boolean };
  if (body.truncated) throw new Error('the upstream tree listing came back truncated');
  const bySlug = new Map<string, string[]>();
  for (const { path: p, type } of body.tree) {
    const match = /^([^/]+)\/([^/]+)\.svg$/.exec(p);
    if (type !== 'blob' || !match) continue;
    const [, dir, slug] = match;
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), dir]);
  }
  return bySlug;
}

// ─── Output ──────────────────────────────────────────────────────────────────

interface GeneratedModule {
  CARVED_SHAPES: Readonly<Record<string, CarvedShapeRecord>>;
  GAME_ICONS_SOURCE: { vendoredOn: string };
}

async function readExisting(): Promise<GeneratedModule | null> {
  if (!fs.existsSync(GENERATED_FILE)) return null;
  return (await import(pathToFileURL(GENERATED_FILE).href)) as GeneratedModule;
}

function renderGenerated(shapes: Record<string, CarvedShapeRecord>, vendoredOn: string): string {
  const keys = Object.keys(shapes).sort();
  const lines = [
    '// GENERATED by scripts/vendor-game-icons.ts (`npm run icons:vendor`). Do not edit by hand.',
    `// Source: https://github.com/${GAME_ICONS_REPO} @ ${GAME_ICONS_REPO_COMMIT}, CC BY 3.0.`,
    `// Coordinates rounded to ${ICON_PATH_DECIMALS} decimal place(s) on the 512 × 512 grid; background square dropped.`,
    '',
    "import type { CarvedShapeRecord } from './gameIconsSource';",
    '',
    '/** Where every shape below came from, and under what licence (plan THR-1879 § 4, § 8). */',
    'export const GAME_ICONS_SOURCE = {',
    "  site: 'https://game-icons.net',",
    `  repo: 'https://github.com/${GAME_ICONS_REPO}',`,
    `  commit: '${GAME_ICONS_REPO_COMMIT}',`,
    "  licence: 'CC BY 3.0',",
    "  licenceUrl: 'https://creativecommons.org/licenses/by/3.0/',",
    `  changes: ${JSON.stringify(GAME_ICONS_CHANGES)},`,
    `  drmNote: ${JSON.stringify(GAME_ICONS_DRM_NOTE)},`,
    `  vendoredOn: '${vendoredOn}',`,
    '} as const;',
    '',
    `/** ${keys.length} vendored shapes, keyed by \`carvedShapeKey(slug, mirror)\`. */`,
    'export const CARVED_SHAPES: Readonly<Record<string, CarvedShapeRecord>> = {',
    ...keys.map((key) => {
      const s = shapes[key];
      return `  ${JSON.stringify(key)}: { slug: ${JSON.stringify(s.slug)}, authorDir: ${JSON.stringify(s.authorDir)}, author: ${JSON.stringify(s.author)}, mirrored: ${s.mirrored}, d: ${JSON.stringify(s.d)} },`;
    }),
    '};',
    '',
  ];
  return lines.join('\n');
}

export async function main(): Promise<void> {
  const requests = await readCarvedRequests(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  const existing = await readExisting();
  const kept: Record<string, CarvedShapeRecord> = {};
  const missing: CarvedRequest[] = [];
  const seen = new Set<string>();

  for (const request of requests) {
    const key = carvedShapeKey(request.slug, request.mirror);
    if (seen.has(key)) continue;
    seen.add(key);
    const have = existing?.CARVED_SHAPES[key];
    if (have && (!request.author || have.authorDir === request.author)) kept[key] = have;
    else missing.push(request);
  }

  let tree: Map<string, string[]> | null = null;
  for (const request of missing) {
    tree ??= await readUpstreamTree();
    const dirs = tree.get(request.slug) ?? [];
    if (dirs.length === 0) throw new Error(`"${request.slug}" is not in ${GAME_ICONS_REPO} @ ${GAME_ICONS_REPO_COMMIT}`);
    let dir = dirs[0];
    if (request.author) {
      if (!dirs.includes(request.author)) throw new Error(`"${request.slug}" has no file by "${request.author}" (found: ${dirs.join(', ')})`);
      dir = request.author;
    } else if (dirs.length > 1) {
      throw new Error(`"${request.slug}" exists under ${dirs.join(' and ')}; name one: carved('${request.slug}', { author: '…' })`);
    }
    const author = GAME_ICONS_AUTHOR_NAMES[dir];
    if (!author) throw new Error(`author directory "${dir}" (for "${request.slug}") has no credited name in GAME_ICONS_AUTHOR_NAMES`);
    const label = `${dir}/${request.slug}.svg`;
    const svg = await fetchText(`https://raw.githubusercontent.com/${GAME_ICONS_REPO}/${GAME_ICONS_REPO_COMMIT}/${label}`);
    let commands = parsePath(extractGlyphPath(svg, label));
    if (request.mirror) commands = mirrorPath(commands);
    const key = carvedShapeKey(request.slug, request.mirror);
    kept[key] = { slug: request.slug, authorDir: dir, author, mirrored: request.mirror, d: formatPath(commands) };
    console.log(`[icons:vendor] fetched ${label}${request.mirror ? ' (mirrored)' : ''}`);
  }

  const dropped = Object.keys(existing?.CARVED_SHAPES ?? {}).filter((key) => !(key in kept));
  const vendoredOn = missing.length > 0 || !existing ? new Date().toISOString().slice(0, 10) : existing.GAME_ICONS_SOURCE.vendoredOn;
  const output = renderGenerated(kept, vendoredOn);
  fs.writeFileSync(GENERATED_FILE, output);

  const gzipKb = gzipSync(output).length / 1024;
  console.log(
    `[icons:vendor] ${Object.keys(kept).length} shapes (${missing.length} fetched, ${dropped.length} dropped${dropped.length ? `: ${dropped.join(', ')}` : ''}); ` +
      `${(output.length / 1024).toFixed(1)} KB raw, ${gzipKb.toFixed(1)} KB gzip`,
  );
  if (gzipKb > ICON_SHAPES_GZIP_BUDGET_KB) {
    console.warn(`[icons:vendor] WARNING: ${gzipKb.toFixed(1)} KB gzip is over the ${ICON_SHAPES_GZIP_BUDGET_KB} KB budget (ICON_SHAPES_GZIP_BUDGET_KB)`);
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err: unknown) => {
    console.error(`[icons:vendor] stopped, nothing written: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

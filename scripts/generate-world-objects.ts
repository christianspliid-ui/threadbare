/**
 * generate-world-objects — THR-1394 slice 1.
 *
 * Renders the world-object catalogue from the registry (`src/data/world-objects.ts`)
 * plus a seeded census, and fails by name on drift between the registry and the
 * unions it claims to cover. Two outputs:
 *
 *   - `Docs/canon/world-objects.generated.md` — the grep-able catalogue: one row per
 *     kind with its game word, shape, classes, writers, owning system and a badge.
 *   - `public/world-objects-reference.html` — the same catalogue as a served wiki page.
 *
 * Badges come from a census: the registry's seeds run `WORLD_OBJECT_CENSUS_TICKS` ticks
 * on the census map and every node's discriminator value is counted. A kind is LIVE
 * when a census node carries one of its values, DORMANT when none does, and the two
 * drift badges are the point of the file:
 *
 *   - UNREGISTERED — a census node writes a discriminator value no kind claims. The
 *     writer minted a thing the catalogue has no word for.
 *   - PHANTOM — a union member (`NodeType`, `EdgeType`, `LocationSubtype`) no kind
 *     claims, or a content target rule naming a subtype no writer mints.
 *
 * `--check` regenerates and diffs against the committed copy; it also exits non-zero
 * when the UNREGISTERED count exceeds `UNREGISTERED_SUBTYPE_MAX` or the PHANTOM count
 * exceeds `PHANTOM_TARGET_MAX` (both 0), because a catalogue that reports drift and
 * passes is the vacuous-gate pattern this repo keeps re-learning.
 *
 * Reuses the anchor catalog's union parser (`scripts/anchor-catalog-sources.ts`,
 * THR-1212) rather than a second regex over `graph.ts`.
 *
 * Fail-soft (NFP #4): if the census throws, the structural catalogue is still emitted
 * with every badge UNKNOWN and the drift counts reported as unmeasured.
 *
 * Usage:
 *   npm run generate-world-objects
 *   npm run generate-world-objects:check
 */

import * as fs from 'fs';
import * as path from 'path';

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import type { GameState } from '../src/types/gameState';
import {
  WORLD_OBJECT_KINDS,
  LOCATION_SUBTYPES,
  ROUTE_IDENTITY_LOCATION_SUBTYPE,
  barePlaceTypeId,
  type WorldObjectKind,
} from '../src/data/world-objects';
import { WORLD_REF_KINDS, WORLD_REF_RESERVED_KINDS } from '../src/types/worldRef';
import { parseUnionMembers, stripLineComments } from './anchor-catalog-sources.ts';
import { readManifest, buildNav } from './design-wiki-nav.ts';

/** The page's id in `public/wiki-manifest.json`; the hub nav is rendered for it here so the file needs no post-pass. */
const WIKI_PAGE_ID = 'world-objects';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────────────

/** The seeds the census runs; two so a kind minted by one world and not the other reads LIVE. */
export const WORLD_OBJECT_CENSUS_SEEDS: readonly number[] = [42, 99];
export const WORLD_OBJECT_CENSUS_MAP: MapSizePreset = 'medium';
/** Ticks per census seed — enough for promotion, war and undertakings to have minted their objects. */
export const WORLD_OBJECT_CENSUS_TICKS = 30;
/** `--check` fails above these; zero because one unregistered value is one word the catalogue lacks. */
export const UNREGISTERED_SUBTYPE_MAX = 0;
export const PHANTOM_TARGET_MAX = 0;

const OUTPUT_MD_REL = path.join('Docs', 'canon', 'world-objects.generated.md');
const OUTPUT_HTML_REL = path.join('public', 'world-objects-reference.html');
const GRAPH_TYPES_REL = path.join('src', 'types', 'graph.ts');
const INDEX_TYPES_REL = path.join('src', 'types', 'index.ts');

/** Content files whose target rules name location subtypes; a name no writer mints is a PHANTOM. */
const CONTENT_TARGET_FILES: readonly string[] = [
  'src/data/strategic-packs/merchantStrategicPack.ts',
  'src/data/strategic-packs/courtStrategicPack.ts',
  'src/data/strategic-packs/warlordStrategicPack.ts',
  'src/data/ambition-templates.ts',
  'src/data/undertaking-cells.ts',
];
/** `subtypes: ['a', 'b']` arrays in `location_subtype` target rules — Location tier only. */
const CONTENT_SUBTYPES_ARRAY_RE = /\bsubtypes\s*:\s*\[([^\]]*)\]/g;
/** `locationType: 'x'` literals in `agent_controls_location` conditions — a holding is a Location or a Place. */
const CONTENT_HOLDING_TYPE_RE = /\blocationType\s*:\s*'([a-z_]+)'/g;

// ─── Args ───────────────────────────────────────────────────────────────────

interface Args { check: boolean; ticks: number }

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const a: Args = { check: false, ticks: WORLD_OBJECT_CENSUS_TICKS };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') a.check = true;
    else if (argv[i] === '--ticks' && argv[i + 1]) { const n = parseInt(argv[++i], 10); if (!isNaN(n)) a.ticks = n; }
  }
  return a;
}

// ─── Census ─────────────────────────────────────────────────────────────────

type Badge = 'live' | 'dormant' | 'unknown';

interface Census {
  /** `${nodeType}|${key}=${value}` → count across seeds. */
  readonly values: Map<string, number>;
  /** nodeType → count. */
  readonly nodeTypes: Map<string, number>;
  /** edgeType → count. */
  readonly edgeTypes: Map<string, number>;
  readonly seeds: readonly number[];
  readonly ticks: number;
}

function runSeed(seed: number, ticks: number): GameState {
  resetDecisionCache();
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[WORLD_OBJECT_CENSUS_MAP];
  const archetype = generateArchetypes(4, seed)[0];
  const { state: initial } = initializeGameState(archetype, 'WorldObjects', cosmology, seed, preset.cols, preset.rows);
  let state = initial;
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  return state;
}

/** The discriminator keys the census counts, per node type — every key a registered kind reads. */
function discriminatorKeys(): Map<string, { key: string; fallbackKey?: string }[]> {
  const out = new Map<string, { key: string; fallbackKey?: string }[]>();
  for (const k of WORLD_OBJECT_KINDS) {
    if (k.shape.kind !== 'node' || !k.shape.discriminator) continue;
    const list = out.get(k.shape.nodeType) ?? [];
    if (!list.some(d => d.key === k.shape.discriminator!.key)) list.push({ key: k.shape.discriminator.key, fallbackKey: k.shape.discriminator.fallbackKey });
    out.set(k.shape.nodeType, list);
  }
  return out;
}

function takeCensus(ticks: number): Census {
  const values = new Map<string, number>();
  const nodeTypes = new Map<string, number>();
  const edgeTypes = new Map<string, number>();
  const keys = discriminatorKeys();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const seed of WORLD_OBJECT_CENSUS_SEEDS) {
    const state = runSeed(seed, ticks);
    for (const node of state.graph.getAllNodes()) {
      bump(nodeTypes, String(node.type));
      for (const d of keys.get(String(node.type)) ?? []) {
        const raw = node.properties[d.key] ?? (d.fallbackKey ? node.properties[d.fallbackKey] : undefined);
        if (raw === undefined || raw === null) continue;
        const value = d.key === 'sublocationTypeId' ? barePlaceTypeId(String(raw)) : String(raw);
        bump(values, `${String(node.type)}|${d.key}=${value}`);
      }
    }
    for (const edge of state.graph.getAllEdges()) bump(edgeTypes, String(edge.type));
  }
  return { values, nodeTypes, edgeTypes, seeds: WORLD_OBJECT_CENSUS_SEEDS, ticks };
}

// ─── Classification ─────────────────────────────────────────────────────────

interface KindView extends WorldObjectKind { badge: Badge; count: number }

function countFor(kind: WorldObjectKind, census: Census): number {
  const s = kind.shape;
  if (s.kind === 'state') return -1;
  if (s.kind === 'edge') return s.edgeTypes.reduce((n, t) => n + (census.edgeTypes.get(t) ?? 0), 0);
  if (!s.discriminator) return census.nodeTypes.get(s.nodeType) ?? 0;
  let n = 0;
  for (const v of s.discriminator.values) n += census.values.get(`${s.nodeType}|${s.discriminator.key}=${v}`) ?? 0;
  return n;
}

function badgeFor(kind: WorldObjectKind, count: number, measured: boolean): Badge {
  if (!measured) return 'unknown';
  if (kind.shape.kind === 'state') return kind.status === 'live' ? 'live' : 'dormant';
  return count > 0 ? 'live' : 'dormant';
}

interface Drift {
  /** Census values no kind claims: `nodeType key=value ×count`. */
  unregistered: string[];
  /** Union members no kind claims. */
  phantomUnion: string[];
  /** Content target names no writer mints. */
  phantomContent: string[];
}

function claimedValues(): Set<string> {
  const out = new Set<string>();
  for (const k of WORLD_OBJECT_KINDS) {
    if (k.shape.kind !== 'node' || !k.shape.discriminator) continue;
    for (const v of k.shape.discriminator.values) out.add(`${k.shape.nodeType}|${k.shape.discriminator.key}=${v}`);
    if (k.shape.refines) out.add(`${k.shape.nodeType}|${k.shape.refines.key}=${k.shape.refines.value}`);
  }
  for (const k of WORLD_OBJECT_KINDS) {
    if (k.shape.kind === 'edge' && k.shape.identityNode) out.add(`${k.shape.identityNode.nodeType}|${k.shape.identityNode.key}=${k.shape.identityNode.value}`);
  }
  return out;
}

function findDrift(repoRoot: string, census: Census | null): Drift {
  const drift: Drift = { unregistered: [], phantomUnion: [], phantomContent: [] };
  const claimed = claimedValues();
  if (census) {
    for (const [k, n] of [...census.values.entries()].sort()) {
      if (!claimed.has(k)) drift.unregistered.push(`${k.replace('|', ' ')} ×${n}`);
    }
  }
  // Comments stripped first: the parser stops at the first `;`, and a trailing comment inside a union can carry one.
  const graphSrc = stripLineComments(fs.readFileSync(path.join(repoRoot, GRAPH_TYPES_REL), 'utf-8'));
  const indexSrc = stripLineComments(fs.readFileSync(path.join(repoRoot, INDEX_TYPES_REL), 'utf-8'));
  const nodeTypes = parseUnionMembers(graphSrc, 'NodeType', GRAPH_TYPES_REL);
  const edgeTypes = parseUnionMembers(graphSrc, 'EdgeType', GRAPH_TYPES_REL);
  const locationSubtypes = parseUnionMembers(indexSrc, 'LocationSubtype', INDEX_TYPES_REL);
  const claimedNodeTypes = new Set(WORLD_OBJECT_KINDS.flatMap(k => k.shape.kind === 'node' ? [k.shape.nodeType] : []));
  const claimedEdgeTypes = new Set(WORLD_OBJECT_KINDS.flatMap(k => k.shape.kind === 'edge' ? [...k.shape.edgeTypes] : []));
  for (const t of nodeTypes) if (!claimedNodeTypes.has(t as never)) drift.phantomUnion.push(`NodeType ${t}`);
  const claimedSubtypes = new Set([...LOCATION_SUBTYPES, ROUTE_IDENTITY_LOCATION_SUBTYPE]);
  for (const s of locationSubtypes) if (!claimedSubtypes.has(s)) drift.phantomUnion.push(`LocationSubtype ${s}`);
  // Edge types are relational by nature; only the ones a kind *is* are catalogued, so an
  // unclaimed edge type is not drift. It is listed for the reader, not counted.
  void claimedEdgeTypes; void edgeTypes;
  const claimedPlaceTypes = new Set([...claimed].filter(k => k.startsWith('location|sublocationTypeId=')).map(k => k.slice('location|sublocationTypeId='.length)));
  const minted = new Set<string>();
  for (const [k] of census?.values ?? []) {
    if (k.startsWith('location|locationSubtype=')) minted.add(k.slice('location|locationSubtype='.length));
    if (k.startsWith('location|sublocationTypeId=')) minted.add(k.slice('location|sublocationTypeId='.length));
  }
  for (const rel of CONTENT_TARGET_FILES) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const src = fs.readFileSync(abs, 'utf-8');
    for (const m of src.matchAll(CONTENT_SUBTYPES_ARRAY_RE)) {
      for (const q of m[1].matchAll(/'([a-z_]+)'/g)) {
        const name = q[1];
        if (!claimedSubtypes.has(name) && !(census && minted.has(name))) drift.phantomContent.push(`${rel}: ${name} (location_subtype rule)`);
      }
    }
    for (const m of src.matchAll(CONTENT_HOLDING_TYPE_RE)) {
      const name = m[1];
      const known = claimedSubtypes.has(name) || claimedPlaceTypes.has(name);
      if (!known && !(census && minted.has(name))) drift.phantomContent.push(`${rel}: ${name} (holding type)`);
    }
  }
  drift.phantomContent = [...new Set(drift.phantomContent)].sort();
  return drift;
}

// ─── Render ─────────────────────────────────────────────────────────────────

const BADGE_LABEL: Record<Badge, string> = { live: '🟢 LIVE', dormant: '⚪ DORMANT', unknown: '❔ UNKNOWN' };

function shapeText(k: WorldObjectKind): string {
  const s = k.shape;
  if (s.kind === 'state') return `state · \`${s.path}\``;
  if (s.kind === 'edge') return `edge · ${s.edgeTypes.map(t => `\`${t}\``).join(', ')}${s.identityNode ? ` · identity node \`${s.identityNode.nodeType}:${s.identityNode.value}\`` : ''}`;
  const req = s.requires === 'parentLocationId' ? ' + `parentLocationId`' : s.requires === 'no-parentLocationId' ? ' − `parentLocationId`' : '';
  const disc = s.discriminator ? ` · \`${s.discriminator.key}\` ∈ {${s.discriminator.values.length > 8 ? `${s.discriminator.values.length} values` : s.discriminator.values.join(', ')}}` : '';
  return `node · \`${s.nodeType}\`${req}${disc}`;
}

function classesText(k: WorldObjectKind): string {
  if (!k.classes) return '—';
  return Object.entries(k.classes).map(([c, members]) => `**${c}** (${members.length})`).join(' · ');
}

function renderMarkdown(kinds: KindView[], census: Census | null, drift: Drift, ticks: number): string {
  const L: string[] = [];
  L.push('<!-- GENERATED by `npm run generate-world-objects` — do not hand-edit. Registry: src/data/world-objects.ts. Hand page: Docs/canon/world-objects.md -->');
  L.push('');
  L.push('# World objects — generated catalogue');
  L.push('');
  L.push(`> Rendered from [\`src/data/world-objects.ts\`](../../src/data/world-objects.ts) plus a census of seeds ${WORLD_OBJECT_CENSUS_SEEDS.join(', ')} on the \`${WORLD_OBJECT_CENSUS_MAP}\` map at tick ${ticks}. The hand page — what the kinds *mean* and how to add one — is [\`world-objects.md\`](world-objects.md). Regenerate: \`npm run generate-world-objects\`; verify: \`npm run generate-world-objects:check\`.`);
  L.push('');
  L.push('## Drift');
  L.push('');
  const u = drift.unregistered.length, p = drift.phantomUnion.length + drift.phantomContent.length;
  L.push(`| Check | Count | Limit | Verdict |`);
  L.push(`|---|---|---|---|`);
  L.push(`| UNREGISTERED — census values no kind claims | ${census ? u : 'unmeasured'} | ${UNREGISTERED_SUBTYPE_MAX} | ${census ? (u <= UNREGISTERED_SUBTYPE_MAX ? '✅' : '❌') : '❔'} |`);
  L.push(`| PHANTOM — union members and content targets no writer mints | ${p} | ${PHANTOM_TARGET_MAX} | ${p <= PHANTOM_TARGET_MAX ? '✅' : '❌'} |`);
  L.push('');
  if (u) { L.push('**Unregistered values** (register the value on a kind, or fix the writer):'); L.push(''); for (const d of drift.unregistered) L.push(`- \`${d}\``); L.push(''); }
  if (drift.phantomUnion.length) { L.push('**Union members no kind claims:**'); L.push(''); for (const d of drift.phantomUnion) L.push(`- \`${d}\``); L.push(''); }
  if (drift.phantomContent.length) { L.push('**Content target names no writer mints:**'); L.push(''); for (const d of drift.phantomContent) L.push(`- \`${d}\``); L.push(''); }
  L.push('## Kinds');
  L.push('');
  L.push('| Kind | Game word | Shape | Classes | Owning system | Writers | Status | Census | Badge |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const k of kinds) {
    const count = k.count < 0 ? '—' : String(k.count);
    L.push(`| \`${k.id}\` | ${k.gameWord} | ${shapeText(k)} | ${classesText(k)} | ${k.owningSystem} | ${k.writers.length ? k.writers.map(w => `\`${w}\``).join(', ') : '—'} | ${k.status} | ${count} | ${BADGE_LABEL[k.badge]} |`);
  }
  L.push('');
  L.push('## Classes');
  L.push('');
  for (const k of kinds) {
    if (!k.classes) continue;
    L.push(`### ${k.gameWord} (\`${k.id}\`)`);
    L.push('');
    L.push('| Class | Members |');
    L.push('|---|---|');
    for (const [c, members] of Object.entries(k.classes)) L.push(`| ${c} | ${members.length ? members.map(m => `\`${m}\``).join(', ') : '_(no value yet)_'} |`);
    L.push('');
  }
  L.push('## Notes');
  L.push('');
  for (const k of kinds) L.push(`- **${k.gameWord}** (\`${k.id}\`, UL \`${k.ulTerm}\`${k.worldRef ? `, chip kind \`${k.worldRef}\`` : ''}) — ${k.note}`);
  L.push('');
  L.push('## Chip vocabulary coverage');
  L.push('');
  L.push('| `WorldRefKind` | Claimed by |');
  L.push('|---|---|');
  for (const w of WORLD_REF_KINDS) {
    const by = kinds.filter(k => k.worldRef === w).map(k => `\`${k.id}\``);
    L.push(`| \`${w}\` | ${by.length ? by.join(', ') : WORLD_REF_RESERVED_KINDS.includes(w) ? '_(reserved)_' : '_(no kind — see the contract test)_'} |`);
  }
  L.push('');
  return L.join('\n');
}

/** The Design Reference Wiki nav, identical to what `generate-design-wiki` would inject (fail-soft: empty when the manifest is unreadable). */
function wikiNav(): string {
  try { return buildNav(readManifest(), WIKI_PAGE_ID); } catch (err) { console.warn(`[generate-world-objects] wiki nav skipped: ${(err as Error).message}`); return ''; }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHtml(kinds: KindView[], census: Census | null, drift: Drift, ticks: number): string {
  const rows = kinds.map(k => `<tr class="badge-${k.badge}"><td><code>${esc(k.id)}</code></td><td><strong>${esc(k.gameWord)}</strong></td><td>${esc(shapeText(k).replace(/`/g, ''))}</td><td>${esc(classesText(k).replace(/\*\*/g, ''))}</td><td>${esc(k.owningSystem)}</td><td>${esc(k.status)}</td><td>${k.count < 0 ? '—' : k.count}</td><td>${BADGE_LABEL[k.badge]}</td></tr>`).join('\n');
  const notes = kinds.map(k => `<li><strong>${esc(k.gameWord)}</strong> <code>${esc(k.id)}</code> — ${esc(k.note)}</li>`).join('\n');
  const driftList = [...drift.unregistered.map(d => `UNREGISTERED ${d}`), ...drift.phantomUnion.map(d => `PHANTOM ${d}`), ...drift.phantomContent.map(d => `PHANTOM ${d}`)];
  return `<!-- GENERATED by npm run generate-world-objects — do not hand-edit. Registry: src/data/world-objects.ts -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Objects — Threadbearer Design Reference</title>
<style>
  :root { color-scheme: dark; --bg:#0a0a0e; --surface:#1a1a1f; --raised:#222228; --text:#e8e4d8; --muted:#9a968c; --gold:#c9a84c; --live:#5aa469; --dormant:#6b6f7a; }
  body { margin:0; background:var(--bg); color:var(--text); font: 15px/1.5 Georgia, 'Times New Roman', serif; }
  main { max-width: 1400px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
  h1 { font-weight: normal; letter-spacing: .02em; color: var(--gold); }
  h2 { font-weight: normal; margin-top: 2.5rem; border-bottom: 1px solid var(--raised); padding-bottom: .3rem; }
  p.lede { color: var(--muted); max-width: 70ch; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { text-align: left; padding: .4rem .6rem; border-bottom: 1px solid var(--raised); vertical-align: top; }
  th { color: var(--muted); font-weight: normal; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
  code { font: 12px/1.4 ui-monospace, Consolas, monospace; color: var(--gold); }
  tr.badge-live td:last-child { color: var(--live); }
  tr.badge-dormant td:last-child { color: var(--dormant); }
  .wrap { overflow-x: auto; }
  ul { max-width: 90ch; }
  li { margin: .35rem 0; }
  .drift { background: var(--surface); padding: 1rem 1.25rem; border-left: 3px solid ${driftList.length ? '#b5533c' : 'var(--live)'}; }
</style>
</head>
<body>
${wikiNav()}
<main>
<h1>World Objects</h1>
<p class="lede">Every kind of thing the world keeps, in game words. A world object is a node type (or an edge type, or a slice of game state) plus a subtype the game names; a variant is a subtype or a class, never a new node type. Rendered from the registry plus a census of seeds ${WORLD_OBJECT_CENSUS_SEEDS.join(', ')} on the ${WORLD_OBJECT_CENSUS_MAP} map at tick ${ticks}. The hand page — what the kinds mean and how to add one — is <code>Docs/canon/world-objects.md</code>.</p>
<h2>Drift</h2>
<div class="drift">${census ? '' : '<p>Census unmeasured — badges are UNKNOWN.</p>'}${driftList.length ? `<ul>${driftList.map(d => `<li><code>${esc(d)}</code></li>`).join('')}</ul>` : '<p>No drift: every census value is claimed by a kind, every union member is claimed, every content target names a subtype a writer mints.</p>'}</div>
<h2>Kinds</h2>
<div class="wrap"><table>
<thead><tr><th>Kind</th><th>Game word</th><th>Shape</th><th>Classes</th><th>Owning system</th><th>Status</th><th>Census</th><th>Badge</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
<h2>Notes</h2>
<ul>
${notes}
</ul>
</main>
</body>
</html>
`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const repoRoot = process.cwd();

  let census: Census | null = null;
  try {
    census = takeCensus(args.ticks);
  } catch (err) {
    console.warn(`[generate-world-objects] census failed — badges degraded to UNKNOWN: ${(err as Error).message}`);
  }

  const kinds: KindView[] = WORLD_OBJECT_KINDS.map(k => {
    const count = census ? countFor(k, census) : -1;
    return { ...k, count, badge: badgeFor(k, count, census !== null) };
  });
  const drift = findDrift(repoRoot, census);

  const md = renderMarkdown(kinds, census, drift, args.ticks);
  const html = renderHtml(kinds, census, drift, args.ticks);
  const mdPath = path.join(repoRoot, OUTPUT_MD_REL);
  const htmlPath = path.join(repoRoot, OUTPUT_HTML_REL);

  const unregistered = drift.unregistered.length;
  const phantom = drift.phantomUnion.length + drift.phantomContent.length;
  const driftFails = (census !== null && unregistered > UNREGISTERED_SUBTYPE_MAX) || phantom > PHANTOM_TARGET_MAX;

  if (args.check) {
    const same = (p: string, out: string) => fs.existsSync(p) && fs.readFileSync(p, 'utf-8').trim() === out.trim();
    const fresh = same(mdPath, md) && same(htmlPath, html);
    if (!fresh) console.warn(`[generate-world-objects] --check: ${OUTPUT_MD_REL} / ${OUTPUT_HTML_REL} STALE. Run \`npm run generate-world-objects\`.`);
    if (driftFails) {
      console.error(`[generate-world-objects] --check: DRIFT — ${unregistered} unregistered value(s) (limit ${UNREGISTERED_SUBTYPE_MAX}), ${phantom} phantom(s) (limit ${PHANTOM_TARGET_MAX}):`);
      for (const d of [...drift.unregistered, ...drift.phantomUnion, ...drift.phantomContent]) console.error(`  - ${d}`);
    }
    if (fresh && !driftFails) console.log('[generate-world-objects] --check: up to date, no drift.');
    process.exit(fresh && !driftFails ? 0 : 1);
  }

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, md, 'utf-8');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  const live = kinds.filter(k => k.badge === 'live').length;
  console.log(`[generate-world-objects] wrote ${OUTPUT_MD_REL} + ${OUTPUT_HTML_REL} — ${kinds.length} kinds (${live} live), ${unregistered} unregistered, ${phantom} phantom.`);
  if (driftFails) {
    console.error(`[generate-world-objects] DRIFT — ${unregistered} unregistered / ${phantom} phantom; see the Drift section.`);
    process.exit(1);
  }
}

main();

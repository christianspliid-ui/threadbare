/**
 * generate-content-objects — THR-1485, slice 1 of THR-1481.
 *
 * Renders the content-object catalogue from the registry (`src/data/content-objects.ts`)
 * plus a census of the real catalogs, and fails by name on drift. Two outputs:
 *
 *   - `Docs/canon/content-objects.generated.md` — the grep-able catalogue: one row per
 *     kind with its game word, catalogs, entry count, gate and a badge.
 *   - `public/content-objects-reference.html` — the same catalogue as a served wiki page.
 *
 * Unlike its world-object sibling this generator boots **no world**: content is
 * authored, not minted, so the census is a static read of the catalogs and runs in
 * about a second. That is why it is cheap enough to sit under `check:generated-freshness`
 * without the ~40s cost the world-object catalogue pays.
 *
 * The drift verdicts are the point of the file:
 *
 *   - UNCLAIMED — a catalog holds an id no kind's prefixes claim. Someone authored a
 *     new family and the catalogue has no word for it.
 *   - EMPTY — a kind whose catalogs yield no entry under its own prefixes. Either the
 *     catalog moved or the prefixes rotted; both are the same silence.
 *   - UNGATED — a kind with no machine gate. Not a failure (most kinds have none yet),
 *     but counted, because "how much of the corpus is ungated" is the number slice 4
 *     is judged by.
 *
 * Tag coverage per axis is rendered as `—` in slice 1: the vocabulary lands in slice 2
 * (`src/data/content-tags.ts`), and a column of zeroes would read as "no tags authored"
 * rather than "no vocabulary yet to count against".
 *
 * Fail-soft (NFP #4): a catalog that throws on import is reported as UNKNOWN rather
 * than taking the whole catalogue down.
 *
 * Usage:
 *   npm run generate-content-objects
 *   npm run generate-content-objects:check
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  CONTENT_OBJECT_KINDS,
  SHARED_ID_PREFIXES,
  contentKindsForId,
  type ContentObjectKind,
} from '../src/data/content-objects';
import { CONTENT_CATALOGS, catalogKey, entriesOfKind } from '../src/data/contentCatalogs';
import { WORLD_OBJECT_KINDS } from '../src/data/world-objects';
import { readManifest, buildNav } from './design-wiki-nav.ts';

/** The page's id in `public/wiki-manifest.json`; the hub nav is rendered here so the file needs no post-pass. */
const WIKI_PAGE_ID = 'content-objects';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────────────

/** `--check` fails above this: one unclaimed id is one authored family the catalogue lacks a word for. */
export const UNCLAIMED_ID_MAX = 0;
/** `--check` fails above this: a kind with no entries is a registry row pointing at nothing. */
export const EMPTY_KIND_MAX = 0;

const OUTPUT_MD_REL = path.join('Docs', 'canon', 'content-objects.generated.md');
const OUTPUT_HTML_REL = path.join('public', 'content-objects-reference.html');

// ─── Census ─────────────────────────────────────────────────────────────────

interface KindView extends ContentObjectKind {
  /** Entries this kind's prefixes claim across its catalogs, de-duplicated. */
  readonly count: number;
  /** Per-catalog counts, in registry order. */
  readonly perCatalog: ReadonlyArray<{ key: string; total: number; claimed: number }>;
  readonly badge: 'live' | 'dormant' | 'legacy' | 'empty';
}

interface Drift {
  /** `catalogKey: id` for every catalog id no kind claims. */
  readonly unclaimed: readonly string[];
  /** Kind ids whose own prefixes claim nothing in their own catalogs. */
  readonly emptyKinds: readonly string[];
  /** Kind ids with no machine gate — counted, never fatal. */
  readonly ungated: readonly string[];
}

function buildViews(): KindView[] {
  return CONTENT_OBJECT_KINDS.map(k => {
    const perCatalog = k.catalogs.map(ref => {
      const key = catalogKey(ref);
      const entries = CONTENT_CATALOGS[key] ?? [];
      return {
        key,
        total: entries.length,
        claimed: entries.filter(e => k.idPrefixes.some(p => e.id.startsWith(p))).length,
      };
    });
    const count = entriesOfKind(k.id).length;
    const badge: KindView['badge'] = count === 0 ? 'empty' : k.status;
    return { ...k, count, perCatalog, badge };
  });
}

function findDrift(views: readonly KindView[]): Drift {
  const unclaimed: string[] = [];
  const seenKeys = new Set<string>();
  for (const v of views) {
    for (const ref of v.catalogs) {
      const key = catalogKey(ref);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      for (const entry of CONTENT_CATALOGS[key] ?? []) {
        if (contentKindsForId(entry.id).length === 0) unclaimed.push(`${key}: ${entry.id}`);
      }
    }
  }
  return {
    unclaimed,
    emptyKinds: views.filter(v => v.count === 0).map(v => v.id),
    ungated: views.filter(v => v.gate === null).map(v => v.id),
  };
}

// ─── Render ─────────────────────────────────────────────────────────────────

const BADGE_LABEL: Record<KindView['badge'], string> = {
  live: '🟢 LIVE',
  dormant: '🟠 DORMANT',
  legacy: '⚪ LEGACY',
  empty: '🔴 EMPTY',
};

const catalogsText = (k: KindView): string =>
  k.perCatalog.map(c => `\`${c.key.split('#')[1]}\` (${c.claimed}/${c.total})`).join('<br>');

const axesText = (k: KindView): string => (k.requiredAxes.length ? k.requiredAxes.map(a => `\`${a}\``).join(', ') : '_(slice 2)_');

const projectionsText = (k: KindView): string => {
  const entries = Object.entries(k.projections);
  return entries.length ? entries.map(([axis, field]) => `${axis} ← \`${field}\``).join(', ') : '—';
};

function renderMarkdown(views: readonly KindView[], drift: Drift): string {
  const L: string[] = [];
  const totalEntries = views.reduce((n, v) => n + v.count, 0);
  L.push('---');
  L.push('domain: content-objects');
  L.push('status: generated');
  L.push('generator: npm run generate-content-objects');
  L.push('---');
  L.push('');
  L.push('# Content objects — generated catalogue');
  L.push('');
  L.push('> **GENERATED — do not hand-edit.** Rendered by `npm run generate-content-objects` from the registry (`src/data/content-objects.ts`) and a static census of the catalogs it names. The hand page — what the kinds mean and how to add one — is [`content-objects.md`](content-objects.md).');
  L.push('');
  L.push(`${views.length} kinds · ${totalEntries} claimed entries across ${Object.keys(CONTENT_CATALOGS).length} catalogs.`);
  L.push('');
  L.push('## Drift');
  L.push('');
  if (drift.unclaimed.length === 0 && drift.emptyKinds.length === 0) {
    L.push('No drift: every catalog id is claimed by a kind, and every kind\'s prefixes claim entries in its own catalogs.');
  }
  if (drift.unclaimed.length) {
    L.push(`**UNCLAIMED — ${drift.unclaimed.length} catalog id(s) no kind claims** (limit ${UNCLAIMED_ID_MAX}):`);
    L.push('');
    for (const d of drift.unclaimed) L.push(`- \`${d}\``);
    L.push('');
  }
  if (drift.emptyKinds.length) {
    L.push(`**EMPTY — ${drift.emptyKinds.length} kind(s) whose prefixes claim nothing** (limit ${EMPTY_KIND_MAX}):`);
    L.push('');
    for (const d of drift.emptyKinds) L.push(`- \`${d}\``);
    L.push('');
  }
  L.push('');
  L.push(`**Ungated kinds — ${drift.ungated.length} of ${views.length}.** Counted, not fatal: most content kinds have no machine gate yet, and closing that is what the later slices of THR-1481 are judged by.`);
  L.push('');
  for (const id of drift.ungated) L.push(`- \`${id}\``);
  L.push('');
  L.push('## Kinds');
  L.push('');
  L.push('| Kind | Game word | Entries | Catalogs (claimed/total) | Instantiates as | Gate | Owning system | Badge |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const v of views) {
    L.push(`| \`${v.id}\` | ${v.gameWord} | ${v.count} | ${catalogsText(v)} | ${v.instantiatesAs ? `\`${v.instantiatesAs}\`` : '_(nothing)_'} | ${v.gate ? `\`npm run ${v.gate}\`` : '—'} | ${v.owningSystem} | ${BADGE_LABEL[v.badge]} |`);
  }
  L.push('');
  L.push('## Tag axes');
  L.push('');
  L.push('Required axes and projections land with the vocabulary in slice 2 (`src/data/content-tags.ts`). Tag coverage per axis is deliberately not rendered here yet — a column of zeroes would read as "no tags authored" rather than "no vocabulary to count against".');
  L.push('');
  L.push('| Kind | Required axes | Projections (axis ← typed field) |');
  L.push('|---|---|---|');
  for (const v of views) L.push(`| \`${v.id}\` | ${axesText(v)} | ${projectionsText(v)} |`);
  L.push('');
  L.push('## Id prefixes');
  L.push('');
  L.push('Prefixes are claimed for **totality**, not ownership: every id in a kind\'s catalogs starts with one of them. Exclusivity sits on the catalog export. A prefix genuinely shared between kinds is declared below with its reason.');
  L.push('');
  L.push('| Kind | Prefixes |');
  L.push('|---|---|');
  for (const v of views) L.push(`| \`${v.id}\` | ${v.idPrefixes.map(p => `\`${p}\``).join(' ')} |`);
  L.push('');
  L.push('### Shared prefixes');
  L.push('');
  for (const [p, reason] of Object.entries(SHARED_ID_PREFIXES)) L.push(`- \`${p}\` — ${reason}`);
  L.push('');
  L.push('## World-object join');
  L.push('');
  L.push('What a granted entry becomes. The reverse pointer — a `content`-status world-object row naming its content kind — is pinned by `contentObjects.test.ts`.');
  L.push('');
  L.push('| Content kind | Instantiates as | World-object row status |');
  L.push('|---|---|---|');
  for (const v of views) {
    const wo = WORLD_OBJECT_KINDS.find(w => w.id === v.instantiatesAs);
    L.push(`| \`${v.id}\` | ${v.instantiatesAs ? `\`${v.instantiatesAs}\`` : '_(nothing — by decision)_'} | ${wo ? wo.status : '—'} |`);
  }
  L.push('');
  L.push('## Notes');
  L.push('');
  for (const v of views) L.push(`- **${v.gameWord}** (\`${v.id}\`, UL \`${v.ulTerm}\`) — ${v.note}`);
  L.push('');
  return L.join('\n');
}

/** The Design Reference Wiki nav (fail-soft: empty when the manifest is unreadable). */
function wikiNav(): string {
  try { return buildNav(readManifest(), WIKI_PAGE_ID); } catch (err) { console.warn(`[generate-content-objects] wiki nav skipped: ${(err as Error).message}`); return ''; }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHtml(views: readonly KindView[], drift: Drift): string {
  const rows = views.map(v => `<tr class="badge-${v.badge}"><td><code>${esc(v.id)}</code></td><td><strong>${esc(v.gameWord)}</strong></td><td>${v.count}</td><td>${esc(v.perCatalog.map(c => `${c.key.split('#')[1]} (${c.claimed}/${c.total})`).join(' · '))}</td><td>${v.instantiatesAs ? `<code>${esc(v.instantiatesAs)}</code>` : '—'}</td><td>${v.gate ? `<code>${esc(v.gate)}</code>` : '—'}</td><td>${esc(v.owningSystem)}</td><td>${BADGE_LABEL[v.badge]}</td></tr>`).join('\n');
  const prefixRows = views.map(v => `<tr><td><code>${esc(v.id)}</code></td><td>${v.idPrefixes.map(p => `<code>${esc(p)}</code>`).join(' ')}</td></tr>`).join('\n');
  const notes = views.map(v => `<li><strong>${esc(v.gameWord)}</strong> <code>${esc(v.id)}</code> — ${esc(v.note)}</li>`).join('\n');
  const shared = Object.entries(SHARED_ID_PREFIXES).map(([p, r]) => `<li><code>${esc(p)}</code> — ${esc(r)}</li>`).join('\n');
  const driftList = [...drift.unclaimed.map(d => `UNCLAIMED ${d}`), ...drift.emptyKinds.map(d => `EMPTY ${d}`)];
  const totalEntries = views.reduce((n, v) => n + v.count, 0);
  return `<!-- GENERATED by npm run generate-content-objects — do not hand-edit. Registry: src/data/content-objects.ts -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Content Objects — Threadbearer Design Reference</title>
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
  tr.badge-dormant td:last-child, tr.badge-legacy td:last-child { color: var(--dormant); }
  .wrap { overflow-x: auto; }
  ul { max-width: 90ch; }
  li { margin: .35rem 0; }
  .drift { background: var(--surface); padding: 1rem 1.25rem; border-left: 3px solid ${driftList.length ? '#b5533c' : 'var(--live)'}; }
</style>
</head>
<body>
${wikiNav()}
<main>
<h1>Content Objects</h1>
<p class="lede">Every kind of authored content the game hands out, in game words. The sibling of World Objects: that registry says what is <em>in</em> the world, this one says what an author may <em>write</em> — and <code>instantiatesAs</code> is the join between them. ${views.length} kinds, ${totalEntries} claimed entries across ${Object.keys(CONTENT_CATALOGS).length} catalogs. The hand page — what the kinds mean and how to add one — is <code>Docs/canon/content-objects.md</code>.</p>
<h2>Drift</h2>
<div class="drift">${driftList.length ? `<ul>${driftList.map(d => `<li><code>${esc(d)}</code></li>`).join('')}</ul>` : '<p>No drift: every catalog id is claimed by a kind, and every kind\'s prefixes claim entries in its own catalogs.</p>'}<p><strong>${drift.ungated.length} of ${views.length} kinds are ungated</strong> — counted, not fatal: <code>${esc(drift.ungated.join(', '))}</code>.</p></div>
<h2>Kinds</h2>
<div class="wrap"><table>
<thead><tr><th>Kind</th><th>Game word</th><th>Entries</th><th>Catalogs (claimed/total)</th><th>Instantiates as</th><th>Gate</th><th>Owning system</th><th>Badge</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
<h2>Id prefixes</h2>
<p class="lede">Prefixes are claimed for <strong>totality</strong>, not ownership: every id in a kind's catalogs starts with one of them. Exclusivity sits on the catalog export.</p>
<div class="wrap"><table>
<thead><tr><th>Kind</th><th>Prefixes</th></tr></thead>
<tbody>
${prefixRows}
</tbody></table></div>
<h3>Shared prefixes</h3>
<ul>
${shared}
</ul>
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

function parseArgs(): { check: boolean } {
  return { check: process.argv.includes('--check') };
}

function main(): void {
  const args = parseArgs();
  const repoRoot = process.cwd();

  let views: KindView[];
  try {
    views = buildViews();
  } catch (err) {
    console.error(`[generate-content-objects] catalogs failed to census: ${(err as Error).message}`);
    process.exit(1);
    return;
  }
  const drift = findDrift(views);

  const md = renderMarkdown(views, drift);
  const html = renderHtml(views, drift);
  const mdPath = path.join(repoRoot, OUTPUT_MD_REL);
  const htmlPath = path.join(repoRoot, OUTPUT_HTML_REL);

  const driftFails = drift.unclaimed.length > UNCLAIMED_ID_MAX || drift.emptyKinds.length > EMPTY_KIND_MAX;

  if (args.check) {
    const same = (p: string, out: string) => fs.existsSync(p) && fs.readFileSync(p, 'utf-8').trim() === out.trim();
    const fresh = same(mdPath, md) && same(htmlPath, html);
    if (!fresh) console.warn(`[generate-content-objects] --check: ${OUTPUT_MD_REL} / ${OUTPUT_HTML_REL} STALE. Run \`npm run generate-content-objects\`.`);
    if (driftFails) {
      console.error(`[generate-content-objects] --check: DRIFT — ${drift.unclaimed.length} unclaimed id(s) (limit ${UNCLAIMED_ID_MAX}), ${drift.emptyKinds.length} empty kind(s) (limit ${EMPTY_KIND_MAX}):`);
      for (const d of [...drift.unclaimed, ...drift.emptyKinds]) console.error(`  - ${d}`);
    }
    if (fresh && !driftFails) console.log('[generate-content-objects] --check: up to date, no drift.');
    process.exit(fresh && !driftFails ? 0 : 1);
  }

  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, md, 'utf-8');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  const totalEntries = views.reduce((n, v) => n + v.count, 0);
  console.log(`[generate-content-objects] wrote ${OUTPUT_MD_REL} + ${OUTPUT_HTML_REL} — ${views.length} kinds, ${totalEntries} claimed entries, ${drift.unclaimed.length} unclaimed, ${drift.ungated.length} ungated.`);
  if (driftFails) {
    console.error(`[generate-content-objects] DRIFT — ${drift.unclaimed.length} unclaimed / ${drift.emptyKinds.length} empty; see the Drift section.`);
    process.exit(1);
  }
}

main();

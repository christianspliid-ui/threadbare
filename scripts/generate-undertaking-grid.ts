/**
 * generate-undertaking-grid — the map of undertakings over the world model (THR-1392
 * slice 4; Christian, 2026-09-03: keep it up to date as undertakings are developed and
 * named, so no chance of connecting a verb to a part of the world graph is missed).
 *
 * The grid is every world-object kind (`src/data/world-objects.ts`) × every undertaking
 * verb variant (`UNDERTAKING_VERB_VARIANTS`). Each cell is one of:
 *
 *   - LIVE — the object-type registry (`src/data/undertaking-objects.ts`) declares a
 *     semantic; the registry is the only source of a live cell.
 *   - OPEN — the model admits it and no operation exists yet; a named decision.
 *   - NO   — not an object of undertakings, with the reason.
 *
 * The curated half (`scripts/undertaking-grid-dispositions.ts`) must be total and
 * fresh: every live cell has a note, every non-live cell has a disposition, and no
 * disposition names a cell the registry now declares. Any of the three failing exits
 * non-zero **from the generator itself**, not only from `--check`, because the point
 * of the map is that it cannot silently fall behind the code.
 *
 * Outputs: `Docs/canon/undertaking-grid.generated.md` (grep-able) and
 * `public/undertaking-grid-reference.html` (the served wiki page, with the hub nav).
 *
 * Usage:
 *   npm run generate-undertaking-grid
 *   npm run generate-undertaking-grid:check
 */

import * as fs from 'fs';
import * as path from 'path';

import { WORLD_OBJECT_KINDS, type WorldObjectKindId } from '../src/data/world-objects';
import { UNDERTAKING_OBJECT_TYPES } from '../src/data/undertaking-objects';
import { UNDERTAKING_VERB_VARIANTS, UNDERTAKING_VERBS } from '../src/data/strategic-action-constants';
import { UNDERTAKING_VERB_WORDS } from '../src/data/undertaking-verb-prose';
import type { UndertakingVerbVariant } from '../src/types/strategicAction';
import { NOT_AN_OBJECT, LIVE_CELL_NOTES, CELL_DISPOSITIONS, type CellDisposition, type LiveCellNote } from './undertaking-grid-dispositions.ts';
import { readManifest, buildNav } from './design-wiki-nav.ts';

const OUTPUT_MD_REL = path.join('Docs', 'canon', 'undertaking-grid.generated.md');
const OUTPUT_HTML_REL = path.join('public', 'undertaking-grid-reference.html');
const WIKI_PAGE_ID = 'undertaking-grid';

type CellStatus = 'live' | 'open' | 'no';
interface Cell {
  readonly kind: WorldObjectKindId;
  readonly variant: UndertakingVerbVariant;
  readonly status: CellStatus;
  readonly note: string;
  readonly op?: string;
  readonly retires?: readonly string[];
}

function buildGrid(): { cells: Cell[]; problems: string[] } {
  const cells: Cell[] = [];
  const problems: string[] = [];
  const declared = new Map<string, boolean>();
  for (const t of UNDERTAKING_OBJECT_TYPES) for (const v of UNDERTAKING_VERB_VARIANTS) if (t.verbs[v] !== undefined) declared.set(`${t.id}|${v}`, true);
  const typeIds = new Set(UNDERTAKING_OBJECT_TYPES.map(t => t.id as string));

  for (const kind of WORLD_OBJECT_KINDS) {
    const notAnObject = NOT_AN_OBJECT[kind.id];
    const notes = LIVE_CELL_NOTES[kind.id] ?? {};
    const dispositions = CELL_DISPOSITIONS[kind.id] ?? {};
    if (notAnObject && typeIds.has(kind.id)) problems.push(`${kind.id}: listed in NOT_AN_OBJECT but registered as an undertaking object type`);
    if (!notAnObject && !typeIds.has(kind.id) && Object.keys(dispositions).length === 0) {
      problems.push(`${kind.id}: no NOT_AN_OBJECT reason and no dispositions — every kind must be on the map`);
    }
    for (const v of UNDERTAKING_VERB_VARIANTS) {
      const isLive = declared.get(`${kind.id}|${v}`) === true;
      const note = (notes as Partial<Record<UndertakingVerbVariant, LiveCellNote>>)[v];
      const disp = (dispositions as Partial<Record<UndertakingVerbVariant, CellDisposition>>)[v];
      if (isLive) {
        if (!note) problems.push(`${kind.id} × ${v}: LIVE in the registry but has no LIVE_CELL_NOTES entry — name it on the map`);
        if (disp) problems.push(`${kind.id} × ${v}: LIVE in the registry but still carries a '${disp.status}' disposition — remove it`);
        cells.push({ kind: kind.id, variant: v, status: 'live', note: note?.note ?? '', op: note?.op, retires: note?.retires });
        continue;
      }
      if (note) problems.push(`${kind.id} × ${v}: has a LIVE_CELL_NOTES entry but the registry declares no semantic`);
      if (notAnObject) {
        if (disp) problems.push(`${kind.id} × ${v}: a NOT_AN_OBJECT kind carries a per-verb disposition`);
        cells.push({ kind: kind.id, variant: v, status: 'no', note: notAnObject });
        continue;
      }
      if (!disp) { problems.push(`${kind.id} × ${v}: neither live nor dispositioned — decide open or no`); cells.push({ kind: kind.id, variant: v, status: 'open', note: '(undecided)' }); continue; }
      cells.push({ kind: kind.id, variant: v, status: disp.status, note: disp.note });
    }
  }
  for (const [kindId] of Object.entries(CELL_DISPOSITIONS)) if (!WORLD_OBJECT_KINDS.some(k => k.id === kindId)) problems.push(`${kindId}: dispositions for a kind the catalogue does not have`);
  for (const [kindId] of Object.entries(LIVE_CELL_NOTES)) if (!WORLD_OBJECT_KINDS.some(k => k.id === kindId)) problems.push(`${kindId}: live-cell notes for a kind the catalogue does not have`);
  return { cells, problems };
}

const BADGE: Record<CellStatus, string> = { live: '🟢', open: '🟡', no: '·' };

function renderMarkdown(cells: Cell[]): string {
  const L: string[] = [];
  const live = cells.filter(c => c.status === 'live'), open = cells.filter(c => c.status === 'open');
  const kindsWithCell = new Set(cells.filter(c => c.status !== 'no').map(c => c.kind)).size;
  L.push('<!-- GENERATED by `npm run generate-undertaking-grid` — do not hand-edit. Live cells: src/data/undertaking-objects.ts; dispositions: scripts/undertaking-grid-dispositions.ts -->');
  L.push('', '# Undertakings × world objects — the grid', '');
  L.push(`> Every world-object kind × every undertaking verb. **${live.length} live cells** (the registry declares a semantic), **${open.length} open cells** (the model admits it, no operation yet — a named decision), the rest not an object of undertakings with the reason. ${kindsWithCell} of ${WORLD_OBJECT_KINDS.length} kinds carry a cell. Verbs: ${UNDERTAKING_VERBS.join(' · ')}; change and control split into raise | lower and claim | seize. Regenerate: \`npm run generate-undertaking-grid\`; the generator fails by name on a live cell without a note, a non-live cell without a disposition, or a stale disposition.`);
  L.push('', '## The grid', '');
  L.push(`| Kind | ${UNDERTAKING_VERB_VARIANTS.map(v => UNDERTAKING_VERB_WORDS[v]).join(' | ')} |`);
  L.push(`|---|${UNDERTAKING_VERB_VARIANTS.map(() => '---').join('|')}|`);
  for (const kind of WORLD_OBJECT_KINDS) {
    const row = UNDERTAKING_VERB_VARIANTS.map(v => { const c = cells.find(x => x.kind === kind.id && x.variant === v)!; return c.status === 'live' ? `🟢 \`${c.op}\`` : c.status === 'open' ? '🟡 open' : '·'; });
    L.push(`| **${kind.gameWord}** \`${kind.id}\` | ${row.join(' | ')} |`);
  }
  L.push('', '## Live cells', '');
  for (const c of live) L.push(`- **${UNDERTAKING_VERB_WORDS[c.variant]} × ${c.kind}** — \`${c.op}\` — ${c.note}${c.retires?.length ? ` _(absorbs: ${c.retires.join(', ')})_` : ''}`);
  L.push('', '## Open cells — the decisions', '');
  for (const c of open) L.push(`- **${UNDERTAKING_VERB_WORDS[c.variant]} × ${c.kind}** — ${c.note}`);
  L.push('', '## Not an object of undertakings', '');
  for (const kind of WORLD_OBJECT_KINDS) {
    const reason = NOT_AN_OBJECT[kind.id];
    if (reason) L.push(`- **${kind.gameWord}** — ${reason}`);
  }
  L.push('');
  return L.join('\n');
}

function esc(s: string): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function renderHtml(cells: Cell[]): string {
  let nav = '';
  try { nav = buildNav(readManifest(), WIKI_PAGE_ID); } catch (err) { console.warn(`[generate-undertaking-grid] wiki nav skipped: ${(err as Error).message}`); }
  const live = cells.filter(c => c.status === 'live'), open = cells.filter(c => c.status === 'open');
  const kindsWithCell = new Set(cells.filter(c => c.status !== 'no').map(c => c.kind)).size;
  const head = UNDERTAKING_VERB_VARIANTS.map(v => `<th class="verb">${esc(UNDERTAKING_VERB_WORDS[v])}<span class="grp">${esc(v.split(':')[0].toUpperCase())}</span></th>`).join('');
  const rows = WORLD_OBJECT_KINDS.map(kind => {
    const tds = UNDERTAKING_VERB_VARIANTS.map(v => {
      const c = cells.find(x => x.kind === kind.id && x.variant === v)!;
      const label = c.status === 'live' ? esc(UNDERTAKING_VERB_WORDS[v].toLowerCase()) : c.status === 'open' ? 'open' : '—';
      return `<td><button class="cell ${c.status}" data-k="${kind.id}" data-v="${v}" title="${esc(c.note)}">${label}${c.op ? `<span class="op">${esc(c.op)}</span>` : ''}</button></td>`;
    }).join('');
    const noobj = NOT_AN_OBJECT[kind.id] ? ' class="noobj"' : '';
    return `<tr${noobj}><td class="kind"><b>${esc(kind.gameWord)}</b><small>${esc(kind.id)}</small></td>${tds}</tr>`;
  }).join('\n');
  const data = JSON.stringify(cells.map(c => ({ k: c.kind, v: c.variant, s: c.status, n: c.note, o: c.op ?? null, r: c.retires ?? [] })));
  const words = JSON.stringify(UNDERTAKING_VERB_WORDS);
  const names = JSON.stringify(Object.fromEntries(WORLD_OBJECT_KINDS.map(k => [k.id, k.gameWord])));
  return `<!-- GENERATED by npm run generate-undertaking-grid — do not hand-edit. Live cells: src/data/undertaking-objects.ts; dispositions: scripts/undertaking-grid-dispositions.ts -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Undertaking Grid — Threadbearer Design Reference</title>
<style>
  :root { color-scheme: dark; --bg:#0a0a0e; --surface:#1a1a1f; --raised:#222228; --line:#2e2e36; --text:#e8e4d8; --muted:#9a968c; --gold:#c9a84c; --live:#5aa469; --live-soft:#17302f; --open:#e0a054; --open-soft:#33240f; }
  body { margin:0; background:var(--bg); color:var(--text); font: 15px/1.5 Georgia, 'Times New Roman', serif; }
  main { max-width: 1400px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
  h1 { font-weight: normal; letter-spacing: .02em; color: var(--gold); margin-bottom: .2rem; }
  h2 { font-weight: normal; margin-top: 2.5rem; border-bottom: 1px solid var(--raised); padding-bottom: .3rem; }
  p.lede { color: var(--muted); max-width: 78ch; }
  .stats { display:flex; flex-wrap:wrap; gap:12px; margin: 1rem 0; }
  .stat { background: var(--surface); border:1px solid var(--line); border-radius:6px; padding:10px 14px; min-width:140px; }
  .stat b { display:block; font-size:26px; line-height:1; color: var(--gold); }
  .stat span { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
  .wrap { overflow-x:auto; background: var(--surface); border:1px solid var(--line); border-radius:8px; }
  table { border-collapse: separate; border-spacing:0; width:100%; min-width: 1000px; font-size:13px; }
  th { position:sticky; top:0; background: var(--raised); color: var(--muted); text-align:left; padding:8px 10px; font-weight:normal; font-size:11px; text-transform:uppercase; letter-spacing:.08em; border-bottom:1px solid var(--line); }
  th.verb { text-align:center; } th .grp { display:block; font-size:9px; letter-spacing:.1em; color: var(--gold); }
  td { padding:0; border-bottom:1px solid var(--line); vertical-align: middle; }
  td.kind { padding: 6px 10px; white-space:nowrap; } td.kind small { display:block; color:var(--muted); font: 11px ui-monospace, Consolas, monospace; }
  tr.noobj td.kind { color: var(--muted); }
  .cell { display:block; width:100%; min-height:38px; padding:5px 6px; border:0; border-left:1px solid var(--line); background:transparent; color:var(--text); font:inherit; text-align:center; cursor:pointer; }
  .cell.live { background: var(--live-soft); color: var(--live); font-weight: bold; }
  .cell.open { background: var(--open-soft); color: var(--open); }
  .cell.no { color: var(--muted); }
  .cell .op { display:block; font: 10px ui-monospace, Consolas, monospace; font-weight:normal; opacity:.8; }
  .cell.sel { box-shadow: inset 0 0 0 2px var(--gold); }
  .cell:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }
  #detail { margin-top: 16px; background: var(--surface); border:1px solid var(--line); border-left:4px solid var(--gold); border-radius:6px; padding: 12px 16px; min-height: 80px; }
  #detail h3 { margin: 0 0 6px; font-weight: normal; color: var(--gold); }
  code { font: 12px ui-monospace, Consolas, monospace; color: var(--gold); }
  ul { max-width: 100ch; } li { margin: .3rem 0; }
</style>
</head>
<body>
${nav}
<main>
<h1>Undertaking Grid</h1>
<p class="lede">Every kind of thing the world keeps, down the side; the six undertaking verbs across the top — create · change (raise | lower) · use · control (claim | seize) · destroy · observe. A green cell is one the registry completes today; an amber cell is a named decision; a blank cell is not an object of undertakings, with the reason on hover. Generated from the code: a new semantic without a note, or a cell without a disposition, fails the build.</p>
<div class="stats"><div class="stat"><b>${WORLD_OBJECT_KINDS.length}</b><span>kinds</span></div><div class="stat"><b>${kindsWithCell}</b><span>kinds with a cell</span></div><div class="stat"><b>${live.length}</b><span>live cells</span></div><div class="stat"><b>${open.length}</b><span>open cells</span></div></div>
<div class="wrap"><table><thead><tr><th>Kind</th>${head}</tr></thead><tbody>
${rows}
</tbody></table></div>
<div id="detail"><h3>Pick a cell</h3><p>Click any cell to read what it does, which operation it rides, and which old templates it absorbs.</p></div>
<h2>Open cells — the decisions</h2>
<ul>${open.map(c => `<li><b>${esc(UNDERTAKING_VERB_WORDS[c.variant])} × ${esc(c.kind)}</b> — ${esc(c.note)}</li>`).join('\n')}</ul>
</main>
<script>
(function(){
  var CELLS = ${data}; var WORDS = ${words}; var NAMES = ${names};
  var detail = document.getElementById('detail'); var sel = null;
  document.querySelector('table').addEventListener('click', function(e){
    var b = e.target.closest('button.cell'); if (!b) return;
    var c = CELLS.find(function(x){ return x.k === b.dataset.k && x.v === b.dataset.v; }); if (!c) return;
    if (sel) sel.classList.remove('sel'); sel = b; b.classList.add('sel');
    var tag = c.s === 'live' ? 'live' : c.s === 'open' ? 'open decision' : 'not an object';
    detail.innerHTML = '<h3>' + WORDS[c.v] + ' × ' + NAMES[c.k] + ' <small>(' + tag + ')</small></h3>' + (c.o ? '<p><code>' + c.o + '</code></p>' : '') + '<p>' + c.n.replace(/</g,'&lt;') + '</p>' + (c.r.length ? '<p><b>Absorbs:</b> ' + c.r.map(function(x){ return '<code>' + x + '</code>'; }).join(' ') + '</p>' : '');
  });
})();
</script>
</body>
</html>
`;
}

function main(): void {
  const check = process.argv.includes('--check');
  const repoRoot = process.cwd();
  const { cells, problems } = buildGrid();
  const md = renderMarkdown(cells);
  const html = renderHtml(cells);
  const mdPath = path.join(repoRoot, OUTPUT_MD_REL);
  const htmlPath = path.join(repoRoot, OUTPUT_HTML_REL);

  if (problems.length) {
    console.error(`[generate-undertaking-grid] ${problems.length} problem(s) — the map has fallen behind the code:`);
    for (const p of problems) console.error(`  - ${p}`);
  }
  if (check) {
    const same = (p: string, out: string) => fs.existsSync(p) && fs.readFileSync(p, 'utf-8').trim() === out.trim();
    const fresh = same(mdPath, md) && same(htmlPath, html);
    if (!fresh) console.warn(`[generate-undertaking-grid] --check: ${OUTPUT_MD_REL} / ${OUTPUT_HTML_REL} STALE. Run \`npm run generate-undertaking-grid\`.`);
    if (fresh && problems.length === 0) console.log('[generate-undertaking-grid] --check: up to date, every cell on the map.');
    process.exit(fresh && problems.length === 0 ? 0 : 1);
  }
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, md, 'utf-8');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  const live = cells.filter(c => c.status === 'live').length, open = cells.filter(c => c.status === 'open').length;
  console.log(`[generate-undertaking-grid] wrote ${OUTPUT_MD_REL} + ${OUTPUT_HTML_REL} — ${WORLD_OBJECT_KINDS.length} kinds × ${UNDERTAKING_VERB_VARIANTS.length} variants: ${live} live, ${open} open.`);
  if (problems.length) process.exit(1);
}

main();

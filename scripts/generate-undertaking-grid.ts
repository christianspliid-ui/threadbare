/**
 * generate-undertaking-grid — the map of undertakings over the world model (THR-1392
 * slice 4; Christian, 2026-09-03: keep it up to date as undertakings are developed and
 * named, so no chance of connecting a verb to a part of the world graph is missed).
 *
 * The grid is every world-object kind (`src/data/world-objects.ts`) × every undertaking
 * verb variant (`UNDERTAKING_VERB_VARIANTS`). Each cell is one of:
 *
 *   - LIVE   — the object-type registry (`src/data/undertaking-objects.ts`) declares a
 *     semantic; the registry is the only source of a live cell. A live cell may also
 *     record what it still *owes* — a decided consequence nothing reads yet.
 *   - WANTED — decided yes (THR-1397); no operation exists yet, the note names it.
 *   - LATER  — decided, waiting on a named precondition.
 *   - OPEN   — the model admits it and nobody has decided; a named decision.
 *   - NO     — not an object of undertakings, with the reason.
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
import { NOT_AN_OBJECT, LIVE_CELL_NOTES, CELL_DISPOSITIONS, STANDING_RIDERS, SUBSYSTEM_READERS, type CellDisposition, type LiveCellNote, type SubsystemReader } from './undertaking-grid-dispositions.ts';
import { readManifest, buildNav } from './design-wiki-nav.ts';
import { SUBSYSTEMS, SUBSYSTEM_NAMES } from './subsystems-registry.ts';

const OUTPUT_MD_REL = path.join('Docs', 'canon', 'undertaking-grid.generated.md');
const OUTPUT_HTML_REL = path.join('public', 'undertaking-grid-reference.html');
const WIKI_PAGE_ID = 'undertaking-grid';

type CellStatus = 'live' | 'wanted' | 'later' | 'open' | 'no';
interface Cell {
  readonly kind: WorldObjectKindId;
  readonly variant: UndertakingVerbVariant;
  readonly status: CellStatus;
  readonly note: string;
  readonly op?: string;
  readonly retires?: readonly string[];
  readonly owes?: string;
  readonly decided?: string;
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
        cells.push({ kind: kind.id, variant: v, status: 'live', note: note?.note ?? '', op: note?.op, retires: note?.retires, owes: note?.owes });
        continue;
      }
      if (note) problems.push(`${kind.id} × ${v}: has a LIVE_CELL_NOTES entry but the registry declares no semantic`);
      if (notAnObject) {
        if (disp) problems.push(`${kind.id} × ${v}: a NOT_AN_OBJECT kind carries a per-verb disposition`);
        cells.push({ kind: kind.id, variant: v, status: 'no', note: notAnObject });
        continue;
      }
      if (!disp) { problems.push(`${kind.id} × ${v}: neither live nor dispositioned — decide wanted, later, open or no`); cells.push({ kind: kind.id, variant: v, status: 'open', note: '(undecided)' }); continue; }
      if ((disp.status === 'wanted' || disp.status === 'later') && !disp.decided) problems.push(`${kind.id} × ${v}: '${disp.status}' without a 'decided' — a verdict must say who decided it and when`);
      cells.push({ kind: kind.id, variant: v, status: disp.status, note: disp.note, decided: disp.decided });
    }
  }
  for (const [kindId] of Object.entries(CELL_DISPOSITIONS)) if (!WORLD_OBJECT_KINDS.some(k => k.id === kindId)) problems.push(`${kindId}: dispositions for a kind the catalogue does not have`);
  for (const [kindId] of Object.entries(LIVE_CELL_NOTES)) if (!WORLD_OBJECT_KINDS.some(k => k.id === kindId)) problems.push(`${kindId}: live-cell notes for a kind the catalogue does not have`);
  return { cells, problems };
}

// ─── The subsystem × verb view (THR-1427) ───────────────────────────────────
// The third view of the same cells, joined through `WORLD_OBJECT_KINDS[].owningSystem`
// — the join THR-1407 repaired and pinned, which until now had no reader. It answers
// the question the kind × verb grid cannot: which of the world's 27 subsystems does a
// mortal's own work actually reach, and what happens to what it leaves behind.
//
// The status is MECHANICAL — derived from the cells, never authored. Whether an
// UNTOUCHED subsystem is untouched *by design* or is a gap is THR-1401's question for
// Christian; this view reports coverage and stops there.

type SubsystemStatus = 'live-touched' | 'open-only' | 'untouched';

interface SubsystemRow {
  readonly subsystem: string;
  readonly status: SubsystemStatus;
  /** The strongest cell status any owned kind carries for the verb; `null` when the subsystem owns no kind. */
  readonly verbs: Readonly<Partial<Record<UndertakingVerbVariant, CellStatus>>>;
  readonly kinds: readonly string[];
  readonly readers: readonly SubsystemReader[];
}

const SUBSYSTEM_STATUS_WORD: Record<SubsystemStatus, string> = { 'live-touched': 'LIVE-TOUCHED', 'open-only': 'OPEN-ONLY', untouched: 'UNTOUCHED' };
/** Strongest-first: a subsystem's verb cell shows the best any of its kinds manages. */
const CELL_RANK: Record<CellStatus, number> = { live: 4, wanted: 3, later: 2, open: 1, no: 0 };

function buildSubsystemView(cells: readonly Cell[]): { rows: SubsystemRow[]; problems: string[] } {
  const problems: string[] = [];
  const ownerOf = new Map<string, string>();
  for (const kind of WORLD_OBJECT_KINDS) {
    if (!SUBSYSTEM_NAMES.has(kind.owningSystem)) {
      problems.push(`${kind.id}: owningSystem '${kind.owningSystem}' is not a registry subsystem — the join the subsystem view rides is broken (fix the kind, never the registry)`);
      continue;
    }
    ownerOf.set(kind.id, kind.owningSystem);
  }

  const rows: SubsystemRow[] = SUBSYSTEMS.map(s => {
    const kinds = WORLD_OBJECT_KINDS.filter(k => ownerOf.get(k.id) === s.name).map(k => k.id as string);
    const verbs: Partial<Record<UndertakingVerbVariant, CellStatus>> = {};
    for (const c of cells) {
      if (ownerOf.get(c.kind) !== s.name) continue;
      const held = verbs[c.variant];
      if (held === undefined || CELL_RANK[c.status] > CELL_RANK[held]) verbs[c.variant] = c.status;
    }
    const best = Object.values(verbs).reduce((m, v) => Math.max(m, CELL_RANK[v]), 0);
    const status: SubsystemStatus = best === CELL_RANK.live ? 'live-touched' : best > CELL_RANK.no ? 'open-only' : 'untouched';
    return { subsystem: s.name, status, verbs, kinds, readers: SUBSYSTEM_READERS[s.name] ?? [] };
  });

  // Totality, the same three-way contract the cell dispositions carry: every
  // LIVE-TOUCHED subsystem is named, nothing else is, and every name is a real one.
  const liveTouched = new Set(rows.filter(r => r.status === 'live-touched').map(r => r.subsystem));
  for (const r of rows) {
    if (r.status === 'live-touched' && SUBSYSTEM_READERS[r.subsystem] === undefined) {
      problems.push(`${r.subsystem}: LIVE-TOUCHED but has no SUBSYSTEM_READERS entry — name who reads what its cells leave, or give it an empty list to record that nothing does`);
    }
  }
  for (const [name, readers] of Object.entries(SUBSYSTEM_READERS)) {
    if (!SUBSYSTEM_NAMES.has(name)) problems.push(`SUBSYSTEM_READERS['${name}']: not a registry subsystem`);
    else if (!liveTouched.has(name)) problems.push(`SUBSYSTEM_READERS['${name}']: readers for a subsystem no live cell reaches — stale, remove it`);
    for (const r of readers) if (!SUBSYSTEM_NAMES.has(r.subsystem)) problems.push(`SUBSYSTEM_READERS['${name}']: reader '${r.subsystem}' is not a registry subsystem`);
  }
  return { rows, problems };
}

const BADGE: Record<CellStatus, string> = { live: '🟢', wanted: '🔵', later: '⏳', open: '🟡', no: '·' };
const STATUS_WORD: Record<CellStatus, string> = { live: 'live', wanted: 'wanted', later: 'later', open: 'open', no: 'not an object' };

function cellLabelMd(c: Cell): string {
  return c.status === 'live' ? `${BADGE.live} \`${c.op}\`` : c.status === 'no' ? BADGE.no : `${BADGE[c.status]} ${c.status}`;
}

function renderMarkdown(cells: Cell[], rows: readonly SubsystemRow[]): string {
  const L: string[] = [];
  const live = cells.filter(c => c.status === 'live'), wanted = cells.filter(c => c.status === 'wanted'), later = cells.filter(c => c.status === 'later'), open = cells.filter(c => c.status === 'open');
  const owing = live.filter(c => c.owes);
  const kindsWithCell = new Set(cells.filter(c => c.status !== 'no').map(c => c.kind)).size;
  L.push('<!-- GENERATED by `npm run generate-undertaking-grid` — do not hand-edit. Live cells: src/data/undertaking-objects.ts; dispositions: scripts/undertaking-grid-dispositions.ts -->');
  L.push('', '# Undertakings × world objects — the grid', '');
  L.push(`> Every world-object kind × every undertaking verb. **${live.length} live cells** (the registry declares a semantic; ${owing.length} of them still owe a decided consequence nothing reads), **${wanted.length} wanted cells** (decided yes, the operation named, not yet built), **${later.length} later cells** (decided, waiting on a named precondition), **${open.length} open cells** (the model admits it, nobody has decided), the rest not an object of undertakings with the reason. ${kindsWithCell} of ${WORLD_OBJECT_KINDS.length} kinds carry a cell. Verbs: ${UNDERTAKING_VERBS.join(' · ')}; change and control split into raise | lower and claim | seize. Regenerate: \`npm run generate-undertaking-grid\`; the generator fails by name on a live cell without a note, a non-live cell without a disposition, a verdict without its decider, or a stale disposition.`);
  L.push('', '## The grid', '');
  L.push(`| Kind | ${UNDERTAKING_VERB_VARIANTS.map(v => UNDERTAKING_VERB_WORDS[v]).join(' | ')} |`);
  L.push(`|---|${UNDERTAKING_VERB_VARIANTS.map(() => '---').join('|')}|`);
  for (const kind of WORLD_OBJECT_KINDS) {
    const row = UNDERTAKING_VERB_VARIANTS.map(v => cellLabelMd(cells.find(x => x.kind === kind.id && x.variant === v)!));
    L.push(`| **${kind.gameWord}** \`${kind.id}\` | ${row.join(' | ')} |`);
  }
  L.push('', '## Subsystems × verbs', '');
  const touched = rows.filter(r => r.status === 'live-touched'), openOnly = rows.filter(r => r.status === 'open-only'), untouched = rows.filter(r => r.status === 'untouched');
  L.push(`> The same cells joined through \`WORLD_OBJECT_KINDS[].owningSystem\` — which of the world's ${rows.length} subsystems a mortal's own work reaches, and who reads what it leaves. **${touched.length} LIVE-TOUCHED** (a live cell rides an op on a kind it owns), **${openOnly.length} OPEN-ONLY** (only decided-but-unbuilt or undecided cells reach it), **${untouched.length} UNTOUCHED** (no cell reaches it at all). Status is derived from the cells, never authored. Whether an untouched subsystem is untouched *by design* or is a gap is a design question and is deliberately **not** answered here.`);
  L.push('');
  L.push(`| Subsystem | Kinds it owns | ${UNDERTAKING_VERB_VARIANTS.map(v => UNDERTAKING_VERB_WORDS[v]).join(' | ')} | Status | Read by |`);
  L.push(`|---|---|${UNDERTAKING_VERB_VARIANTS.map(() => '---').join('|')}|---|---|`);
  for (const r of rows) {
    const verbCells = UNDERTAKING_VERB_VARIANTS.map(v => { const s = r.verbs[v]; return s === undefined || s === 'no' ? BADGE.no : `${BADGE[s]} ${s}`; });
    const reads = r.status !== 'live-touched' ? '—' : r.readers.length === 0 ? '**nothing reads this**' : r.readers.map(x => x.subsystem).join(' · ');
    L.push(`| **${r.subsystem}** | ${r.kinds.length ? r.kinds.map(k => `\`${k}\``).join(', ') : '_none_'} | ${verbCells.join(' | ')} | ${SUBSYSTEM_STATUS_WORD[r.status]} | ${reads} |`);
  }
  L.push('', '### What the live cells leave, and who picks it up', '');
  for (const r of touched) {
    L.push(`- **${r.subsystem}**`);
    if (r.readers.length === 0) L.push('  - **Nothing reads this.** Every consequence its live cells write vanishes — a lever with no consequence.');
    for (const x of r.readers) L.push(`  - _${x.subsystem}_ — ${x.sites}`);
  }
  L.push('', '## Standing riders', '', '_Rules that bind every cell rather than one._', '');
  for (const r of STANDING_RIDERS) L.push(`- ${r}`);
  L.push('', '## Live cells', '');
  for (const c of live) L.push(`- **${UNDERTAKING_VERB_WORDS[c.variant]} × ${c.kind}** — \`${c.op}\` — ${c.note}${c.retires?.length ? ` _(absorbs: ${c.retires.join(', ')})_` : ''}${c.owes ? ` **Owes:** ${c.owes}` : ''}`);
  L.push('', '## Wanted cells — decided yes, not yet built', '');
  for (const c of wanted) L.push(`- **${UNDERTAKING_VERB_WORDS[c.variant]} × ${c.kind}** — ${c.note} _(${c.decided})_`);
  L.push('', '## Later — decided, waiting on a precondition', '');
  for (const c of later) L.push(`- **${UNDERTAKING_VERB_WORDS[c.variant]} × ${c.kind}** — ${c.note} _(${c.decided})_`);
  L.push('', '## Open cells — the decisions', '');
  if (open.length === 0) L.push('_None — every admitted cell has a verdict._');
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
/** Backticked spans in the curated prose become real code spans on the served page. */
function codeify(s: string): string { return s.replace(/`([^`]+)`/g, '<code>$1</code>'); }

function renderHtml(cells: Cell[], subsystemRows: readonly SubsystemRow[]): string {
  let nav = '';
  try { nav = buildNav(readManifest(), WIKI_PAGE_ID); } catch (err) { console.warn(`[generate-undertaking-grid] wiki nav skipped: ${(err as Error).message}`); }
  const live = cells.filter(c => c.status === 'live'), wanted = cells.filter(c => c.status === 'wanted'), later = cells.filter(c => c.status === 'later'), open = cells.filter(c => c.status === 'open');
  const owing = live.filter(c => c.owes);
  const kindsWithCell = new Set(cells.filter(c => c.status !== 'no').map(c => c.kind)).size;
  const touched = subsystemRows.filter(r => r.status === 'live-touched'), openOnly = subsystemRows.filter(r => r.status === 'open-only'), untouched = subsystemRows.filter(r => r.status === 'untouched');
  const head = UNDERTAKING_VERB_VARIANTS.map(v => `<th class="verb">${esc(UNDERTAKING_VERB_WORDS[v])}<span class="grp">${esc(v.split(':')[0].toUpperCase())}</span></th>`).join('');
  const rows = WORLD_OBJECT_KINDS.map(kind => {
    const tds = UNDERTAKING_VERB_VARIANTS.map(v => {
      const c = cells.find(x => x.kind === kind.id && x.variant === v)!;
      const label = c.status === 'live' ? esc(UNDERTAKING_VERB_WORDS[v].toLowerCase()) : c.status === 'no' ? '—' : c.status;
      const owes = c.status === 'live' && c.owes ? ' owes' : '';
      return `<td><button class="cell ${c.status}${owes}" data-k="${kind.id}" data-v="${v}" title="${esc(c.note)}">${label}${c.op ? `<span class="op">${esc(c.op)}</span>` : ''}</button></td>`;
    }).join('');
    const noobj = NOT_AN_OBJECT[kind.id] ? ' class="noobj"' : '';
    return `<tr${noobj}><td class="kind"><b>${esc(kind.gameWord)}</b><small>${esc(kind.id)}</small></td>${tds}</tr>`;
  }).join('\n');
  const data = JSON.stringify(cells.map(c => ({ k: c.kind, v: c.variant, s: c.status, n: c.note, o: c.op ?? null, r: c.retires ?? [], w: c.owes ?? null, d: c.decided ?? null })));
  const listItem = (c: Cell) => `<li><b>${esc(UNDERTAKING_VERB_WORDS[c.variant])} × ${esc(c.kind)}</b> — ${esc(c.note)}${c.decided ? ` <small>(${esc(c.decided)})</small>` : ''}</li>`;
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
  :root { color-scheme: dark; --bg:#0a0a0e; --surface:#1a1a1f; --raised:#222228; --line:#2e2e36; --text:#e8e4d8; --muted:#9a968c; --gold:#c9a84c; --live:#5aa469; --live-soft:#17302f; --open:#e0a054; --open-soft:#33240f; --wanted:#6ea8d9; --wanted-soft:#15283a; --later:#a78bca; --later-soft:#241c33; }
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
  .cell.live.owes { box-shadow: inset 0 -3px 0 var(--open); }
  .cell.wanted { background: var(--wanted-soft); color: var(--wanted); }
  .cell.later { background: var(--later-soft); color: var(--later); }
  .cell.open { background: var(--open-soft); color: var(--open); }
  .cell.no { color: var(--muted); }
  .legend { display:flex; flex-wrap:wrap; gap:14px; margin:.6rem 0 1rem; font-size:12px; color:var(--muted); }
  .legend span::before { content:''; display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:-1px; }
  .legend .l-live::before { background: var(--live); } .legend .l-wanted::before { background: var(--wanted); } .legend .l-later::before { background: var(--later); } .legend .l-open::before { background: var(--open); } .legend .l-owes::before { background: var(--live); box-shadow: inset 0 -3px 0 var(--open); }
  .cell .op { display:block; font: 10px ui-monospace, Consolas, monospace; font-weight:normal; opacity:.8; }
  .cell.sel { box-shadow: inset 0 0 0 2px var(--gold); }
  .cell:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }
  #detail { margin-top: 16px; background: var(--surface); border:1px solid var(--line); border-left:4px solid var(--gold); border-radius:6px; padding: 12px 16px; min-height: 80px; }
  #detail h3 { margin: 0 0 6px; font-weight: normal; color: var(--gold); }
  code { font: 12px ui-monospace, Consolas, monospace; color: var(--gold); }
  ul { max-width: 100ch; } li { margin: .3rem 0; }
  td.owns { padding: 6px 10px; max-width: 200px; } td.owns code { font-size: 10px; margin-right: 3px; white-space: nowrap; }
  td.reads { padding: 6px 10px; color: var(--muted); font-size: 12px; max-width: 320px; }
  .sv { display:block; padding: 6px 4px; text-align:center; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
  .sv.live { background: var(--live-soft); color: var(--live); font-weight:bold; } .sv.wanted { background: var(--wanted-soft); color: var(--wanted); } .sv.later { background: var(--later-soft); color: var(--later); } .sv.open { background: var(--open-soft); color: var(--open); } .sv.no { color: var(--muted); }
  .sstat { display:inline-block; padding: 3px 8px; border-radius: 3px; font-size:10px; letter-spacing:.06em; white-space:nowrap; }
  .sstat.live-touched { background: var(--live-soft); color: var(--live); } .sstat.open-only { background: var(--open-soft); color: var(--open); } .sstat.untouched { color: var(--muted); border:1px solid var(--line); }
  .unread { color: var(--open); }
</style>
</head>
<body>
${nav}
<main>
<h1>Undertaking Grid</h1>
<p class="lede">Every kind of thing the world keeps, down the side; the six undertaking verbs across the top — create · change (raise | lower) · use · control (claim | seize) · destroy · observe. A green cell is one the registry completes today (an amber underline means it still owes a decided consequence nothing reads yet); a blue cell is wanted — decided yes, the operation named, not yet built; a violet cell is later — decided, waiting on a precondition; an amber cell is open — nobody has decided; a blank cell is not an object of undertakings, with the reason on hover. Generated from the code: a new semantic without a note, a cell without a disposition, or a verdict without its decider fails the build.</p>
<div class="legend"><span class="l-live">live</span><span class="l-owes">live, owes a reader</span><span class="l-wanted">wanted</span><span class="l-later">later</span><span class="l-open">open</span></div>
<div class="stats"><div class="stat"><b>${WORLD_OBJECT_KINDS.length}</b><span>kinds</span></div><div class="stat"><b>${kindsWithCell}</b><span>kinds with a cell</span></div><div class="stat"><b>${live.length}</b><span>live cells</span></div><div class="stat"><b>${owing.length}</b><span>live, owing</span></div><div class="stat"><b>${wanted.length}</b><span>wanted</span></div><div class="stat"><b>${later.length}</b><span>later</span></div><div class="stat"><b>${open.length}</b><span>open</span></div></div>
<div class="wrap"><table><thead><tr><th>Kind</th>${head}</tr></thead><tbody>
${rows}
</tbody></table></div>
<div id="detail"><h3>Pick a cell</h3><p>Click any cell to read what it does, which operation it rides or needs, which old templates it absorbs, and what it still owes.</p></div>
<h2>Subsystems × verbs</h2>
<p class="lede">The same cells joined through each kind's <code>owningSystem</code> — which of the world's ${subsystemRows.length} subsystems a mortal's own work reaches, and who reads what it leaves behind. Status is derived from the cells, never authored: <b>live-touched</b> means a live cell rides an op on a kind the subsystem owns, <b>open-only</b> that only decided-but-unbuilt or undecided cells reach it, <b>untouched</b> that no cell reaches it at all. Whether an untouched subsystem is untouched <i>by design</i> or is a gap is a design question and is deliberately not answered here.</p>
<div class="stats"><div class="stat"><b>${touched.length}</b><span>live-touched</span></div><div class="stat"><b>${openOnly.length}</b><span>open-only</span></div><div class="stat"><b>${untouched.length}</b><span>untouched</span></div></div>
<div class="wrap"><table><thead><tr><th>Subsystem</th><th>Kinds it owns</th>${head}<th>Status</th><th>Read by</th></tr></thead><tbody>
${subsystemRows.map(r => {
    const tds = UNDERTAKING_VERB_VARIANTS.map(v => {
      const s = r.verbs[v];
      return s === undefined || s === 'no' ? '<td><span class="sv no">—</span></td>' : `<td><span class="sv ${s}">${s}</span></td>`;
    }).join('');
    const reads = r.status !== 'live-touched' ? '<small>—</small>' : r.readers.length === 0 ? '<b class="unread">nothing reads this</b>' : esc(r.readers.map(x => x.subsystem).join(' · '));
    return `<tr><td class="kind"><b>${esc(r.subsystem)}</b></td><td class="owns">${r.kinds.length ? r.kinds.map(k => `<code>${esc(k)}</code>`).join(' ') : '<small><i>none</i></small>'}</td>${tds}<td><span class="sstat ${r.status}">${SUBSYSTEM_STATUS_WORD[r.status]}</span></td><td class="reads">${reads}</td></tr>`;
  }).join('\n')}
</tbody></table></div>
<h3>What the live cells leave, and who picks it up</h3>
<ul>${touched.map(r => `<li><b>${esc(r.subsystem)}</b>${r.readers.length === 0 ? '<ul><li><b class="unread">Nothing reads this.</b> Every consequence its live cells write vanishes — a lever with no consequence.</li></ul>' : `<ul>${r.readers.map(x => `<li><i>${esc(x.subsystem)}</i> — ${codeify(esc(x.sites))}</li>`).join('')}</ul>`}</li>`).join('\n')}</ul>
<h2>Standing riders</h2>
<ul>${STANDING_RIDERS.map(r => `<li>${esc(r)}</li>`).join('\n')}</ul>
<h2>Wanted cells — decided yes, not yet built</h2>
<ul>${wanted.map(listItem).join('\n')}</ul>
<h2>Later — decided, waiting on a precondition</h2>
<ul>${later.map(listItem).join('\n')}</ul>
<h2>Open cells — the decisions</h2>
<ul>${open.length ? open.map(listItem).join('\n') : '<li><i>None — every admitted cell has a verdict.</i></li>'}</ul>
</main>
<script>
(function(){
  var CELLS = ${data}; var WORDS = ${words}; var NAMES = ${names};
  var detail = document.getElementById('detail'); var sel = null;
  document.querySelector('table').addEventListener('click', function(e){
    var b = e.target.closest('button.cell'); if (!b) return;
    var c = CELLS.find(function(x){ return x.k === b.dataset.k && x.v === b.dataset.v; }); if (!c) return;
    if (sel) sel.classList.remove('sel'); sel = b; b.classList.add('sel');
    var TAGS = ${JSON.stringify(STATUS_WORD)};
    var tag = TAGS[c.s] + (c.d ? ' · ' + c.d : '');
    var e = function(s){ return String(s).replace(/</g,'&lt;'); };
    detail.innerHTML = '<h3>' + WORDS[c.v] + ' × ' + NAMES[c.k] + ' <small>(' + e(tag) + ')</small></h3>' + (c.o ? '<p><code>' + e(c.o) + '</code></p>' : '') + '<p>' + e(c.n) + '</p>' + (c.w ? '<p><b>Owes:</b> ' + e(c.w) + '</p>' : '') + (c.r.length ? '<p><b>Absorbs:</b> ' + c.r.map(function(x){ return '<code>' + e(x) + '</code>'; }).join(' ') + '</p>' : '');
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
  const { rows, problems: viewProblems } = buildSubsystemView(cells);
  problems.push(...viewProblems);
  const md = renderMarkdown(cells, rows);
  const html = renderHtml(cells, rows);
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
  const count = (s: CellStatus) => cells.filter(c => c.status === s).length;
  console.log(`[generate-undertaking-grid] wrote ${OUTPUT_MD_REL} + ${OUTPUT_HTML_REL} — ${WORLD_OBJECT_KINDS.length} kinds × ${UNDERTAKING_VERB_VARIANTS.length} variants: ${count('live')} live, ${count('wanted')} wanted, ${count('later')} later, ${count('open')} open.`);
  if (problems.length) process.exit(1);
}

main();

/**
 * `undertaking:batch-report` — the undertaking factory's Stage 5 artifact (THR-1300
 * slice 4; the `encounter-batch-report.ts` sibling, THR-1047).
 *
 *   npm run undertaking:batch-report -- <templateId...> [--out <path>] [--seed N]... [--brief <path>]
 *
 * ## A renderer, not a third gate
 *
 * It runs nothing itself. It shells `check:undertaking --json` and
 * `check:undertaking-live --json` and renders their verdicts together, so it cannot
 * disagree with CI. The template facts it adds (kind, cell, tier, reach, harm) are
 * read from the registry — data, not judgment.
 *
 * ## Grid coverage is the variance the director reviews for
 *
 * The encounter report leads with six rows so *variance* is visible. On this line the
 * variance that matters is the **kind × CRUD grid**: a batch that fills only C cells
 * is works nobody can take back (REVISE trigger 1), so the coverage table — every
 * kind row, its C/U/D counts, this batch's additions marked — sits directly under the
 * batch table, before any per-template detail.
 *
 * ## Links (Rule Zero)
 *
 * Every row carries two clickable links: the live run
 * (`?view=game&seeded&size=medium&undertaking=<id>&forcemoments`) and the Package View
 * (`?view=cms#undertaking-packages?template=<id>`). Both are live.
 *
 * Exit codes: 0 report written (whatever the batch's verdicts were) · 1 a sub-check
 * could not be run, or no templates were named. A batch with failures is a report
 * worth reading; failing the command that writes it would delete the explanation.
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getStrategicTemplate } from '../src/engine/strategicActionCandidates';
import { getAllUndertakingKindRows, getUndertakingKindForTemplate } from '../src/data/undertaking-kinds';
import { UNDERTAKING_CELL_TEMPLATES } from '../src/data/undertaking-cells';
import { UNDERTAKING_OBJECT_TYPES } from '../src/data/undertaking-objects';
import { UNDERTAKING_VERB_VARIANTS } from '../src/data/strategic-action-constants';
import { FACTORY_STRATEGIC_TEMPLATES } from '../src/data/strategic-packs/factory/index';
import { undertakingWriteSet } from '../src/data/content-eval/undertakingContract';

const BATCH_SIZE = 6;
const REVIEW_BASE_URL = 'https://threadbare.vercel.app';
const LIVE_QUERY = 'view=game&seeded&size=medium';
const PACKAGE_VIEW_ROUTE = 'view=cms#undertaking-packages';
const DEFAULT_OUT_DIR = 'Docs/plans/undertakings';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const FLAGS_WITH_VALUES: readonly string[] = ['--out', '--seed', '--brief'];
function flagValue(name: string): string | undefined {
  const index = argv.indexOf(name);
  return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined;
}
function flagValues(name: string): string[] {
  const out: string[] = [];
  argv.forEach((a, i) => { if (a === name && argv[i + 1]) out.push(argv[i + 1]); });
  return out;
}
const ids = argv.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  const previous = argv[index - 1];
  return previous === undefined || !FLAGS_WITH_VALUES.includes(previous);
});
const seeds = flagValues('--seed');
const briefPath = flagValue('--brief');
if (ids.length === 0) {
  console.error('Usage: npm run undertaking:batch-report -- <templateId...> [--out <path>] [--seed N]... [--brief <path>]');
  process.exit(1);
}

// ─── Sub-check shapes ────────────────────────────────────────────────

interface GateRow {
  templateId: string;
  passed: boolean;
  pending: boolean;
  gateFailure: string | null;
  blocks: string[];
  violations: { block: string; message: string }[];
  warnings: string[];
}
interface LiveClaim { name: string; status: 'pass' | 'fail' | 'not_declared'; detail: string }
interface LiveRun {
  templateId: string;
  seed: number;
  actorId?: string;
  ticksRun: number;
  finalStatus?: string;
  verdict: 'proved' | 'failed' | 'vacuous';
  claims: LiveClaim[];
}

const SAFE_ARG = /^[A-Za-z0-9._\-/\\:]+$/;
function runJsonRaw(script: string, args: readonly string[]): string {
  for (const arg of args) if (!SAFE_ARG.test(arg)) throw new Error(`refusing to shell out with argument '${arg}'`);
  try {
    return execSync(`npm run ${script} --silent -- ${args.join(' ')}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
  } catch (error) {
    // A failing gate exits 1 and that is data here, not an error; only no JSON is fatal.
    const stdout = (error as { stdout?: string }).stdout ?? '';
    if (stdout.trim() === '') throw error;
    return stdout;
  }
}
function parseFrom<T>(raw: string, opener: '{' | '['): T {
  const closer = opener === '{' ? '}' : ']';
  const start = raw.indexOf(opener);
  const end = raw.lastIndexOf(closer);
  if (start === -1 || end === -1) throw new Error('sub-check produced no JSON');
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

// ─── Collect ─────────────────────────────────────────────────────────

console.log(`[batch-report] running check:undertaking over ${ids.length} template(s)…`);
let gates: GateRow[];
try {
  gates = parseFrom<GateRow[]>(runJsonRaw('check:undertaking', [...ids, '--json']), '[');
} catch (error) {
  console.error(`[batch-report] check:undertaking could not be run: ${(error as Error).message}`);
  process.exit(1);
}
console.log(`[batch-report] running check:undertaking-live over ${ids.length} template(s)…`);
let runs: LiveRun[];
try {
  const liveArgs = [...ids, ...seeds.flatMap(s => ['--seed', s]), '--json'];
  runs = parseFrom<{ runs: LiveRun[] }>(runJsonRaw('check:undertaking-live', liveArgs), '{').runs;
} catch (error) {
  console.error(`[batch-report] check:undertaking-live could not be run: ${(error as Error).message}`);
  process.exit(1);
}

// ─── Render ──────────────────────────────────────────────────────────

const gateById = new Map(gates.map(g => [g.templateId, g]));
const runsById = new Map<string, LiveRun[]>();
for (const r of runs) runsById.set(r.templateId, [...(runsById.get(r.templateId) ?? []), r]);
const rows = getAllUndertakingKindRows();
const batch = new Set(ids);

function liveLink(id: string): string { return `${REVIEW_BASE_URL}/?${LIVE_QUERY}&undertaking=${id}&forcemoments`; }
function packageLink(id: string): string { return `${REVIEW_BASE_URL}/?${PACKAGE_VIEW_ROUTE}?template=${id}`; }
function gateBadge(g: GateRow | undefined): string {
  if (!g) return '—';
  if (g.passed) return '✅ green';
  return g.pending ? '🟡 ratchet' : `❌ ${g.blocks.join(', ')}`;
}
function liveBadge(list: LiveRun[] | undefined): string {
  if (!list || list.length === 0) return '—';
  return list.map(r => `${{ proved: '✅', failed: '❌', vacuous: '⚪' }[r.verdict]} ${r.seed}`).join(' · ');
}
function cellOf(templateId: string): { kindId: string; cell: 'C' | 'U' | 'D'; tier: number } | undefined {
  // A verb × object cell (or a compiled override of one) reports its cell as the
  // variant and its object type as the kind (THR-1392 slice 3).
  const asCell = getStrategicTemplate(templateId);
  if (asCell?.cellVariant && asCell.objectTypeId) {
    const cell = asCell.cellVariant === 'undo' || asCell.cellVariant === 'control:seize' ? 'D' : asCell.cellVariant === 'found' ? 'C' : 'U';
    return { kindId: `${asCell.cellVariant} × ${asCell.objectTypeId}`, cell, tier: 2 };
  }
  const kindId = getUndertakingKindForTemplate(templateId);
  const row = rows.find(r => r.kindId === kindId);
  if (!row) return undefined;
  const cell = row.createTemplateIds.includes(templateId) ? 'C' : row.updateTemplateIds.includes(templateId) ? 'U' : 'D';
  return { kindId: row.kindId, cell, tier: row.tier };
}

const today = new Date().toISOString().slice(0, 10);
const lines: string[] = [];
lines.push(`# Undertaking batch report — ${today}`);
lines.push('');
lines.push(`**Batch:** ${ids.length} undertaking(s)${ids.length === BATCH_SIZE ? '' : ` (the line sets the batch at ${BATCH_SIZE})`}`);
if (briefPath) lines.push(`**Brief:** \`${briefPath}\``);
lines.push(`**Seeds:** ${seeds.length ? seeds.join(', ') : 'default'}`);
lines.push('**Stages rendered:** 3 (`check:undertaking`) + 4 (`check:undertaking-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.');
lines.push('');
lines.push('> **How to read this.** The first table is the batch, one row each. The second is the kind × CRUD grid with this batch\'s additions marked — the variance this line reviews for: a batch that fills only C cells is works nobody can take back.');
lines.push('');

// ── The batch ──
lines.push('## The batch, side by side');
lines.push('');
lines.push('| Undertaking | Kind · cell · tier | Verb | Reach | Family | Harm | Gate | Live | Review |');
lines.push('|---|---|---|---|---|---|---|---|---|');
for (const id of ids) {
  const t = getStrategicTemplate(id);
  const c = cellOf(id);
  const reach = t ? Object.entries(t.reachProfile ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? '—' : '—';
  lines.push(`| \`${id}\` | ${c ? `${c.kindId} · ${c.cell} · T${c.tier}` : '⚠️ no row'} | ${t?.verb ?? '—'} | ${reach} | ${t?.behaviorFamily ?? '—'} | ${t?.harmClass ?? '—'} | ${gateBadge(gateById.get(id))} | ${liveBadge(runsById.get(id))} | [live](${liveLink(id)}) · [package](${packageLink(id)}) |`);
}
lines.push('');

// ── Grid coverage ──
lines.push('## Grid coverage — kinds × C/U/D');
lines.push('');
lines.push('Counts are the registry after this batch; `+n` marks what this batch added. An empty **D** is the cell to fill next.');
lines.push('');
lines.push('| Kind | Tier | C | U | D |');
lines.push('|---|---|---|---|---|');
const cellText = (all: readonly string[]) => {
  const added = all.filter(id => batch.has(id)).length;
  return `${all.length}${added ? ` (+${added})` : ''}${all.length === 0 ? ' ⚠️' : ''}`;
};
for (const r of rows) {
  lines.push(`| \`${r.kindId}\` | T${r.tier} | ${cellText(r.createTemplateIds)} | ${cellText(r.updateTemplateIds)} | ${cellText(r.destroyTemplateIds)} |`);
}
const cells = ids.map(id => cellOf(id)?.cell).filter(Boolean);
const onlyC = cells.length > 0 && cells.every(c => c === 'C');
lines.push('');
if (onlyC) lines.push('> ⚠️ **This batch fills only C cells** — REVISE trigger 1. Rejected on sight.');
lines.push('');

// ── Grid coverage — verbs × objects (THR-1392 slice 3) ──
lines.push('## Grid coverage — verbs × objects');
lines.push('');
lines.push('Each cell the registry can complete, with the compiled overrides it carries; `+n` marks this batch. A dash is a verb the object type declares no semantic for — a slice-2 decision, never a gap to fill with prose.');
lines.push('');
lines.push(`| Object | ${UNDERTAKING_VERB_VARIANTS.join(' | ')} |`);
lines.push(`|---|${UNDERTAKING_VERB_VARIANTS.map(() => '---').join('|')}|`);
for (const type of UNDERTAKING_OBJECT_TYPES) {
  const row = UNDERTAKING_VERB_VARIANTS.map(variant => {
    const cell = UNDERTAKING_CELL_TEMPLATES.find(c => c.objectTypeId === type.id && c.cellVariant === variant);
    if (!cell) return '—';
    const overrides = FACTORY_STRATEGIC_TEMPLATES.filter(t => t.baseCellId === cell.id);
    const added = [cell, ...overrides].filter(t => batch.has(t.id)).length;
    return `${1 + overrides.length}${added ? ` (+${added})` : ''}`;
  });
  lines.push(`| \`${type.id}\` | ${row.join(' | ')} |`);
}
lines.push('');

// ── Spread ──
lines.push('## Spread');
lines.push('');
const count = (xs: (string | undefined)[]) => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x ?? '—', (m.get(x ?? '—') ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(', ');
};
lines.push(`- **Tiers:** ${count(ids.map(id => { const c = cellOf(id); return c ? `T${c.tier}` : undefined; }))}`);
lines.push(`- **Verbs:** ${count(ids.map(id => getStrategicTemplate(id)?.verb))}`);
lines.push(`- **Leading reach:** ${count(ids.map(id => { const t = getStrategicTemplate(id); return t ? Object.entries(t.reachProfile ?? {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] : undefined; }))}`);
lines.push(`- **Motivations:** ${count(ids.flatMap(id => [...(getStrategicTemplate(id)?.motivations ?? [])]))}`);
lines.push('');

// ── Per-template detail ──
lines.push('## Per undertaking');
lines.push('');
for (const id of ids) {
  const t = getStrategicTemplate(id);
  const g = gateById.get(id);
  const list = runsById.get(id) ?? [];
  lines.push(`### \`${id}\`${t ? ` — ${t.displayName}` : ''}`);
  lines.push('');
  if (t) {
    const w = undertakingWriteSet(t);
    lines.push(`**Write set:** ${w.empty ? '⚠️ empty' : [w.mutation && `mutation \`${w.mutation}\``, w.creationBands.length && `creation on ${w.creationBands.join('/')}`, w.harmClass && `harm \`${w.harmClass}\``, w.kind && `kind \`${w.kind.kindId}\`${w.kind.ownable ? ' (ownable)' : ''}`, w.persistentCast.length && `must-persist ${w.persistentCast.map(k => `\`$${k}\``).join(', ')}`, w.catalysts.length && `catalysts ${w.catalysts.length}`].filter(Boolean).join(' · ')}`);
    lines.push('');
    for (const line of t.activityProse ?? []) lines.push(`> ${line}`);
    for (const line of t.completionProse ?? []) lines.push(`> **${line}**`);
    lines.push('');
  }
  if (g) {
    lines.push(`**Gate:** ${gateBadge(g)}${g.gateFailure ? ` (${g.gateFailure})` : ''}`);
    for (const v of g.violations) lines.push(`- ✗ \`${v.block}\` ${v.message}`);
    for (const w of g.warnings) lines.push(`- warn · ${w}`);
    lines.push('');
  }
  for (const r of list) {
    lines.push(`**Live, seed ${r.seed}:** ${r.verdict}${r.actorId ? ` — ${r.actorId}, ${r.ticksRun} ticks, ${r.finalStatus}` : ''}`);
    for (const c of r.claims) lines.push(`- ${c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '·'} \`${c.name}\` ${c.detail}`);
    lines.push('');
  }
}

// ── Census pointers ──
lines.push('## Before the batch ships');
lines.push('');
lines.push('- `npm run census:undertakings -- --seed 42` and `--seed 99` must still sit inside the envelope (the board and the motive gate are not retuned for a batch — if six templates move it, the batch is wrong).');
lines.push('- `npm run census:reachability` for every family this batch touches.');
lines.push('- Christian samples two in chat; his verdict feeds the next brief.');
lines.push('');

const outPath = flagValue('--out') ?? path.join(DEFAULT_OUT_DIR, `${today}-batch-report.md`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`[batch-report] wrote ${outPath} — ${ids.length} undertaking(s), gate ${gates.filter(g => g.passed).length}/${gates.length} green, live ${runs.filter(r => r.verdict === 'proved').length}/${runs.length} proved`);

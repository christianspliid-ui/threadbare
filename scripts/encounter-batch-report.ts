/**
 * `encounter:batch-report` — the Encounter Factory's Stage 5 artifact. THR-1047.
 *
 * Plan: `Docs/plans/2026-08-08-encounter-factory-workflow.md` §2 Stage 5 and
 * ruling 1 ("batch size 6, and the batch report renders the six side by side so
 * **variance is visible** — shapes, reaches, tones in one view; that is what he
 * reviews for").
 *
 *   npm run encounter:batch-report -- <templateId...> [--out <path>] [--seed N]
 *   npm run encounter:batch-report -- --brief Docs/plans/encounters/<batch>-brief.md
 *
 * ## Why the report is a renderer, not a third gate
 *
 * It runs nothing itself. It shells `check:encounter --json` and
 * `check:encounter-live --json` and renders their verdicts together. That split
 * is the whole design: a report that re-implemented either check would drift
 * from it, and the drift would show up as a batch reading green while CI read
 * red — the most expensive shape of disagreement, because it is discovered after
 * the director has already approved the batch.
 *
 * ## Variance is the column, not a footnote
 *
 * Ruling 1 is a statement about *layout*: Christian reviews six encounters for
 * whether they differ from each other, so the shape/reach/tone facts sit in one
 * table with one row per encounter, and the per-encounter detail comes after.
 * A report that led with six full dossiers would be six reviews, not one batch
 * review, which is the thing the ruling exists to prevent.
 *
 * ## Links (Rule Zero)
 *
 * Every encounter row carries a clickable review link, because a report that
 * names a template id and expects the reader to find it is exactly the stall
 * Rule Zero forbids. Two links per row:
 *
 *   - `?spawn=` — live today, opens the encounter on the balanced test avatar.
 *   - Package View — the one-page whole-content-package surface (THR-1046).
 *     Rendered unconditionally and marked pending until that ticket ships: a
 *     link that will resolve is more useful in the report than a promise in a
 *     footnote, and marking it is what keeps it from reading as broken.
 *
 * Exit codes:
 *   0  report written (whatever the batch's own verdicts were)
 *   1  a sub-check could not be run, or no templates were named
 *
 * The report's exit code deliberately does **not** mirror the batch verdict.
 * A batch with failures is a report worth reading, and failing the command that
 * *writes* it would delete the artifact that explains why.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ─── Constants (NFP #1) ──────────────────────────────────────────────

/** Ruling 1. Not enforced — a batch may be short — but reported against. */
const BATCH_SIZE = 6;

/** Deployed build, so a link in the report works from anywhere. */
const REVIEW_BASE_URL = 'https://threadbare.vercel.app';

/** The review route `?spawn=` needs: seeded identity, medium map, balanced avatar. */
const SPAWN_QUERY = 'view=game&seeded&size=medium';

/** Package View route (THR-1046). Rendered ahead of the surface, marked pending. */
const PACKAGE_VIEW_ROUTE = 'view=cms#encounter-packages';

const DEFAULT_OUT_DIR = 'Docs/plans/encounters';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  const index = argv.indexOf(name);
  return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined;
}

const FLAGS_WITH_VALUES: readonly string[] = ['--out', '--seed', '--brief'];
const ids = argv.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  const previous = argv[index - 1];
  return previous === undefined || !FLAGS_WITH_VALUES.includes(previous);
});

const seed = flagValue('--seed');
const briefPath = flagValue('--brief');

if (ids.length === 0) {
  console.error('Usage: npm run encounter:batch-report -- <templateId...> [--out <path>] [--seed N] [--brief <path>]');
  process.exit(1);
}

// ─── Sub-check shapes (the contracts this renderer consumes) ─────────

interface GateResult {
  id: string;
  failed: boolean;
  pending: boolean;
  composition: {
    systems: string[];
    bands: string[];
    violations: { block: string; message: string; planSection: string }[];
  };
  register: string[];
  liveness: string[];
  tokens: string[];
  forecast: string[];
}

interface LiveClaim {
  name: string;
  status: 'pass' | 'fail' | 'not_declared';
  detail: string;
}

interface LiveResult {
  templateId: string;
  verdict: 'proved' | 'failed' | 'vacuous';
  outcome?: string;
  ticksSpent: number;
  committedNudges: string[];
  claims: LiveClaim[];
}

/**
 * Characters an argument may contain to reach the shell.
 *
 * The sub-checks must run through a shell — Node refuses to `execFile` a Windows
 * `.cmd` shim directly (`spawnSync npm.cmd EINVAL`), and `npm` is a `.cmd` shim
 * on this platform. A shell means arguments are parsed, so they are validated
 * against this charset first rather than quoted: template ids and flags need
 * nothing outside it, and a whitelist that a legitimate argument cannot fail is
 * a stronger guarantee than escaping rules nobody re-reads.
 */
const SAFE_ARG = /^[A-Za-z0-9._\-/\\:]+$/;

/**
 * Run a sub-check and parse its JSON.
 *
 * `--silent` keeps npm's own banner out of stdout, but esbuild still prints its
 * build line, so the parse starts at the first `{` rather than at byte zero.
 * Trusting the whole of stdout to be JSON is how this class of wrapper usually
 * breaks, and it breaks loudly enough to look like a check failure.
 */
function runJson<T>(script: string, args: readonly string[]): T {
  for (const arg of args) {
    if (!SAFE_ARG.test(arg)) throw new Error(`refusing to shell out with argument '${arg}'`);
  }
  const raw = execSync(`npm run ${script} --silent -- ${args.join(' ')}`, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const start = raw.indexOf('{');
  if (start === -1) throw new Error(`${script} produced no JSON`);
  return JSON.parse(raw.slice(start)) as T;
}

// ─── Collect ─────────────────────────────────────────────────────────

console.log(`[batch-report] running check:encounter over ${ids.length} template(s)…`);
let gates: GateResult[];
try {
  // The gate exits 1 on failures; that is data here, not an error, so the throw
  // is caught and the parsed body used. Only an *unparseable* run is fatal.
  gates = runJson<{ results: GateResult[] }>('check:encounter', [...ids, '--json']).results;
} catch (error) {
  const stdout = (error as { stdout?: string }).stdout ?? '';
  const start = stdout.indexOf('{');
  if (start === -1) {
    console.error(`[batch-report] check:encounter could not be run: ${(error as Error).message}`);
    process.exit(1);
  }
  gates = (JSON.parse(stdout.slice(start)) as { results: GateResult[] }).results;
}

console.log(`[batch-report] running check:encounter-live over ${ids.length} template(s)…`);
let lives: LiveResult[];
const liveArgs = seed ? [...ids, '--seed', seed, '--json'] : [...ids, '--json'];
try {
  lives = runJson<{ results: LiveResult[] }>('check:encounter-live', liveArgs).results;
} catch (error) {
  const stdout = (error as { stdout?: string }).stdout ?? '';
  const start = stdout.indexOf('{');
  if (start === -1) {
    console.error(`[batch-report] check:encounter-live could not be run: ${(error as Error).message}`);
    process.exit(1);
  }
  lives = (JSON.parse(stdout.slice(start)) as { results: LiveResult[] }).results;
}

// ─── Render ──────────────────────────────────────────────────────────

const gateById = new Map(gates.map(gate => [gate.id, gate]));
const liveById = new Map(lives.map(live => [live.templateId, live]));

function spawnLink(id: string): string {
  return `${REVIEW_BASE_URL}/?${SPAWN_QUERY}&spawn=${id}`;
}

function packageLink(id: string): string {
  return `${REVIEW_BASE_URL}/?${PACKAGE_VIEW_ROUTE}/${id}`;
}

function gateBadge(gate: GateResult | undefined): string {
  if (!gate) return '—';
  if (!gate.failed) return '✅ green';
  return gate.pending ? '🟡 ratchet' : '❌ red';
}

function liveBadge(live: LiveResult | undefined): string {
  if (!live) return '—';
  return { proved: '✅ proved', failed: '❌ failed', vacuous: '⚪ vacuous' }[live.verdict];
}

const today = new Date().toISOString().slice(0, 10);
const lines: string[] = [];

lines.push(`# Encounter batch report — ${today}`);
lines.push('');
lines.push(
  `**Batch:** ${ids.length} encounter(s)`
    + (ids.length === BATCH_SIZE ? '' : ` (ruling 1 sets the batch at ${BATCH_SIZE})`),
);
if (briefPath) lines.push(`**Brief:** \`${briefPath}\``);
lines.push(
  '**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). '
    + 'This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.',
);
lines.push('');
lines.push(
  '> **How to read this.** The first table is the batch: one row per encounter, so '
    + 'variance is visible in one view (ruling 1). Everything below it is per-encounter '
    + 'detail for the two you sample.',
);
lines.push('');

// ── Variance table (ruling 1) ──
lines.push('## The batch, side by side');
lines.push('');
lines.push('| Encounter | Gate | Live | Outcome | Systems | Bands | Review |');
lines.push('|---|---|---|---|---|---|---|');
for (const id of ids) {
  const gate = gateById.get(id);
  const live = liveById.get(id);
  const systems = gate?.composition.systems.join(', ') || '—';
  const bands = gate?.composition.bands.length ?? 0;
  const outcome = live?.outcome ?? '—';
  lines.push(
    `| \`${id}\` | ${gateBadge(gate)} | ${liveBadge(live)} | ${outcome} | ${systems} `
      + `| ${bands} | [spawn](${spawnLink(id)}) · [package](${packageLink(id)}) |`,
  );
}
lines.push('');
lines.push(
  '*Package View links resolve once THR-1046 ships; the spawn links are live today.*',
);
lines.push('');

// ── Roll-up ──
const gateGreen = ids.filter(id => gateById.get(id)?.failed === false).length;
const liveProved = ids.filter(id => liveById.get(id)?.verdict === 'proved').length;
const liveVacuous = ids.filter(id => liveById.get(id)?.verdict === 'vacuous').length;

lines.push('## Verdict roll-up');
lines.push('');
lines.push(`- **Gate green:** ${gateGreen} / ${ids.length}`);
lines.push(`- **Live proved:** ${liveProved} / ${ids.length}`);
lines.push(
  `- **Live vacuous:** ${liveVacuous} / ${ids.length}`
    + (liveVacuous > 0
      ? ' — these ran clean and proved nothing. Read them as unproved, not as passes.'
      : ''),
);
lines.push('');

// ── Per-encounter detail ──
lines.push('## Per-encounter detail');
lines.push('');
for (const id of ids) {
  const gate = gateById.get(id);
  const live = liveById.get(id);
  lines.push(`### \`${id}\``);
  lines.push('');
  lines.push(`[Open the encounter](${spawnLink(id)}) · [Open the content package](${packageLink(id)}) *(pending THR-1046)*`);
  lines.push('');

  const violations = gate?.composition.violations ?? [];
  const otherGateLines = [
    ...(gate?.register ?? []).map(line => `register — ${line}`),
    ...(gate?.liveness ?? []).map(line => `liveness — ${line}`),
    ...(gate?.tokens ?? []).map(line => `tokens — ${line}`),
    ...(gate?.forecast ?? []).map(line => `forecast — ${line}`),
  ];

  if (violations.length === 0 && otherGateLines.length === 0) {
    lines.push('**Stage 3 — gate:** green.');
  } else {
    lines.push('**Stage 3 — gate:**');
    lines.push('');
    for (const violation of violations) {
      lines.push(`- \`[${violation.block}]\` ${violation.message}`);
    }
    for (const line of otherGateLines) lines.push(`- ${line}`);
  }
  lines.push('');

  if (!live) {
    lines.push('**Stage 4 — live proof:** not run.');
  } else {
    lines.push(
      `**Stage 4 — live proof:** ${liveBadge(live)} `
        + `(${live.ticksSpent} tick(s), hand: ${live.committedNudges.join(', ') || 'none'})`,
    );
    lines.push('');
    const notable = live.claims.filter(claim => claim.status !== 'pass');
    if (notable.length === 0) {
      lines.push('- every declared claim passed');
    } else {
      for (const claim of notable) {
        const mark = claim.status === 'fail' ? '❌' : '·';
        lines.push(`- ${mark} \`${claim.name}\` — ${claim.detail}`);
      }
    }
  }
  lines.push('');
}

// ── Director's sample (Stage 5) ──
lines.push('## Director\'s sample');
lines.push('');
lines.push(
  `Ruling: Christian reviews **2** of the ${ids.length}, in chat, in plain language `
    + '(THR-608). The gates hold the floor; he holds the ceiling.',
);
lines.push('');
const sample = ids.slice(0, 2);
for (const id of sample) {
  lines.push(`- \`${id}\` — [open it](${spawnLink(id)})`);
}
lines.push('');
lines.push(
  '**Ask him one question:** *do these two read like encounters worth meeting twice?* '
    + 'His verdict feeds the next brief.',
);
lines.push('');

const outPath = flagValue('--out')
  ?? path.join(DEFAULT_OUT_DIR, `batch-report-${today}.md`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`[batch-report] wrote ${outPath}`);
console.log(
  `[batch-report] gate green ${gateGreen}/${ids.length} · `
    + `live proved ${liveProved}/${ids.length} · vacuous ${liveVacuous}/${ids.length}`,
);

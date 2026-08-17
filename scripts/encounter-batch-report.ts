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

import { plotHookById } from '../src/data/content-eval/plotHooks';

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

/**
 * Where the Package critic's per-encounter verdicts live (THR-1154).
 *
 * Beside the batch's other pipeline artifacts, same as the editorial and systems
 * passes. Read rather than re-run: this file is a renderer, and the package
 * question is a *written judgment*, not a machine output — re-deriving it here
 * would either drift from the critic or silently invent an answer nobody wrote.
 */
const PACKAGE_DIR = DEFAULT_OUT_DIR;

/** The three package verdicts, worst last so a batch sorts readably. */
const PACKAGE_BADGE: Readonly<Record<string, string>> = {
  connected: '🔗 connected',
  thin: '🪢 thin',
  solitary: '📖 solitary',
};

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
const packageById = loadPackageVerdicts(PACKAGE_DIR);

/**
 * One Package-critic verdict, as written into `<slug>-package.md` (THR-1154).
 *
 * `leaves` is the critic's answer to the qualitative half — *what does this
 * encounter leave behind that a later encounter or system can pick up, and would
 * the player recognise it happening?* It is carried into the report verbatim,
 * because that sentence is the thing the director's sample review reads.
 */
interface PackageVerdict {
  readonly templateId: string;
  readonly verdict: string;
  readonly leaves: string;
}

/**
 * Scan the batch's pipeline artifacts for Package-critic verdicts.
 *
 * Reads authored markdown by regex, the same way the plot-hook block reads the
 * brief, and for the same reason: the verdict exists only in the critic's write-up,
 * so that document is the sole source. A missing file is not an error — a batch run
 * before this stage existed simply has no verdicts, and the column says so rather
 * than failing a report that is otherwise complete (the report never fails on batch
 * content, only on being unable to run).
 */
function loadPackageVerdicts(dir: string): Map<string, PackageVerdict> {
  const byId = new Map<string, PackageVerdict>();
  if (!fs.existsSync(dir)) return byId;

  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith('-package.md')) continue;
    const body = fs.readFileSync(path.join(dir, entry), 'utf8');

    const templateId = /^\s*templateId:\s*(.+)$/im.exec(body)?.[1]?.trim().replace(/[`,]/g, '');
    const verdict = /^\s*packageVerdict:\s*(.+)$/im.exec(body)?.[1]?.trim().toLowerCase();
    const leaves = /^\s*packageLeaves:\s*(.+)$/im.exec(body)?.[1]?.trim();
    if (!templateId || !verdict) continue;

    byId.set(templateId, { templateId, verdict, leaves: leaves ?? '' });
  }
  return byId;
}

function packageBadge(entry: PackageVerdict | undefined): string {
  if (!entry) return '— not run';
  return PACKAGE_BADGE[entry.verdict] ?? `⚠️ \`${entry.verdict}\``;
}

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
lines.push('| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |');
lines.push('|---|---|---|---|---|---|---|---|');
for (const id of ids) {
  const gate = gateById.get(id);
  const live = liveById.get(id);
  const systems = gate?.composition.systems.join(', ') || '—';
  const bands = gate?.composition.bands.length ?? 0;
  const outcome = live?.outcome ?? '—';
  lines.push(
    `| \`${id}\` | ${gateBadge(gate)} | ${liveBadge(live)} | ${packageBadge(packageById.get(id))} `
      + `| ${outcome} | ${systems} | ${bands} | [spawn](${spawnLink(id)}) · [package](${packageLink(id)}) |`,
  );
}
lines.push('');
lines.push(
  '*Package View links resolve once THR-1046 ships; the spawn links are live today.*',
);
lines.push('');

// ── Package verdicts (THR-1154) ──
//
// The director's frame: prose and chips are one package, judged together or not at
// all. The mechanical half (does every chip anchor?) is shared with THR-1153's gate
// and shows up in the Gate column. This block carries the half no machine can read.
{
  const answered = ids.map(id => packageById.get(id)).filter((v): v is PackageVerdict => v !== undefined);
  lines.push('## What each encounter leaves behind');
  lines.push('');
  lines.push(
    '> The Package critic\'s answer, per encounter, to: *what does this encounter leave '
      + 'behind that a later encounter or system can pick up, and would the player '
      + 'recognise it happening?* An encounter whose honest answer is "nothing" is a '
      + 'solitary story — ruling 4 applies, park it rather than shipping it.',
  );
  lines.push('');

  if (answered.length === 0) {
    lines.push(
      `*No Package verdicts found in \`${PACKAGE_DIR}\`. Either the batch predates the `
        + 'Package stage or it has not run yet — treat this batch as unjudged on the '
        + 'package question, not as passing it.*',
    );
  } else {
    lines.push('| Encounter | Verdict | What it leaves |');
    lines.push('|---|---|---|');
    for (const id of ids) {
      const entry = packageById.get(id);
      if (!entry) {
        lines.push(`| \`${id}\` | — not run | — |`);
        continue;
      }
      lines.push(`| \`${id}\` | ${packageBadge(entry)} | ${entry.leaves || '⚠️ no answer written'} |`);
    }

    const solitary = answered.filter(v => v.verdict === 'solitary').length;
    if (solitary > 0) {
      lines.push('');
      lines.push(
        `**${solitary} of ${ids.length} judged solitary.** A solitary encounter is not a `
          + 'failed one — it is a finished story that connects to nothing, and the response '
          + 'is to park it for a human, not to redraft it.',
      );
    }
  }
  lines.push('');
}

// ── Plot hooks (THR-1147) ──
//
// Read from the brief rather than the templates, because the hook is deliberately
// not recorded on a template: it is a starting point, not a contract, and the
// finished encounter is never checked against it. The brief is therefore the only
// place the roll exists, which is exactly why recording it there is mandatory.
if (briefPath && fs.existsSync(briefPath)) {
  const brief = fs.readFileSync(briefPath, 'utf8');
  const taken = [...brief.matchAll(/^\s*plotHookTaken:\s*(.+)$/gim)]
    .flatMap(match => match[1].split(','))
    .map(id => id.trim().replace(/[`,]/g, ''))
    .filter(id => id !== '');

  if (taken.length > 0) {
    lines.push('## Plot hooks taken');
    lines.push('');
    lines.push(
      '> The premise each encounter started from (THR-1147). A hook is a starting '
        + 'point, never a contract — nothing checks the finished encounter against it, '
        + 'so read this for **spread**, not for fidelity. Six hooks sharing a theme is '
        + 'the finding.',
    );
    lines.push('');
    lines.push('| Hook | Themes | Source | Times used before |');
    lines.push('|---|---|---|---|');

    const themeTally = new Map<string, number>();
    for (const id of taken) {
      const hook = plotHookById(id);
      if (!hook) {
        lines.push(`| \`${id}\` | — | ⚠️ not in the catalog | — |`);
        continue;
      }
      for (const theme of hook.themes) {
        themeTally.set(theme, (themeTally.get(theme) ?? 0) + 1);
      }
      lines.push(
        `| \`${hook.id}\` | ${hook.themes.join(', ')} | ${hook.source} | ${hook.usedBy.length} |`,
      );
    }
    lines.push('');

    const spread = [...themeTally.entries()].sort((a, b) => b[1] - a[1]);
    lines.push(
      `**Theme spread:** ${spread.map(([theme, n]) => `${theme} ×${n}`).join(' · ') || '—'}`,
    );
    lines.push('');
    lines.push(
      '*A `usedBy` count above 0 means the hook had already been spent before this '
        + 'batch — stamp the hook in `src/data/content-eval/plotHooks.ts` as each '
        + 'encounter ships, or the damping that keeps the corpus varied never applies.*',
    );
    lines.push('');
  }
}

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

/**
 * check:tick-cost — the tick-cost trend line someone reads (THR-1385).
 *
 * `measure:tick-cost` is the number; this is the memory. It appends today's
 * measurement to the dated trend file on the `ops` branch, compares the steady-state
 * ms/tick against the 7-day median, and returns the uniform probe shape
 * (`{verdict, summary, needsChristian, needsSession}`) that `keep-work-flowing-cc`
 * already folds into the briefing. Report, never fail: a regression is the
 * executor's job (`needsSession`), never Christian's (`needsChristian` is always
 * false here — nothing about engine speed is his decision).
 *
 *   npm run check:tick-cost -- --input .cache/tick-cost.json --write Docs/ops/tick-cost-trend.tsv --json
 *
 * `--input` is the JSON `measure:tick-cost -- --json` printed (the lane runs the
 * measurement first so a crash in it is one line, not a lost probe). `--write` writes
 * the updated trend file for `ops-publish.sh`; without it nothing is written. The
 * trend file lives on `ops` by the membership predicate in `Docs/ops/README.md`:
 * machine-written on a schedule, no gate reads it, nothing durable cites it.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Where the trend lives on the `ops` branch. */
export const TICK_COST_TREND_PATH = 'Docs/ops/tick-cost-trend.tsv';
/** Window the median is taken over. */
export const TICK_COST_MEDIAN_WINDOW_DAYS = 7;
/**
 * Drift that earns a Health line: steady ms/tick more than this fraction above the
 * window median. 25% is the ticket's number — one merge's worth of per-tick cost on
 * the 2026-08-29 evidence (45 → 91 s was 100%), well above runner noise (~10%).
 */
export const TICK_COST_DRIFT_FRACTION = 0.25;
/** Rows needed before a median means anything. */
export const TICK_COST_MIN_ROWS_FOR_MEDIAN = 3;
/** Rows kept in the trend file. Hourly for a quarter, roughly. */
export const TICK_COST_MAX_ROWS = 2200;

const COLUMNS = ['measuredAt', 'commit', 'seed', 'map', 'ticks', 'agentsAtEnd', 'msPerTickWarmup', 'msPerTickSteady', 'totalMs', 'topPhase', 'node'] as const;

interface Row { measuredAt: string; commit: string; seed: string; map: string; ticks: string; agentsAtEnd: string; msPerTickWarmup: string; msPerTickSteady: string; totalMs: string; topPhase: string; node: string }

interface Probe {
  verdict: 'healthy' | 'drift' | 'baseline' | 'unknown';
  summary: string;
  needsChristian: false;
  needsSession: boolean;
  row?: Row;
  medianSteady?: number;
  windowRows?: number;
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function readTrend(): Row[] {
  try {
    const text = execSync(`git show origin/ops:${TICK_COST_TREND_PATH}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return text.split('\n').slice(1).filter(l => l.trim()).map(l => {
      const cells = l.split('\t');
      return Object.fromEntries(COLUMNS.map((c, i) => [c, cells[i] ?? ''])) as unknown as Row;
    });
  } catch {
    return [];
  }
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function run(): Probe {
  const input = argValue('--input');
  if (!input) {
    return { verdict: 'unknown', summary: 'check:tick-cost — no --input measurement given; nothing compared.', needsChristian: false, needsSession: false };
  }
  let m: { measuredAt: string; seed: number; map: string; ticks: number; agentsAtEnd: number; msPerTickWarmup: number; msPerTickSteady: number; totalMs: number; phases: { phase: string }[]; node: string };
  try {
    m = JSON.parse(readFileSync(input, 'utf8'));
  } catch (err) {
    return { verdict: 'unknown', summary: `check:tick-cost — could not read ${input}: ${(err as Error).message}`, needsChristian: false, needsSession: false };
  }
  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short origin/main', { encoding: 'utf8' }).trim(); } catch { /* fail-soft */ }

  const row: Row = {
    measuredAt: m.measuredAt, commit, seed: String(m.seed), map: m.map, ticks: String(m.ticks),
    agentsAtEnd: String(m.agentsAtEnd), msPerTickWarmup: m.msPerTickWarmup.toFixed(1),
    msPerTickSteady: m.msPerTickSteady.toFixed(1), totalMs: m.totalMs.toFixed(0),
    topPhase: m.phases[0]?.phase ?? 'none', node: m.node,
  };

  const prior = readTrend();
  const cutoff = Date.now() - TICK_COST_MEDIAN_WINDOW_DAYS * 24 * 3600 * 1000;
  const window = prior.filter(r => r.map === row.map && r.seed === row.seed && r.ticks === row.ticks && Date.parse(r.measuredAt) >= cutoff);
  const all = [...prior, row].slice(-TICK_COST_MAX_ROWS);

  if (argValue('--write')) {
    const out = argValue('--write')!;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, [COLUMNS.join('\t'), ...all.map(r => COLUMNS.map(c => r[c]).join('\t'))].join('\n') + '\n');
  }

  const steady = Number(row.msPerTickSteady);
  if (window.length < TICK_COST_MIN_ROWS_FOR_MEDIAN) {
    return {
      verdict: 'baseline', needsChristian: false, needsSession: false, row, windowRows: window.length,
      summary: `tick cost ${steady.toFixed(0)} ms/tick steady (${row.map}, ${row.ticks} ticks, ${row.agentsAtEnd} agents, top phase ${row.topPhase}) — ${window.length} prior row(s) in ${TICK_COST_MEDIAN_WINDOW_DAYS} d, building the baseline.`,
    };
  }
  const med = median(window.map(r => Number(r.msPerTickSteady)));
  const drift = med > 0 ? steady / med - 1 : 0;
  if (drift > TICK_COST_DRIFT_FRACTION) {
    const first = window[0];
    return {
      verdict: 'drift', needsChristian: false, needsSession: true, row, medianSteady: med, windowRows: window.length,
      summary: `tick cost ${steady.toFixed(0)} ms/tick steady, ${(drift * 100).toFixed(0)}% above the ${TICK_COST_MEDIAN_WINDOW_DAYS}-day median (${med.toFixed(0)}, ${window.length} rows since ${first.commit}); top phase ${row.topPhase}, ${row.agentsAtEnd} agents. Name the merges between ${first.commit} and ${commit}: git log --oneline --merges ${first.commit}..${commit}`,
    };
  }
  return {
    verdict: 'healthy', needsChristian: false, needsSession: false, row, medianSteady: med, windowRows: window.length,
    summary: `tick cost ${steady.toFixed(0)} ms/tick steady, ${drift >= 0 ? '+' : ''}${(drift * 100).toFixed(0)}% vs the ${TICK_COST_MEDIAN_WINDOW_DAYS}-day median (${med.toFixed(0)}, ${window.length} rows).`,
  };
}

const probe = run();
if (process.argv.includes('--json')) console.log(JSON.stringify(probe));
else console.log(`[tick-cost] verdict=${probe.verdict} needs-session=${probe.needsSession}\n[tick-cost] ${probe.summary}`);

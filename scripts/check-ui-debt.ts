#!/usr/bin/env node

/**
 * check-ui-debt — the UI-debt ratchet (THR-1821).
 *
 * Counts each row of `scripts/ui-debt-rows.ts` (raw `<button>`, colour literals,
 * glyph icons, hand-built overlays, …) across the player UI tree, compares every
 * row's total with `ui-debt-baseline.json`, and fails if ANY row went up. Rows
 * only go down. The shape is `check-typecheck-ratchet.ts`'s, and the properties
 * worth keeping if this is rewritten are the same:
 *
 * 1. Comments never count. `.ts`/`.tsx` files are parsed with the TypeScript
 *    compiler API and re-printed with `removeComments: true`; `.css` files lose
 *    their block comments. A hand-rolled stripper mis-reads the apostrophe in
 *    JSX text (`Don't`) as a string opener and eats the rest of the file.
 * 2. The compiler is proven present BEFORE anything is scored (THR-1128). A
 *    ratchet that cannot run must never report a floor.
 * 3. A run that cannot vouch for itself is UNVERIFIABLE: a root with zero files,
 *    an unreadable file, a file that does not parse. Exit 1, write nothing.
 * 4. An implausibly large drop is SUSPECT, not OK — a detector or scope that
 *    silently matches nothing looks exactly like this. `--allow-drop` accepts
 *    it, deliberately out loud.
 * 5. `--update` refuses to RAISE an existing row unless that row is named with
 *    `--allow-increase=<row-id>`. Raising a ceiling is a named act with a reason
 *    in the commit body, never a side effect of refreshing.
 *
 * The gate is each row's TOTAL. The per-file map only makes a failure
 * actionable; debt moving between files never fails the build.
 *
 * Not a generated-freshness artifact, for the chip ratchet's reason: freshness
 * would force the baseline to equal the current count on every commit and
 * delete the only thing a ratchet does.
 *
 * Run: `npm run check:ui-debt`. After lowering a count:
 * `npm run check:ui-debt -- --update`, and commit the baseline.
 * Plan: Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { isExcluded, UI_DEBT_ROWS, type CleanSource, type StyleBlock, type UiDebtRow } from './ui-debt-rows.ts';

/** Committed baseline, refreshed via `--update`. */
export const UI_DEBT_BASELINE_PATH = 'ui-debt-baseline.json';
/** A one-run drop above this share of the baseline is suspect (property 4). */
export const UI_DEBT_SUSPECT_DROP_RATIO = 0.5;
/** Below this baseline a row may drop freely — a 4 → 1 drop is real work, not a broken detector. */
export const UI_DEBT_SUSPECT_DROP_MIN_BASELINE = 10;
/** Files listed when a row grows. */
export const UI_DEBT_GROWTH_REPORT_LIMIT = 20;

export const ALLOW_DROP_FLAG = '--allow-drop';
export const ALLOW_INCREASE_PREFIX = '--allow-increase=';

/** Specifiers that prove the compiler is installed (property 2) — the typecheck ratchet's list. */
export const COMPILER_SPECIFIERS = ['typescript/bin/tsc', 'typescript'] as const;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const requireFromScript = createRequire(import.meta.url);

// ── Verdicts (pure) ──────────────────────────────────────────────────────

export type RowVerdictKind = 'unregistered-row' | 'orphan-row' | 'increase' | 'suspect-drop' | 'decrease' | 'unchanged';

export interface RowVerdict {
  id: string;
  kind: RowVerdictKind;
  /** Measured total; null for an orphan row. */
  total: number | null;
  /** Baseline total; null for an unregistered row. */
  baseline: number | null;
}

export type UiDebtVerdict =
  | { kind: 'unverifiable'; detail: string }
  | { kind: 'no-baseline' }
  | { kind: 'rows'; rows: RowVerdict[]; failing: boolean };

export interface UiDebtFlags {
  update: boolean;
  allowDrop: boolean;
  /** Row ids named with `--allow-increase=<row-id>`. */
  allowIncrease: readonly string[];
}

export interface UiDebtFacts {
  /** Why the run cannot vouch for itself, or null. */
  unverifiable: string | null;
  /** Row id → measured total, for every registered row. */
  measured: Readonly<Record<string, number>>;
  /** Row id → baseline total, or null when the baseline is missing or malformed. */
  baseline: Readonly<Record<string, number>> | null;
}

/** Verdicts that fail the check path. */
const FAILING: ReadonlySet<RowVerdictKind> = new Set(['unregistered-row', 'orphan-row', 'increase', 'suspect-drop']);

/**
 * The whole decision. `main()` does the I/O; everything that decides whether
 * the gate may report a floor lives here so a test can drive it.
 */
export function classifyUiDebt(facts: UiDebtFacts, flags: UiDebtFlags): UiDebtVerdict {
  if (facts.unverifiable !== null) return { kind: 'unverifiable', detail: facts.unverifiable };
  if (facts.baseline === null) return { kind: 'no-baseline' };

  const rows: RowVerdict[] = [];
  for (const [id, total] of Object.entries(facts.measured)) {
    const baseline = facts.baseline[id];
    if (baseline === undefined) {
      rows.push({ id, kind: 'unregistered-row', total, baseline: null });
    } else if (
      !flags.allowDrop &&
      baseline >= UI_DEBT_SUSPECT_DROP_MIN_BASELINE &&
      total < baseline * (1 - UI_DEBT_SUSPECT_DROP_RATIO)
    ) {
      rows.push({ id, kind: 'suspect-drop', total, baseline });
    } else if (total > baseline) {
      rows.push({ id, kind: 'increase', total, baseline });
    } else if (total < baseline) {
      rows.push({ id, kind: 'decrease', total, baseline });
    } else {
      rows.push({ id, kind: 'unchanged', total, baseline });
    }
  }
  for (const [id, baseline] of Object.entries(facts.baseline)) {
    if (!(id in facts.measured)) rows.push({ id, kind: 'orphan-row', total: null, baseline });
  }
  return { kind: 'rows', rows, failing: rows.some((r) => FAILING.has(r.kind)) };
}

/**
 * Why `--update` must not write, or null when it may. Unverifiable runs and
 * suspect drops never write (THR-1128); an increase writes only for a row named
 * with `--allow-increase`. New rows and orphan rows are what `--update` is for.
 */
export function updateRefusal(verdict: UiDebtVerdict, flags: UiDebtFlags): string | null {
  if (verdict.kind === 'unverifiable') return `the run is unverifiable — ${verdict.detail}`;
  if (verdict.kind === 'no-baseline') return null;
  const suspect = verdict.rows.filter((r) => r.kind === 'suspect-drop').map((r) => r.id);
  if (suspect.length > 0) {
    return `suspect drop on ${suspect.join(', ')} — verify the detector, then re-run with ${ALLOW_DROP_FLAG}`;
  }
  const raised = verdict.rows
    .filter((r) => r.kind === 'increase' && !flags.allowIncrease.includes(r.id))
    .map((r) => `${r.id} (${r.baseline} → ${r.total})`);
  if (raised.length > 0) {
    return (
      `refusing to raise ${raised.join(', ')}. Raising a ceiling is deliberate: name the row with ` +
      `${ALLOW_INCREASE_PREFIX}<row-id> and say why in the commit body`
    );
  }
  return null;
}

/** Parse the CLI flags. */
export function parseFlags(argv: readonly string[]): UiDebtFlags {
  return {
    update: argv.includes('--update'),
    allowDrop: argv.includes(ALLOW_DROP_FLAG),
    allowIncrease: argv.filter((a) => a.startsWith(ALLOW_INCREASE_PREFIX)).map((a) => a.slice(ALLOW_INCREASE_PREFIX.length)),
  };
}

// ── Measurement ──────────────────────────────────────────────────────────

/** Absolute path to the installed compiler, or null when TypeScript is absent. */
export function findCompiler(): string | null {
  for (const specifier of COMPILER_SPECIFIERS) {
    try {
      return requireFromScript.resolve(specifier);
    } catch {
      // Try the next specifier.
    }
  }
  return null;
}

type Ts = typeof import('typescript');

/** Comment-free text, strings and style blocks of a `.ts`/`.tsx` file. Throws on a parse error. */
export function cleanScript(ts: Ts, relPath: string, raw: string): CleanSource {
  const ext = path.extname(relPath).toLowerCase();
  const kind = ext === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(relPath, raw, ts.ScriptTarget.Latest, true, kind);
  const diagnostics = (sf as unknown as { parseDiagnostics?: readonly { messageText: unknown }[] }).parseDiagnostics ?? [];
  if (diagnostics.length > 0) {
    const first = diagnostics[0]?.messageText;
    throw new Error(`does not parse: ${typeof first === 'string' ? first : 'syntax error'}`);
  }
  const text = ts.createPrinter({ removeComments: true }).printFile(sf);

  const strings: string[] = [];
  const blocks: StyleBlock[] = [];
  const visit = (node: import('typescript').Node): void => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      strings.push(node.text);
    } else if (ts.isObjectLiteralExpression(node)) {
      const props: Record<string, string> = {};
      const spreads: string[] = [];
      for (const member of node.properties) {
        if (ts.isPropertyAssignment(member)) {
          const name = member.name;
          if (ts.isIdentifier(name) || ts.isStringLiteral(name)) props[name.text] = member.initializer.getText(sf);
        } else if (ts.isSpreadAssignment(member)) {
          spreads.push(member.expression.getText(sf));
        }
      }
      blocks.push({ props, spreads });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { path: relPath, ext, text, strings, blocks };
}

/** Comment-free text and rule bodies of a `.css` file. */
export function cleanCss(relPath: string, raw: string): CleanSource {
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: StyleBlock[] = [];
  for (const m of text.matchAll(/\{([^{}]*)\}/g)) {
    const props: Record<string, string> = {};
    for (const decl of (m[1] ?? '').split(';')) {
      const colon = decl.indexOf(':');
      if (colon < 0) continue;
      props[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
    }
    blocks.push({ props, spreads: [] });
  }
  return { path: relPath, ext: '.css', text, strings: [], blocks };
}

function walk(absDir: string, out: string[]): void {
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.isFile()) out.push(abs);
  }
}

export interface Measurement {
  unverifiable: string | null;
  /** Row id → total. */
  totals: Record<string, number>;
  /** Row id → file → count (non-zero only). */
  perFile: Record<string, Record<string, number>>;
  files: number;
}

/** Count every row across its scope. Pure over the filesystem it is given. */
export function measure(ts: Ts, rows: readonly UiDebtRow[], repoRoot: string): Measurement {
  const totals: Record<string, number> = {};
  const perFile: Record<string, Record<string, number>> = {};
  const cache = new Map<string, CleanSource>();
  const seen = new Set<string>();

  for (const row of rows) {
    totals[row.id] = 0;
    perFile[row.id] = {};
    for (const root of row.roots) {
      const absRoot = path.join(repoRoot, root);
      const files: string[] = [];
      try {
        walk(absRoot, files);
      } catch (err) {
        return { unverifiable: `root ${root} cannot be read (${(err as Error).message})`, totals, perFile, files: seen.size };
      }
      const inRoot = files.map((abs) => path.relative(repoRoot, abs).replaceAll('\\', '/')).filter((rel) => !isExcluded(rel));
      // A root with nothing in it means a moved directory or a broken walk, never
      // a clean codebase. (A row's own extension may match nothing in one root —
      // `src/hooks` holds no `.tsx` — and that is fine.)
      if (inRoot.length === 0) {
        return { unverifiable: `row ${row.id}: root ${root} has zero files in scope`, totals, perFile, files: seen.size };
      }
      const scoped = inRoot.filter((rel) => row.extensions.test(rel));
      for (const rel of scoped.sort()) {
        if (row.homes.some((home) => home.test(rel))) continue;
        let source = cache.get(rel);
        if (source === undefined) {
          try {
            const raw = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
            source = rel.endsWith('.css') ? cleanCss(rel, raw) : cleanScript(ts, rel, raw);
          } catch (err) {
            return { unverifiable: `${rel}: ${(err as Error).message}`, totals, perFile, files: seen.size };
          }
          cache.set(rel, source);
        }
        seen.add(rel);
        const n = row.count(source);
        if (n > 0) {
          totals[row.id] += n;
          perFile[row.id][rel] = n;
        }
      }
    }
  }
  return { unverifiable: null, totals, perFile, files: seen.size };
}

// ── Baseline I/O ─────────────────────────────────────────────────────────

interface BaselineRow {
  total: number;
  perFile: Record<string, number>;
}
interface BaselineFile {
  rows: Record<string, BaselineRow>;
}

/** The baseline, or null when missing or malformed. */
export function readBaseline(absPath: string): BaselineFile | null {
  if (!fs.existsSync(absPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(absPath, 'utf8')) as Partial<BaselineFile>;
    if (!parsed.rows || typeof parsed.rows !== 'object') return null;
    for (const row of Object.values(parsed.rows)) {
      if (typeof row?.total !== 'number' || !Number.isFinite(row.total)) return null;
    }
    return parsed as BaselineFile;
  } catch {
    return null;
  }
}

function sortedRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

/** Measured rows only — orphan rows are dropped. Keys sorted so the file diffs cleanly. */
export function serializeBaseline(m: Measurement): string {
  const rows: Record<string, BaselineRow> = {};
  for (const id of Object.keys(m.totals)) {
    rows[id] = { total: m.totals[id] ?? 0, perFile: sortedRecord(m.perFile[id] ?? {}) };
  }
  return `${JSON.stringify({ rows: sortedRecord(rows) }, null, 2)}\n`;
}

/** Files whose count of one row rose, worst first. */
export function growthReport(now: Record<string, number>, before: Record<string, number>): string[] {
  const grew: Array<{ file: string; from: number; to: number }> = [];
  for (const [file, count] of Object.entries(now)) {
    const from = before[file] ?? 0;
    if (count > from) grew.push({ file, from, to: count });
  }
  return grew
    .sort((a, b) => b.to - b.from - (a.to - a.from) || a.file.localeCompare(b.file))
    .slice(0, UI_DEBT_GROWTH_REPORT_LIMIT)
    .map(({ file, from, to }) => `${file}: ${from} → ${to} (+${to - from})`);
}

// ── main ─────────────────────────────────────────────────────────────────

function fail(reason: string, ...detail: string[]): never {
  console.error(`check-ui-debt: FAIL — ${reason}`);
  for (const line of detail) console.error(`  ${line}`);
  process.exit(1);
}

function rowLine(r: RowVerdict): string {
  const id = r.id.padEnd(19);
  switch (r.kind) {
    case 'unchanged':
      return `  ${id} ${r.total}`;
    case 'decrease':
      return `  ${id} ${r.baseline} → ${r.total}  (−${(r.baseline ?? 0) - (r.total ?? 0)}, run --update)`;
    case 'increase':
      return `  ${id} ${r.baseline} → ${r.total}  (+${(r.total ?? 0) - (r.baseline ?? 0)}) INCREASE`;
    case 'suspect-drop':
      return `  ${id} ${r.baseline} → ${r.total}  SUSPECT DROP (more than ${UI_DEBT_SUSPECT_DROP_RATIO * 100}%)`;
    case 'unregistered-row':
      return `  ${id} ${r.total}  UNREGISTERED — no baseline entry`;
    case 'orphan-row':
      return `  ${id} baseline ${r.baseline}  ORPHAN — no row in ui-debt-rows.ts`;
  }
}

export async function main(argv: readonly string[] = process.argv.slice(2), repoRoot = REPO_ROOT): Promise<number> {
  const flags = parseFlags(argv);
  const started = Date.now();

  if (findCompiler() === null) {
    fail(
      'the TypeScript compiler is not installed — cannot verify.',
      `Resolved none of: ${COMPILER_SPECIFIERS.join(', ')}. Run \`npm install\` and re-run — ` +
        `${UI_DEBT_BASELINE_PATH} was NOT ${flags.update ? 'written' : 'compared'}.`,
    );
  }
  const ts = (await import('typescript')).default as Ts;

  const m = measure(ts, UI_DEBT_ROWS, repoRoot);
  const baselinePath = path.join(repoRoot, UI_DEBT_BASELINE_PATH);
  const baseline = readBaseline(baselinePath);
  const baselineTotals = baseline ? Object.fromEntries(Object.entries(baseline.rows).map(([id, r]) => [id, r.total])) : null;
  const verdict = classifyUiDebt({ unverifiable: m.unverifiable, measured: m.totals, baseline: baselineTotals }, flags);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (verdict.kind === 'unverifiable') {
    fail(`cannot verify — ${verdict.detail}.`, `${UI_DEBT_BASELINE_PATH} was NOT ${flags.update ? 'written' : 'compared'}.`);
  }

  if (flags.update) {
    const refusal = updateRefusal(verdict, flags);
    if (refusal !== null) fail(`--update refused: ${refusal}.`);
    fs.writeFileSync(baselinePath, serializeBaseline(m), 'utf8');
    console.log(`check-ui-debt: baseline updated — ${UI_DEBT_ROWS.length} rows over ${m.files} files (${seconds} s).`);
    for (const row of UI_DEBT_ROWS) console.log(`  ${row.id.padEnd(19)} ${m.totals[row.id]}`);
    console.log(`Commit ${UI_DEBT_BASELINE_PATH}.`);
    return 0;
  }

  if (verdict.kind === 'no-baseline') {
    fail(`${UI_DEBT_BASELINE_PATH} is missing or malformed — cannot verify.`, 'Create it with `npm run check:ui-debt -- --update`.');
  }

  const lines = verdict.rows.map(rowLine);
  if (!verdict.failing) {
    console.log(`check-ui-debt: OK — ${verdict.rows.length} rows over ${m.files} files (${seconds} s)`);
    for (const line of lines) console.log(line);
    if (verdict.rows.some((r) => r.kind === 'decrease')) {
      console.log('A row went down: run `npm run check:ui-debt -- --update` and commit the baseline so the floor holds.');
    }
    return 0;
  }

  console.error(`check-ui-debt: FAIL — ${verdict.rows.filter((r) => FAILING.has(r.kind)).length} row(s) failing`);
  for (const line of lines) console.error(line);
  for (const r of verdict.rows) {
    const row = UI_DEBT_ROWS.find((candidate) => candidate.id === r.id);
    if (r.kind === 'increase' && row) {
      console.error('');
      console.error(`${r.id} rose (${row.law}). Write instead: ${row.sanctioned.replace(/\.$/, '')}.`);
      for (const line of growthReport(m.perFile[r.id] ?? {}, baseline?.rows[r.id]?.perFile ?? {})) console.error(`  - ${line}`);
    } else if (r.kind === 'suspect-drop') {
      console.error('');
      console.error(
        `${r.id} fell by more than half in one run. A detector or scope that matches nothing looks exactly like ` +
          `this. If the drop is real, re-run with ${ALLOW_DROP_FLAG} --update and say why in the commit body.`,
      );
    } else if (r.kind === 'unregistered-row' || r.kind === 'orphan-row') {
      console.error('');
      console.error(`${r.id}: run \`npm run check:ui-debt -- --update\` and commit the baseline.`);
    }
  }
  return 1;
}

// Entry guard so the exports above are importable by tests without running the gate.
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  main().then((code) => process.exit(code));
}

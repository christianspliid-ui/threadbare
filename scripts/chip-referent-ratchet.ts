/**
 * The no-referent chip ratchet — arithmetic and baseline I/O (THR-1212, slice 3).
 *
 * Lives apart from `check-chip-anchors.ts` for one mechanical reason: that runner
 * executes `main()` at module top level, so a test importing it to score a
 * hand-built corpus would run the whole gate as a side effect. The house idiom
 * elsewhere is an `import.meta.url === argv[1]` entry guard, and it is **not
 * available here** — the npm script bundles the runner with
 * `esbuild --bundle`, and a bundle relocates the entry so that comparison stops
 * being a reliable "am I the entry" test. A guard that fails open would make the
 * gate exit 0 without running: the exact false green this whole ticket is about.
 * So the pure half moves here, where importing it does nothing.
 *
 * The rule itself is not here. `chipsWithoutReferent` lives in
 * `compositionContract.ts` beside the clause-2 walk it shares, so the measured
 * population and the gated population cannot drift apart.
 */

import fs from 'fs';
import path from 'path';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { chipsWithoutReferent } from '../src/data/content-eval/compositionContract';

/** Committed ratchet ceiling, refreshed via `--baseline --update`. */
export const BASELINE_PATH = 'chip-referent-baseline.json';

export const BASELINE_COMMAND = 'npm run check:chip-anchors -- --baseline';

export interface ChipReferentBaseline {
  /** The gate. Sum of `perTemplate`. */
  readonly total: number;
  /** How the number was produced, so a reader can reproduce it. */
  readonly command: string;
  /** Attributability only — the comparison is on `total` (see the runner header). */
  readonly perTemplate: Readonly<Record<string, number>>;
}

/** Count the no-referent chips across a population. */
export function noReferentCounts(
  templates: readonly UnifiedActionTemplate[],
): { total: number; perTemplate: Map<string, number> } {
  const perTemplate = new Map<string, number>();
  let total = 0;
  for (const template of templates) {
    const chips = chipsWithoutReferent(template);
    if (chips.length === 0) continue;
    perTemplate.set(template.id, chips.length);
    total += chips.length;
  }
  return { total, perTemplate };
}

/** Templates whose no-referent count rose against the baseline, biggest jump first. */
export function growthReport(
  perTemplate: ReadonlyMap<string, number>,
  baseline: ChipReferentBaseline,
): string[] {
  const grew: { id: string; from: number; to: number }[] = [];
  for (const [id, to] of perTemplate) {
    const from = baseline.perTemplate[id] ?? 0;
    if (to > from) grew.push({ id, from, to });
  }
  return grew
    .sort((a, b) => b.to - b.from - (a.to - a.from))
    .map(g => `${g.id}: ${g.from} → ${g.to} (+${g.to - g.from})`);
}

/** Shape check, split out so a test can assert the corrupt-file verdict directly. */
export function isValidBaseline(parsed: unknown): parsed is ChipReferentBaseline {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const candidate = parsed as Partial<ChipReferentBaseline>;
  if (typeof candidate.total !== 'number' || !Number.isFinite(candidate.total)) return false;
  if (typeof candidate.perTemplate !== 'object' || candidate.perTemplate === null) return false;
  return true;
}

export function serializeBaseline(
  total: number,
  perTemplate: ReadonlyMap<string, number>,
): string {
  const baseline: ChipReferentBaseline = {
    total,
    command: BASELINE_COMMAND,
    // Sorted so a refresh produces a reviewable diff rather than a reshuffle.
    perTemplate: Object.fromEntries([...perTemplate].sort(([a], [b]) => a.localeCompare(b))),
  };
  return `${JSON.stringify(baseline, null, 2)}\n`;
}

/**
 * Repo root. `process.cwd()` rather than a path derived from `import.meta.url`,
 * because the runner that calls this is bundled into `.cache/` and a
 * module-relative root would then be computed from the bundle's location. npm
 * scripts run with the package root as cwd, which is the stable answer.
 */
export function baselineFilePath(): string {
  return path.join(process.cwd(), BASELINE_PATH);
}

export type BaselineReadResult =
  | { readonly ok: true; readonly baseline: ChipReferentBaseline }
  | { readonly ok: false; readonly reason: 'missing' | 'malformed'; readonly message: string };

/**
 * Read the committed baseline.
 *
 * Both failure modes are hard failures with regeneration instructions. A gate
 * that reads an absent or corrupt ceiling as "no ceiling" passes everything while
 * looking green, which is worse than having no gate at all.
 */
export function readBaseline(file = baselineFilePath()): BaselineReadResult {
  if (!fs.existsSync(file)) {
    return {
      ok: false,
      reason: 'missing',
      message:
        `${BASELINE_PATH} is missing. Create it with \`${BASELINE_COMMAND} --update\`.`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return {
      ok: false,
      reason: 'malformed',
      message:
        `${BASELINE_PATH} is not valid JSON (${(error as Error).message}). `
        + `Regenerate with \`${BASELINE_COMMAND} --update\`.`,
    };
  }
  if (!isValidBaseline(parsed)) {
    return {
      ok: false,
      reason: 'malformed',
      message:
        `${BASELINE_PATH} is malformed — it needs a numeric \`total\` and an object `
        + `\`perTemplate\`. Regenerate with \`${BASELINE_COMMAND} --update\`.`,
    };
  }
  return { ok: true, baseline: parsed };
}

export function writeBaseline(
  total: number,
  perTemplate: ReadonlyMap<string, number>,
  file = baselineFilePath(),
): void {
  fs.writeFileSync(file, serializeBaseline(total, perTemplate), 'utf8');
}

/**
 * emitTrace cast ratchet (THR-1065).
 *
 * Every `as unknown as` at an `emitTrace`/`emitTiming` boundary is a payload the
 * compiler was told not to check. They exist because `Omit<TraceEntry, …>`
 * collapsed a ~200-member discriminated union into its common keys, so any
 * category-specific field read as an excess property and the only way to emit a
 * faithful trace was to launder it.
 *
 * `TraceEntryInput` (a distributive omit) removed that reason. What it cannot do
 * is remove the casts already written — a cast still compiles, silently, and
 * suppresses exactly the mismatch it used to be the only way around. THR-1065
 * exposed two such mismatches the moment four casts came out (THR-1117).
 *
 * So the count is pinned as a **ceiling that may only fall**. This is the
 * `RETROFIT_PENDING` / `ORPHANED_TRACE_INTERFACES` pattern: removing a cast is
 * the fix's proof, adding one fails here and has to be argued for in review.
 *
 * The scan is source-level on purpose. The defect is that these expressions
 * defeat the type system, so a type-level probe cannot see them by construction —
 * it would be the vacuous test this file exists to replace.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SRC = join(REPO_ROOT, 'src');

/**
 * Casts remaining at emitTrace boundaries. **May only shrink.**
 *
 * 117 when THR-1065 landed the distributive input; 112 after it retired the five
 * it could prove unnecessary; 110 after THR-1117 reconciled the two payloads that
 * retrofit had exposed in `phaseAscendantHandFilter`; 107 after THR-1150 added
 * `faction_reputation_gain` to `EncounterAftermathEffectTrace.effectKind` and took
 * the casts out of that arm. The rest are not yet known to be removable — each
 * needs its payload checked against its interface, which is the work, not a
 * formality.
 *
 * Lowering this number is the point. If a change raises it, the cast is hiding
 * something: name what, in the same PR.
 */
const MAX_EMITTRACE_CASTS = 107;

/**
 * Lines between an `emitTrace(` and its cast. Emit payloads are object literals
 * spanning many lines — `encounterAftermath.ts` has ~25-line ones — so the window
 * has to clear the longest of them or the scan silently under-reports.
 */
const LOOKBACK_LINES = 30;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

/**
 * This file. Excluded because the scanner's own source necessarily contains the
 * pattern it searches for, next to the `emitTrace` mention that qualifies it — so
 * an unguarded scan counts its own audit trail and reports one phantom cast that
 * can never be removed. Caught by this ratchet on its first run; it is the same
 * shape as impediment #578, where a drain predicate counted the comments
 * recording its own campaign.
 */
const SELF = fileURLToPath(import.meta.url);

function collectEmitTraceCasts(): string[] {
  const found: string[] = [];
  for (const file of walk(SRC)) {
    if (file === SELF) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!/as unknown as/.test(lines[i])) continue;
      // An `emitTrace(`/`emitTiming(` within the preceding window is what makes
      // this cast a trace-boundary cast rather than an unrelated one.
      const window = lines.slice(Math.max(0, i - LOOKBACK_LINES), i + 1).join('\n');
      if (!/emitTrace\s*\(|emitTiming\s*\(/.test(window)) continue;
      found.push(`${relative(REPO_ROOT, file)}:${i + 1}`);
    }
  }
  return found;
}

describe('emitTrace cast ratchet (THR-1065)', () => {
  const casts = collectEmitTraceCasts();

  it('the scan finds a realistic population', () => {
    // Vacuity guard. The assertion below is a `<=`, which passes trivially
    // against an empty scan — a broken walk or a changed cast spelling would
    // read as total success. Delete this guard only when the count reaches zero,
    // and replace it with an equality on zero.
    expect(casts.length).toBeGreaterThan(50);
  });

  it('emitTrace-boundary casts only decrease', () => {
    expect(
      casts.length,
      casts.length > MAX_EMITTRACE_CASTS
        ? `emitTrace casts rose to ${casts.length} (ceiling ${MAX_EMITTRACE_CASTS}). A cast here tells the compiler not to check a trace payload — THR-1065 found two payloads that had silently diverged from their interfaces behind exactly this. New sites:\n${casts.slice(MAX_EMITTRACE_CASTS).join('\n')}`
        : '',
    ).toBeLessThanOrEqual(MAX_EMITTRACE_CASTS);
  });

  it('the ceiling is not left stale after a removal', () => {
    // A ratchet nobody re-pins stops ratcheting: if 40 casts came out and the
    // ceiling stayed at 112, the next 40 could go back in unnoticed. Slack of
    // more than 10 means the ceiling owes an update in the PR that created it.
    expect(
      MAX_EMITTRACE_CASTS - casts.length,
      `MAX_EMITTRACE_CASTS is ${MAX_EMITTRACE_CASTS} but only ${casts.length} casts remain — re-pin it to ${casts.length} so the ratchet keeps holding.`,
    ).toBeLessThanOrEqual(10);
  });
});

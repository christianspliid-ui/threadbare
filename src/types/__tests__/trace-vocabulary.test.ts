/**
 * Trace vocabulary gate (THR-928).
 *
 * Three sets describe traces, and until THR-928 nothing held them together:
 *
 *   A  the `TraceCategory` union            — the debug-panel filter vocabulary
 *   A' the `TRACE_CATEGORIES` array         — the runtime mirror of A, which
 *                                             DebugPanel seeds its enabled set from
 *   B  `category: '<lit>'` field decls      — the TraceEntry members, i.e. what
 *                                             `trace.category` narrows to and so
 *                                             what a consumer may compare against
 *                                             without a cast
 *   C  categories at emitTrace call sites   — what the engine actually emits
 *
 * They had diverged in every direction: 34 emitted categories were absent from A
 * (so invisible in the trace inspector, because DebugPanel filters on membership
 * of A'), three sat in A' but not A (so the `TRACE_CATEGORIES: TraceCategory[]`
 * annotation itself failed to typecheck), and 20 authored payload interfaces were
 * never added to the `TraceEntry` union at all.
 *
 * This is the THR-800 / THR-803 "two vocabularies that never intersected" shape.
 * A count is not a gate — the assertions below pin the *sets*, so the next
 * divergence fails here instead of being rediscovered by hand months later.
 *
 * The scan is deliberately source-level rather than type-level: the defect is
 * precisely that the types do not constrain each other, so a type-level probe
 * would be the vacuous test this file exists to replace.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SRC = join(REPO_ROOT, 'src');
const TRACE_TS = join(SRC, 'types/trace.ts');
const TRACES_DIR = join(SRC, 'types/traces');

/**
 * Strip comments before delimiting a declaration.
 *
 * Load-bearing: a `;` inside a comment in the middle of the `TraceCategory`
 * union ends a naive scan early. One did (`THR-339 wiring; emitters …`), and it
 * is why THR-928 was filed against `forecast_computed`, a union member since
 * 2026-05-07. Scanning raw source silently under-reports by ~120 members.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n');
}

function literals(body: string): Set<string> {
  return new Set([...body.matchAll(/'([a-z0-9_.]+)'/gi)].map((m) => m[1]));
}

function sliceDecl(src: string, marker: string, terminator: string): string {
  const start = src.indexOf(marker);
  expect(start, `declaration not found: ${marker}`).toBeGreaterThanOrEqual(0);
  const end = src.indexOf(terminator, start);
  expect(end, `terminator not found after: ${marker}`).toBeGreaterThan(start);
  return src.slice(start, end);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const traceSrc = stripComments(readFileSync(TRACE_TS, 'utf8'));

/** A — the filter vocabulary. */
const CATEGORY_UNION = literals(sliceDecl(traceSrc, 'export type TraceCategory =', ';'));
/** A' — its runtime mirror. */
const CATEGORY_ARRAY = literals(sliceDecl(traceSrc, 'export const TRACE_CATEGORIES', '];'));

/** Named members of the `TraceEntry` union. */
const TRACE_ENTRY_MEMBERS = new Set(
  [...sliceDecl(traceSrc, 'export type TraceEntry =', ';').matchAll(/\|\s*([A-Za-z0-9_]+)/g)].map(
    (m) => m[1],
  ),
);

/** Every interface declaring a `category` literal, with the interface name. */
function collectCategoryInterfaces(): Array<{ iface: string; category: string; where: string }> {
  const files = [TRACE_TS, ...readdirSync(TRACES_DIR).filter((f) => f.endsWith('.ts')).map((f) => join(TRACES_DIR, f))];
  const found: Array<{ iface: string; category: string; where: string }> = [];
  for (const file of files) {
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    let current: string | null = null;
    lines.forEach((line, i) => {
      const iface = line.match(/^export interface ([A-Za-z0-9_]+)/);
      if (iface) current = iface[1];
      // A FIELD declaration ends in ';' — that is what distinguishes it from an
      // object-literal property (`category: 'x',`) at an emit site.
      const cat = line.match(/^\s+(?:readonly\s+)?category\s*:\s*'([a-z0-9_.]+)'\s*;/i);
      if (cat && current) {
        found.push({ iface: current, category: cat[1], where: `${relative(REPO_ROOT, file)}:${i + 1}` });
        current = null;
      }
    });
  }
  return found;
}

/** C — categories at live emitTrace call sites, excluding tests. */
function collectEmittedCategories(): Map<string, string[]> {
  const LOOKBACK = 25;
  const emitted = new Map<string, string[]>();
  for (const file of walk(SRC)) {
    if (/__tests__|\.test\.|\.spec\./.test(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(\/\/|\*)/.test(lines[i])) continue;
      const m = lines[i].match(/\bcategory:\s*'([a-z0-9_.]+)'/i);
      if (!m) continue;
      // An `emitTrace(` within the preceding window is what makes this a trace
      // emission rather than an unrelated `category` field (codex entries, graph
      // node categories, impediment rows all use the same key name).
      const window = lines.slice(Math.max(0, i - LOOKBACK), i + 1).join('\n');
      if (!/emitTrace\s*\(/.test(window)) continue;
      const at = `${relative(REPO_ROOT, file)}:${i + 1}`;
      const prev = emitted.get(m[1]);
      if (prev) prev.push(at);
      else emitted.set(m[1], [at]);
    }
  }
  return emitted;
}

/**
 * Payload interfaces that declare a category but are not wired into `TraceEntry`.
 *
 * A **ratchet that may only shrink** (the `RETROFIT_PENDING` pattern): deleting a
 * name is the fix's proof, and adding one fails this file. Each is invisible to
 * every consumer — `trace.category === '<its literal>'` is a TS2367 "no overlap"
 * error — so its emit site needs an `as unknown as` cast to compile.
 *
 * **Drained to zero by THR-1065.** The twenty listed here now extend `TraceBase`
 * and are named individually in the `TraceEntry` union. The blocker THR-928
 * recorded — that adding them as-is would make `trace.id`/`trace.summary`
 * unreadable and *raise* the baseline — was resolved by making `summary` optional
 * on the emit-side input type only (`TraceEntryInput`), so payloads that never
 * declared one keep compiling while every reader still sees it as required.
 * Measured: 3448 → 3212 typecheck errors, −236.
 *
 * **This staying empty is the gate.** A new payload interface that declares a
 * `category` without joining the union fails the assertion below rather than
 * quietly re-opening the class — which is the whole reason the set is pinned
 * rather than counted.
 */
const ORPHANED_TRACE_INTERFACES: readonly string[] = [];

describe('trace vocabulary (THR-928)', () => {
  const emitted = collectEmittedCategories();
  const categoryInterfaces = collectCategoryInterfaces();

  // ─── Vacuity guards ───────────────────────────────────────────────────
  // Every assertion below is a subset/equality check, and all of them pass
  // trivially against an empty population. These pin the scan itself.

  it('the scan finds a realistic population', () => {
    expect(CATEGORY_UNION.size).toBeGreaterThan(180);
    expect(CATEGORY_ARRAY.size).toBeGreaterThan(180);
    expect(TRACE_ENTRY_MEMBERS.size).toBeGreaterThan(150);
    expect(emitted.size).toBeGreaterThan(150);
    expect(categoryInterfaces.length).toBeGreaterThan(150);
  });

  it('the comment-stripping delimiter reaches the end of the union', () => {
    // The specific regression: `agent_mended` is the last member declared before
    // the THR-928 block. A scan truncated at the old `wiring;` comment loses it.
    expect(CATEGORY_UNION.has('agent_mended')).toBe(true);
    expect(CATEGORY_UNION.has('nudge_played')).toBe(true);
    // And the member that started it all, present since 2026-05-07.
    expect(CATEGORY_UNION.has('forecast_computed')).toBe(true);
  });

  // ─── The gates ────────────────────────────────────────────────────────

  it('every emitted category is a member of the TraceCategory union', () => {
    const unregistered = [...emitted.entries()]
      .filter(([category]) => !CATEGORY_UNION.has(category))
      .map(([category, sites]) => `${category} (${sites.length}×, first at ${sites[0]})`)
      .sort();
    expect(unregistered).toEqual([]);
  });

  it('TRACE_CATEGORIES and the TraceCategory union hold exactly the same set', () => {
    // Both directions. An array entry absent from the union is a type error on
    // the array's own annotation; a union member absent from the array is a
    // category the DebugPanel can never enable.
    const arrayOnly = [...CATEGORY_ARRAY].filter((c) => !CATEGORY_UNION.has(c)).sort();
    const unionOnly = [...CATEGORY_UNION].filter((c) => !CATEGORY_ARRAY.has(c)).sort();
    expect({ arrayOnly, unionOnly }).toEqual({ arrayOnly: [], unionOnly: [] });
  });

  it('every emitted category is selectable in the DebugPanel', () => {
    // The inspectability half (NFP #2): DebugPanel seeds its enabled-category set
    // from TRACE_CATEGORIES, so a category missing from it is filtered out of the
    // inspector no matter how faithfully it is emitted.
    const invisible = [...emitted.keys()].filter((c) => !CATEGORY_ARRAY.has(c)).sort();
    expect(invisible).toEqual([]);
  });

  it('the orphaned-payload-interface ratchet only shrinks', () => {
    const orphans = categoryInterfaces
      .filter((d) => !TRACE_ENTRY_MEMBERS.has(d.iface))
      .map((d) => d.iface)
      .sort();
    expect(orphans).toEqual([...ORPHANED_TRACE_INTERFACES].sort());
  });

  it('no orphaned interface is silently also missing from the category vocabulary', () => {
    // An orphan is at least inspectable if its category is registered. One that
    // is orphaned *and* unregistered is invisible twice over.
    const doublyInvisible = categoryInterfaces
      .filter((d) => !TRACE_ENTRY_MEMBERS.has(d.iface) && !CATEGORY_UNION.has(d.category))
      .map((d) => `${d.iface} -> '${d.category}' (${d.where})`)
      .sort();
    expect(doublyInvisible).toEqual([]);
  });
});

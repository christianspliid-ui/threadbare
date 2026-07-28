/**
 * Lint: every relative import reachable from a `node --experimental-strip-types`
 * entrypoint must carry an explicit file extension.
 *
 * Node's native ESM resolver does no extension resolution, so an extensionless
 * relative specifier throws ERR_MODULE_NOT_FOUND *at import time* — the script
 * dies before its first line of logic. esbuild-bundled scripts resolve
 * extensionless specifiers fine, so the repo carries both conventions and the
 * correct one is not discoverable by looking at neighbouring files.
 *
 * This has now bitten three times:
 *   - THR-683 — `scripts/drift-scan/index.ts`, 4 consecutive weeks of red
 *   - THR-717 — `scripts/interface-contracts.ts` shared across both runners
 *   - THR-804 — `scripts/stale-claim-sweep/index.ts`, 88 consecutive red runs
 *
 * Each time the stated remedy was "default `scripts/` imports to explicit `.ts`",
 * and each time nothing enforced it. This test is that enforcement: it lives in
 * the required `Test · Typecheck · Build` CI check rather than in an advisory
 * lint, so a regression blocks the merge instead of printing into a log nobody
 * reads.
 *
 * Scope is the *reachable module graph*, not all of `scripts/` — extensionless
 * imports in esbuild-bundled scripts are legal and plentiful, and flagging them
 * would make this test noise.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/** Repo root. Vitest runs with cwd at the project root. */
const ROOT = process.cwd();

/** Matches the runner invocation in package.json scripts and workflow `run:` lines. */
const STRIP_TYPES_INVOCATION = /node\s+--experimental-strip-types\s+([^\s"']+\.ts)/g;

/**
 * Entrypoints invoked by humans/agents from documentation rather than from
 * package.json or a workflow, so they are not otherwise discoverable.
 */
const EXTRA_ENTRYPOINTS = ['scripts/session-precheck.ts'];

/** Extensions Node's ESM resolver accepts on an explicit relative specifier. */
const EXPLICIT_EXTENSION = /\.(ts|mts|cts|js|mjs|cjs|json)$/;

/**
 * Relative `import … from` / `export … from` specifiers, capturing a leading
 * `type` keyword so type-only forms can be excluded — `--experimental-strip-types`
 * erases those before the resolver ever sees them, so an extensionless
 * `import type { X } from '../types'` is genuinely harmless and flagging it would
 * make this lint noise. `[^;'"]` (not `.`) spans the newlines of a multi-line
 * named-import block while still being bounded by the statement's own quotes.
 */
const FROM_SPECIFIER = /(?:\bimport|\bexport)\s+(type\s+)?[^;'"]*?from\s*['"](\.[^'"]+)['"]/g;

/** `import('./x')` — dynamic, always a runtime resolution. */
const DYNAMIC_SPECIFIER = /\bimport\s*\(\s*['"](\.[^'"]+)['"]/g;

/** `import './x'` — bare side-effect import, always a runtime resolution. */
const SIDE_EFFECT_SPECIFIER = /\bimport\s+['"](\.[^'"]+)['"]/g;

/** Relative specifiers Node will actually try to resolve at runtime. */
function runtimeSpecifiers(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(FROM_SPECIFIER)) {
    if (m[1]) continue; // `import type …` / `export type …` — erased, never resolved
    out.push(m[2]);
  }
  for (const m of source.matchAll(DYNAMIC_SPECIFIER)) out.push(m[1]);
  for (const m of source.matchAll(SIDE_EFFECT_SPECIFIER)) out.push(m[1]);
  return out;
}

function collectEntrypoints(): string[] {
  const found = new Set<string>();

  const pkg = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
  for (const m of pkg.matchAll(STRIP_TYPES_INVOCATION)) found.add(m[1]);

  const workflowDir = path.join(ROOT, '.github', 'workflows');
  for (const entry of fs.readdirSync(workflowDir)) {
    if (!entry.endsWith('.yml') && !entry.endsWith('.yaml')) continue;
    const yaml = fs.readFileSync(path.join(workflowDir, entry), 'utf8');
    for (const m of yaml.matchAll(STRIP_TYPES_INVOCATION)) found.add(m[1]);
  }

  for (const extra of EXTRA_ENTRYPOINTS) {
    if (fs.existsSync(path.join(ROOT, extra))) found.add(extra);
  }

  return [...found].sort();
}

type Violation = { file: string; specifier: string; reason: 'no-extension' | 'unresolved' };

/**
 * Walks the relative-import graph from the given entrypoints, collecting every
 * specifier that Node's resolver would reject. Returns the violations plus the
 * set of files actually visited, so the caller can assert the population is
 * non-empty (a lint that scanned nothing would pass vacuously).
 */
function walkGraph(entrypoints: string[]): { violations: Violation[]; visited: Set<string> } {
  const violations: Violation[] = [];
  const visited = new Set<string>();
  const queue = [...entrypoints];

  while (queue.length > 0) {
    const rel = queue.shift()!;
    if (visited.has(rel)) continue;
    visited.add(rel);

    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue; // entrypoint existence is asserted separately
    const source = fs.readFileSync(abs, 'utf8');

    for (const specifier of runtimeSpecifiers(source)) {
      if (!EXPLICIT_EXTENSION.test(specifier)) {
        violations.push({ file: rel, specifier, reason: 'no-extension' });
        continue;
      }

      const targetRel = path
        .relative(ROOT, path.resolve(path.dirname(abs), specifier))
        .split(path.sep)
        .join('/');

      if (!fs.existsSync(path.join(ROOT, targetRel))) {
        violations.push({ file: rel, specifier, reason: 'unresolved' });
        continue;
      }

      if (targetRel.endsWith('.ts') || targetRel.endsWith('.mts')) queue.push(targetRel);
    }
  }

  return { violations, visited };
}

describe('scripts run under --experimental-strip-types', () => {
  const entrypoints = collectEntrypoints();

  it('discovers a non-empty set of entrypoints', () => {
    // Guards against the whole suite passing because the discovery regex rotted.
    expect(entrypoints.length).toBeGreaterThan(0);
    expect(entrypoints).toContain('scripts/stale-claim-sweep/index.ts');
    expect(entrypoints).toContain('scripts/drift-scan/index.ts');
  });

  it('every entrypoint exists on disk', () => {
    const missing = entrypoints.filter((e) => !fs.existsSync(path.join(ROOT, e)));
    expect(missing).toEqual([]);
  });

  it('every relative import in the reachable graph carries an explicit extension', () => {
    const { violations, visited } = walkGraph(entrypoints);

    // The graph must be strictly larger than its roots, or the walk found no
    // imports at all and the assertion below would be vacuous.
    expect(visited.size).toBeGreaterThan(entrypoints.length);

    const formatted = violations.map(
      (v) => `${v.file}: "${v.specifier}" (${v.reason})`,
    );
    expect(formatted).toEqual([]);
  });
});

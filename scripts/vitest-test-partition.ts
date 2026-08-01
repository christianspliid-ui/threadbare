/**
 * Partitions the test suite into the three pools vitest runs it under (THR-940).
 *
 * Why this exists: ~58% of the suite's wall time was per-file module importing,
 * because every test file ran in its own isolated worker and re-imported the
 * heavy engine/data modules from scratch. Most node-environment tests are pure
 * functions over the graph and can safely share a worker (`isolate: false`), so
 * the module graph is imported once per worker instead of once per file.
 *
 * Two populations cannot share a worker, and both are detected mechanically
 * rather than by path convention — the conventions do not line up with reality:
 *
 * 1. **DOM tests**, by `@vitest-environment` docblock. 68 node-environment tests
 *    live under `src/components/` and 6 jsdom tests live outside it, so a
 *    path-based split would misroute 74 files, silently and in the slow direction.
 *
 * 2. **Module-mocking tests**, by `vi.mock` / `vi.doMock` usage. A shared module
 *    registry defeats module mocking: whichever file imports the real module
 *    first wins, and the mock silently does not apply. This is worse than a
 *    crash — in `grantedTraitConsumers.test.ts` it made one assertion pass for
 *    the wrong reason (an unmocked lookup returned undefined, so the template
 *    carried no `requiredTraits` and sailed through the gate it was meant to
 *    be blocked by) while two others failed.
 *
 * Consumed by `vitest.config.ts` at config-load time.
 * `scripts/__tests__/vitest-test-partition.test.ts` asserts the partition stays
 * exhaustive and disjoint as files are added.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Top-level directories vitest collects test files from. */
export const TEST_ROOTS = ['src', 'scripts', 'tests'] as const;

/** Mirrors vitest's default `include` pattern. */
const TEST_FILE_PATTERN = /\.(test|spec)\.(c|m)?[jt]sx?$/;

/** Directory names never walked, mirroring the `exclude` list in vitest.config.ts. */
const SKIPPED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.worktrees',
  'worktrees',
  'preview',
  'preview-build',
]);

/**
 * Matches the environment docblock vitest reads, e.g. `@vitest-environment jsdom`.
 * Captures the environment name so a non-jsdom value is detectable rather than
 * silently treated as node.
 */
export const ENVIRONMENT_DOCBLOCK = /@vitest-environment\s+([\w-]+)/;

/**
 * Matches vitest's module-mocking calls. `vi.mock` is hoisted per file, but the
 * module registry is shared when `isolate` is false — so any file using it must
 * keep isolation regardless of environment.
 */
export const MODULE_MOCK_CALL = /\bvi\s*\.\s*(mock|doMock)\s*\(/;

/**
 * Node-environment files that keep isolation despite not mocking modules,
 * because they carry module-scope engine state across file boundaries.
 *
 * Each entry is tracked by **THR-949**, which owns removing it. Do not add to
 * this list without filing a Deferral naming the specific failure — an unexplained
 * pin is indistinguishable from a test that was quietly opted out of the fast path.
 */
export const ISOLATED_PINS: readonly string[] = [
  // THR-949: `completedActors.size` is 0 after 100 ticks under shared workers.
  // Resets `resetDecisionCache()` / `resetEventCounter()` but something else survives.
  'src/engine/__tests__/contracts/resolution-to-growth.contract.test.ts',
  // THR-949: `action.currentStep` reads 0 where the test expects 1 after two ticks.
  'src/engine/__tests__/gateDutyDirectSpawnProgression.test.ts',
];

/** What the scan learned about one test file. */
export interface TestFileFacts {
  /** Repo-relative, POSIX-separated path. */
  file: string;
  /** Docblock environment, or `null` when the file declares none. */
  environment: string | null;
  /** Whether the file calls `vi.mock` / `vi.doMock`. */
  usesModuleMocks: boolean;
}

/** The three pools, disjoint and jointly exhaustive. */
export interface TestPartition {
  /** jsdom tests — isolated. */
  dom: string[];
  /** Node tests that must stay isolated (module mocks, or an explicit pin). */
  isolatedNode: string[];
  /** Node tests that share a worker — the fast path, and the large majority. */
  sharedNode: string[];
}

function walk(dir: string, rootDir: string, acc: string[]): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    // Fail-soft (NFP #4): an unreadable directory must not break config load.
    return acc;
  }

  for (const entry of entries) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, rootDir, acc);
    else if (TEST_FILE_PATTERN.test(entry.name)) {
      acc.push(path.relative(rootDir, full).split(path.sep).join('/'));
    }
  }
  return acc;
}

/** Scans every collected test file for the two facts that decide its pool. */
export function collectTestFileFacts(rootDir: string): TestFileFacts[] {
  const files: string[] = [];
  for (const root of TEST_ROOTS) {
    const absolute = path.join(rootDir, root);
    if (fs.existsSync(absolute)) walk(absolute, rootDir, files);
  }
  files.sort();

  return files.map((file) => {
    let source = '';
    try {
      source = fs.readFileSync(path.join(rootDir, file), 'utf8');
    } catch {
      // Fail-soft: an unreadable file falls through to the isolated pool below,
      // because `environment: null` + `usesModuleMocks: false` is the fast path.
      // Guard that explicitly rather than relying on the default.
      return { file, environment: null, usesModuleMocks: true };
    }
    const match = source.match(ENVIRONMENT_DOCBLOCK);
    return {
      file,
      environment: match ? match[1] : null,
      usesModuleMocks: MODULE_MOCK_CALL.test(source),
    };
  });
}

/**
 * Routes every collected test file into exactly one pool.
 *
 * The conservative direction is isolation: anything unrecognised keeps the
 * current behaviour rather than being opted into shared workers.
 */
export function partitionTestFiles(rootDir: string): TestPartition {
  const pinned = new Set(ISOLATED_PINS);
  const partition: TestPartition = { dom: [], isolatedNode: [], sharedNode: [] };

  for (const { file, environment, usesModuleMocks } of collectTestFileFacts(rootDir)) {
    if (environment !== null && environment !== 'node') partition.dom.push(file);
    else if (usesModuleMocks || pinned.has(file)) partition.isolatedNode.push(file);
    else partition.sharedNode.push(file);
  }

  return partition;
}

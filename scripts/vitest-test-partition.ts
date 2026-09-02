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
 *
 * **A green local run does not prove this list is complete.** Under `isolate: false`
 * *which* files share a worker depends on worker count and on the order files finish,
 * so a fast many-core dev box groups them differently than a 2-core CI runner. Two of
 * the four entries below passed locally — including at CI's worker count — and failed
 * only on CI. When adding a pin, prefer evidence from a constrained run
 * (`npx vitest run --maxWorkers=2`) over a default local run, and treat a
 * scheduling-dependent failure as a real leak rather than as flakiness: the test is
 * reporting that production state outlived its session.
 */
export const ISOLATED_PINS: readonly string[] = [
  // THR-949: `completedActors.size` is 0 after 100 ticks under shared workers.
  // Resets `resetDecisionCache()` / `resetEventCounter()` but something else survives.
  'src/engine/__tests__/contracts/resolution-to-growth.contract.test.ts',
  // THR-949: `action.currentStep` reads 0 where the test expects 1 after two ticks.
  'src/engine/__tests__/gateDutyDirectSpawnProgression.test.ts',
  // THR-949: `evaluateIdentityMilestones` yields 0 milestones where >= 1 is expected.
  // Surfaced only on CI, not on a 32-core dev box — see the scheduling note below.
  'src/engine/__tests__/doomIdentityMilestones.test.ts',
  // THR-949: asserts a 500ms wall-clock budget, which a shared worker's added
  // allocation pressure pushes over (539ms on CI). A timing assertion is
  // isolation-sensitive by nature; the budget was already marginal on a 2-core
  // runner, so this pin restores its pre-existing behaviour rather than fixing it.
  'src/engine/__tests__/coastline-integration.test.ts',
];

// ─── The heavy lane (THR-1384) ──────────────────────────────────────────
//
// The three pools above split the suite by *how* a file may run. This splits it
// by *cost*. Thirteen world-simulation files were 89% of the suite's test CPU
// (1,452 s of 1,629 s on run 33653898091) and, as a PR gate, produced more false
// reds — heavy files timing out on their own slowness — than true catches. They
// now run in a fourth project, `heavy`, which `npm test` does not include; the
// non-required `Heavy simulation tests` workflow runs it on push to `main`,
// nightly, and on dispatch.
//
// Routing is by an explicit docblock tag, so a reader of the file sees which lane
// it runs in and why. The tag is *enforced* mechanically: `isMechanicallyHeavy`
// scans every test file for a world build (`initializeGameState*`) driven for
// `HEAVY_TICK_THRESHOLD` or more ticks in one case, and the partition test fails
// if such a file is untagged — so a new heavy test cannot silently land in the
// fast lane. Files tagged on measured CI duration alone (≥ 10 s, the ticket's
// second clause) carry the tag with the measurement as its reason.

/**
 * The docblock tag that routes a file into the heavy project — a line comment
 * (`// @vitest-lane heavy …`) or a docblock line (` * @vitest-lane heavy …`),
 * anchored at the start of its line. Anchored deliberately: the partition's own
 * test quotes the tag inside a string literal, and an unanchored scan routed
 * that test file into the heavy lane on first contact (the source-text-lint
 * trap, impediment #960).
 */
export const HEAVY_LANE_TAG = /^(?:\/\/|[ \t]*\*)[ \t]*@vitest-lane[ \t]+heavy\b/m;

/** A file that builds a real world rather than a hand-made graph. */
export const WORLD_BUILD_CALL = /\binitializeGameState(?:FromIdentity)?\s*\(/;

/**
 * Ticks driven in a single case at or above which a world-building test is
 * heavy by construction. From THR-1384's predicate; below it a world build
 * costs seconds, above it tens of seconds on a hosted runner.
 */
export const HEAVY_TICK_THRESHOLD = 50;

/** `const NAME = 123` — the local constants a loop bound may resolve through. */
const NUMERIC_CONST = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(\d[\d_]*)\b/g;

/** Counting loops, `for (let i = 0; i < N` and `while (ticks < N`. */
const LOOP_BOUND =
  /\b(?:for\s*\(\s*(?:let|var|const)?\s*[\w$]+\s*=\s*[\w$]+\s*;\s*[\w$]+|while\s*\(\s*[\w$]+)\s*<=?\s*([A-Za-z_$][\w$.]*|\d[\d_]*)/g;

/**
 * Tick helpers that take the count as their last argument — the local
 * `runTicks(state, n)` idiom, the debug bridge's `runTickBatch(state, n, …)`,
 * and the browser bridge's `tick(n)`.
 */
const TICK_HELPER_CALL =
  /\b(?:runTicks|runTickBatch|advanceTicks|tickBridge|tick)\s*\(\s*(?:[^,()]+,\s*)?([A-Za-z_$][\w$.]*|\d[\d_]*)\s*[,)]/g;

function toCount(token: string, consts: ReadonlyMap<string, number>): number {
  if (/^\d/.test(token)) return Number(token.replace(/_/g, ''));
  return consts.get(token) ?? 0;
}

/**
 * The largest tick count one case in this file drives, as far as a text scan can
 * tell: numeric loop bounds and tick-helper arguments, resolved through the
 * file's own numeric constants. An identifier the file does not define locally
 * (an imported constant, a function parameter) resolves to 0 — the conservative
 * direction here is *not* heavy, because that keeps the file on the PR gate.
 */
export function detectTickBudget(source: string): number {
  const consts = new Map<string, number>();
  for (const m of source.matchAll(NUMERIC_CONST)) consts.set(m[1], Number(m[2].replace(/_/g, '')));

  let max = 0;
  for (const m of source.matchAll(LOOP_BOUND)) max = Math.max(max, toCount(m[1], consts));
  for (const m of source.matchAll(TICK_HELPER_CALL)) max = Math.max(max, toCount(m[1], consts));
  return max;
}

/** The predicate the partition test enforces the tag against. */
export function isMechanicallyHeavy(source: string): boolean {
  return WORLD_BUILD_CALL.test(source) && detectTickBudget(source) >= HEAVY_TICK_THRESHOLD;
}

/** What the scan learned about one test file. */
export interface TestFileFacts {
  /** Repo-relative, POSIX-separated path. */
  file: string;
  /** Docblock environment, or `null` when the file declares none. */
  environment: string | null;
  /** Whether the file calls `vi.mock` / `vi.doMock`. */
  usesModuleMocks: boolean;
  /** Whether the file carries the `@vitest-lane heavy` tag. */
  heavyTag: boolean;
  /** Whether the scan finds a world build driven ≥ `HEAVY_TICK_THRESHOLD` ticks. */
  mechanicallyHeavy: boolean;
}

/** The four pools, disjoint and jointly exhaustive. */
export interface TestPartition {
  /** jsdom tests — isolated. */
  dom: string[];
  /** Node tests that must stay isolated (module mocks, or an explicit pin). */
  isolatedNode: string[];
  /** Node tests that share a worker — the fast path, and the large majority. */
  sharedNode: string[];
  /**
   * World-simulation tests too costly for the PR gate (THR-1384). Isolated,
   * any environment (each file's own docblock still applies), run by
   * `npm run test:heavy` and the post-merge workflow rather than `npm test`.
   */
  heavy: string[];
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
      // Guard that explicitly rather than relying on the default. It is not
      // routed heavy: an unreadable file must stay on the PR gate, where its
      // failure is loud, rather than in the lane that runs after the merge.
      return {
        file,
        environment: null,
        usesModuleMocks: true,
        heavyTag: false,
        mechanicallyHeavy: false,
      };
    }
    const match = source.match(ENVIRONMENT_DOCBLOCK);
    return {
      file,
      environment: match ? match[1] : null,
      usesModuleMocks: MODULE_MOCK_CALL.test(source),
      heavyTag: HEAVY_LANE_TAG.test(source),
      mechanicallyHeavy: isMechanicallyHeavy(source),
    };
  });
}

/**
 * Routes every collected test file into exactly one pool.
 *
 * The heavy tag is read first, so a heavy jsdom file or a heavy module-mocking
 * file lands in the heavy project (which is isolated and honours per-file
 * environment docblocks) rather than in the fast pool its other facts would
 * pick. The conservative direction for everything else is isolation: anything
 * unrecognised keeps the current behaviour rather than being opted into shared
 * workers.
 */
export function partitionTestFiles(rootDir: string): TestPartition {
  const pinned = new Set(ISOLATED_PINS);
  const partition: TestPartition = { dom: [], isolatedNode: [], sharedNode: [], heavy: [] };

  for (const { file, environment, usesModuleMocks, heavyTag } of collectTestFileFacts(rootDir)) {
    if (heavyTag) partition.heavy.push(file);
    else if (environment !== null && environment !== 'node') partition.dom.push(file);
    else if (usesModuleMocks || pinned.has(file)) partition.isolatedNode.push(file);
    else partition.sharedNode.push(file);
  }

  return partition;
}

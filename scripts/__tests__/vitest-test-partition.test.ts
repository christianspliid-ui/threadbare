/**
 * Guards the three-way test partition that `vitest.config.ts` builds (THR-940).
 *
 * The failures this exists to catch are silent ones. A new jsdom test the scan
 * misses lands in the shared-worker pool, where `document` is undefined. A new
 * `vi.mock` file the scan misses lands there too — and that one does not crash:
 * the mock simply never applies, so the assertion passes or fails for reasons
 * unrelated to what it claims to test. The inverse (a plain node test misrouted
 * into an isolated pool) is merely slow and would never announce itself at all.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  partitionTestFiles,
  collectTestFileFacts,
  detectTickBudget,
  isMechanicallyHeavy,
  ENVIRONMENT_DOCBLOCK,
  HEAVY_LANE_TAG,
  HEAVY_TICK_THRESHOLD,
  MODULE_MOCK_CALL,
  ISOLATED_PINS,
  TEST_ROOTS,
} from '../vitest-test-partition';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Floors for each population. Their job is to fail loudly if a scan ever returns
 * nothing — an empty list would make the set-equality assertions below vacuously
 * true while routing that whole population into shared workers.
 */
const MIN_EXPECTED_DOM_FILES = 50;
const MIN_EXPECTED_MOCK_FILES = 10;
const MIN_EXPECTED_SUITE_FILES = 500;
/**
 * THR-1384 named thirteen files by measured duration and the mechanical scan
 * finds more; an empty heavy lane would make every heavy assertion below
 * vacuous while the PR gate quietly ran all of them again.
 */
const MIN_EXPECTED_HEAVY_FILES = 10;

describe('vitest test partition', () => {
  const facts = collectTestFileFacts(rootDir);
  const { dom, isolatedNode, sharedNode, heavy } = partitionTestFiles(rootDir);

  it('collects a non-trivial suite from every configured test root', () => {
    expect(facts.length).toBeGreaterThan(MIN_EXPECTED_SUITE_FILES);
    for (const root of TEST_ROOTS) {
      if (!fs.existsSync(path.join(rootDir, root))) continue;
      expect(facts.some((entry) => entry.file.startsWith(`${root}/`))).toBe(true);
    }
  });

  it('partitions every collected file into exactly one pool', () => {
    const combined = [...dom, ...isolatedNode, ...sharedNode, ...heavy];
    expect(combined.length).toBe(facts.length);
    expect(new Set(combined).size).toBe(combined.length);
    expect([...combined].sort()).toEqual(facts.map((f) => f.file).sort());
  });

  it('keeps the fast path the large majority of the suite', () => {
    // Guards against a regression where some broad predicate quietly pushes most
    // files back into isolation, undoing THR-940 while staying green.
    expect(sharedNode.length).toBeGreaterThan(facts.length * 0.75);
  });

  it('routes every non-node environment docblock into the dom pool, unless it is heavy', () => {
    const declared = facts
      .filter((f) => f.environment !== null && f.environment !== 'node' && !f.heavyTag)
      .map((f) => f.file);

    expect(declared.length).toBeGreaterThanOrEqual(MIN_EXPECTED_DOM_FILES);
    expect([...dom].sort()).toEqual([...declared].sort());
  });

  it('keeps every module-mocking node test out of the shared-worker pool', () => {
    const mockers = facts.filter(
      (f) => f.usesModuleMocks && !dom.includes(f.file) && !heavy.includes(f.file),
    );

    expect(mockers.length).toBeGreaterThanOrEqual(MIN_EXPECTED_MOCK_FILES);
    for (const { file } of mockers) expect(isolatedNode).toContain(file);
    for (const file of sharedNode) {
      expect(facts.find((f) => f.file === file)?.usesModuleMocks).toBe(false);
    }
  });

  it('honours every explicit pin, and every pin still exists', () => {
    for (const pin of ISOLATED_PINS) {
      expect(fs.existsSync(path.join(rootDir, pin))).toBe(true);
      // A pin is honoured by any isolated project — the heavy lane is isolated too.
      expect([...isolatedNode, ...heavy]).toContain(pin);
      expect(sharedNode).not.toContain(pin);
    }
  });

  // ── The heavy lane (THR-1384) ──────────────────────────────────────────

  it('routes exactly the tagged files into the heavy lane, and nowhere else', () => {
    const tagged = facts.filter((f) => f.heavyTag).map((f) => f.file);

    expect(tagged.length).toBeGreaterThanOrEqual(MIN_EXPECTED_HEAVY_FILES);
    expect([...heavy].sort()).toEqual([...tagged].sort());
    for (const file of heavy) {
      expect(dom).not.toContain(file);
      expect(isolatedNode).not.toContain(file);
      expect(sharedNode).not.toContain(file);
    }
  });

  it('fails when a world-simulation test is untagged — the predicate is enforced, not advisory', () => {
    // The whole point of the lane: a new test that builds a world and drives it
    // HEAVY_TICK_THRESHOLD+ ticks must not land in the PR gate by omission. The
    // fix is to add `// @vitest-lane heavy — <reason>` to the file (or, if the
    // scan is wrong about it, to make the tick budget legible to the scan).
    const untagged = facts.filter((f) => f.mechanicallyHeavy && !f.heavyTag).map((f) => f.file);
    expect(untagged).toEqual([]);

    // And the guard itself is not vacuous: the scan finds heavy files.
    expect(facts.filter((f) => f.mechanicallyHeavy).length).toBeGreaterThanOrEqual(MIN_EXPECTED_HEAVY_FILES);
  });

  it('reads the tick budget the way the heavy files actually write it', () => {
    // The three idioms in the tree: a bare numeric loop bound, a bound through a
    // local constant, and a tick helper taking the count as its last argument.
    expect(detectTickBudget('for (let i = 0; i < 150; i++) state = runTick(state);')).toBe(150);
    expect(detectTickBudget('const TICKS = 60;\nfor (let t = 0; t < TICKS; t++) {}')).toBe(60);
    expect(detectTickBudget('const PIPELINE_TICK_BUDGET = 50;\nrunTicks(state, PIPELINE_TICK_BUDGET)')).toBe(50);
    expect(detectTickBudget('runTickBatch(state, 10_000, createSimulationRuntime(), noTargets)')).toBe(10_000);
    expect(detectTickBudget('const MAX_TICKS = 96;\nwhile (ticks < MAX_TICKS && !seen) {}')).toBe(96);
    // An imported bound the file does not define resolves to nothing — the
    // conservative direction is the PR gate, not the post-merge lane.
    expect(detectTickBudget('for (let i = 0; i < LIVENESS_TICK_COUNT; i++) {}')).toBe(0);
  });

  it('calls a file heavy only when it builds a world AND drives it past the threshold', () => {
    // Composed at runtime so this file's own source never contains the
    // world-build call: the scan reads source text, and a literal here would
    // make the partition test itself mechanically heavy (impediment #960's
    // shape — a fixture tripping the lint it exists to exercise).
    const worldBuild = ['initializeGame', 'State('].join('');
    const world = `const { state } = ${worldBuild}a, 'x', c, 42, 32, 24);\n`;
    expect(isMechanicallyHeavy(`${world}for (let i = 0; i < ${HEAVY_TICK_THRESHOLD}; i++) runTick(state);`)).toBe(true);
    expect(isMechanicallyHeavy(`${world}for (let i = 0; i < ${HEAVY_TICK_THRESHOLD - 1}; i++) runTick(state);`)).toBe(false);
    // A hand-built graph ticked 200 times is not a world build; it is tagged on
    // measured duration, never on this predicate.
    expect(isMechanicallyHeavy('for (let i = 0; i < 200; i++) state = runTick(state);')).toBe(false);
    expect(HEAVY_LANE_TAG.test('// @vitest-lane heavy — builds a world (THR-1384)')).toBe(true);
    expect(HEAVY_LANE_TAG.test('// @vitest-lane fast')).toBe(false);
  });

  it('re-derives the same facts from an independent read of each file', () => {
    // Re-reads the source rather than trusting the collector's own reader, so a
    // bug in that reader cannot hide the very thing this asserts.
    const sampled = facts.filter(
      (f) => f.environment !== null || f.usesModuleMocks || f.heavyTag || f.mechanicallyHeavy,
    );
    expect(sampled.length).toBeGreaterThan(0);

    for (const { file, environment, usesModuleMocks, heavyTag, mechanicallyHeavy } of sampled) {
      const source = fs.readFileSync(path.join(rootDir, file), 'utf8');
      const match = source.match(ENVIRONMENT_DOCBLOCK);
      expect(match ? match[1] : null).toBe(environment);
      expect(MODULE_MOCK_CALL.test(source)).toBe(usesModuleMocks);
      expect(HEAVY_LANE_TAG.test(source)).toBe(heavyTag);
      expect(isMechanicallyHeavy(source)).toBe(mechanicallyHeavy);
    }
  });

  it('produces stable, repo-relative POSIX paths', () => {
    for (const file of [...dom, ...isolatedNode, ...heavy]) {
      expect(file).not.toContain('\\');
      expect(path.isAbsolute(file)).toBe(false);
      expect(fs.existsSync(path.join(rootDir, file))).toBe(true);
    }
  });
});

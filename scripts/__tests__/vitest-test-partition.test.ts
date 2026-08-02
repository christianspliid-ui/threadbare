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
  ENVIRONMENT_DOCBLOCK,
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

describe('vitest test partition', () => {
  const facts = collectTestFileFacts(rootDir);
  const { dom, isolatedNode, sharedNode } = partitionTestFiles(rootDir);

  it('collects a non-trivial suite from every configured test root', () => {
    expect(facts.length).toBeGreaterThan(MIN_EXPECTED_SUITE_FILES);
    for (const root of TEST_ROOTS) {
      if (!fs.existsSync(path.join(rootDir, root))) continue;
      expect(facts.some((entry) => entry.file.startsWith(`${root}/`))).toBe(true);
    }
  });

  it('partitions every collected file into exactly one pool', () => {
    const combined = [...dom, ...isolatedNode, ...sharedNode];
    expect(combined.length).toBe(facts.length);
    expect(new Set(combined).size).toBe(combined.length);
    expect([...combined].sort()).toEqual(facts.map((f) => f.file).sort());
  });

  it('keeps the fast path the large majority of the suite', () => {
    // Guards against a regression where some broad predicate quietly pushes most
    // files back into isolation, undoing THR-940 while staying green.
    expect(sharedNode.length).toBeGreaterThan(facts.length * 0.75);
  });

  it('routes every non-node environment docblock into the dom pool', () => {
    const declared = facts
      .filter((f) => f.environment !== null && f.environment !== 'node')
      .map((f) => f.file);

    expect(declared.length).toBeGreaterThanOrEqual(MIN_EXPECTED_DOM_FILES);
    expect([...dom].sort()).toEqual([...declared].sort());
  });

  it('keeps every module-mocking node test out of the shared-worker pool', () => {
    const mockers = facts.filter((f) => f.usesModuleMocks && !dom.includes(f.file));

    expect(mockers.length).toBeGreaterThanOrEqual(MIN_EXPECTED_MOCK_FILES);
    for (const { file } of mockers) expect(isolatedNode).toContain(file);
    for (const file of sharedNode) {
      expect(facts.find((f) => f.file === file)?.usesModuleMocks).toBe(false);
    }
  });

  it('honours every explicit pin, and every pin still exists', () => {
    for (const pin of ISOLATED_PINS) {
      expect(fs.existsSync(path.join(rootDir, pin))).toBe(true);
      expect(isolatedNode).toContain(pin);
      expect(sharedNode).not.toContain(pin);
    }
  });

  it('re-derives the same facts from an independent read of each file', () => {
    // Re-reads the source rather than trusting the collector's own reader, so a
    // bug in that reader cannot hide the very thing this asserts.
    const sampled = facts.filter((f) => f.environment !== null || f.usesModuleMocks);
    expect(sampled.length).toBeGreaterThan(0);

    for (const { file, environment, usesModuleMocks } of sampled) {
      const source = fs.readFileSync(path.join(rootDir, file), 'utf8');
      const match = source.match(ENVIRONMENT_DOCBLOCK);
      expect(match ? match[1] : null).toBe(environment);
      expect(MODULE_MOCK_CALL.test(source)).toBe(usesModuleMocks);
    }
  });

  it('produces stable, repo-relative POSIX paths', () => {
    for (const file of [...dom, ...isolatedNode]) {
      expect(file).not.toContain('\\');
      expect(path.isAbsolute(file)).toBe(false);
      expect(fs.existsSync(path.join(rootDir, file))).toBe(true);
    }
  });
});

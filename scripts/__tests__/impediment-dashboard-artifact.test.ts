/**
 * THR-916 — the impediment dashboard is rendered, not committed.
 *
 * `Design/impediment-dashboard.html` is ~6,400 lines of which ~6,200 are generated
 * from `Docs/impediments.md`. While it was committed, every impediment append
 * re-rendered it, and because HTML has no union merge driver (unlike the log itself,
 * THR-691), the moment any impediment-appending PR merged, *every* other open PR
 * conflicted on this one file — and the resolutions re-staled each other. Four
 * hand-resolutions across three PRs inside one 40-minute run, each purely mechanical.
 *
 * The fix splits the artifact: a committed template holding the hand-authored chrome,
 * and an untracked render holding chrome + data.
 *
 * These pins exist because the failure mode is silent in both directions. Nothing
 * breaks the day someone runs `git add -f` on the render — the treadmill just starts
 * again, and it took four repetitions before anyone filed it. And nothing breaks the
 * day someone drops a marker from the template — the render would simply ship an
 * empty `DATA`, i.e. a dashboard reporting zero impediments, which reads as a healthy
 * log rather than a broken generator.
 *
 * `check:generated-freshness` asserts the same two properties at merge time; these
 * give the same answer in seconds, on the PR that introduces the regression.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { SUBPROCESS_TEST_TIMEOUT_MS } from '../../src/testing/testTimeouts.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { STATIC_ARTIFACT_SOURCES } from '../generated-artifact-sources.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..', '..');

const RENDER = 'Design/impediment-dashboard.html';
const TEMPLATE = 'Design/impediment-dashboard.template.html';

/** The marker pairs the generator splices between. Both must survive in the template. */
const MARKERS = [
  '// ── Impediment data ──',
  '// ── End data ──',
  '// ── Last retro ──',
  '// ── End last retro ──',
] as const;

function tracked(relPath: string): boolean {
  return execFileSync('git', ['ls-files', '--', relPath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim() !== '';
}

// Timeout raised off vitest's 5000 ms default (THR-1328): `tracked()` shells
// `git ls-files` per case, and process startup is the contended resource once the
// full suite runs 1100+ files. Hang detector, not a performance budget; see
// `src/testing/testTimeouts.ts`.
describe('the rendered dashboard stays out of the tree', { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
  it('git does not track the render', () => {
    // The guard against `git add -f` — impediment #139 is how it was committed the
    // first time, and #358 is the four-resolution treadmill that followed.
    expect(tracked(RENDER)).toBe(false);
  });

  it('git DOES track the template', () => {
    // Proves the assertion above is not passing because the whole pair vanished.
    expect(tracked(TEMPLATE)).toBe(true);
  });

  it('gitignore covers the render without re-including it', () => {
    const gitignore = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8');
    expect(gitignore).toContain(`!${TEMPLATE}`);
    expect(gitignore).not.toContain(`!${RENDER}`);
  });
});

describe('the template can still be rendered from', () => {
  const template = fs.readFileSync(path.join(REPO_ROOT, TEMPLATE), 'utf8');

  it('keeps every marker the generator splices between', () => {
    for (const marker of MARKERS) {
      expect(template).toContain(marker);
    }
  });

  it('holds placeholder declarations rather than committed data', () => {
    // The whole point of the split: the template carries no impediment rows, so it
    // does not change when the log does. A template that accumulated real data would
    // reintroduce the conflict it was created to remove.
    expect(template).toContain('const DATA = [];');
    expect(template.split('\n').length).toBeLessThan(500);
  });

  it('declares the template among the artifact sources', () => {
    // Keeps the doc→code coupling table honest: a template edit regenerates the
    // render, so it is genuinely one of its inputs.
    expect(STATIC_ARTIFACT_SOURCES[RENDER]).toContain(TEMPLATE);
  });
});

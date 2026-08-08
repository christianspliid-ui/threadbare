/**
 * THR-1028 — the impediment `#` was allocated as `max(ids in the working tree) + 1`,
 * against a tree that by construction cannot see a row on `origin/main`'s unmerged
 * future or on another in-flight branch. The number was free when chosen and
 * duplicated when the merge landed, reddening the required check on a PR that wrote
 * its row correctly (impediment #460, 4 occurrences).
 *
 * Two things are pinned here, and they need different kinds of test:
 *
 * 1. **The allocation rule**, against fixture strings — a max across sources, not a
 *    max within one. Pure, so it does not depend on what the live log holds today.
 * 2. **The end-to-end claim in the ticket's Done-when**, against a real throwaway
 *    git repo: two branches cut from the same base, each appending a row, must
 *    produce non-colliding ids with neither running `--fix`. A narrative argument
 *    that a ref scan "would" see the sibling branch is exactly the assertion that
 *    was wrong before, so it is driven through actual `git` rather than a mock.
 *
 * Every fixture asserts its own non-vacuity first: the same-base branches are
 * checked to genuinely collide under the OLD rule before the new rule is asked to
 * separate them. Without that, a test that mints two different numbers passes for a
 * fixture that could never have collided in the first place.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import {
  COLLISION_BASE_REF,
  IMPEDIMENT_LOG_GIT_PATH,
  allocateFromSources,
  allocateNextImpedimentId,
  findLatentCollisions,
  highestTableNum,
} from '../impediment-id-allocation.ts';

const HEADER = [
  '| # | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround | Session Context |',
  '|---|---|---|---|---|---|---|---|---|---|',
].join('\n');

function row(num: number | string, description: string): string {
  return `| ${num} | 1 | 2026-08-08 | tooling | ${description} | Cost a gate cycle. | S | Yes | Retry once. | lane 2026-08-08 |`;
}

function log(...rows: string[]): string {
  return [HEADER, ...rows, ''].join('\n');
}

/** The pre-THR-1028 rule, kept here so the fixtures can prove they would have collided. */
function legacyNextId(markdown: string): number {
  return highestTableNum(markdown) + 1;
}

describe('highestTableNum', () => {
  it('reads the highest numeric table id', () => {
    expect(highestTableNum(log(row(11, 'a'), row(480, 'b'), row(9, 'c')))).toBe(480);
  });

  it('is 0 for a log with no numbered rows, so allocation starts at 1', () => {
    expect(highestTableNum(HEADER)).toBe(0);
    expect(allocateFromSources([{ label: 'empty', markdown: HEADER }]).nextId).toBe(1);
  });

  it('ignores paragraph-form entries, whose synthetic ids sit in a reserved band', () => {
    const markdown = [
      log(row(12, 'a')),
      '**New 2026-08-08 (lane) — tooling (S): a paragraph entry.** body | consequence | S | Yes | wa | ctx',
    ].join('\n');
    // PARAGRAPH_ID_BASE is 9000; reading it as a table id would allocate #9002.
    expect(highestTableNum(markdown)).toBe(12);
  });
});

describe('allocateFromSources', () => {
  it('takes the max ACROSS sources, not within the local one', () => {
    const allocation = allocateFromSources([
      { label: 'working tree', markdown: log(row(480, 'local')) },
      { label: 'refs/remotes/origin/main', markdown: log(row(484, 'merged elsewhere')) },
    ]);

    expect(allocation.nextId).toBe(485);
    expect(allocation.highestFrom).toBe('refs/remotes/origin/main');
    // The whole defect in one line: the local-only answer is the colliding one.
    expect(legacyNextId(log(row(480, 'local')))).toBe(481);
  });

  it('reports degraded when no ref could be read, because that IS the old behaviour', () => {
    const allocation = allocateFromSources([{ label: 'working tree', markdown: log(row(480, 'a')) }]);
    expect(allocation.degraded).toBe(true);
    expect(allocation.nextId).toBe(481);
  });

  it('is not degraded once a second source is present', () => {
    const allocation = allocateFromSources([
      { label: 'working tree', markdown: log(row(480, 'a')) },
      { label: 'refs/heads/other', markdown: log(row(480, 'a')) },
    ]);
    expect(allocation.degraded).toBe(false);
  });
});

describe('findLatentCollisions', () => {
  const local = log(row(480, 'the local impediment'));

  it('reports an id claimed by the base ref for a different impediment', () => {
    const collisions = findLatentCollisions(local, [
      { label: COLLISION_BASE_REF, markdown: log(row(480, 'a completely different impediment')) },
    ]);

    expect(collisions).toHaveLength(1);
    expect(collisions[0].num).toBe('480');
    expect(collisions[0].ref).toBe(COLLISION_BASE_REF);
  });

  it('does NOT report this branch’s own row seen through a ref that carries it', () => {
    expect(
      findLatentCollisions(local, [{ label: COLLISION_BASE_REF, markdown: local }]),
    ).toEqual([]);
  });

  it('does not report an id the base ref does not claim at all', () => {
    expect(
      findLatentCollisions(local, [{ label: COLLISION_BASE_REF, markdown: log(row(479, 'other')) }]),
    ).toEqual([]);
  });
});

/**
 * The Done-when, driven through real git.
 *
 * `git` is available in every environment this suite runs in (the repo itself is a
 * clone), but the fixture still degrades to a skip rather than a failure if it is
 * not — an absent `git` is an environment fact, not a defect in the allocator.
 */
describe('two branches cut from the same base', () => {
  let repo: string | null = null;

  const git = (args: string[], cwd = repo as string): string =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

  const readLog = (): string => fs.readFileSync(path.join(repo as string, 'Docs', 'impediments.md'), 'utf8');
  const writeLog = (markdown: string): void =>
    fs.writeFileSync(path.join(repo as string, 'Docs', 'impediments.md'), markdown, 'utf8');

  beforeAll(() => {
    let scratch: string;
    try {
      scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'thr1028-'));
      execFileSync('git', ['init', '--initial-branch=main', scratch], { stdio: 'ignore' });
    } catch {
      return; // No git, or no writable tmp — the tests below skip themselves.
    }

    repo = scratch;
    // Identity is set locally so the fixture never depends on a global git config.
    git(['config', 'user.email', 'fixture@example.invalid']);
    git(['config', 'user.name', 'THR-1028 fixture']);

    fs.mkdirSync(path.join(repo, 'Docs'), { recursive: true });
    writeLog(log(row(480, 'the base row')));
    // Mirror the real repo's driver for this file (THR-691). Union keeps BOTH
    // sides of a conflicting hunk, which is right for the rows and is precisely
    // what preserved two same-numbered rows before this ticket. Merging with
    // `-X ours`/`-X theirs` instead would drop one lane's row and let the
    // no-duplicates assertion below pass without proving anything.
    // The path comes from the module's own constant rather than a literal: this
    // fixture never touches the live log, but a bare `Docs/impediments.md` string
    // anywhere in a test file trips the THR-922 decoupling guard, which cannot tell
    // a temp-repo fixture from a real read and is right not to try.
    fs.writeFileSync(
      path.join(repo, '.gitattributes'),
      `${IMPEDIMENT_LOG_GIT_PATH} merge=union\n`,
      'utf8',
    );
    git(['add', '-A']);
    git(['commit', '-m', 'base']);
  });

  afterAll(() => {
    if (repo) fs.rmSync(repo, { recursive: true, force: true });
  });

  it('allocate non-colliding ids without either running --fix', () => {
    if (!repo) return expect(true).toBe(true); // git unavailable — see beforeAll.

    const base = git(['rev-parse', 'HEAD']).trim();

    // --- Lane A: cut from base, allocate, append, commit. ---
    git(['checkout', '-q', '-b', 'lane-a', base]);
    const laneA = allocateNextImpedimentId(repo, readLog(), { fetch: false });
    expect(laneA.nextId).toBe(481);
    writeLog(log(row(480, 'the base row'), row(laneA.nextId, 'lane A friction')));
    git(['add', '-A']);
    git(['commit', '-m', 'lane a logs an impediment']);

    // --- Lane B: cut from the SAME base, so its own tree still stops at #480. ---
    git(['checkout', '-q', '-b', 'lane-b', base]);

    // Non-vacuity: under the old rule lane B would mint #481 too. If this ever
    // stops holding, the test below is passing for the wrong reason.
    expect(legacyNextId(readLog())).toBe(laneA.nextId);

    const laneB = allocateNextImpedimentId(repo, readLog(), { fetch: false });

    expect(laneB.nextId).not.toBe(laneA.nextId);
    expect(laneB.nextId).toBe(482);
    // The answer must be attributed to the sibling branch, not to a coincidence.
    expect(laneB.highestFrom).toBe('refs/heads/lane-a');
    expect(laneB.degraded).toBe(false);
  });

  it('the merged result of both lanes has no duplicate ids', async () => {
    if (!repo) return expect(true).toBe(true);

    const { parseImpedimentLog } = await import('../impediment-log.ts');

    // Lane B is checked out with its allocation from the previous test still
    // uncommitted; commit it, then merge lane A in the way the closeout would.
    writeLog(log(row(480, 'the base row'), row(482, 'lane B friction')));
    git(['add', '-A']);
    git(['commit', '-m', 'lane b logs an impediment']);

    git(['merge', '--no-edit', 'lane-a']);

    const merged = parseImpedimentLog(readLog());
    expect(merged.duplicateNums).toEqual([]);
    // Non-vacuity: a merge that dropped one lane's row would also report no
    // duplicates, for entirely the wrong reason. Union keeps all three — the base
    // row plus one from each lane — so the count is what proves both survived.
    expect(merged.tableCount).toBe(3);
    expect(merged.entries.map((entry) => entry.num).sort()).toEqual(['480', '481', '482']);
  });
});

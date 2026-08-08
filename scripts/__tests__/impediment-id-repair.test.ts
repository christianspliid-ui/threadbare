/**
 * THR-1018 — `check:impediment-ids` detected duplicate ids but could not repair
 * them, so every closeout merge that touched the log needed a session to
 * hand-classify each collision into one of two different remedies.
 *
 * These tests pin the **classification**, which is the part that can corrupt the
 * live log if it is wrong. The two mistakes are not symmetric — a renumber
 * misread as a dedupe deletes a distinct impediment, while a dedupe misread as a
 * renumber leaves a visible duplicate — so the discrimination is asserted in both
 * directions, and the non-vacuity of each fixture is asserted before the repair
 * runs (a fixture with no collisions would satisfy "no duplicates afterwards" for
 * entirely the wrong reason).
 */

import { describe, it, expect } from 'vitest';

import { parseImpedimentLog } from '../impediment-log.ts';
import {
  DEDUPE_SIMILARITY_THRESHOLD,
  applyRepairs,
  attachRemovedText,
  planRepairs,
  similarity,
} from '../impediment-id-repair.ts';

const HEADER = [
  '| # | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround | Session Context |',
  '|---|---|---|---|---|---|---|---|---|---|',
].join('\n');

function row(
  num: string,
  count: number,
  description: string,
  extra: Partial<{ consequence: string; workaround: string; session: string }> = {},
): string {
  const { consequence = 'Cost a gate cycle.', workaround = 'Retry once.', session = 'lane 2026-08-07' } =
    extra;
  return `| ${num} | ${count} | 2026-08-07 | tooling | ${description} | ${consequence} | S | Yes | ${workaround} | ${session} |`;
}

function log(...rows: string[]): string {
  return [HEADER, ...rows, ''].join('\n');
}

/** The count-bump shape: one lane incremented an existing row while another appended. */
const BUMPED = '**esbuild fails with spawn EPERM in the restricted sandbox.** The install step exits before writing any binary.';

/** Two genuinely different impediments that both claimed the same next-free number. */
const DIFFERENT_A = '**Playwright attached to another session port and screenshotted a stale build.**';
const DIFFERENT_B = '**The Linear save_issue call returned 200 and silently dropped the state write.**';

describe('similarity', () => {
  /**
   * The measured bands the threshold was set from. Pinned so a tokenizer change
   * that moves a band across {@link DEDUPE_SIMILARITY_THRESHOLD} fails here rather
   * than by misclassifying a live collision.
   */
  const BANDS: [label: string, left: string, right: string, atLeast: number, below: number][] = [
    ['identical text — a count bump', BUMPED, BUMPED, 0.99, 1.01],
    [
      'a bump whose edit appended a dated tag',
      BUMPED,
      `${BUMPED} Seen 3x as of 2026-08-06.`,
      0.85,
      0.95,
    ],
    [
      'the same subject in fully independent prose',
      'esbuild install fails with spawn EPERM in the sandbox; no binary is written.',
      'The npm install step dies on spawn EPERM under the restricted sandbox and leaves esbuild unusable.',
      0.2,
      0.5,
    ],
    ['two different impediments', DIFFERENT_A, DIFFERENT_B, 0, 0.2],
  ];

  it.each(BANDS)('%s sits in its measured band', (_label, left, right, atLeast, below) => {
    const score = similarity(left, right);
    expect(score).toBeGreaterThanOrEqual(atLeast);
    expect(score).toBeLessThan(below);
  });

  it('places the threshold above every band the classifier must not dedupe', () => {
    // The bump family is above it; everything the module header calls
    // "deliberately declined" is below it. This is the safety property.
    expect(similarity(BUMPED, `${BUMPED} Seen 3x as of 2026-08-06.`)).toBeGreaterThanOrEqual(
      DEDUPE_SIMILARITY_THRESHOLD,
    );
    expect(similarity(DIFFERENT_A, DIFFERENT_B)).toBeLessThan(DEDUPE_SIMILARITY_THRESHOLD);
  });
});

describe('planRepairs — classification', () => {
  it('classifies the same impediment on both sides as a dedupe, and takes max not sum', () => {
    const markdown = log(row('451', 1, BUMPED), row('451', 2, BUMPED));

    // Non-vacuity: the fixture must actually collide before the repair means anything.
    expect(parseImpedimentLog(markdown).duplicateNums).toHaveLength(1);

    const [plan] = planRepairs(markdown).plans;
    expect(plan.kind).toBe('dedupe');
    expect(plan.removed).toHaveLength(1);
    // 1 and 2 are the same tally before and after an increment. Summing to 3 would
    // double-count the first observation — this is the THR-1018 spec's one error.
    expect(plan.countRule).toBe('max');
    expect(plan.resolvedCount).toBe(2);
  });

  it('sums the counts when two lanes independently appended the same observation', () => {
    // Equal counts cannot have come from an increment — each lane wrote a fresh
    // observation — so these are additive where a bump is not.
    const markdown = log(row('451', 2, BUMPED), row('451', 3, BUMPED));
    expect(planRepairs(markdown).plans[0].countRule).toBe('max');

    const equal = log(row('451', 2, BUMPED), row('451', 2, BUMPED));
    const [plan] = planRepairs(equal).plans;
    expect(plan.kind).toBe('dedupe');
    expect(plan.countRule).toBe('sum');
    expect(plan.resolvedCount).toBe(4);
  });

  it('renumbers rather than merges when the same friction is worded independently', () => {
    // 0.333 similarity — too close to "two different impediments" (0.053) to risk
    // the destructive mistake. The safe outcome is two rows, not one deletion.
    const markdown = log(
      row('451', 1, '**esbuild install fails with spawn EPERM in the sandbox; no binary is written.**'),
      row('451', 1, '**The npm install step dies on spawn EPERM under the restricted sandbox and leaves esbuild unusable.**'),
    );

    const [plan] = planRepairs(markdown).plans;
    expect(plan.kind).toBe('renumber');
    expect(plan.removed).toHaveLength(0);
  });

  it('classifies two different impediments sharing an id as a renumber', () => {
    const markdown = log(row('452', 1, DIFFERENT_A), row('452', 1, DIFFERENT_B), row('460', 1, 'Unrelated.'));

    expect(parseImpedimentLog(markdown).duplicateNums).toHaveLength(1);

    const [plan] = planRepairs(markdown).plans;
    expect(plan.kind).toBe('renumber');
    expect(plan.removed).toHaveLength(0);
    // Allocated past the highest claimed number, not merely past the collision.
    expect(plan.renumbered).toEqual([{ line: 4, oldNum: '452', newNum: '461' }]);
  });
});

describe('applyRepairs — both cases in one merge', () => {
  // The measured 2026-08-07 shape: one of each, in a single merge.
  const markdown = log(
    row('450', 1, '**A prior, uncontested entry.**'),
    row('451', 1, BUMPED),
    row('451', 2, BUMPED),
    row('452', 1, DIFFERENT_A),
    row('452', 1, DIFFERENT_B),
  );

  it('is falsified against the unrepaired tree', () => {
    const before = parseImpedimentLog(markdown);
    expect(before.duplicateNums.map((d) => d.num)).toEqual(['451', '452']);
    expect(before.tableCount).toBe(5);
  });

  it('dedupes one and renumbers the other in a single pass', () => {
    const plan = planRepairs(markdown);
    expect(plan.plans.map((p) => [p.num, p.kind])).toEqual([
      ['451', 'dedupe'],
      ['452', 'renumber'],
    ]);

    const after = parseImpedimentLog(applyRepairs(markdown, plan));

    expect(after.duplicateNums).toHaveLength(0);
    // Dedupe dropped a row; renumber kept both. 5 - 1 = 4.
    expect(after.tableCount).toBe(4);
    expect(after.entries.map((e) => e.num).sort()).toEqual(['450', '451', '452', '453']);
  });

  it('keeps the deduped row at the earlier line with the resolved count', () => {
    const repaired = applyRepairs(markdown, planRepairs(markdown));
    const kept = parseImpedimentLog(repaired).entries.filter((e) => e.num === '451');

    expect(kept).toHaveLength(1);
    expect(kept[0].count).toBe(2);
    expect(kept[0].description).toContain('spawn EPERM');
  });

  it('stamps the renumbered row with its old id so an existing reference stays traceable', () => {
    const repaired = applyRepairs(markdown, planRepairs(markdown));
    const moved = parseImpedimentLog(repaired).entries.find((e) => e.num === '453');

    expect(moved?.session).toContain('Renumbered from #452');
    // The row that appears FIRST keeps the original number — existing prose
    // cross-references resolve to it.
    expect(parseImpedimentLog(repaired).entries.find((e) => e.num === '452')?.description).toContain(
      'Playwright',
    );
  });

  it('echoes every removed row verbatim, so a wrong dedupe is recoverable from the report', () => {
    const plan = attachRemovedText(markdown, planRepairs(markdown));
    const [dedupe] = plan.plans;

    expect(dedupe.removed[0].text).toContain('spawn EPERM');
    expect(dedupe.removed[0].text.startsWith('|')).toBe(true);
  });

  it('preserves every non-colliding row byte-for-byte', () => {
    const repaired = applyRepairs(markdown, planRepairs(markdown));
    expect(repaired).toContain(row('450', 1, '**A prior, uncontested entry.**'));
    expect(repaired.split('\n')[0]).toBe(HEADER.split('\n')[0]);
  });
});

describe('planRepairs — a clean log', () => {
  it('plans nothing when no number collides', () => {
    const markdown = log(row('450', 1, DIFFERENT_A), row('451', 1, DIFFERENT_B));
    const plan = planRepairs(markdown);

    expect(plan.plans).toHaveLength(0);
    // And the repair is a true identity, not a reformat.
    expect(applyRepairs(markdown, plan)).toBe(markdown);
  });
});

describe('which row keeps the number (impediment #460 rule 1)', () => {
  // The merge placed the BRANCH's row first and main's second. File order says
  // keep the first; publication says keep main's, because it is already out in
  // the world and may be cited. Impediment #460 records applying the file-order
  // advice on PR #1327 and having to reverse it.
  const branchRow = row('452', 1, DIFFERENT_A);
  const publishedRow = row('452', 1, DIFFERENT_B);
  const markdown = log(branchRow, publishedRow);

  it('keeps the number on the published row even when it is second in the file', () => {
    const plan = planRepairs(markdown, { publishedRows: new Set([publishedRow.trim()]) });
    const [collision] = plan.plans;

    expect(collision.keptBecause).toBe('published');
    // Line 4 is the published row; line 3 is the branch-only one that must move.
    expect(collision.keptLine).toBe(4);
    expect(collision.renumbered).toEqual([{ line: 3, oldNum: '452', newNum: '453' }]);

    const after = parseImpedimentLog(applyRepairs(markdown, plan));
    expect(after.entries.find((e) => e.num === '452')?.description).toContain('Linear save_issue');
  });

  it('is falsified by the file-order fallback, which keeps the WRONG row', () => {
    // The same input with publication unknown produces the opposite answer — so
    // the assertion above is testing the publication rule, not a coincidence.
    const plan = planRepairs(markdown);
    const [collision] = plan.plans;

    expect(collision.keptBecause).toBe('file-order');
    expect(collision.keptLine).toBe(3);
    expect(collision.renumbered).toEqual([{ line: 4, oldNum: '452', newNum: '453' }]);
  });

  it('falls back to file order when no colliding row is published', () => {
    // Both rows are branch-only — nothing is out in the world, so there is no
    // publication signal to follow and first-wins is as good as anything.
    const plan = planRepairs(markdown, { publishedRows: new Set(['| 1 | 1 | unrelated |']) });
    expect(plan.plans[0].keptBecause).toBe('file-order');
  });
});

describe('three-way collisions', () => {
  it('renumbers every later row, allocating distinct ids', () => {
    const markdown = log(
      row('452', 1, DIFFERENT_A),
      row('452', 1, DIFFERENT_B),
      row('452', 1, '**A third, unrelated failure: the reaper deleted a live worktree.**'),
    );

    const after = parseImpedimentLog(applyRepairs(markdown, planRepairs(markdown)));
    expect(after.duplicateNums).toHaveLength(0);
    expect(after.entries.map((e) => e.num).sort()).toEqual(['452', '453', '454']);
  });
});

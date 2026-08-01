/**
 * THR-764 — the impediment log's two consumers were blind to every paragraph-form
 * entry.
 *
 * `generate-impediment-dashboard.ts` and `retro-draft.ts` both gated on
 * `line.startsWith("|")`, so the ~97 trailing-paragraph entries spanning
 * 2026-07-02 → 2026-07-28 were parsed by **neither** the dashboard nor the weekly
 * retrospective draft. The retro is the project's only mechanism for noticing
 * recurring friction, and it had been running on pre-July data.
 *
 * These tests pin the parser's **behaviour** against committed fixtures, so a
 * regression to a single-format gate fails the required CI check instead of
 * silently shrinking the corpus again.
 *
 * ## Why the live log is no longer read here (THR-922)
 *
 * Until THR-922 this file read `Docs/impediments.md` at test time and asserted
 * against it — parse population against an oracle, no dropped lines, no duplicate
 * ids. That made `npm test`'s outcome a function of **documentation content**:
 * appending an impediment could redden the suite, so logging one was never really
 * a doc update. Worse, CI *skips* tests on the docs-only PR that carries the
 * append (THR-491), so a log edit that broke these assertions landed green and
 * failed the next unrelated code PR — a red suite misattributed to whoever
 * touched code next.
 *
 * The split now is: **behaviour here, population there.** Every live-log invariant
 * moved to `scripts/check-impediment-ids.ts`, which is blocking in CI and — since
 * THR-909's `docs-check` job — runs on documentation PRs, which is exactly where a
 * change to the log can break them. Nothing was dropped; see that file's
 * `LIVE_LOG_FLOORS` and the assertions beneath it.
 *
 * Adding a case? Put it in a fixture. Reading the live log from a test here
 * reintroduces the coupling, and a *copy* of the live log is the same mistake with
 * an extra step — it rots, and its floors drift back toward vacuity.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PARAGRAPH_ID_BASE,
  isParagraphEntryLine,
  isTableEntryLine,
  parseImpedimentLog,
  splitParagraphTail,
} from '../impediment-log.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(TEST_DIR, 'fixtures', 'impediment-log-sample.md');
const fixture = fs.readFileSync(FIXTURE_PATH, 'utf8');
const fixtureLines = fixture.split(/\r?\n/);

/**
 * Oracle: count each form straight off the raw fixture, independent of the parser
 * under test. If the parser and the oracle disagree, entries are being dropped.
 */
const oracle = {
  table: fixtureLines.filter((line) => isTableEntryLine(line)).length,
  paragraph: fixtureLines.filter((line) => isParagraphEntryLine(line)).length,
};

describe('impediment log parser', () => {
  const result = parseImpedimentLog(fixture);

  it('has a non-empty population of BOTH forms to assert against', () => {
    // Without this, every assertion below would pass vacuously against an empty
    // or single-format fixture — the exact failure mode that hid THR-764 for a
    // month. The floors are small because this is a fixture; the *live* log's
    // population floors live in check-impediment-ids.ts (THR-922).
    expect(oracle.table).toBeGreaterThan(3);
    expect(oracle.paragraph).toBeGreaterThan(3);
  });

  it('parses every table row and every paragraph entry', () => {
    expect(result.tableCount).toBe(oracle.table);
    expect(result.paragraphCount).toBe(oracle.paragraph);
    expect(result.entries.length).toBe(oracle.table + oracle.paragraph);
  });

  it('drops no line it recognised as an entry', () => {
    // A warning is allowed (short rows are parsed with empty trailing fields),
    // but it must never correspond to a discarded entry.
    const recognised = oracle.table + oracle.paragraph;
    expect(result.entries.length).toBe(recognised);
  });

  it('parses paragraph entries under BOTH header conventions', () => {
    // The regression THR-764 fixed: the pre-2026-07-04 legacy header (no category,
    // no impact) and the modern one must both yield entries.
    const paragraphs = result.entries.filter((entry) => entry.form === 'paragraph');
    const legacy = paragraphs.filter((entry) => entry.category === 'uncategorized');
    const modern = paragraphs.filter((entry) => entry.category !== 'uncategorized');

    expect(legacy.length).toBeGreaterThan(0);
    expect(modern.length).toBeGreaterThan(0);
  });

  it('gives paragraph entries collision-free synthetic ids', () => {
    const paragraphs = result.entries.filter((entry) => entry.form === 'paragraph');
    const tables = result.entries.filter((entry) => entry.form === 'table');

    for (const entry of paragraphs) {
      expect(entry.id).toBeGreaterThan(PARAGRAPH_ID_BASE);
      expect(entry.num).toMatch(/^P\d+$/);
    }

    const tableIds = new Set(tables.map((entry) => entry.id));
    const collisions = paragraphs.filter((entry) => tableIds.has(entry.id));
    expect(collisions).toEqual([]);

    // Synthetic ids must also be unique among themselves.
    const paragraphIds = paragraphs.map((entry) => entry.id);
    expect(new Set(paragraphIds).size).toBe(paragraphIds.length);
  });

  it('extracts real field values from paragraph entries, not just their text', () => {
    const paragraphs = result.entries.filter((entry) => entry.form === 'paragraph');

    // The dominant authored shape declares a category and an impact in the header.
    expect(paragraphs.some((entry) => entry.category !== 'uncategorized')).toBe(true);
    expect(paragraphs.some((entry) => entry.impact !== 'Unknown')).toBe(true);

    // Every entry carries a date and a non-empty description.
    for (const entry of paragraphs) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('keeps an escaped pipe inside a description cell', () => {
    const escaped = result.entries.find((entry) => entry.num === '13');
    expect(escaped?.description).toContain('|');
    expect(escaped?.impact).toBe('S');
  });
});

describe('splitParagraphTail', () => {
  it('reads the canonical 6-field tail positionally', () => {
    const fields = splitParagraphTail(
      ' body text | the consequence | M | Yes | the workaround | session context.',
    );
    expect(fields).toEqual({
      description: 'body text',
      consequence: 'the consequence',
      impact: 'M',
      workaroundFoundRaw: 'Yes',
      workaround: 'the workaround',
      session: 'session context.',
    });
  });

  it('folds a stray pipe in the body back into the description', () => {
    // An unescaped `|` inside authored prose shifts every field right. Anchoring
    // on the impact token rather than on arity is what keeps the fields aligned.
    const fields = splitParagraphTail(
      ' body with a | stray pipe | the consequence | L | No | none | ctx',
    );
    expect(fields.impact).toBe('L');
    expect(fields.consequence).toBe('the consequence');
    expect(fields.description).toBe('body with a | stray pipe');
    expect(fields.workaroundFoundRaw).toBe('No');
  });

  it('degrades to body-only when the tail declares no impact', () => {
    const fields = splitParagraphTail(' just a prose paragraph with no fields at all.');
    expect(fields.impact).toBe('Unknown');
    expect(fields.description).toBe('just a prose paragraph with no fields at all.');
    expect(fields.consequence).toBe('');
    expect(fields.workaroundFoundRaw).toBe('');
  });
});

describe('parseImpedimentLog on synthetic fixtures', () => {
  it('parses both forms from the same document', () => {
    const doc = [
      '| # | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround Description | Session Context |',
      '|---|---|---|---|---|---|---|---|---|---|',
      '| 1 | 2 | 2026-07-01 | tooling | row desc | row consequence | S | Yes | row workaround | row session |',
      '',
      '**New 2026-07-05 (THR-999, hourly pickup) — process (M): a headline.** body | consequence | M | Yes | workaround | context.',
      '',
      '**New 2026-07-02 (THR-000 Opus pickup) — a legacy headline with no category:** trailing prose.',
    ].join('\n');

    const { entries, tableCount, paragraphCount, warnings } = parseImpedimentLog(doc);

    expect(tableCount).toBe(1);
    expect(paragraphCount).toBe(2);
    expect(warnings).toEqual([]);

    const [table, legacy, modern] = entries; // sorted by date
    expect(table.num).toBe('1');
    expect(table.form).toBe('table');
    expect(table.impact).toBe('S');
    expect(table.workaroundFound).toBe(true);

    expect(legacy.date).toBe('2026-07-02');
    expect(legacy.category).toBe('uncategorized');
    expect(legacy.impact).toBe('Unknown');

    expect(modern.date).toBe('2026-07-05');
    expect(modern.category).toBe('process');
    expect(modern.impact).toBe('M');
    expect(modern.description).toContain('a headline.');
    expect(modern.session).toContain('THR-999');
  });

  it('keeps the Impact column verbatim alongside the normalised bucket', () => {
    // The dashboard renders the authored text; retro-draft aggregates the bucket.
    // Collapsing the two would rewrite 30 shipped entries whose Impact column
    // holds prose or a qualified value like "Blocked (workaround available)".
    const doc = [
      '| 3 | 1 | 2026-07-11 | config | desc | consequence | Blocked (workaround available) | Yes | w | s |',
    ].join('\n');

    const [entry] = parseImpedimentLog(doc).entries;
    expect(entry.impactRaw).toBe('Blocked (workaround available)');
    expect(entry.impact).toBe('Unknown');
  });

  it('parses a short table row rather than discarding it', () => {
    const doc = [
      '| # | Count | Date | Category | Description |',
      '|---|---|---|---|---|',
      '| 7 | 1 | 2026-07-09 | tooling | a row missing its trailing columns |',
    ].join('\n');

    const { entries, tableCount, warnings } = parseImpedimentLog(doc);
    expect(tableCount).toBe(1);
    expect(entries[0].description).toBe('a row missing its trailing columns');
    expect(entries[0].impact).toBe('Unknown');
    expect(warnings.some((w) => w.includes('short row'))).toBe(true);
  });

  it('ignores the header and separator rows', () => {
    const doc = [
      '| # | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround Description | Session Context |',
      '|---|---|---|---|---|---|---|---|---|---|',
    ].join('\n');

    expect(parseImpedimentLog(doc).entries).toEqual([]);
  });
});

/**
 * THR-881 — the impediment number is the dashboard's primary key, and nothing
 * checked it was distinct.
 *
 * `Docs/impediments.md` is `merge=union` (THR-691) so concurrent appends from
 * different lanes merge without conflict; union keeps BOTH sides of a conflicting
 * hunk, which is right for the rows and wrong for their hand-assigned numbers.
 * Fifteen duplicates had accumulated — the oldest since March — each noticed at
 * least three separate times and never repaired, because a duplicate regenerates
 * cleanly and ships green.
 *
 * The **live-log** half of this invariant now runs in `check:impediment-ids`
 * (THR-922), so a duplicate fails on the docs PR that introduces it rather than on
 * the next code PR. What stays here is the detector's behaviour.
 */
describe('impediment number uniqueness', () => {
  it('reports no duplicate numbers in a clean document', () => {
    expect(parseImpedimentLog(fixture).duplicateNums).toEqual([]);
  });

  it('detects two rows claiming the same number, and names the lines', () => {
    const doc = [
      '| # | Count | Date | Category | Description |',
      '|---|---|---|---|---|',
      '| 41 | 1 | 2026-07-09 | tooling | first row to claim the number |',
      '| 42 | 1 | 2026-07-09 | process | an unrelated row in between |',
      '| 41 | 1 | 2026-07-10 | environment | a second lane picked the same number |',
    ].join('\n');

    const { duplicateNums, tableCount } = parseImpedimentLog(doc);
    expect(tableCount).toBe(3);
    expect(duplicateNums).toEqual([{ num: '41', lines: [3, 5] }]);
  });

  it('orders duplicates numerically, not lexically', () => {
    const doc = [
      '| # | Count | Date | Category | Description |',
      '|---|---|---|---|---|',
      '| 90 | 1 | 2026-07-09 | tooling | a |',
      '| 90 | 1 | 2026-07-09 | tooling | b |',
      '| 9 | 1 | 2026-07-09 | tooling | c |',
      '| 9 | 1 | 2026-07-09 | tooling | d |',
    ].join('\n');

    // Lexical order would put "90" before "9"; the report reads in log order.
    expect(parseImpedimentLog(doc).duplicateNums.map((d) => d.num)).toEqual(['9', '90']);
  });

  it('does not flag paragraph entries, whose synthetic ids cannot collide', () => {
    const doc = [
      '**New 2026-07-09 (session-a) — tooling (S): first paragraph entry.** body | consequence | S | Yes | workaround | context.',
      '',
      '**New 2026-07-09 (session-b) — tooling (S): second paragraph entry.** body | consequence | S | Yes | workaround | context.',
    ].join('\n');

    const { paragraphCount, duplicateNums } = parseImpedimentLog(doc);
    expect(paragraphCount).toBe(2);
    expect(duplicateNums).toEqual([]);
  });
});

// The decoupling itself is asserted repo-wide in `docs-code-decoupling.test.ts`
// (THR-922 Done-when 1), which sweeps every test file rather than just this one.

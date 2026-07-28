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
 * These tests pin the parse population against an oracle counted independently
 * from the raw markdown, so a future regression to a single-format gate fails the
 * required CI check instead of silently shrinking the corpus again.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  PARAGRAPH_ID_BASE,
  isParagraphEntryLine,
  isTableEntryLine,
  parseImpedimentLog,
  splitParagraphTail,
} from '../impediment-log.ts';

const LOG_PATH = path.join(process.cwd(), 'Docs', 'impediments.md');
const markdown = fs.readFileSync(LOG_PATH, 'utf8');
const lines = markdown.split(/\r?\n/);

/**
 * Oracle: count each form straight off the raw file, independent of the parser
 * under test. If the parser and the oracle disagree, entries are being dropped.
 */
const oracle = {
  table: lines.filter((line) => isTableEntryLine(line)).length,
  paragraph: lines.filter((line) => isParagraphEntryLine(line)).length,
};

describe('impediment log parser', () => {
  const result = parseImpedimentLog(markdown);

  it('has a non-empty population of BOTH forms to assert against', () => {
    // Without this, every assertion below would pass vacuously against an empty
    // or single-format log — the exact failure mode that hid this bug for a month.
    expect(oracle.table).toBeGreaterThan(100);
    expect(oracle.paragraph).toBeGreaterThan(50);
  });

  it('parses every table row and every paragraph entry in the log', () => {
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

  it('surfaces previously-invisible July paragraph entries', () => {
    const julyParagraphs = result.entries.filter(
      (entry) => entry.form === 'paragraph' && entry.date.startsWith('2026-07'),
    );
    expect(julyParagraphs.length).toBeGreaterThan(50);
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
    const categorised = paragraphs.filter((entry) => entry.category !== 'uncategorized');
    const withImpact = paragraphs.filter((entry) => entry.impact !== 'Unknown');
    expect(categorised.length).toBeGreaterThan(paragraphs.length * 0.8);
    expect(withImpact.length).toBeGreaterThan(paragraphs.length * 0.8);

    // Every entry carries a date and a non-empty description.
    for (const entry of paragraphs) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.description.length).toBeGreaterThan(0);
    }
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

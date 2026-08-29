/**
 * THR-1016 — pins for the generated closeout page.
 *
 * The deliverable is a *conflict* property, not a rendering one: two closeout PRs
 * must never write the same path. That property is carried by the fragment layout
 * (one brand-new file per ticket) and by the generator being a pure function of the
 * fragment set — if ordering or content ever depended on something two branches
 * share, the shared write would be back and nothing would say so.
 *
 * Everything here runs against temp fixtures rather than the live `Docs/status/`.
 * A test that read the real directory would make `npm test`'s outcome a function of
 * documentation content, which is the coupling THR-922 removed: CI skips the test
 * job on the docs-only PR carrying the append, so the failure would land on the next
 * unrelated code PR instead.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ENTRIES_MARKER,
  MAX_PAGE_LINES,
  SUMMARY_GIST_CHARS,
  assemble,
  fragmentGist,
  fragmentLabel,
  newestDate,
  readFragments,
  selectFragments,
  sortKey,
  summaryLine,
  type Fragment,
} from '../generate-project-status.ts';

/** A template of the same shape as `Docs/status/_page.md`, small enough to reason about. */
const TEMPLATE = `# Project Status

> Newest entry {UPDATED}.

## Current Focus

${ENTRIES_MARKER}

## Where things live

- Shipped work: \`Docs/project-history.md\`
`;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thr1016-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFragment(name: string, body: string): void {
  fs.writeFileSync(path.join(tmpDir, name), `${body}\n`, 'utf8');
}

function frag(file: string, lines: number): Fragment {
  return { file, body: Array.from({ length: lines }, (_, i) => `line ${i}`).join('\n') };
}

describe('fragment ordering is newest-first (THR-1016)', () => {
  it('compares the ticket id numerically, not as text', () => {
    // The bug this pins: a plain filename sort reads "thr-994" as newer than
    // "thr-1013", burying every four-digit ticket below every three-digit one.
    // Replacing the sort with `b.localeCompare(a)` reddens this.
    writeFragment('2026-08-06-thr-994.md', 'nine ninety four');
    writeFragment('2026-08-06-thr-1013.md', 'ten thirteen');
    writeFragment('2026-08-06-thr-723.md', 'seven twenty three');

    expect(readFragments(tmpDir).map((f) => f.file)).toEqual([
      '2026-08-06-thr-1013.md',
      '2026-08-06-thr-994.md',
      '2026-08-06-thr-723.md',
    ]);
  });

  it('sorts by date before ticket id', () => {
    writeFragment('2026-08-06-thr-9999.md', 'older day, huge id');
    writeFragment('2026-08-07-thr-1.md', 'newer day, tiny id');

    expect(readFragments(tmpDir).map((f) => f.file)).toEqual([
      '2026-08-07-thr-1.md',
      '2026-08-06-thr-9999.md',
    ]);
  });

  it('sorts an undated or unnumbered fragment last rather than throwing', () => {
    expect(sortKey('marathon.md')).toEqual(['', -1]);
    expect(sortKey('2026-08-07-thr-1016.md')).toEqual(['2026-08-07', 1016]);
  });

  it('excludes scaffolding and the directory README from the entry set', () => {
    writeFragment('_page.md', 'the template');
    writeFragment('README.md', 'how this directory works');
    writeFragment('2026-08-07-thr-1016.md', 'a real entry');
    writeFragment('notes.txt', 'not markdown');

    expect(readFragments(tmpDir).map((f) => f.file)).toEqual(['2026-08-07-thr-1016.md']);
  });

  it('drops an empty fragment instead of rendering a blank entry', () => {
    writeFragment('2026-08-07-thr-1016.md', '   ');
    writeFragment('2026-08-06-thr-1014.md', 'real');

    expect(readFragments(tmpDir).map((f) => f.file)).toEqual(['2026-08-06-thr-1014.md']);
  });
});

describe('the line cap is a rendering budget, not an editing discipline (THR-1016)', () => {
  it('holds the cap by rendering only the newest fragments that fit', () => {
    // More fragments than any budget under MAX_PAGE_LINES can hold, so the
    // held-back set is non-empty by construction rather than by coincidence.
    const fragments = Array.from({ length: MAX_PAGE_LINES * 3 }, (_, i) =>
      frag(`2026-08-01-thr-${1000 + i}.md`, 1),
    ).reverse();

    const { content, rendered, dropped, lineCount } = assemble(TEMPLATE, fragments);

    expect(lineCount).toBeLessThanOrEqual(MAX_PAGE_LINES);
    expect(dropped.length).toBeGreaterThan(0);
    expect(rendered.length + dropped.length).toBe(fragments.length);
    // Nothing is deleted or annotated to make room — the held-back entries are
    // simply absent from the page and still on disk.
    expect(content).not.toContain('moved to `project-history.md`');
  });

  it('cannot be defeated by one long entry — the page is an index (THR-1327)', () => {
    // The defect this pins: the old renderer spliced whole bodies in, so a single
    // long fragment consumed the entire budget and the page showed one entry
    // wearing the name of a page. Measured `1 of 281` (2026-08-27) and `4 of 341`
    // (2026-08-29) with nothing changed but how long the last author wrote.
    // Restoring body-splicing to `assemble` reddens this.
    const fragments = [
      frag('2026-08-07-thr-3.md', 200),
      frag('2026-08-06-thr-2.md', 150),
      frag('2026-08-05-thr-1.md', 1),
    ];

    const { rendered, lineCount } = assemble(TEMPLATE, fragments);

    expect(rendered).toHaveLength(3);
    expect(lineCount).toBeLessThanOrEqual(MAX_PAGE_LINES);
  });

  it('costs exactly one line per entry regardless of fragment length', () => {
    // The property that makes the cap mean a stable entry count: a 1-line and a
    // 200-line fragment occupy the same space on the page.
    const short = assemble(TEMPLATE, [frag('2026-08-07-thr-1.md', 1)]).lineCount;
    const long = assemble(TEMPLATE, [frag('2026-08-07-thr-1.md', 200)]).lineCount;

    expect(long).toBe(short);
  });

  it('keeps every fragment when they all fit', () => {
    const fragments = [frag('2026-08-07-thr-2.md', 1), frag('2026-08-06-thr-1.md', 1)];
    const { rendered, dropped } = assemble(TEMPLATE, fragments);

    expect(rendered).toHaveLength(2);
    expect(dropped).toHaveLength(0);
  });

  it('fills the budget with one entry per line', () => {
    // Budget of 4 fits four index lines, not two — the separator charge went away
    // with body-splicing (THR-1327).
    const fragments = Array.from({ length: 6 }, (_, i) => frag(`2026-08-0${6 - i}-thr-${6 - i}.md`, 1));
    const { rendered, dropped } = selectFragments(fragments, 4);

    expect(rendered).toHaveLength(4);
    expect(dropped).toHaveLength(2);
    expect(rendered.map((f) => f.file)).toEqual(fragments.slice(0, 4).map((f) => f.file));
  });

  it('still renders one entry when the budget is exhausted by scaffolding', () => {
    // A page whose scaffolding leaves no room must show the newest entry anyway,
    // never an empty Current Focus.
    expect(selectFragments([frag('2026-08-07-thr-1.md', 1)], 0).rendered).toHaveLength(1);
  });
});

describe('the index line names the entry it links to (THR-1327)', () => {
  it('labels from the filename, which both body shapes share', () => {
    // 100 of the 341 fragments live when this landed lead with a bold sentence
    // rather than a heading, so a body-derived label would be absent for a third
    // of the corpus. The filename carries date and ticket by construction.
    expect(fragmentLabel('2026-08-29-thr-1364.md')).toBe('2026-08-29 — THR-1364');
  });

  it('degrades to the basename for a fragment matching neither shape', () => {
    // `2026-07-22-marathon.md` is real and undated-by-ticket; it must not throw.
    expect(fragmentLabel('2026-07-22-marathon.md')).toBe('2026-07-22');
    expect(fragmentLabel('notes.md')).toBe('notes');
  });

  it('reads the gist from a dated heading, dropping the prefix the label repeats', () => {
    expect(
      fragmentGist({ file: 'x.md', body: '# 2026-08-29 — THR-1364: R4-T3 skills sweep\n\nbody' }),
    ).toBe('R4-T3 skills sweep');
  });

  it('reads the gist from the older ticket-first heading too', () => {
    expect(
      fragmentGist({ file: 'x.md', body: '# THR-1358 — round 3 closes: ui-laws is a doctrine now' }),
    ).toBe('round 3 closes: ui-laws is a doctrine now');
  });

  it('reads the first sentence of a bold-lead fragment, stripping emphasis', () => {
    // The pre-heading norm: no `#` line at all, a bolded lead sentence instead.
    const body =
      '**A 400-seed loop was measuring a value the seed cannot move (THR-1000, 2026-08-06).** ' +
      'The rest of the paragraph runs on for a very long time indeed.';

    expect(fragmentGist({ file: 'x.md', body })).toBe(
      'A 400-seed loop was measuring a value the seed cannot move',
    );
  });

  it('truncates a long gist to one line, on a word boundary', () => {
    const gist = fragmentGist({ file: 'x.md', body: `# ${'word '.repeat(80)}` });

    expect(gist.length).toBeLessThanOrEqual(SUMMARY_GIST_CHARS + 1);
    expect(gist.endsWith('…')).toBe(true);
    expect(gist).not.toMatch(/\s…$/);
  });

  it('renders label, link and gist as a single line', () => {
    const line = summaryLine({ file: '2026-08-29-thr-1364.md', body: '# 2026-08-29 — THR-1364: R4-T3 skills sweep' });

    expect(line).toBe(
      '- **[2026-08-29 — THR-1364](status/2026-08-29-thr-1364.md)** — R4-T3 skills sweep',
    );
    expect(line.split('\n')).toHaveLength(1);
  });

  it('still renders a link when the gist comes out empty', () => {
    // A fragment whose whole body is the prefix the label already carries.
    expect(summaryLine({ file: '2026-08-29-thr-1364.md', body: '# THR-1364' })).toBe(
      '- **[2026-08-29 — THR-1364](status/2026-08-29-thr-1364.md)**',
    );
  });
});

describe('the page is a pure function of the fragment set (THR-1016)', () => {
  it('carries no wall-clock stamp — the date comes from the newest fragment', () => {
    // A per-run value would make `check:generated-freshness` report every PR stale,
    // the trap THR-714 removed at source rather than registering as volatile.
    const fragments = [frag('2026-08-07-thr-2.md', 1), frag('2026-08-06-thr-1.md', 1)];

    expect(newestDate(fragments)).toBe('2026-08-07');
    expect(assemble(TEMPLATE, fragments).content).toContain('Newest entry 2026-08-07.');
    expect(assemble(TEMPLATE, fragments).content).toBe(assemble(TEMPLATE, fragments).content);
  });

  it('renders identically regardless of the order fragments arrive on disk', () => {
    // Two branches create their fragments in opposite orders; the merged directory
    // must render the same page either way, or the merge result would depend on
    // which side wrote first.
    writeFragment('2026-08-07-thr-1016.md', 'mine');
    writeFragment('2026-08-07-thr-1017.md', 'theirs');
    const forward = assemble(TEMPLATE, readFragments(tmpDir)).content;

    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    writeFragment('2026-08-07-thr-1017.md', 'theirs');
    writeFragment('2026-08-07-thr-1016.md', 'mine');

    expect(assemble(TEMPLATE, readFragments(tmpDir)).content).toBe(forward);
  });

  it('contains both sides after a merge that only added files', () => {
    // The property the whole change exists for: a closeout adds a path nobody else
    // is writing, so "merging" two closeouts is set union over the directory.
    writeFragment('2026-08-07-thr-1016.md', 'entry from branch A');
    writeFragment('2026-08-07-thr-1017.md', 'entry from branch B');

    const { content } = assemble(TEMPLATE, readFragments(tmpDir));
    expect(content).toContain('entry from branch A');
    expect(content).toContain('entry from branch B');
  });

  it('fails loudly when the template loses its marker', () => {
    expect(() => assemble('# Project Status\n\nno marker here\n', [frag('2026-08-07-thr-1.md', 1)])).toThrow(
      /marker/i,
    );
  });
});

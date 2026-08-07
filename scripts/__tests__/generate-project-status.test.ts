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
  assemble,
  newestDate,
  readFragments,
  selectFragments,
  sortKey,
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
    const fragments = Array.from({ length: 40 }, (_, i) =>
      frag(`2026-08-${String(i + 1).padStart(2, '0')}-thr-${1000 + i}.md`, 1),
    ).reverse();

    const { content, rendered, dropped, lineCount } = assemble(TEMPLATE, fragments);

    expect(lineCount).toBeLessThanOrEqual(MAX_PAGE_LINES);
    expect(dropped.length).toBeGreaterThan(0);
    expect(rendered.length + dropped.length).toBe(fragments.length);
    // Nothing is deleted or annotated to make room — the held-back entries are
    // simply absent from the page and still on disk.
    expect(content).not.toContain('moved to `project-history.md`');
  });

  it('renders the newest entry even when it alone exceeds the budget', () => {
    // An oversized entry must overrun visibly, never produce an empty Current Focus.
    const { rendered, lineCount } = assemble(TEMPLATE, [frag('2026-08-07-thr-1.md', 200)]);

    expect(rendered).toHaveLength(1);
    expect(lineCount).toBeGreaterThan(MAX_PAGE_LINES);
  });

  it('keeps every fragment when they all fit', () => {
    const fragments = [frag('2026-08-07-thr-2.md', 1), frag('2026-08-06-thr-1.md', 1)];
    const { rendered, dropped } = assemble(TEMPLATE, fragments);

    expect(rendered).toHaveLength(2);
    expect(dropped).toHaveLength(0);
  });

  it('charges each entry a blank-line separator', () => {
    // Budget of 4 fits two 1-line entries (2 lines each incl. separator), not three.
    const fragments = Array.from({ length: 3 }, (_, i) => frag(`2026-08-0${3 - i}-thr-${3 - i}.md`, 1));
    expect(selectFragments(fragments, 4).rendered).toHaveLength(2);
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

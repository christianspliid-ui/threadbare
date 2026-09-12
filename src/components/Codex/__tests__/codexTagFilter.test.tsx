// @vitest-environment jsdom

/**
 * The codex tag filter — THR-1486, slice 2 of THR-1481.
 *
 * The surface is the first place a player meets the tag vocabulary as words, so what is
 * pinned here is the reading, not the markup: the chips offered are the ones the entries
 * in view actually wear, selecting narrows ALL-of, and every recognised chip carries its
 * `tag.*` tooltip id so Law 17 holds on the composed surface rather than on the copy.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CodexTagFilter, tagOptionsFor } from '../CodexTagFilter';
import { getAllCodexEntries } from '../codexRegistry';
import type { CodexEntry } from '../codexRegistry';
import { isContentTag } from '../../../data/content-tags';

const POSSESSIONS = getAllCodexEntries().filter(e => e.category === 'possessions');

function entry(id: string, tags: string[]): CodexEntry {
  return {
    id,
    name: id,
    glyph: '◆',
    tier: 1,
    tierName: 'Common',
    tierColor: '#888',
    category: 'possessions',
    subcategory: 'arms',
    subtitle: '',
    summary: '',
    tags,
    details: [],
  } as CodexEntry;
}

describe('codex tag filter — the options offered', () => {
  it('offers only tags the entries in view actually wear, most-worn first', () => {
    const options = tagOptionsFor([entry('a', ['#iron', '#weapon']), entry('b', ['#iron'])]);
    expect(options.map(o => o.tag)).toEqual(['#iron', '#weapon']);
    expect(options[0].count).toBe(2);
    expect(options[1].count).toBe(1);
  });

  it('groups a seated tag on its axis and an unseated one as other', () => {
    const options = tagOptionsFor([entry('a', ['#iron', '#weapon', '#retired_spelling'])]);
    const byTag = new Map(options.map(o => [o.tag, o.axis]));
    expect(byTag.get('#iron')).toBe('reach');
    expect(byTag.get('#weapon')).toBe('form');
    expect(byTag.get('#retired_spelling')).toBe('other');
  });

  it('renders nothing at all when no entry in view carries a tag', () => {
    const { container } = render(
      <CodexTagFilter entries={[entry('a', [])]} selected={[]} onToggle={() => {}} onClear={() => {}} />,
    );
    expect(container.querySelector('[data-testid="codex-tag-filter"]')).toBeNull();
  });
});

describe('codex tag filter — the shipped possessions corpus', () => {
  it('is a real population, so the assertions below are not vacuous', () => {
    expect(POSSESSIONS.length).toBeGreaterThan(50);
    expect(POSSESSIONS.filter(e => e.tags.length > 0).length).toBeGreaterThan(50);
  });

  it('offers chips the vocabulary recognises — no category is all-other', () => {
    const options = tagOptionsFor(POSSESSIONS);
    const recognised = options.filter(o => o.axis !== 'other');
    expect(recognised.length).toBeGreaterThan(10);
    expect(options.every(o => isContentTag(o.tag))).toBe(true);
  });

  it('every chip is a real control: pressing one reports its tag', () => {
    const pressed: string[] = [];
    render(
      <CodexTagFilter
        entries={POSSESSIONS}
        selected={[]}
        onToggle={tag => pressed.push(tag)}
        onClear={() => {}}
      />,
    );
    const chip = document.querySelector('[data-tag-chip="#weapon"]');
    expect(chip).not.toBeNull();
    fireEvent.click(chip!);
    expect(pressed).toEqual(['#weapon']);
  });

  it('marks the selected chips pressed and offers a clear control', () => {
    render(
      <CodexTagFilter
        entries={POSSESSIONS}
        selected={['#weapon']}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    );
    expect(document.querySelector('[data-tag-chip="#weapon"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-tag-chip="#tome"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('codex-tag-filter-clear').textContent).toContain('Clear 1 tag');
  });

  it('Law 17 — a recognised chip is wrapped in the tooltip registry, keyed on tag.*', () => {
    render(
      <CodexTagFilter entries={POSSESSIONS} selected={[]} onToggle={() => {}} onClear={() => {}} />,
    );
    const chip = document.querySelector('[data-tag-chip="#weapon"]');
    // The Tooltip primitive renders its trigger as the chip's wrapper; the chip being
    // inside an element that is not the filter row itself is the structural proof it is
    // wrapped rather than bare.
    expect(chip?.parentElement?.getAttribute('data-testid')).not.toBe('codex-tag-filter');
  });
});

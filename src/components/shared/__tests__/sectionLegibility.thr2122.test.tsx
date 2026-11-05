// @vitest-environment jsdom
/**
 * THR-2122 — Legibility 1: the shared blocks, the type ladder and the spacing rhythm.
 *
 * Every section kind renders on the ladder (no inline rem size below the 1rem floor), the
 * facts block is a grid, Detail sections draw no gold heading, and the one section heading
 * reads its count as "words · n".
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { Section } from '../Section';
import { SectionHeading } from '../SectionHeading';
import type { Section as DetailSection, SectionBase } from '../../../types/detailPage';

afterEach(cleanup);

const base = (label: string, gold = false): SectionBase => ({ label, gold, tier: 'routine', typeId: label, source: 'test' });

const EVERY_KIND: DetailSection[] = [
  { ...base('Who they are', true), kind: 'prose', prose: 'A miller of the river towns.' },
  { ...base('Traits'), kind: 'chips', chips: [{ label: 'patient' }, { label: 'proud', flavour: 'quietly' }] },
  { ...base('Last seen'), kind: 'event-card', whenLabel: 'Two seasons ago', prose: 'She left the mill.' },
  { ...base('Story'), kind: 'event-card', whenLabel: '', prose: '', entries: [{ whenLabel: 'Spring', prose: 'Born.' }] },
  {
    ...base('Facts'), kind: 'panel', rows: [
      { left: 'Home', right: 'Ashford' },
      { left: 'Temper', right: 'Calm', meter: 0.3, poles: ['Calm', 'Wild'] },
    ],
  },
  { ...base('Portrait'), kind: 'portrait', portraitRef: { url: '/x.png', subject: 'Mara', sphere: 'life' }, bodyProse: 'Quiet.' },
  { ...base('What it does'), kind: 'triggers', triggers: [{ condition: 'Critical failure', probability: 0.4, effectSummary: 'It cracks.' }] },
  { ...base('Kin'), kind: 'links', rows: [] },
  { ...base('Works'), kind: 'cards', tiles: [{ title: 'Bridge', kindWord: 'Work', lines: ['Half built'] }] },
];

/** An inline `font-size` in rem below the 1rem floor (THR-2118 § 3.1). */
function subFloorRem(el: HTMLElement): string | null {
  const m = /^([0-9.]+)rem$/.exec(el.style.fontSize);
  return m && Number(m[1]) < 1 ? el.style.fontSize : null;
}

describe('THR-2122 — every section kind on the ladder', () => {
  it.each(EVERY_KIND.map(s => [s.kind, s] as const))('%s: no inline rem size below 1rem', (_kind, section) => {
    const { container } = render(<Section section={section} />);
    const offenders = [...container.querySelectorAll<HTMLElement>('*')].map(subFloorRem).filter(Boolean);
    expect(offenders).toEqual([]);
  });

  it('every section is spaced by the shell: --space-6 below', () => {
    for (const section of EVERY_KIND) {
      const { container } = render(<Section section={section} />);
      const shell = container.querySelector<HTMLElement>('[data-section-shape]');
      expect(shell?.style.marginBottom).toBe('var(--space-6)');
      cleanup();
    }
  });
});

describe('THR-2122 — the facts block', () => {
  it('the panel body is a grid with right-aligned labels and no space-between', () => {
    const { container } = render(<Section section={EVERY_KIND[4]} />);
    const grid = container.querySelector<HTMLElement>('[data-facts-block]')!;
    expect(grid.style.display).toBe('grid');
    expect(grid.style.gridTemplateColumns).toBe('max-content minmax(0, 1fr)');
    const label = container.querySelector<HTMLElement>('[data-facts-label]')!;
    expect(label.style.textAlign).toBe('right');
    expect(container.innerHTML).not.toContain('space-between');
  });

  it('a pole row puts its first pole word in the label column', () => {
    const { container } = render(<Section section={EVERY_KIND[4]} />);
    const pole = container.querySelector<HTMLElement>('[data-pole-bar]')!;
    const [labelCell] = [...pole.children] as HTMLElement[];
    expect(labelCell.textContent).toBe('Calm');
    expect(labelCell.style.textAlign).toBe('right');
  });
});

describe('THR-2122 — no gold heading in Detail sections', () => {
  it('a gold: true section labels in tertiary, not gold', () => {
    const { container } = render(<Section section={EVERY_KIND[0]} />);
    const label = container.querySelector<HTMLElement>('[data-section-label]')!;
    expect(label.style.color).not.toBe('var(--accent-gold)');
    expect(label.style.color).toBe('var(--text-tertiary)');
  });

  it('an unclickable event card draws no frame', () => {
    const { container } = render(<Section section={EVERY_KIND[2]} />);
    const shell = container.querySelector<HTMLElement>('[data-section-shape="event-card"]')!;
    expect(shell.style.border).toBe('');
    expect(shell.getAttribute('role')).toBeNull();
  });
});

describe('THR-2122 — one section heading, "words · n"', () => {
  it('count 3 reads "Retinue · 3"', () => {
    render(<SectionHeading count={3}>Retinue</SectionHeading>);
    expect(screen.getByText(/Retinue/)).toHaveTextContent('Retinue · 3');
  });

  it('count 0 reads "Empty · 0"', () => {
    render(<SectionHeading count={0}>Empty</SectionHeading>);
    expect(screen.getByText(/Empty/)).toHaveTextContent('Empty · 0');
  });

  it('no count reads the words alone', () => {
    render(<SectionHeading>Retinue</SectionHeading>);
    expect(screen.getByText('Retinue').textContent).toBe('Retinue');
  });
});

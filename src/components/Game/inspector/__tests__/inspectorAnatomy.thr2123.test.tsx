// @vitest-environment jsdom
/**
 * THR-2123 — Inspector pages read Who, Now, Act, Detail, Out at every size
 * (plan 2026-11-03-thr-2123-legibility-inspector-pages, Done-when 2).
 *
 * (a) At wide the kind label and the name come before the picture, the name at `--text-2xl`.
 * (b) `nowSectionOf`: highlight over bond; bond when no highlight; null with neither.
 * (c) A person page draws Now before Act, and the Now section in no tab panel.
 * (d) Docked draws no frame of its own; Full keeps the page frame.
 * (e) No section heading on the page is gold.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { SubjectHeaderVM, SubjectPageVM } from '../../../../engine/views/subjects/subjectTypes';
import type { ProseSection, Section as DetailSection } from '../../../../types/detailPage';
import { SubjectHeader } from '../SubjectHeader';
import { InspectorPage, nowSectionOf, type InspectorPageReport, type InspectorSize } from '../InspectorPage';

afterEach(cleanup);

const header: SubjectHeaderVM = {
  ref: { kind: 'agent', id: 'bren' },
  name: 'Bren',
  kindLabel: 'Smith',
  epithet: null,
  mortalShape: null,
  whereLine: [],
  visual: { kind: 'agent', id: 'bren', portraitGate: 'shown' },
  standing: [{ label: 'Wary' }],
  doingLine: 'Working the forge.',
  lede: null,
  mapLocated: false,
  hexKey: null,
  opensWide: false,
  follow: true,
} as SubjectHeaderVM;

function prose(typeId: string, extra: Partial<ProseSection> = {}, tab?: ProseSection['tab']): ProseSection {
  return { kind: 'prose', typeId, label: typeId, gold: false, tier: 'routine', source: 'test', prose: `${typeId} words`, ...(tab ? { tab } : {}), ...extra } as ProseSection;
}

const bond = { left: { name: 'Vara', src: null }, right: { name: 'Bren', id: 'bren', src: null } };
const highlight = { icon: 'person' as const, headline: 'To keep the forge' };

function page(body: DetailSection[]): SubjectPageVM {
  return {
    subjectKey: 'agent:bren',
    layoutKind: 'actor',
    pageKind: 'person',
    header,
    actOn: { heading: 'Act on Bren', cards: [{ actionId: 'bless', name: 'Bless', sphere: null, available: true, reason: null }], emptyLine: null },
    body,
    connections: { title: 'Connections', groups: [] },
  } as unknown as SubjectPageVM;
}

const personBody = [
  prose('what_she_is_to_him', { bond }),
  prose('disposition'),
  prose('leading_ambition', { highlight }),
  prose('chronicle', {}, 'chronicle'),
];

function drawPage(size: InspectorSize, body = personBody) {
  let report: InspectorPageReport | null = null;
  const view = render(<InspectorPage page={page(body)} size={size} onReport={r => { report = r; }} />);
  return { container: view.container, report: () => report };
}

describe('THR-2123 — the Inspector page reading order', () => {
  it('(a) at wide the kind label and the name come before the picture, the name at --text-2xl', () => {
    const { container } = render(<SubjectHeader header={header} compact={false} />);
    const kind = container.querySelector('[data-inspector-kind]')!;
    const h2 = container.querySelector('h2')!;
    const picture = container.querySelector('[data-inspector-picture]')!;
    expect(kind.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h2.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h2.style.fontSize).toBe('var(--text-2xl)');
    // The describing lines sit under the picture, on the same left edge.
    const doing = Array.from(container.querySelectorAll('p')).find(p => p.textContent === 'Working the forge.')!;
    expect(picture.compareDocumentPosition(doing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect((container.querySelector('[data-inspector-header]') as HTMLElement).style.alignItems).toBe('flex-start');
  });

  it('docked keeps the thumbnail beside the words', () => {
    const { container } = render(<SubjectHeader header={header} compact />);
    const headerEl = container.querySelector('[data-inspector-header]') as HTMLElement;
    expect(headerEl.style.flexDirection).toBe('row');
    expect(headerEl.firstElementChild?.hasAttribute('data-inspector-picture')).toBe(true);
  });

  it('(b) nowSectionOf: the highlight over the bond, the bond with no highlight, else null', () => {
    expect(nowSectionOf(personBody, 'docked')?.typeId).toBe('leading_ambition');
    expect(nowSectionOf(personBody.filter(s => s.typeId !== 'leading_ambition'), 'docked')?.typeId).toBe('what_she_is_to_him');
    expect(nowSectionOf([prose('disposition'), prose('chronicle')], 'wide')).toBeNull();
    // A highlight not shown at this size is skipped (fail-soft table).
    expect(nowSectionOf([prose('leading_ambition', { highlight, visibleAt: ['full'] })], 'docked')).toBeNull();
  });

  it('(c) a person page draws Now before Act, and the Now section in no tab panel', () => {
    for (const size of ['docked', 'wide'] as const) {
      const { container, report } = drawPage(size);
      const now = container.querySelector('[data-inspector-now]')!;
      const act = container.querySelector('[data-inspector-act]')!;
      expect(now.getAttribute('data-inspector-now')).toBe('leading_ambition');
      expect(now.compareDocumentPosition(act) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      const body = container.querySelector('[data-inspector-body]')!;
      expect(body.textContent).not.toContain('To keep the forge');
      expect(report()?.dressing.nowSection).toBe('leading_ambition');
      expect(report()?.sectionsShown.filter(id => id === 'leading_ambition')).toHaveLength(1);
      // The bond strip stays first in Overview.
      expect(body.textContent).toContain('what_she_is_to_him');
      expect(report()?.fold.now).not.toBeUndefined();
      cleanup();
    }
  });

  it('an empty Now slot draws nothing', () => {
    const { container, report } = drawPage('docked', [prose('disposition')]);
    expect(container.querySelector('[data-inspector-now]')).toBeNull();
    expect(report()?.dressing.nowSection).toBeNull();
    expect(report()?.fold.now).toBeNull();
  });

  it('(d) docked draws no frame of its own; Full keeps the page frame', () => {
    const docked = drawPage('docked').container.querySelector('[data-inspector-page]') as HTMLElement;
    expect(docked.style.border).toBe('');
    expect(docked.style.background).toBe('');
    expect(docked.style.backgroundColor).toBe('');
    cleanup();
    const full = drawPage('full').container.querySelector('[data-inspector-page]') as HTMLElement;
    expect(full.style.border).not.toBe('');
    expect(full.style.background).not.toBe('');
  });

  it('(e) no section heading on the page is gold', () => {
    for (const size of ['docked', 'wide', 'full'] as const) {
      const { container } = drawPage(size);
      const labels = Array.from(container.querySelectorAll<HTMLElement>('[data-section-label]'));
      expect(labels.length).toBeGreaterThan(0);
      for (const l of labels) expect(l.style.color).not.toContain('accent-gold');
      cleanup();
    }
  });
});

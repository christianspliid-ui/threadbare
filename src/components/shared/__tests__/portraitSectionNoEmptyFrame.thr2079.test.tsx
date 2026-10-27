// @vitest-environment jsdom
/**
 * THR-2079 — The First's page shows no empty portrait box.
 *
 * 1. The disposition section no longer reads `properties.portraitUrl` (a second
 *    portrait resolver); the page header owns the subject's art (UI Law 3).
 * 2. A portrait section with no url renders its prose and no frame — never the bare
 *    subject name in an empty box (UI Law 4).
 * 3. A portrait section with a url (an item's icon, a place's painting) keeps its frame.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import type { PortraitSection, Section as DetailSection } from '../../../types/detailPage';
import { composeSections } from '../../../engine/detailPageGenerator';
import { Section } from '../Section';

afterEach(cleanup);

function firstDisposition(portraitUrl?: string): PortraitSection {
  const g = new WorldGraph();
  g.addNode({ id: 'asc', type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  g.addNode({
    id: 'kael', type: 'actor', name: 'Kael Thornweaver',
    properties: { actorType: 'individual', ...(portraitUrl ? { portraitUrl } : {}) },
  });
  g.addEdge({ id: 'th1', source: 'asc', target: 'kael', type: 'thread', properties: { courtPosition: 'the_first' } });
  const rows: DetailSection[] = composeSections('actor', { nodeId: 'kael', pageKind: 'actor', graph: g, seed: 42, tick: 10, protagonistId: 'asc' });
  const row = rows.find(r => r.typeId === 'portrait_with_disposition');
  expect(row?.kind).toBe('portrait');
  return row as PortraitSection;
}

describe('THR-2079 — disposition section carries no second portrait', () => {
  it('ignores properties.portraitUrl; the header resolves the art', () => {
    expect(firstDisposition('/raw/kael.png').portraitRef.url).toBeUndefined();
    expect(firstDisposition().portraitRef.url).toBeUndefined();
  });

  it('renders the prose with no frame and no bare name', () => {
    const section = firstDisposition();
    const { container } = render(<Section section={section} />);
    expect(container.querySelector('[data-testid="portrait-section"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="portrait-section-frame"]')).toBeNull();
    // Only the label and the prose — the bare subject name is gone.
    expect(section.bodyProse).toBeTruthy();
    expect(container.textContent).toBe(`${section.label}${section.bodyProse}`);
  });

  it('a portrait section with art keeps its frame', () => {
    const section: PortraitSection = {
      kind: 'portrait', typeId: 'item_icon', label: 'The thing', source: 'test',
      portraitRef: { url: '/art/blade.png', subject: 'Blade', sphere: 'war' },
    } as PortraitSection;
    const { container } = render(<Section section={section} />);
    const img = container.querySelector('[data-testid="portrait-section-frame"] img');
    expect(img?.getAttribute('src')).toBe('/art/blade.png');
  });
});

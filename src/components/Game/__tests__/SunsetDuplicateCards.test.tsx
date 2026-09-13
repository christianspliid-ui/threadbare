// @vitest-environment jsdom
//
// Render evidence for the UI pillar of THR-1492 (sunset the duplicate cards).
//
// **Browser-verify substitution: jsdom-render — unattended run, no startable dev
// server.** `preview_start` is refused in scheduled runs (impediments #546, #574), which
// also shuts the Playwright route since it presumes a running server. Per
// `Docs/canon/verification-gates.md` § Browser-verify, the sanctioned substitution is
// render assertions on the real components: every face the change produces, plus absence
// where an element must not render.
//
// The two changed surfaces are `AttachmentDetailView`, which moved off the retired
// `EntityCard` onto the canonical `Section` stack, and `FactionSheet`, whose local
// section-label fork now draws `shared/Section`'s `SectionLabel`. The *preserved* faces
// of the attachment sheet are covered by its own suite (`AttachmentDetailView.test.tsx`,
// 20 arms, unchanged by this PR and green against the migrated component — which is what
// makes it evidence rather than decoration). What is asserted here is what this change
// itself produces.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentDetailView } from '../AttachmentDetailView';
import type { AttachmentDetailData } from '../AttachmentDetailView';
import { FactionSheet } from '../FactionSheet';
import { WorldGraph } from '../../../engine/graph';

const item: AttachmentDetailData = {
  id: 'item.1',
  name: "Ashenmane's Fang",
  subcategory: 'arms',
  tier: 2,
  mechanicalSummary: '+Iron in open terrain',
  flavorText: 'Won in a border raid. Still bites strangers.',
  tags: ['#weapon', '#iron'],
  source: 'Battle of the Ash Ford',
};

const triggered: AttachmentDetailData = {
  ...item,
  id: 'item.2',
  name: 'Cursed Blade',
  actionTriggers: [{
    type: 'action_trigger',
    on: 'encounter_critical_failure',
    probability: 0.1,
    payload: { kind: 'self_remove' },
    narrativeTemplate: 'The blade shatters against the shield...',
  }],
};

describe('THR-1492 — the attachment sheet renders through the one section model', () => {
  it('draws its sections with the shared SectionLabel treatment, not the retired card', () => {
    const { container } = render(<AttachmentDetailView attachment={item} onBack={vi.fn()} />);

    // `SectionLabel` is a div at 0.65rem / 0.12em tracking; `EntityCard` drew an <h3>.
    // Asserting the retired element is *gone* is the half that fails if the component
    // were reverted — a label-present assertion alone would pass against either model.
    expect(container.querySelector('h3')).toBeNull();

    const labels = Array.from(container.querySelectorAll('div'))
      .filter(el => el.style.letterSpacing === '0.12em')
      .map(el => el.textContent);
    expect(labels).toContain('Effect');
    expect(labels).toContain('Tags');
    expect(labels).toContain('Source');
  });

  it('keeps the tag chips whole through the move — glyph, word, and DOM key', () => {
    render(<AttachmentDetailView attachment={item} onBack={vi.fn()} />);

    const chips = document.querySelectorAll('[data-content-tag]');
    expect(chips.length).toBe(2);
    // The axis glyph survived the move onto `ChipDescriptor` (THR-1486's reading).
    expect(chips[0].textContent).toContain('◇');
    // The word the player reads is the bare one, never the raw key (Laws 13, 14).
    expect(screen.getByText('weapon')).toBeTruthy();
    expect(screen.queryByText('#weapon')).toBeNull();
  });

  it('renders a trigger as a condition and pips, never as a numeral (Law 15)', () => {
    const { container } = render(<AttachmentDetailView attachment={triggered} onBack={vi.fn()} />);

    expect(screen.getByTestId('trigger-block')).toBeTruthy();
    expect(screen.getByText(/Critical failure/)).toBeTruthy();
    expect(screen.getByText(/The blade shatters/)).toBeTruthy();
    // The firing chance is pips, so no percentage reaches the surface.
    expect(container.querySelector('[data-testid="trigger-odds-pips"]')).toBeTruthy();
    expect(container.textContent ?? '').not.toMatch(/10%|0\.1/);
  });

  /**
   * Law 21 — a control that does nothing is worse than no control. Both production
   * mounts pass no `onViewCodex`, and the retired card turned that absence into a
   * no-op handler, so the sheet shipped two dead buttons. The affordance now follows
   * the wiring.
   */
  it('offers no codex affordance when no host wires one', () => {
    render(<AttachmentDetailView attachment={item} onBack={vi.fn()} />);
    expect(screen.queryByText('View Full Codex')).toBeNull();
    expect(screen.queryByText('Codex →')).toBeNull();
    // The way out is still there — absence of the dead control is not absence of a header.
    expect(screen.getByLabelText('close')).toBeTruthy();
  });

  it('offers both codex affordances when a host does wire one', () => {
    const onViewCodex = vi.fn();
    render(<AttachmentDetailView attachment={item} onBack={vi.fn()} onViewCodex={onViewCodex} />);
    expect(screen.getByText('View Full Codex')).toBeTruthy();
    expect(screen.getByText('Codex →')).toBeTruthy();
  });

  /** NFP #4 — an authored summary containing markup is a word, not a tag. */
  it('renders angle brackets in authored prose as text', () => {
    render(
      <AttachmentDetailView
        attachment={{ ...item, mechanicalSummary: '+Iron <in> open terrain' }}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText(/\+Iron <in> open terrain/)).toBeTruthy();
  });
});

describe('THR-1492 — the faction sheet draws the shared section label', () => {
  function realmGraph(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'faction_0',
      type: 'actor',
      name: 'hold of Witness Skyfield',
      properties: {
        actorType: 'faction',
        factionType: 'political',
        factionDefId: 'realm.culture_0',
        cultureId: 'culture_0',
      },
    } as never);
    graph.addNode({
      id: 'loc_0', type: 'location', name: 'Ardenmor',
      properties: { locationSubtype: 'capital', hexCol: 3, hexRow: 4 },
    } as never);
    graph.addEdge({
      id: 'e_controls_0', source: 'faction_0', target: 'loc_0', type: 'controls',
      properties: { influence: 0.9, role: 'seat' },
    } as never);
    return graph;
  }

  it('labels its blocks with the design-system treatment, not the local fork', () => {
    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={realmGraph()}
        onClose={() => {}}
      />,
    );

    // The sheet renders inside a portalled `Modal`, so the query goes through the
    // document rather than the render container.
    const root = document.body;

    // The fork was an <h4> at --text-xs / 0.05em. Its absence is the falsifying half:
    // this arm fails if the local component comes back.
    const forked = Array.from(root.querySelectorAll('h4'))
      .filter(el => (el as HTMLElement).style.letterSpacing === '0.05em');
    expect(forked).toHaveLength(0);

    const labels = Array.from(root.querySelectorAll('div'))
      .filter(el => (el as HTMLElement).style.letterSpacing === '0.12em')
      .map(el => el.textContent);
    // The sheet still says everything it said — same words, one treatment.
    expect(labels).toContain('What They Control');
    expect(labels.length).toBeGreaterThan(1);
  });
});

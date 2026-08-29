// @vitest-environment jsdom
/**
 * Holdings section render assertions (THR-1297, slice 3).
 *
 * These stand in for the contractual 1920×1080 pixel capture, which this
 * unattended run cannot produce — `preview_start` is refused outright with
 * *"Dev servers can't be started from unattended sessions"* (impediments #546 ×10,
 * #574), which also shuts the Playwright route, since that presumes a running
 * server. Recorded in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * They assert the real component's rendered DOM for every face the Holdings group
 * produces — present, absent, capless, and correctly separated from loot — which is
 * what requirement 1 exists to establish: that the change reached the surface.
 *
 * What they deliberately do NOT cover is what only pixels can: paint regressions,
 * overflow, z-index, off-viewport rendering. The pixel pass is owed and named in the
 * PR, and belongs to the attended sweep (THR-1133).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentsTab } from '../AttachmentsTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';
import type { AttachmentFullEntry } from '../../../../engine/agentAttachments';
import { SLOT_CAPS, SLOT_TAG_DISPLAY_NAMES } from '../../../../data/attachment-slot-constants';

function holding(overrides: Partial<AttachmentFullEntry> = {}): AttachmentFullEntry {
  return {
    id: 'holding_face_actor.bearer_loc.mill',
    name: 'Greywater Mill',
    subcategory: 'holding',
    tier: 1,
    mechanicalSummary: 'Holds Greywater Mill.',
    tags: ['#holding'],
    lossCondition: 'permanent',
    slotTag: 'holding',
    active: true,
    isPinned: true,
    ...overrides,
  } as AttachmentFullEntry;
}

function possession(overrides: Partial<AttachmentFullEntry> = {}): AttachmentFullEntry {
  return {
    id: 'item.fang',
    name: "Ashenmane's Fang",
    subcategory: 'arms',
    tier: 2,
    mechanicalSummary: '+Iron in open terrain',
    tags: ['weapon'],
    lossCondition: 'breakable',
    slotTag: 'weapon',
    active: true,
    isPinned: false,
    ...overrides,
  } as AttachmentFullEntry;
}

function card(overrides: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return {
    id: 'actor.bearer',
    name: 'Kael Thornweaver',
    locationId: 'loc.1',
    locationName: 'Thornhold',
    knowledgeLevel: 'known',
    ...overrides,
  } as AgentInfoCardData;
}

describe('AttachmentsTab — Holdings section', () => {
  it('renders a holdings section naming the place', () => {
    render(<AttachmentsTab card={card({ holdings: [holding()] })} />);

    // Scoped to the section's text rather than `getByText`: the vignette splits the
    // name across elements (name, tier glyph, summary), so an exact-node matcher
    // reports "unable to find" for a name that is plainly on screen.
    const section = screen.getByTestId('attachments-slot-holding');
    expect(section).toBeTruthy();
    expect(section.textContent).toContain('Greywater Mill');
    expect(section.textContent).toContain('Holds Greywater Mill.');
  });

  it('renders NO count — holdings are uncapped by construction', () => {
    // The exemption is structural: `holding` has no `SLOT_CAPS` row, so `getSlotCap`
    // returns undefined and the heading omits the `(n/m)` suffix. Asserting the
    // rendered heading rather than the constant is what makes this a surface test —
    // the constant could be right while the render still printed `(1/undefined)`.
    render(<AttachmentsTab card={card({ holdings: [holding()] })} />);

    const section = screen.getByTestId('attachments-slot-holding');
    const heading = section.querySelector('h2');

    expect(SLOT_CAPS.holding).toBeUndefined();
    expect(heading?.textContent).toBe(SLOT_TAG_DISPLAY_NAMES.holding);
    // The literal is pinned deliberately beside the constant: the constant-only
    // assertion would pass on any rename, including one back into the six-way
    // "Holding" collision THR-1314 resolved. Player-facing word is *Freeholds*.
    expect(heading?.textContent).toBe('Freeholds');
    expect(heading?.textContent).not.toMatch(/\d+\s*\/\s*\d+/);
  });

  it('a capped group still shows its count — the capless render is specific, not global', () => {
    // The negative that gives the assertion above its meaning. Without it, a bug that
    // dropped every count everywhere would pass the capless test.
    render(<AttachmentsTab card={card({ possessions: [possession()] })} />);

    const heading = screen.getByTestId('attachments-slot-weapon').querySelector('h2');
    expect(heading?.textContent).toBe(`Weapons (1/${SLOT_CAPS.weapon})`);
  });

  it('holdings render above possessions, and never inside them', () => {
    // A town is not a trinket. `SLOT_GROUP_ORDER` puts holdings first, and the two
    // must be separate sections — a holding filed into the weapons/rings run would be
    // read as loot by anyone glancing at the sheet.
    const { container } = render(
      <AttachmentsTab card={card({ holdings: [holding()], possessions: [possession()] })} />,
    );

    const sections = Array.from(container.querySelectorAll('[data-testid^="attachments-slot-"]'))
      .map(el => el.getAttribute('data-testid'));

    expect(sections).toContain('attachments-slot-holding');
    expect(sections).toContain('attachments-slot-weapon');
    expect(sections.indexOf('attachments-slot-holding'))
      .toBeLessThan(sections.indexOf('attachments-slot-weapon'));

    const holdingSection = screen.getByTestId('attachments-slot-holding');
    expect(holdingSection.textContent).toContain('Greywater Mill');
    expect(holdingSection.textContent).not.toContain("Ashenmane's Fang");
  });

  it('renders no holdings section for an agent who holds nothing', () => {
    // Absence, asserted — the half a render test most often forgets. An empty group
    // must not paint an empty heading.
    render(<AttachmentsTab card={card({ possessions: [possession()] })} />);

    expect(screen.queryByTestId('attachments-slot-holding')).toBeNull();
    expect(screen.queryByText('Freeholds')).toBeNull();
  });

  it('names the place in plain language, never a slot tag or node id', () => {
    // UI Law 14: a snake_case union member never reaches a screen. The section
    // heading resolves through SLOT_TAG_DISPLAY_NAMES, and the row shows the
    // holding's own name.
    render(<AttachmentsTab card={card({ holdings: [holding()] })} />);

    const section = screen.getByTestId('attachments-slot-holding');
    expect(section.textContent).not.toContain('holding_face_');
    expect(section.querySelector('h2')?.textContent).not.toBe('holding');
  });
});

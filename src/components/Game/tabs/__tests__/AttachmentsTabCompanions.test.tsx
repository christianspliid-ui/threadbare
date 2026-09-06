// @vitest-environment jsdom
/**
 * Companions row render assertions (THR-1096).
 *
 * These stand in for the contractual 1920×1080 pixel capture, which no
 * unattended run can produce (impediment #546 — `preview_start` is refused
 * without someone present to approve it). They assert the real component's
 * rendered DOM for every face the Companions row produces, which is what
 * requirement 1 exists to establish: that the change reached the surface.
 *
 * What they deliberately do NOT cover is what only pixels can — paint
 * regressions, overflow, z-index, off-viewport rendering. The pixel pass is
 * owed and named in the PR.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentsTab } from '../AttachmentsTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';
import type { CompanionEntry } from '../../../../engine/companions';
import { COMPANION_MAX } from '../../../../data/companion-templates';

function companion(overrides: Partial<CompanionEntry> = {}): CompanionEntry {
  return {
    id: 'companion_actor.bearer_1_companion.wayfarer',
    name: 'Senna Ardwick',
    templateId: 'companion.wayfarer',
    profession: 'Wayfarer',
    goodFor: 'Knows the fords, the passes, and which of them is lying about being a road.',
    domainContributions: { stone: 2, eye: 1 },
    tier: 1,
    lossCondition: 'permanent',
    ticksRemaining: null,
    totalTicks: null,
    sinceTick: 1,
    source: 'encounter.slice.unsafe_bridge',
    edgeId: 'companion_actor.bearer_1_companion.wayfarer_edge',
    ...overrides,
  };
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

describe('AttachmentsTab — Companions row', () => {
  it('renders the section with the count against the cap', () => {
    render(<AttachmentsTab card={card({ companions: [companion()] })} />);

    expect(screen.getByTestId('attachments-companions')).toBeTruthy();
    expect(screen.getByText(`Companions (1/${COMPANION_MAX})`)).toBeTruthy();
  });

  it('shows the person — name, profession, and what they are good for', () => {
    render(<AttachmentsTab card={card({ companions: [companion()] })} />);

    const row = screen.getByTestId('companion-companion.wayfarer');
    expect(row.textContent).toContain('Senna Ardwick');
    expect(row.textContent).toContain('Wayfarer');
    expect(row.textContent).toContain('Knows the fords');
  });

  it('says "Companions", never "retinue" — THR-1099 arbitration', () => {
    const { container } = render(<AttachmentsTab card={card({ companions: [companion()] })} />);
    expect(container.textContent).toContain('Companions');
    expect(container.textContent?.toLowerCase()).not.toContain('retinue');
  });

  // Replaced, not deleted (THR-1421). The assertion this supersedes pinned
  // `+2 stone` / `+1 eye` — a raw magnitude and a raw reach key on a
  // player-facing surface, Laws 13 and 14. The `not.toMatch` arm is the half
  // that makes the fix falsifiable rather than eyeballed: it fails if any
  // numeral returns to the row by any route, not just via the old wording.
  it('names the Reaches a companion steadies, and lets no numeral onto the row', () => {
    render(<AttachmentsTab card={card({ companions: [companion()] })} />);

    const row = screen.getByTestId('companion-companion.wayfarer');
    expect(row.textContent).toContain('Steadies your Stone and Eye.');
    expect(row.textContent ?? '').not.toMatch(/[+-]?\d/);
  });

  it('names a single Reach without the list grammar', () => {
    render(
      <AttachmentsTab
        card={card({ companions: [companion({ domainContributions: { iron: 3 } })] })}
      />,
    );

    const row = screen.getByTestId('companion-companion.wayfarer');
    // The terminal period is the assertion that matters: it pins the
    // single-Reach grammar, since the two-Reach form would read
    // `Steadies your Iron and …`. Not a bare `not.toContain('and')` — the
    // authored `goodFor` sentence on this fixture contains one.
    expect(row.textContent).toContain('Steadies your Iron.');
    expect(row.textContent ?? '').not.toMatch(/[+-]?\d/);
  });

  it('names a bonus-less companion honestly rather than showing an empty line', () => {
    render(
      <AttachmentsTab card={card({ companions: [companion({ domainContributions: {} })] })} />,
    );
    expect(screen.getByTestId('companion-companion.wayfarer').textContent)
      .toContain('No help in any Reach — just company.');
  });

  it('shows a duration readout for a contracted companion', () => {
    render(
      <AttachmentsTab
        card={card({
          companions: [companion({
            templateId: 'companion.sellsword-band',
            profession: 'Sellsword Band',
            ticksRemaining: 4,
            totalTicks: 10,
          })],
        })}
      />,
    );

    // THR-1421: was `4 ticks remaining` — a raw magnitude in an engine unit
    // (Laws 13 + 14). `durationLabel` spells the count out, so the numeral-free
    // arm now covers the whole row rather than only its permanent variant.
    const row = screen.getByTestId('companion-companion.sellsword-band');
    expect(row.textContent).toContain('one day remaining');
    expect(row.textContent).not.toContain('ticks');
    expect(row.textContent ?? '').not.toMatch(/[+-]?\d/);
  });

  it('shows no duration readout for a permanent companion', () => {
    render(<AttachmentsTab card={card({ companions: [companion()] })} />);
    expect(screen.getByTestId('companion-companion.wayfarer').textContent)
      .not.toContain('ticks remaining');
  });

  it('renders one row per companion', () => {
    render(
      <AttachmentsTab
        card={card({
          companions: [
            companion(),
            companion({
              id: 'c2',
              templateId: 'companion.guild-scribe',
              name: 'Ovin Marth',
              profession: 'Guild Scribe',
              domainContributions: { gold: 2 },
            }),
          ],
        })}
      />,
    );

    expect(screen.getByTestId('companion-companion.wayfarer')).toBeTruthy();
    expect(screen.getByTestId('companion-companion.guild-scribe')).toBeTruthy();
    expect(screen.getByText(`Companions (2/${COMPANION_MAX})`)).toBeTruthy();
  });

  it('omits the section entirely when the agent travels alone', () => {
    const { container } = render(<AttachmentsTab card={card()} />);
    expect(screen.queryByTestId('attachments-companions')).toBeNull();
    expect(container.textContent).toContain('travels alone');
  });

  it('renders companions even when the agent has no attachments at all', () => {
    // The row is ungated (THR-1096 decision 8) and does not ride the
    // intimate-knowledge attachment path, so it must survive an empty card.
    render(<AttachmentsTab card={card({ companions: [companion()] })} />);
    expect(screen.getByTestId('attachments-companions')).toBeTruthy();
  });
});

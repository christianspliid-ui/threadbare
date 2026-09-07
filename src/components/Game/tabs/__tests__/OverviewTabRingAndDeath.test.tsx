// @vitest-environment jsdom
/**
 * The ring's group line and a dead mortal's header (THR-1430).
 *
 * Two faces this ticket puts on the live sheet — `OverviewTab`, which
 * `AgentProfileModal` renders (`AgentDetailPanel` is unmounted; its own header says
 * so, and putting these rows only there would ship UI nobody can open).
 *
 * Every face carries its absence arm, because both render conditionally and a
 * presence-only assertion would pass on a card that renders the row unconditionally:
 *
 *   1. the group's **kind word** — Company · Army · Network, the catalogue's word;
 *      "ring" is a design gloss and must reach no surface (Law 14);
 *   2. a network's member Locations by name, with a **banded** size phrase and never
 *      a numeral (Law 13);
 *   3. a dead mortal's cause word, and *by whom* **only** where the seen-rule allows
 *      it — the absence arm here is the load-bearing one, since a clean kill naming
 *      its killer would be the defect;
 *   4. neither the places line nor the death line rendering on a living mortal in an
 *      ordinary company.
 *
 * These stand in for the contractual 1920×1080 capture, which this unattended run
 * cannot produce — `preview_start` is refused with nobody present to approve it
 * (impediments #546, #574), and the refusal was confirmed for this run rather than
 * assumed. They prove the words reached the DOM; they do not cover what only pixels
 * can — paint, overflow, z-index, off-viewport.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';

function card(extra: Partial<AgentInfoCardData>): AgentInfoCardData {
  return { name: 'Old Maerin', knowledgeLevel: 'intimate', ...extra } as unknown as AgentInfoCardData;
}

const COMPANY = {
  id: 'grp_1',
  name: 'The Salt Company',
  cohesionState: 'holding',
  role: 'member',
  members: [{ id: 'm1', name: 'Bren', role: 'member' }],
  kindWord: 'Company',
};

const RING = {
  id: 'grp_ring',
  name: "Miriel's Hold",
  cohesionState: 'holding',
  role: 'leader',
  members: [
    { id: 'm1', name: 'Bren', role: 'member' },
    { id: 'm2', name: 'Ivo', role: 'member' },
  ],
  kindWord: 'Network',
  memberLocations: [
    { id: 'loc_a', name: 'Coldwater' },
    { id: 'loc_b', name: 'Longreach' },
  ],
  sizeWord: 'a handful',
};

describe('OverviewTab — the group kind word (THR-1430)', () => {
  it('names a company a Company and a network a Network, on the same surface', () => {
    // The pair is the point: a heading that printed one constant word would pass
    // either arm on its own.
    const company = render(<OverviewTab card={card({ company: COMPANY as never })} />);
    expect(company.getByText('Company')).toBeTruthy();
    company.unmount();

    const ring = render(<OverviewTab card={card({ company: RING as never })} />);
    expect(ring.getByText('Network')).toBeTruthy();
  });

  it('never says "ring" anywhere on the sheet — that word is a design gloss', () => {
    const { container } = render(<OverviewTab card={card({ company: RING as never })} />);
    expect(container.textContent).not.toMatch(/\bring\b/i);
  });
});

describe('OverviewTab — where a network\'s people are (THR-1430)', () => {
  it('names each place, and bands the size rather than counting it', () => {
    const { container } = render(<OverviewTab card={card({ company: RING as never })} />);

    // A network is a web laid over the map: "where is it?" is answered by a list.
    // Asserted on the container's text rather than by exact node match, because the
    // last place shares a text node with its " and " joiner.
    expect(container.textContent).toContain('Coldwater');
    expect(container.textContent).toContain('Longreach');
    expect(container.textContent).toContain('a handful');
    // The size is a phrase, never a count — the line must carry no numeral (Law 13).
    const line = screen.getByText(/a handful/);
    expect(line.textContent).not.toMatch(/\d/);
  });

  it('renders no places line for an ordinary company', () => {
    // The absence arm. A company acts where it stands, so the line would be a lie.
    render(<OverviewTab card={card({ company: COMPANY as never })} />);
    expect(screen.queryByText('Coldwater')).toBeNull();
    expect(screen.queryByText(/a handful/)).toBeNull();
  });
});

describe('OverviewTab — a dead mortal (THR-1430)', () => {
  it('says how they died', () => {
    render(<OverviewTab card={card({ death: { causeWord: 'slain' } as never })} />);
    expect(screen.getByTestId('identity-death').textContent).toContain('slain');
  });

  it('names the killer only where the seen-rule allowed one', () => {
    render(<OverviewTab card={card({ death: { causeWord: 'slain', by: 'Oswen' } as never })} />);
    expect(screen.getByTestId('identity-death').textContent).toContain('Oswen');
  });

  it('names nobody on a clean kill — the load-bearing absence', () => {
    // This is the arm that matters. `slainBy` is always on the node (it is how the
    // world knows), but the player is not the world: a killing nobody witnessed must
    // render a death with no killer named, which is mechanically "unfair" and
    // exactly the design (THR-1383's seen-rule).
    render(<OverviewTab card={card({ death: { causeWord: 'slain' } as never })} />);
    expect(screen.getByTestId('identity-death').textContent).not.toMatch(/by /);
  });

  it('renders no death line on a living mortal', () => {
    render(<OverviewTab card={card({ company: COMPANY as never })} />);
    expect(screen.queryByTestId('identity-death')).toBeNull();
  });
});

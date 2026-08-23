// @vitest-environment jsdom
/**
 * The three player surfaces reputation reaches — THR-1206.
 *
 * Plan: `Docs/plans/2026-08-23-thr-1206-reputation-unification.md`
 *
 * The unification's claim is that one score shows up in one vocabulary wherever it is
 * relevant. These render the **real components** and assert that, on the surfaces as
 * composed:
 *
 *   1. LocationProfileModal — "your reputation here", banded, only when it exists.
 *   2. OverviewTab          — the agent's notable standings, banded and clickable.
 *   3. FactionSheet         — the same words, where raw percentages used to leak.
 *
 * **Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server** (impediments #546, #574; CLAUDE.md § Definition of Done → Browser-verify).
 * `preview_start` is refused in a scheduled run, which shuts the Playwright route too
 * since it presumes a running server. These assert every face the change produces,
 * plus absence where the surface must render nothing.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LocationProfileModal } from '../LocationProfileModal';
import { OverviewTab } from '../tabs/OverviewTab';
import { FactionSheet } from '../FactionSheet';
import { WorldGraph } from '../../../engine/graph';
import { applyReputationWithDelta } from '../../../engine/reputation';
import { getReputationWord } from '../../../data/domain-words';
import type { AgentInfoCardData } from '../../../engine/agentDetail';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function worldWithGrove(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc.grove', type: 'location', name: 'Sacred Grove',
    properties: { locationSubtype: 'settlement', terrain: 'temperate_forest', rarityTier: 1 },
  } as never);
  graph.addNode({
    id: 'agent.hero', type: 'actor', name: 'The Traveler',
    properties: { actorType: 'individual' },
  } as never);
  graph.addNode({
    id: 'agent.kin', type: 'actor', name: 'Maerith of the Fen Road',
    properties: { actorType: 'individual' },
  } as never);
  return graph;
}

/** A card shaped like the live one, with only the fields these assertions read. */
function heroCard(overrides: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return {
    id: 'agent.hero',
    name: 'The Traveler',
    locationId: 'loc.grove',
    locationName: 'Sacred Grove',
    knowledgeLevel: 'known',
    reputationWord: 'Accepted',
    ...overrides,
  } as unknown as AgentInfoCardData;
}

// ─── 1. LocationProfileModal ─────────────────────────────────────────────────

describe('LocationProfileModal — Standing row (THR-1206)', () => {
  it('shows the viewer standing as a word, never a number (Law 13)', () => {
    const graph = worldWithGrove();
    // Three writes past neutral, so the band is unambiguously above "Accepted".
    for (let i = 0; i < 3; i++) {
      applyReputationWithDelta(graph, 'agent.hero', 'loc.grove', 0.15, i, 'test');
    }
    render(
      <LocationProfileModal
        name="Sacred Grove" locationId="loc.grove" graph={graph}
        viewerAgentId="agent.hero" onClose={() => {}}
      />,
    );

    const row = screen.getByTestId('location-profile-standing');
    expect(within(row).getByText('Your reputation here')).toBeInTheDocument();
    expect(within(row).getByText(getReputationWord(0.95))).toBeInTheDocument();
    // No percentage, no decimal, anywhere in the row.
    expect(row.textContent).not.toMatch(/%|\d/);
  });

  it('renders nothing when nothing has happened between them (designed absence, Law 4)', () => {
    // A row reading "Accepted" for every town the player has never visited is noise.
    render(
      <LocationProfileModal
        name="Sacred Grove" locationId="loc.grove" graph={worldWithGrove()}
        viewerAgentId="agent.hero" onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('location-profile-standing')).toBeNull();
  });

  it('renders nothing when the surface has no viewer — fail-open, not a blank row', () => {
    const graph = worldWithGrove();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.grove', 0.15, 1, 'test');
    render(
      <LocationProfileModal
        name="Sacred Grove" locationId="loc.grove" graph={graph} onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('location-profile-standing')).toBeNull();
    // …and the rest of the sheet still renders (Law 21: no empty page).
    expect(screen.getByTestId('location-profile-prose')).toBeInTheDocument();
  });
});

// ─── 2. OverviewTab ──────────────────────────────────────────────────────────

describe('OverviewTab — Standings section (THR-1206)', () => {
  it('lists standings by name and band, strongest first, and links each counterparty', () => {
    const graph = worldWithGrove();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.grove', 0.04, 1, 'test');
    applyReputationWithDelta(graph, 'agent.hero', 'agent.kin', -0.15, 1, 'test');

    const opened: string[] = [];
    render(
      <OverviewTab
        card={heroCard()} graph={graph}
        onOpenEntity={(id) => opened.push(id)}
      />,
    );

    const section = screen.getByTestId('overview-standings');
    // Law 1 / 21: every named entity is a real control that goes somewhere.
    const buttons = within(section).getAllByRole('button');
    expect(buttons.map(b => b.textContent))
      .toEqual(['Maerith of the Fen Road', 'Sacred Grove']);
    buttons[0].click();
    expect(opened).toEqual(['agent.kin']);

    // Law 13: words, and the same five the rest of the game uses.
    expect(within(section).getByText(getReputationWord(0.35))).toBeInTheDocument();
    expect(section.textContent).not.toMatch(/%/);
  });

  it('renders nothing when the agent holds no standings', () => {
    render(<OverviewTab card={heroCard()} graph={worldWithGrove()} />);
    expect(screen.queryByTestId('overview-standings')).toBeNull();
  });

  it('is knowledge-gated with its siblings — a stranger shows no standings', () => {
    // What someone's standing is around town is exactly the sort of thing you learn
    // by asking about them, so it gates with the Reputation section above it.
    const graph = worldWithGrove();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.grove', 0.15, 1, 'test');
    render(
      <OverviewTab
        card={heroCard({ knowledgeLevel: 'stranger', reputationWord: undefined })}
        graph={graph}
      />,
    );
    expect(screen.queryByTestId('overview-standings')).toBeNull();
  });
});

// ─── 3. FactionSheet ─────────────────────────────────────────────────────────

describe('FactionSheet — Law 13 banding (THR-1206)', () => {
  function worldWithGuild(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'faction.guild', type: 'actor', name: 'The Arcane Circle',
      properties: { actorType: 'faction', factionDefId: 'arcane_circle' },
    } as never);
    graph.addNode({
      id: 'agent.archivist', type: 'actor', name: 'Sella the Archivist',
      properties: { actorType: 'individual' },
    } as never);
    graph.addEdge({
      id: 'm1', source: 'agent.archivist', target: 'faction.guild', type: 'member_of',
      properties: { role: 'member', rank: 0.5, joinedTick: 0, reputation: 0.62, factionDefId: 'arcane_circle' },
    } as never);
    return graph;
  }

  it('states a member standing as a word, never the percentage it used to print', () => {
    const { container } = render(
      <FactionSheet factionId="faction.guild" name="The Arcane Circle"
        graph={worldWithGuild()} onClose={() => {}} />,
    );
    // The word the rest of the game uses for the same number, on the same screen.
    expect(screen.getAllByText(getReputationWord(0.62)).length).toBeGreaterThan(0);
    // The two leaks this ticket closed: `62%` beside the bar, and `rep 40%+` in the
    // Ranks table. Neither may reappear anywhere on the sheet.
    expect(container.textContent).not.toMatch(/\d+\s*%/);
    expect(container.textContent).not.toMatch(/rep\s/);
  });

  it('names each rank tier by the band it opens at', () => {
    render(
      <FactionSheet factionId="faction.guild" name="The Arcane Circle"
        graph={worldWithGuild()} onClose={() => {}} />,
    );
    // Falsifies the assertion above: if the Ranks table did not render at all, the
    // "no percentages" check would pass vacuously.
    expect(screen.getByText('Ranks')).toBeInTheDocument();
    expect(screen.getAllByText(/and above$/).length).toBeGreaterThan(0);
  });
});

// @vitest-environment jsdom
//
// JourneyTab as the arc panel — THR-1299 slice 4. The stub is gone; the tab
// renders the follow row, the undertaking cards (words, never numerals), the
// ambitions with their flavor line, and the arc strip from persisted state.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import type { GameState } from '../../../types/gameState';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import { JourneyTab, haltsSentence } from '../tabs/JourneyTab';
import { UNDERTAKING_HALT_RATCHET_N } from '../../../data/strategic-action-constants';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'ascendant', name: 'The God', type: 'actor', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'kael', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
  return {
    tick: 60,
    ascendantId: 'ascendant',
    graph,
    followedAgentIds: [],
    mutedAgentIds: [],
    strategicState: {
      projects: [{
        projectId: 'proj_1', actorId: 'kael', templateId: 'strategic_build_warehouse', ambitionId: 'a',
        verb: 'create', behaviorFamily: 'merchant-expansion', progress: 12, progressRequired: 18,
        startedTick: 30, lastProgressTick: 54, status: 'active', halts: 1,
        lastCheckpoint: { band: 'success', effect: 'advance', roll: 0.5, probability: 0.6, tick: 54 },
      }],
      controls: [],
      history: [{
        tick: 20, actorId: 'kael', templateId: 'strategic_survey_market', ambitionId: 'a', verb: 'create',
        behaviorFamily: 'merchant-expansion', displayName: 'Survey the Market', outcome: 'completed',
        graphOps: [], catalystSeeded: false,
      }],
    },
    pendingUndertakingMoments: [],
  } as unknown as GameState;
}

function card(overrides: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return {
    id: 'kael',
    name: 'Kael',
    locationId: 'loc_1',
    locationName: 'Millhaven',
    knowledgeLevel: 'intimate',
    intents: [{
      templateId: 'ambition_dominate_trade',
      displayName: 'Dominate Trade',
      category: 'wealth',
      priority: 'primary',
      completedMilestones: 1,
      requiredMilestones: 3,
      reachAffinity: {},
      flavorText: 'She set her eyes on the trade roads, and the trade roads noticed.',
    }],
    ...overrides,
  } as AgentInfoCardData;
}

describe('JourneyTab (the arc panel)', () => {
  it('renders the work, the ambition with its flavor line, and the arc — with no numeral', () => {
    const state = buildState();
    render(<JourneyTab card={card()} gameState={state} />);

    expect(screen.queryByText(/future update/i)).toBeNull();
    const work = screen.getByTestId('arc-undertaking-proj_1');
    // 12 of 18 is two thirds — the 60–80% band.
    expect(work.textContent).toContain('Well along');
    expect(work.textContent).toContain('Halted once');
    expect(screen.getByTestId('arc-undertaking-band').textContent).toBeTruthy();
    expect(screen.getByTestId('intent-flavor-ambition_dominate_trade').textContent).toContain('trade roads');
    const strip = screen.getByTestId('arc-strip');
    expect(strip.textContent).toContain('Finished Survey the Market.');
    expect(strip.textContent).toContain('past');
    expect(document.body.textContent).not.toMatch(/\d/);
  });

  it('renders the follow row and fires the toggle with the card\'s agent', () => {
    const onToggleFollow = vi.fn();
    render(
      <JourneyTab
        card={card()}
        gameState={buildState()}
        followState={{ followed: false, explicit: false, byBond: false, muted: false }}
        onToggleFollow={onToggleFollow}
      />,
    );
    expect(screen.getByTestId('arc-follow-row')).toBeTruthy();
    fireEvent.click(screen.getByTestId('follow-toggle-arc_panel-button'));
    expect(onToggleFollow).toHaveBeenCalledWith('kael');
  });

  it('degrades to plain lines without game state', () => {
    render(<JourneyTab card={card({ intents: [] })} />);
    expect(screen.getByText('No long work under way.')).toBeTruthy();
    expect(screen.getByText('Nothing yet worth the telling.')).toBeTruthy();
    expect(screen.queryByTestId('arc-follow-row')).toBeNull();
  });

  it('haltsSentence steps through the ratchet in words', () => {
    const base = { projectId: 'p', templateId: 't', displayName: 'x', percentComplete: 0, halts: 0, escalated: false };
    expect(haltsSentence(base)).toBe('Going as planned.');
    expect(haltsSentence({ ...base, halts: 1 })).toContain('once');
    expect(haltsSentence({ ...base, halts: UNDERTAKING_HALT_RATCHET_N - 1 })).toContain('must choose');
    expect(haltsSentence({ ...base, escalated: true })).toContain('Doubled down');
  });
});

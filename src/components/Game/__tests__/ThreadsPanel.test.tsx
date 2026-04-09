// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadsPanel } from '../ThreadsPanel';
import type { ThreadedNode } from '../../../engine/retinue';
import type { BalanceEvent } from '../../../types/balanceEval';

// ─── Test fixtures ─────────────────────────────────────────────────

function makeAgent(overrides?: Partial<Extract<ThreadedNode, { category: 'agent' }>>): Extract<ThreadedNode, { category: 'agent' }> {
  return {
    id: 'agent-1',
    name: 'Seraphel',
    tier: 2,
    tierName: 'Devoted',
    category: 'agent',
    threadEdgeId: 'thread-a1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    locationId: 'loc-1',
    locationName: 'Thornwall',
    activityLabel: 'Idling',
    portraitUrl: null,
    primaryDomain: 'iron',
    factionName: 'Iron Brotherhood',
    ...overrides,
  };
}

function makeLocation(overrides?: Partial<Extract<ThreadedNode, { category: 'location' }>>): Extract<ThreadedNode, { category: 'location' }> {
  return {
    id: 'loc-1',
    name: 'Thornwall',
    tier: 1,
    tierName: 'Touched',
    category: 'location',
    threadEdgeId: 'thread-l1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    hexCol: 5,
    hexRow: 3,
    prosperityLabel: 'Stable',
    controllingFaction: 'Iron Brotherhood',
    ...overrides,
  };
}

function makeFaction(overrides?: Partial<Extract<ThreadedNode, { category: 'faction' }>>): Extract<ThreadedNode, { category: 'faction' }> {
  return {
    id: 'faction-1',
    name: 'Iron Brotherhood',
    tier: 2,
    tierName: 'Devoted',
    category: 'faction',
    threadEdgeId: 'thread-f1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    dominantSphere: 'force',
    territoryCount: 7,
    memberCount: 12,
    ...overrides,
  };
}

function makeArmy(overrides?: Partial<Extract<ThreadedNode, { category: 'army' }>>): Extract<ThreadedNode, { category: 'army' }> {
  return {
    id: 'army-1',
    name: 'Third Legion',
    tier: 1,
    tierName: 'Touched',
    category: 'army',
    threadEdgeId: 'thread-ar1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    size: 500,
    objective: 'March north',
    factionName: 'Iron Brotherhood',
    locationName: 'Thornwall',
    ...overrides,
  };
}

function makeArtifact(overrides?: Partial<Extract<ThreadedNode, { category: 'artifact' }>>): Extract<ThreadedNode, { category: 'artifact' }> {
  return {
    id: 'artifact-1',
    name: 'Sword of Dawn',
    tier: 3,
    tierName: 'Champion',
    category: 'artifact',
    threadEdgeId: 'thread-art1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    bearerName: 'Seraphel',
    locationName: null,
    ...overrides,
  };
}

const noop = () => {};

function makeEncounterDecision(overrides?: Partial<BalanceEvent>): BalanceEvent {
  return {
    seq: 1,
    tick: 10,
    kind: 'encounter_decision',
    agentId: 'agent-1',
    sourceSystem: 'planner',
    decisionType: 'idle',
    filterCacheSize: 12,
    candidatesAfterCooldown: 3,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('ThreadsPanel', () => {
  it('renders "No Threads" empty state when threadedNodes is empty', () => {
    render(
      <ThreadsPanel
        threadedNodes={[]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('No Threads')).toBeTruthy();
    expect(screen.getByText(/threads of fate lie still/i)).toBeTruthy();
  });

  it('renders Agents section with correct count badge', () => {
    const nodes: ThreadedNode[] = [makeAgent(), makeAgent({ id: 'agent-2', name: 'Vardus' })];
    render(
      <ThreadsPanel
        threadedNodes={nodes}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // SectionHeading renders "Agents (2)"
    expect(screen.getByText('Agents (2)')).toBeTruthy();
  });

  it('renders compact rows with agent name and secondary info', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('Seraphel')).toBeTruthy();
    // Secondary info: "Thornwall · Idling"
    expect(screen.getByText(/Thornwall/)).toBeTruthy();
  });

  it('shows encounter pool counts for agent rows when telemetry is available', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        agentEncounterDecisions={new Map([['agent-1', makeEncounterDecision()]])}
      />
    );

    expect(screen.getByText('Pool 3 / 12')).toBeTruthy();
  });

  it('opens encounter pool modal with ranked candidates in priority order', () => {
    const onNodeSelect = vi.fn();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={onNodeSelect}
        onCenterOnHex={noop}
        agentEncounterDecisions={new Map([[
          'agent-1',
          makeEncounterDecision({
            rankedEncounterPool: [
              {
                rank: 1,
                templateId: 'encounter.merchant_gambit',
                templateName: "Merchant's Gambit",
                locationId: 'loc-2',
                locationName: 'Green-shroud',
                action: 'queue_movement',
                reachPrimary: 'gold',
                reachSecondary: 'eye',
                encounterType: 'trade',
                threatBand: 'moderate',
                stepCount: 3,
                totalTickCost: 4,
                rewardEstimate: 1.1,
                completionProb: 0.62,
                travelCost: 0.58,
                finalScore: 1.42,
                selected: true,
              },
              {
                rank: 2,
                templateId: 'encounter.shadow_hunt',
                templateName: 'The Shadow Hunt',
                locationId: 'loc-3',
                locationName: 'Sacred Grove',
                action: 'queue_movement',
                reachPrimary: 'shadow',
                reachSecondary: 'star',
                encounterType: 'steal',
                threatBand: 'moderate',
                stepCount: 3,
                totalTickCost: 4,
                rewardEstimate: 1.1,
                completionProb: 0.53,
                travelCost: 0.71,
                finalScore: 1.11,
                selected: false,
              },
            ],
          }),
        ]])}
      />
    );

    fireEvent.click(screen.getByLabelText('Open encounter pool for Seraphel'));

    expect(onNodeSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Seraphel encounter pool' })).toBeTruthy();
    const items = screen.getAllByTestId('encounter-pool-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("Merchant's Gambit");
    expect(items[0].textContent).toContain('Chosen');
    expect(items[1].textContent).toContain('The Shadow Hunt');
  });

  it('groups repeated encounter templates into one modal row with destination count', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        agentEncounterDecisions={new Map([[
          'agent-1',
          makeEncounterDecision({
            rankedEncounterPool: [
              {
                rank: 1,
                templateId: 'encounter.master_local_craft',
                templateName: 'Master the Local Craft',
                locationId: 'loc-2',
                locationName: 'Inn',
                action: 'queue_movement',
                reachPrimary: 'stone',
                reachSecondary: 'gold',
                encounterType: 'create',
                threatBand: 'hard',
                stepCount: 2,
                totalTickCost: 5,
                rewardEstimate: 1.0,
                completionProb: 0.51,
                travelCost: 0.6,
                finalScore: 1.2,
                selected: true,
              },
              {
                rank: 2,
                templateId: 'encounter.master_local_craft',
                templateName: 'Master the Local Craft',
                locationId: 'loc-3',
                locationName: 'Well Fountain',
                action: 'queue_movement',
                reachPrimary: 'stone',
                reachSecondary: 'gold',
                encounterType: 'create',
                threatBand: 'hard',
                stepCount: 2,
                totalTickCost: 5,
                rewardEstimate: 1.0,
                completionProb: 0.48,
                travelCost: 0.7,
                finalScore: 1.1,
                selected: false,
              },
            ],
          }),
        ]])}
      />
    );

    fireEvent.click(screen.getByLabelText('Open encounter pool for Seraphel'));

    const items = screen.getAllByTestId('encounter-pool-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('2 destinations');
  });

  it('shows the chosen encounter as a badge even when the agent is still moving toward it', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent({ activityLabel: 'Going to Green-shroud' })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        agentEncounterDecisions={new Map([[
          'agent-1',
          makeEncounterDecision({
            decisionType: 'queue_movement',
            rankedEncounterPool: [{
              rank: 1,
              templateId: 'encounter.merchant_gambit',
              templateName: "Merchant's Gambit",
              locationId: 'loc-2',
              locationName: 'Green-shroud',
              action: 'queue_movement',
              reachPrimary: 'gold',
              reachSecondary: 'eye',
              encounterType: 'trade',
              threatBand: 'moderate',
              stepCount: 3,
              totalTickCost: 4,
              rewardEstimate: 1.1,
              completionProb: 0.62,
              travelCost: 0.58,
              finalScore: 1.42,
              selected: true,
            }],
          }),
        ]])}
      />
    );

    expect(screen.getByText("Merchant's Gambit")).toBeTruthy();
  });

  it('does not render sections with 0 entries', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Locations/Factions/Armies/Artifacts should not be rendered
    expect(screen.queryByText(/Locations/)).toBeNull();
    expect(screen.queryByText(/Factions/)).toBeNull();
    expect(screen.queryByText(/Armies/)).toBeNull();
    expect(screen.queryByText(/Artifacts/)).toBeNull();
  });

  it('Agents section is expanded by default', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // The agent row should be visible (section is expanded)
    expect(screen.getAllByTestId('thread-entry')).toHaveLength(1);
  });

  it('non-agent sections are collapsed by default', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeLocation()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Section header renders but rows are hidden (collapsed)
    expect(screen.getByText('Locations (1)')).toBeTruthy();
    expect(screen.queryByTestId('thread-entry')).toBeNull();
  });

  it('click on compact row calls onNodeSelect with correct nodeId and category', () => {
    const onNodeSelect = vi.fn();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={onNodeSelect}
        onCenterOnHex={noop}
      />
    );
    fireEvent.click(screen.getByTestId('thread-entry'));
    expect(onNodeSelect).toHaveBeenCalledWith('agent-1', 'agent');
  });

  it('eye icon click calls onCenterOnHex and does not trigger row select', () => {
    const onCenterOnHex = vi.fn();
    const onNodeSelect = vi.fn();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={onNodeSelect}
        onCenterOnHex={onCenterOnHex}
      />
    );
    const eyeButton = screen.getByLabelText('Center map on Seraphel');
    fireEvent.click(eyeButton);
    expect(onCenterOnHex).toHaveBeenCalledWith('loc-1');
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  it('selected row has ring-2 class applied', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId="agent-1"
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    const row = screen.getByTestId('thread-entry');
    expect(row.className).toContain('ring-2');
  });

  it('faction secondary info shows sphere alignment first when dominantSphere is non-null', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeFaction({ dominantSphere: 'flesh' })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Expand factions section first
    fireEvent.click(screen.getByText('Factions (1)'));
    const row = screen.getByTestId('thread-entry');
    // Secondary info should start with sphere alignment
    expect(row.textContent).toContain('flesh sphere');
  });

  it('renders multiple node type sections when present', () => {
    const nodes: ThreadedNode[] = [makeAgent(), makeFaction(), makeArtifact()];
    render(
      <ThreadsPanel
        threadedNodes={nodes}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('Agents (1)')).toBeTruthy();
    expect(screen.getByText('Factions (1)')).toBeTruthy();
    expect(screen.getByText('Artifacts (1)')).toBeTruthy();
  });

  it('clicking section header toggles collapse/expand', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeLocation()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Initially collapsed — no rows visible
    expect(screen.queryByTestId('thread-entry')).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByText('Locations (1)'));
    expect(screen.getByTestId('thread-entry')).toBeTruthy();

    // Click to collapse again
    fireEvent.click(screen.getByText('Locations (1)'));
    expect(screen.queryByTestId('thread-entry')).toBeNull();
  });
});
